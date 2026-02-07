import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminCreateProduct,
  adminGetCategories,
  adminUpdateProduct,
  adminUploadImage,
  clearAdminToken,
  toAbsoluteUrl,
} from '../../shared/api';
import './styles.css';

export default function AdminCatalogPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');

  const [productId, setProductId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredRank, setFeaturedRank] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await adminGetCategories();
        if (cancelled) return;
        setCategories(data);
      } catch {
        if (cancelled) return;
        setCategories([]);
      } finally {
        if (cancelled) return;
        setLoadingCats(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewUrl = useMemo(() => toAbsoluteUrl(imageUrl || uploadUrl), [imageUrl, uploadUrl]);

  async function onUploadFile(file?: File | null) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const res = await adminUploadImage(file);
      const url = (res as any)?.data?.url || '';
      if (!url) throw new Error('No se recibió URL');
      setUploadUrl(url);
      setImageUrl(url);
    } catch (err: any) {
      setUploadError(err?.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveOk(null);
    setSaving(true);
    try {
      const payload = {
        category_id: Number(categoryId),
        name,
        description: description || undefined,
        image_url: imageUrl || undefined,
        is_featured: isFeatured,
        featured_rank: featuredRank ? Number(featuredRank) : undefined,
        is_active: isActive,
      } as any;

      if (!payload.category_id || Number.isNaN(payload.category_id)) throw new Error('category_id inválido');
      if (!name.trim()) throw new Error('name es requerido');

      if (productId.trim()) {
        const id = Number(productId);
        if (!Number.isFinite(id)) throw new Error('ID inválido');
        await adminUpdateProduct(id, payload);
        setSaveOk('Producto actualizado');
      } else {
        await adminCreateProduct(payload);
        setSaveOk('Producto creado');
      }
    } catch (err: any) {
      if (err?.message === 'API 401 Unauthorized') {
        clearAdminToken();
        navigate('/admin/login');
        return;
      }
      setSaveError(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <h1 className="title">Admin · Catálogo</h1>
      <p className="subtitle">Subí imágenes y creá/actualizá productos</p>

      <section className="card">
        <h2 className="cardTitle">Subir imagen</h2>
        <div className="uploadRow">
          <input
            className="file"
            type="file"
            accept="image/*"
            onChange={(e) => onUploadFile(e.target.files?.[0])}
            disabled={uploading}
          />
          {uploading ? <span className="hint">Subiendo…</span> : null}
        </div>
        {uploadError ? <p className="error">{uploadError}</p> : null}
        {uploadUrl ? <p className="hint">URL: {uploadUrl}</p> : null}
        {previewUrl ? <img className="preview" src={previewUrl} alt="Preview" /> : null}
      </section>

      <section className="card">
        <h2 className="cardTitle">Crear / actualizar producto</h2>
        <form className="form" onSubmit={onSave}>
          <label className="label">
            ID (si actualizás)
            <input className="input" value={productId} onChange={(e) => setProductId(e.target.value)} />
          </label>
          <label className="label">
            Categoría
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Seleccionar</option>
              {loadingCats ? <option>cargando…</option> : null}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (#{c.id})
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Nombre
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="label">
            Descripción
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="label">
            URL de imagen
            <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </label>
          <label className="label checkbox">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Destacado
          </label>
          <label className="label">
            Orden destacado
            <input className="input" value={featuredRank} onChange={(e) => setFeaturedRank(e.target.value)} />
          </label>
          <label className="label checkbox">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Activo
          </label>
          {saveError ? <p className="error">{saveError}</p> : null}
          {saveOk ? <p className="ok">{saveOk}</p> : null}
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </section>
    </main>
  );
}
