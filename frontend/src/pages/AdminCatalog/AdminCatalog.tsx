import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../componentes/admin/AdminLayout';
import ImageCropModal from '../../componentes/admin/ImageCropModal';
import Skeleton from '../../componentes/shared/Skeleton';
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminSetProductActive,
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminSetCategoryActive,
  adminGetVariants,
  adminCreateVariant,
  adminUpdateVariant,
  adminDeleteVariant,
  adminSetVariantActive,
  adminGetExtras,
  adminCreateExtra,
  adminUpdateExtra,
  adminDeleteExtra,
  adminSetExtraActive,
  adminGetHomeSettings,
  adminUpdateHomeSettings,
  adminUploadImage,
  adminGetReviews,
  adminUpdateReviewStatus,
  adminDeleteReview,
  clearAdminToken,
  toAbsoluteUrl,
  type ProductDto,
  type CategoryDto,
  type VariantDto,
  type ExtraDto,
  type ReviewDto,
} from '../../shared/api';
import '../../componentes/admin/AdminLayout.css';
import './AdminCatalog.css';

type Tab = 'home' | 'products' | 'categories' | 'variants' | 'extras' | 'reviews';

/* ─── hook: handle 401 redirect ──────────────────────────── */
function useAuthRedirect() {
  const nav = useNavigate();
  return useCallback(
    (err: any) => {
      const msg = String(err?.message ?? '');
      if (msg.includes('401') || msg.includes('token')) {
        clearAdminToken();
        nav('/admin/login');
      }
    },
    [nav],
  );
}

/* ================================================================
   HOME TAB
   ================================================================ */
function HomeTab() {
  const onAuthErr = useAuthRedirect();
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageLeftUrl, setHeroImageLeftUrl] = useState('');
  const [heroImageRightUrl, setHeroImageRightUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'center' | 'left' | 'right'>('center');
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminGetHomeSettings();
      setHeroImageUrl(data.heroImageUrl ?? '');
      setHeroImageLeftUrl((data as any).heroImageLeftUrl ?? '');
      setHeroImageRightUrl((data as any).heroImageRightUrl ?? '');
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setLoading(false);
    }
  }, [onAuthErr]);

  useEffect(() => { load(); }, [load]);

  function onPickImage(file?: File | null) {
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
  }

  function triggerUpload(target: 'center' | 'left' | 'right') {
    setUploadTarget(target);
    fileRef.current?.click();
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const res = await adminUploadImage(file);
      const url = (res as any)?.data?.url || '';
      if (url) {
        if (uploadTarget === 'left') setHeroImageLeftUrl(url);
        else if (uploadTarget === 'right') setHeroImageRightUrl(url);
        else setHeroImageUrl(url);
      }
    } catch (e: any) {
      setError(e?.message || 'Error al subir imagen');
      onAuthErr(e);
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    setSaving(true);
    setError('');
    try {
      await adminUpdateHomeSettings({
        hero_image_url: heroImageUrl || undefined,
        hero_image_left_url: heroImageLeftUrl || undefined,
        hero_image_right_url: heroImageRightUrl || undefined,
      });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error');
      onAuthErr(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="adm-card" style={{ display: 'grid', gap: 10 }}><Skeleton variant="text" /><Skeleton variant="text" /><Skeleton variant="text" /></div>;
  }

  return (
    <>
      <div className="adm-header">
        <h1 className="adm-h1">Portada</h1>
      </div>

      <div className="adm-card adm-homeCard">
        <div className="adm-homeNote" style={{ marginBottom: 16 }}>
          La portada usa 3 imágenes en modo collage. En PC se ven las 3 fotos; en celulares se ve solo la del centro.
        </div>

        {/* Preview collage */}
        <div style={{ display: 'flex', gap: 6, borderRadius: 14, overflow: 'hidden', border: '1px solid #eee2ea', marginBottom: 18 }}>
          <div style={{ flex: '1', minHeight: 140, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5e9ee', backgroundImage: heroImageLeftUrl ? `url(${toAbsoluteUrl(heroImageLeftUrl)})` : undefined }} />
          <div style={{ flex: '1', minHeight: 140, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5e9ee', backgroundImage: heroImageUrl ? `url(${toAbsoluteUrl(heroImageUrl)})` : undefined }} />
          <div style={{ flex: '1', minHeight: 140, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f5e9ee', backgroundImage: heroImageRightUrl ? `url(${toAbsoluteUrl(heroImageRightUrl)})` : undefined }} />
        </div>

        <div className="adm-form">
          {/* Center (main) image */}
          <div className="adm-field">
            <label className="adm-label">Imagen central (obligatoria, visible en mobile)</label>
            <div className="adm-uploadArea">
              {heroImageUrl && <img className="adm-uploadPreview" src={toAbsoluteUrl(heroImageUrl)} alt="" />}
              <button className="adm-uploadBtn" type="button" disabled={uploading} onClick={() => triggerUpload('center')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                {uploading && uploadTarget === 'center' ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
            <input className="adm-input" placeholder="URL manual" value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} style={{ marginTop: 6 }} />
          </div>

          {/* Left image */}
          <div className="adm-field">
            <label className="adm-label">Imagen izquierda (solo PC)</label>
            <div className="adm-uploadArea">
              {heroImageLeftUrl && <img className="adm-uploadPreview" src={toAbsoluteUrl(heroImageLeftUrl)} alt="" />}
              <button className="adm-uploadBtn" type="button" disabled={uploading} onClick={() => triggerUpload('left')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                {uploading && uploadTarget === 'left' ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
            <input className="adm-input" placeholder="URL manual" value={heroImageLeftUrl} onChange={(e) => setHeroImageLeftUrl(e.target.value)} style={{ marginTop: 6 }} />
          </div>

          {/* Right image */}
          <div className="adm-field">
            <label className="adm-label">Imagen derecha (solo PC)</label>
            <div className="adm-uploadArea">
              {heroImageRightUrl && <img className="adm-uploadPreview" src={toAbsoluteUrl(heroImageRightUrl)} alt="" />}
              <button className="adm-uploadBtn" type="button" disabled={uploading} onClick={() => triggerUpload('right')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                {uploading && uploadTarget === 'right' ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
            <input className="adm-input" placeholder="URL manual" value={heroImageRightUrl} onChange={(e) => setHeroImageRightUrl(e.target.value)} style={{ marginTop: 6 }} />
          </div>

          {error && <p className="adm-error">{error}</p>}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            onPickImage(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <div className="adm-modalFooter" style={{ paddingLeft: 0, paddingRight: 0, borderTop: 0, justifyContent: 'flex-start' }}>
        <button className="adm-btnPrimary" disabled={saving || uploading} onClick={onSave}>
          {saving ? 'Guardando...' : 'Guardar portada'}
        </button>
      </div>

      <ImageCropModal
        file={cropFile}
        open={cropOpen}
        title="Recortar foto de Home"
        aspect={1}
        onClose={() => {
          setCropOpen(false);
          setCropFile(null);
        }}
        onConfirm={async (croppedFile) => {
          await onUpload(croppedFile);
          setCropFile(null);
        }}
      />
    </>
  );
}

/* ================================================================
   PRODUCTS TAB
   ================================================================ */
function ProductsTab() {
  const onAuthErr = useAuthRedirect();
  const [items, setItems] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<ProductDto | null>(null);

  // Form
  const [name, setName] = useState('');
  const [catId, setCatId] = useState('');
  const [desc, setDesc] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [featured, setFeatured] = useState(false);
  const [rank, setRank] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([adminGetProducts(), adminGetCategories()]);
      setItems(p);
      setCategories(c);
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setLoading(false);
    }
  }, [onAuthErr]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditItem(null);
    setName(''); setCatId(''); setDesc(''); setImgUrl(''); setGalleryUrls([]); setFeatured(false); setRank(''); setActive(true);
    setError('');
    setModal('create');
  }

  function openEdit(p: ProductDto) {
    setEditItem(p);
    setName(p.name);
    setCatId(String(p.category?.id ?? ''));
    setDesc(p.description ?? '');
    setImgUrl(p.imageUrl ?? '');
    setGalleryUrls(p.galleryImages || []);
    setFeatured(p.isFeatured ?? false);
    setRank(String(p.featuredRank ?? ''));
    setActive(p.isActive !== false);
    setError('');
    setModal('edit');
  }

  function onPickImage(file?: File | null) {
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const res = await adminUploadImage(file);
      const url = (res as any)?.data?.url || '';
      if (url) setImgUrl(url);
    } catch (e: any) {
      setError(e?.message || 'Error al subir imagen');
      onAuthErr(e);
    } finally {
      setUploading(false);
    }
  }

  async function onUploadGallery(file: File) {
    setUploadingGallery(true);
    try {
      const res = await adminUploadImage(file);
      const url = (res as any)?.data?.url || '';
      if (url) setGalleryUrls((prev) => [...prev, url]);
    } catch (e: any) {
      setError(e?.message || 'Error al subir imagen de galería');
      onAuthErr(e);
    } finally {
      setUploadingGallery(false);
    }
  }

  async function onSave() {
    if (!name.trim()) { setError('Nombre requerido'); return; }
    if (!catId) { setError('Categoría requerida'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        category_id: Number(catId),
        name: name.trim(),
        description: desc || undefined,
        image_url: imgUrl || undefined,
        gallery_images: galleryUrls,
        is_featured: featured,
        featured_rank: rank ? Number(rank) : undefined,
        is_active: active,
      };
      if (modal === 'edit' && editItem) {
        await adminUpdateProduct(editItem.id, payload);
      } else {
        await adminCreateProduct(payload);
      }
      setModal(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error'); onAuthErr(e);
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(p: ProductDto) {
    try {
      await adminSetProductActive(p.id, !p.isActive);
      await load();
    } catch (e: any) { onAuthErr(e); }
  }

  async function onDelete(p: ProductDto) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    try { await adminDeleteProduct(p.id); await load(); } catch (e: any) { onAuthErr(e); }
  }

  const catName = (id?: number) => categories.find((c) => c.id === id)?.name ?? '—';

  if (loading) return <div className="adm-card" style={{ display: 'grid', gap: 10 }}><Skeleton variant="text" /><Skeleton variant="text" /><Skeleton variant="text" /></div>;

  return (
    <>
      <div className="adm-header">
        <h1 className="adm-h1">Productos</h1>
        <button className="adm-btnPrimary" onClick={openCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Nuevo
        </button>
      </div>

      {items.length === 0 ? (
        <div className="adm-empty">No hay productos.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Destacado</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.imageUrl ? (
                      <img className="adm-imgThumb" src={toAbsoluteUrl(p.imageUrl)} alt="" />
                    ) : (
                      <div className="adm-imgThumb" />
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td>{catName(p.category?.id)}</td>
                  <td>{p.isFeatured ? <span className="adm-badge yellow">Sí</span> : '—'}</td>
                  <td>
                    <button
                      className={`adm-toggle ${p.isActive !== false ? 'on' : 'off'}`}
                      title={p.isActive !== false ? 'Activo' : 'Inactivo'}
                      onClick={() => onToggleActive(p)}
                    />
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btnSmall" aria-label={`Editar ${p.name}`} title="Editar" onClick={() => openEdit(p)}>
                        <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                      </button>
                      <button className="adm-btnSmall" aria-label={`Eliminar ${p.name}`} title="Eliminar" onClick={() => onDelete(p)}>
                        <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="adm-modalOverlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">{modal === 'edit' ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button className="adm-modalClose" aria-label="Cerrar modal" onClick={() => setModal(null)}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="adm-modalBody">
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label" htmlFor="prod-name">Nombre</label>
                  <input id="prod-name" className="adm-input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label" htmlFor="prod-cat">Categoría</label>
                  <select id="prod-cat" className="adm-select" value={catId} onChange={(e) => setCatId(e.target.value)}>
                    <option value="">Seleccionar</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="adm-field">
                  <label className="adm-label" htmlFor="prod-desc">Descripción</label>
                  <textarea id="prod-desc" className="adm-textarea" value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Imagen</label>
                  <div className="adm-uploadArea">
                    {imgUrl && <img className="adm-uploadPreview" src={toAbsoluteUrl(imgUrl)} alt="" />}
                    <button className="adm-uploadBtn" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        onPickImage(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <input id="prod-img-url" className="adm-input" placeholder="URL manual" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} style={{ marginTop: 6 }} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Galería de imágenes</label>
                  <div className="adm-galleryPanel">
                    {galleryUrls.map((url, idx) => (
                      <div key={url + idx} className="adm-galleryThumbWrap">
                        <img
                          className="adm-galleryThumb"
                          src={toAbsoluteUrl(url)}
                          alt={`Foto galería ${idx + 1}`}
                        />
                        <button
                          type="button"
                          className="adm-galleryRemove"
                          aria-label="Quitar foto"
                          onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">close</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="adm-galleryAddBtn"
                      disabled={uploadingGallery}
                      onClick={() => galleryFileRef.current?.click()}
                    >
                      {uploadingGallery ? (
                        <span className="adm-gallerySpinner" />
                      ) : (
                        <span className="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
                      )}
                      <span>{uploadingGallery ? 'Subiendo...' : 'Agregar foto'}</span>
                    </button>
                    <input
                      ref={galleryFileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) onUploadGallery(f);
                      }}
                    />
                  </div>
                  {galleryUrls.length === 0 && (
                    <p className="adm-galleryHint">Sin fotos adicionales. Hacé clic en "Agregar foto" para subir imágenes a la galería.</p>
                  )}
                </div>
                <label className="adm-checkbox">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                  Destacado
                </label>
                {featured && (
                  <div className="adm-field">
                    <label className="adm-label">Orden destacado</label>
                    <input className="adm-input" type="number" value={rank} onChange={(e) => setRank(e.target.value)} />
                  </div>
                )}
                <label className="adm-checkbox">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                  Activo
                </label>
                {error && <p className="adm-error">{error}</p>}
              </div>
            </div>
            <div className="adm-modalFooter">
              <button className="adm-btnCancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="adm-btnPrimary" disabled={saving} onClick={onSave}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageCropModal
        file={cropFile}
        open={cropOpen}
        title="Recortar imagen del producto"
        onClose={() => {
          setCropOpen(false);
          setCropFile(null);
        }}
        onConfirm={async (croppedFile) => {
          await onUpload(croppedFile);
          setCropFile(null);
        }}
      />
    </>
  );
}

/* ================================================================
   CATEGORIES TAB
   ================================================================ */
function CategoriesTab() {
  const onAuthErr = useAuthRedirect();
  const [items, setItems] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<CategoryDto | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await adminGetCategories()); } catch (e: any) { onAuthErr(e); }
    finally { setLoading(false); }
  }, [onAuthErr]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditItem(null); setName(''); setImageUrl(''); setActive(true); setError(''); setModal('create'); }
  function openEdit(c: CategoryDto) { setEditItem(c); setName(c.name); setImageUrl(c.imageUrl ?? ''); setActive(c.isActive !== false); setError(''); setModal('edit'); }

  function onPickImage(file?: File | null) {
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const res = await adminUploadImage(file);
      const url = (res as any)?.data?.url || '';
      if (url) setImageUrl(url);
    } catch (e: any) {
      setError(e?.message || 'Error al subir imagen');
      onAuthErr(e);
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!name.trim()) { setError('Nombre requerido'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'edit' && editItem) {
        await adminUpdateCategory(editItem.id, { name: name.trim(), image_url: imageUrl || undefined, is_active: active });
      } else {
        await adminCreateCategory({ name: name.trim(), image_url: imageUrl || undefined, is_active: active });
      }
      setModal(null); await load();
    } catch (e: any) { setError(e?.message || 'Error'); onAuthErr(e); }
    finally { setSaving(false); }
  }

  async function onToggle(c: CategoryDto) {
    try { await adminSetCategoryActive(c.id, !c.isActive); await load(); } catch (e: any) { onAuthErr(e); }
  }

  async function onDelete(c: CategoryDto) {
    if (!confirm(`¿Eliminar "${c.name}"?`)) return;
    try { await adminDeleteCategory(c.id); await load(); } catch (e: any) { onAuthErr(e); }
  }

  if (loading) return <div className="adm-card" style={{ display: 'grid', gap: 10 }}><Skeleton variant="text" /><Skeleton variant="text" /><Skeleton variant="text" /></div>;

  return (
    <>
      <div className="adm-header">
        <h1 className="adm-h1">Categorías</h1>
        <button className="adm-btnPrimary" onClick={openCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Nueva
        </button>
      </div>
      {items.length === 0 ? (
        <div className="adm-empty">No hay categorías.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Activa</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td><button className={`adm-toggle ${c.isActive !== false ? 'on' : 'off'}`} onClick={() => onToggle(c)} /></td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btnSmall" title="Editar" onClick={() => openEdit(c)}><span className="material-symbols-outlined">edit</span></button>
                      <button className="adm-btnSmall" title="Eliminar" onClick={() => onDelete(c)}><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="adm-modalOverlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">{modal === 'edit' ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button className="adm-modalClose" onClick={() => setModal(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="adm-modalBody">
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label">Nombre</label>
                  <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Imagen</label>
                  <div className="adm-uploadArea">
                    {imageUrl && <img className="adm-uploadPreview" src={toAbsoluteUrl(imageUrl)} alt="" />}
                    <button className="adm-uploadBtn" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        onPickImage(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <input className="adm-input" placeholder="URL manual" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ marginTop: 6 }} />
                </div>
                <label className="adm-checkbox">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activa
                </label>
                {error && <p className="adm-error">{error}</p>}
              </div>
            </div>
            <div className="adm-modalFooter">
              <button className="adm-btnCancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="adm-btnPrimary" disabled={saving} onClick={onSave}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ImageCropModal
        file={cropFile}
        open={cropOpen}
        title="Recortar imagen de la categoría"
        onClose={() => {
          setCropOpen(false);
          setCropFile(null);
        }}
        onConfirm={async (croppedFile) => {
          await onUpload(croppedFile);
          setCropFile(null);
        }}
      />
    </>
  );
}

/* ================================================================
   VARIANTS TAB
   ================================================================ */
function VariantsTab() {
  const onAuthErr = useAuthRedirect();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [items, setItems] = useState<VariantDto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<VariantDto | null>(null);
  const [vName, setVName] = useState('');
  const [vPrice, setVPrice] = useState('');
  const [vImageUrl, setVImageUrl] = useState('');
  const [vProduct, setVProduct] = useState('');
  const [vActive, setVActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    try { setProducts(await adminGetProducts()); } catch (e: any) { onAuthErr(e); }
  }, [onAuthErr]);

  const loadVariants = useCallback(async () => {
    try {
      const pid = selectedProduct ? Number(selectedProduct) : undefined;
      setItems(await adminGetVariants({ productId: pid }));
    } catch (e: any) { onAuthErr(e); }
    finally { setLoading(false); }
  }, [selectedProduct, onAuthErr]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { setLoading(true); loadVariants(); }, [loadVariants]);

  function openCreate() {
    setEditItem(null); setVName(''); setVPrice(''); setVImageUrl(''); setVProduct(selectedProduct); setVActive(true); setError(''); setModal('create');
  }
  function openEdit(v: VariantDto) {
    setEditItem(v); setVName(v.name); setVPrice(v.price); setVImageUrl(v.imageUrl ?? ''); setVProduct(String(v.product?.id ?? '')); setVActive(v.isActive !== false); setError(''); setModal('edit');
  }

  function onPickImage(file?: File | null) {
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const res = await adminUploadImage(file);
      const url = (res as any)?.data?.url || '';
      if (url) setVImageUrl(url);
    } catch (e: any) {
      setError(e?.message || 'Error al subir imagen');
      onAuthErr(e);
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!vName.trim()) { setError('Nombre requerido'); return; }
    if (!vPrice) { setError('Precio requerido'); return; }
    if (!vProduct) { setError('Producto requerido'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'edit' && editItem) {
        await adminUpdateVariant(editItem.id, { product_id: Number(vProduct), name: vName.trim(), price: vPrice, image_url: vImageUrl || undefined, is_active: vActive });
      } else {
        await adminCreateVariant({ product_id: Number(vProduct), name: vName.trim(), price: vPrice, image_url: vImageUrl || undefined, is_active: vActive });
      }
      setModal(null); await loadVariants();
    } catch (e: any) { setError(e?.message || 'Error'); onAuthErr(e); }
    finally { setSaving(false); }
  }

  async function onToggle(v: VariantDto) {
    try { await adminSetVariantActive(v.id, !v.isActive); await loadVariants(); } catch (e: any) { onAuthErr(e); }
  }

  async function onDelete(v: VariantDto) {
    if (!confirm(`¿Eliminar variante "${v.name}"?`)) return;
    try { await adminDeleteVariant(v.id); await loadVariants(); } catch (e: any) { onAuthErr(e); }
  }

  return (
    <>
      <div className="adm-header">
        <h1 className="adm-h1">Variantes</h1>
        <button className="adm-btnPrimary" onClick={openCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Nueva
        </button>
      </div>

      <div className="adm-card">
        <div className="adm-field">
          <label className="adm-label">Filtrar por producto</label>
          <select className="adm-select" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
            <option value="">Todos los productos</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="adm-card" style={{ display: 'grid', gap: 10 }}><Skeleton variant="text" /><Skeleton variant="text" /><Skeleton variant="text" /></div>
      ) : items.length === 0 ? (
        <div className="adm-empty">No hay variantes{selectedProduct ? ' para este producto' : ''}.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead><tr><th>Imagen</th><th>Nombre</th><th>Precio</th><th>Producto</th><th>Activa</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
                  <td>
                    {v.imageUrl ? (
                      <img className="adm-imgThumb" src={toAbsoluteUrl(v.imageUrl)} alt="" />
                    ) : (
                      <div className="adm-imgThumb" />
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>{v.name}</td>
                  <td>${v.price}</td>
                  <td>{v.product?.name ?? '—'}</td>
                  <td><button className={`adm-toggle ${v.isActive !== false ? 'on' : 'off'}`} onClick={() => onToggle(v)} /></td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btnSmall" title="Editar" onClick={() => openEdit(v)}><span className="material-symbols-outlined">edit</span></button>
                      <button className="adm-btnSmall" title="Eliminar" onClick={() => onDelete(v)}><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="adm-modalOverlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">{modal === 'edit' ? 'Editar variante' : 'Nueva variante'}</h2>
              <button className="adm-modalClose" onClick={() => setModal(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="adm-modalBody">
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label">Producto</label>
                  <select className="adm-select" value={vProduct} onChange={(e) => setVProduct(e.target.value)}>
                    <option value="">Seleccionar</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Nombre</label>
                  <input className="adm-input" value={vName} onChange={(e) => setVName(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Precio</label>
                  <input className="adm-input" type="number" step="0.01" value={vPrice} onChange={(e) => setVPrice(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Imagen de variante</label>
                  <div className="adm-uploadArea">
                    {vImageUrl && <img className="adm-uploadPreview" src={toAbsoluteUrl(vImageUrl)} alt="" />}
                    <button className="adm-uploadBtn" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        onPickImage(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <input className="adm-input" placeholder="URL manual" value={vImageUrl} onChange={(e) => setVImageUrl(e.target.value)} style={{ marginTop: 6 }} />
                </div>
                <label className="adm-checkbox">
                  <input type="checkbox" checked={vActive} onChange={(e) => setVActive(e.target.checked)} /> Activa
                </label>
                {error && <p className="adm-error">{error}</p>}
              </div>
            </div>
            <div className="adm-modalFooter">
              <button className="adm-btnCancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="adm-btnPrimary" disabled={saving} onClick={onSave}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ImageCropModal
        file={cropFile}
        open={cropOpen}
        title="Recortar imagen de la variante"
        onClose={() => {
          setCropOpen(false);
          setCropFile(null);
        }}
        onConfirm={async (croppedFile) => {
          await onUpload(croppedFile);
          setCropFile(null);
        }}
      />
    </>
  );
}

/* ================================================================
   EXTRAS TAB
   ================================================================ */
const EXTRA_TYPES = ['general', 'dije', 'cadena', 'servicio'] as const;

function ExtrasTab() {
  const onAuthErr = useAuthRedirect();
  const [items, setItems] = useState<ExtraDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<ExtraDto | null>(null);
  const [eName, setEName] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eCatType, setECatType] = useState('general');
  const [eActive, setEActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setItems(await adminGetExtras()); } catch (e: any) { onAuthErr(e); }
    finally { setLoading(false); }
  }, [onAuthErr]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditItem(null); setEName(''); setEPrice(''); setECatType('general'); setEActive(true); setError(''); setModal('create'); }
  function openEdit(x: ExtraDto) { setEditItem(x); setEName(x.name); setEPrice(x.price); setECatType(x.categoryType ?? 'general'); setEActive(x.isActive !== false); setError(''); setModal('edit'); }

  async function onSave() {
    if (!eName.trim()) { setError('Nombre requerido'); return; }
    if (!ePrice) { setError('Precio requerido'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: eName.trim(), price: ePrice, category_type: eCatType, is_active: eActive };
      if (modal === 'edit' && editItem) { await adminUpdateExtra(editItem.id, payload); }
      else { await adminCreateExtra(payload); }
      setModal(null); await load();
    } catch (e: any) { setError(e?.message || 'Error'); onAuthErr(e); }
    finally { setSaving(false); }
  }

  async function onToggle(x: ExtraDto) {
    try { await adminSetExtraActive(x.id, !x.isActive); await load(); } catch (e: any) { onAuthErr(e); }
  }
  async function onDelete(x: ExtraDto) {
    if (!confirm(`¿Eliminar extra "${x.name}"?`)) return;
    try { await adminDeleteExtra(x.id); await load(); } catch (e: any) { onAuthErr(e); }
  }

  if (loading) return <div className="adm-card" style={{ display: 'grid', gap: 10 }}><Skeleton variant="text" /><Skeleton variant="text" /><Skeleton variant="text" /></div>;

  return (
    <>
      <div className="adm-header">
        <h1 className="adm-h1">Extras</h1>
        <button className="adm-btnPrimary" onClick={openCreate}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Nuevo
        </button>
      </div>
      {items.length === 0 ? (
        <div className="adm-empty">No hay extras.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="adm-table">
            <thead><tr><th>Nombre</th><th>Precio</th><th>Tipo</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td style={{ fontWeight: 700 }}>{x.name}</td>
                  <td>${x.price}</td>
                  <td><span className="adm-badge gray">{x.categoryType ?? 'general'}</span></td>
                  <td><button className={`adm-toggle ${x.isActive !== false ? 'on' : 'off'}`} onClick={() => onToggle(x)} /></td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btnSmall" title="Editar" onClick={() => openEdit(x)}><span className="material-symbols-outlined">edit</span></button>
                      <button className="adm-btnSmall" title="Eliminar" onClick={() => onDelete(x)}><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="adm-modalOverlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">{modal === 'edit' ? 'Editar extra' : 'Nuevo extra'}</h2>
              <button className="adm-modalClose" onClick={() => setModal(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="adm-modalBody">
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label">Nombre</label>
                  <input className="adm-input" value={eName} onChange={(e) => setEName(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Precio</label>
                  <input className="adm-input" type="number" step="0.01" value={ePrice} onChange={(e) => setEPrice(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Tipo</label>
                  <select className="adm-select" value={eCatType} onChange={(e) => setECatType(e.target.value)}>
                    {EXTRA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <label className="adm-checkbox">
                  <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} /> Activo
                </label>
                {error && <p className="adm-error">{error}</p>}
              </div>
            </div>
            <div className="adm-modalFooter">
              <button className="adm-btnCancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="adm-btnPrimary" disabled={saving} onClick={onSave}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================
   REVIEWS TAB
   ================================================================ */
function ReviewsTab() {
  const onAuthErr = useAuthRedirect();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminGetReviews({
        status: statusFilter || undefined,
        q: search.trim() || undefined,
        page: p,
        limit: 20,
      });
      setReviews(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setPage(res.page);
    } catch (e: any) {
      onAuthErr(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, onAuthErr]);

  useEffect(() => { load(1); }, [load]);

  async function handleStatus(id: number, status: string) {
    try {
      await adminUpdateReviewStatus(id, status);
      load(page);
    } catch (e: any) {
      onAuthErr(e);
    }
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      await adminDeleteReview(deleteId);
      load(page);
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setDeleteId(null);
    }
  }

  function renderStars(n: number) {
    return (
      <span className="adm-reviewStars">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= n ? 'adm-starFilled' : 'adm-starEmpty'}>
            ★
          </span>
        ))}
      </span>
    );
  }

  const statusBadge = (s: string) => {
    if (s === 'approved') return { label: 'Aprobada', cls: 'adm-badgeGreen' };
    if (s === 'rejected') return { label: 'Rechazada', cls: 'adm-badgeRed' };
    return { label: 'Pendiente', cls: 'adm-badgeYellow' };
  };

  return (
    <>
      <div className="adm-toolbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', padding: '0 10px', fontSize: 13 }}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
        <input
          type="text"
          placeholder="Buscar por nombre o comentario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', padding: '0 10px', fontSize: 13, flex: 1, maxWidth: 300 }}
        />
        <span style={{ fontSize: 13, color: '#6b7280' }}>{total} reseña{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div style={{ padding: 24 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
        </div>
      ) : reviews.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No hay reseñas{statusFilter ? ` con estado "${statusFilter}"` : ''}.</p>
      ) : (
        <div className="adm-list" style={{ display: 'grid', gap: 12, padding: '0 0 16px' }}>
          {reviews.map((r) => {
            const badge = statusBadge(r.status);
            return (
              <div key={r.id} style={{
                border: '1px solid #f3f4f6',
                borderRadius: 12,
                padding: '14px 16px',
                background: '#fff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ fontSize: 13 }}>{r.customerName}</strong>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: badge.cls === 'adm-badgeGreen' ? '#dcfce7'
                        : badge.cls === 'adm-badgeRed' ? '#fee2e2'
                          : '#fef9c3',
                      color: badge.cls === 'adm-badgeGreen' ? '#166534'
                        : badge.cls === 'adm-badgeRed' ? '#991b1b'
                          : '#854d0e',
                    }}>{badge.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-AR') : ''}
                  </span>
                </div>
                <div style={{ color: '#C76DA2', fontSize: 15, letterSpacing: -1, marginBottom: 4 }}>
                  {renderStars(r.rating)}
                </div>
                {r.productName ? (
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6b7280' }}>Producto: {r.productName}</p>
                ) : null}
                {r.comment ? (
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#52525b', lineHeight: 1.6 }}>{r.comment}</p>
                ) : null}
                <div style={{ display: 'flex', gap: 8 }}>
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => handleStatus(r.id, 'approved')}
                      style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
                    >✓ Aprobar</button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatus(r.id, 'rejected')}
                      style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}
                    >✗ Rechazar</button>
                  )}
                  <button
                    onClick={() => setDeleteId(r.id)}
                    style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontWeight: 700, marginLeft: 'auto' }}
                  >Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '8px 0 16px' }}>
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
          >← Anterior</button>
          <span style={{ fontSize: 12, color: '#6b7280', lineHeight: '30px' }}>Página {page} de {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
          >Siguiente →</button>
        </div>
      ) : null}

      {deleteId !== null && (
        <div className="adm-deleteModalOverlay" onClick={() => setDeleteId(null)}>
          <div className="adm-deleteModal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-deleteModalIcon">
              <span className="material-symbols-outlined">delete</span>
            </div>

            <h3 className="adm-deleteModalTitle">¿Eliminar reseña?</h3>

            <p className="adm-deleteModalText">
              Esta acción no se puede deshacer. La reseña se eliminará permanentemente del catálogo.
            </p>

            <div className="adm-deleteModalActions">
              <button
                type="button"
                className="adm-btnModalCancel"
                onClick={() => setDeleteId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="adm-btnConfirmDelete"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================
   MAIN PAGE (tabs)
   ================================================================ */
export default function AdminCatalogPage() {
  const [tab, setTab] = useState<Tab>('products');

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Catálogo | Petit</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="adm-tabs">
        <button className={`adm-tab${tab === 'home' ? ' active' : ''}`} onClick={() => setTab('home')}>Portada</button>
        <button className={`adm-tab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>Productos</button>
        <button className={`adm-tab${tab === 'categories' ? ' active' : ''}`} onClick={() => setTab('categories')}>Categorías</button>
        <button className={`adm-tab${tab === 'variants' ? ' active' : ''}`} onClick={() => setTab('variants')}>Variantes</button>
        <button className={`adm-tab${tab === 'extras' ? ' active' : ''}`} onClick={() => setTab('extras')}>Extras</button>
        <button className={`adm-tab${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>Reseñas</button>
      </div>

      {tab === 'home' && <HomeTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'variants' && <VariantsTab />}
      {tab === 'extras' && <ExtrasTab />}
      {tab === 'reviews' && <ReviewsTab />}
    </AdminLayout>
  );
}
