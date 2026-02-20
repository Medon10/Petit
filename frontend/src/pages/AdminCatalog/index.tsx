import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../componentes/admin/AdminLayout';
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
  adminUploadImage,
  clearAdminToken,
  toAbsoluteUrl,
  type ProductDto,
  type CategoryDto,
  type VariantDto,
  type ExtraDto,
} from '../../shared/api';
import '../../componentes/admin/AdminLayout.css';

type Tab = 'products' | 'categories' | 'variants' | 'extras';

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
  const [featured, setFeatured] = useState(false);
  const [rank, setRank] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setName(''); setCatId(''); setDesc(''); setImgUrl(''); setFeatured(false); setRank(''); setActive(true);
    setError('');
    setModal('create');
  }

  function openEdit(p: ProductDto) {
    setEditItem(p);
    setName(p.name);
    setCatId(String(p.category?.id ?? ''));
    setDesc(p.description ?? '');
    setImgUrl(p.imageUrl ?? '');
    setFeatured(p.isFeatured ?? false);
    setRank(String(p.featuredRank ?? ''));
    setActive(p.isActive !== false);
    setError('');
    setModal('edit');
  }

  async function onUpload(file?: File | null) {
    if (!file) return;
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

  if (loading) return <div className="adm-empty">Cargando...</div>;

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
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
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
                      <button className="adm-btnSmall" title="Editar" onClick={() => openEdit(p)}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="adm-btnSmall" title="Eliminar" onClick={() => onDelete(p)}>
                        <span className="material-symbols-outlined">delete</span>
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
              <button className="adm-modalClose" onClick={() => setModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="adm-modalBody">
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label">Nombre</label>
                  <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Categoría</label>
                  <select className="adm-select" value={catId} onChange={(e) => setCatId(e.target.value)}>
                    <option value="">Seleccionar</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Descripción</label>
                  <textarea className="adm-textarea" value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Imagen</label>
                  <div className="adm-uploadArea">
                    {imgUrl && <img className="adm-uploadPreview" src={toAbsoluteUrl(imgUrl)} alt="" />}
                    <button className="adm-uploadBtn" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
                  </div>
                  <input className="adm-input" placeholder="URL manual" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} style={{ marginTop: 6 }} />
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
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setItems(await adminGetCategories()); } catch (e: any) { onAuthErr(e); }
    finally { setLoading(false); }
  }, [onAuthErr]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditItem(null); setName(''); setActive(true); setError(''); setModal('create'); }
  function openEdit(c: CategoryDto) { setEditItem(c); setName(c.name); setActive(c.isActive !== false); setError(''); setModal('edit'); }

  async function onSave() {
    if (!name.trim()) { setError('Nombre requerido'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'edit' && editItem) {
        await adminUpdateCategory(editItem.id, { name: name.trim(), is_active: active });
      } else {
        await adminCreateCategory({ name: name.trim(), is_active: active });
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

  if (loading) return <div className="adm-empty">Cargando...</div>;

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
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
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
  const [vProduct, setVProduct] = useState('');
  const [vActive, setVActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    setEditItem(null); setVName(''); setVPrice(''); setVProduct(selectedProduct); setVActive(true); setError(''); setModal('create');
  }
  function openEdit(v: VariantDto) {
    setEditItem(v); setVName(v.name); setVPrice(v.price); setVProduct(String(v.product?.id ?? '')); setVActive(v.isActive !== false); setError(''); setModal('edit');
  }

  async function onSave() {
    if (!vName.trim()) { setError('Nombre requerido'); return; }
    if (!vPrice) { setError('Precio requerido'); return; }
    if (!vProduct) { setError('Producto requerido'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'edit' && editItem) {
        await adminUpdateVariant(editItem.id, { product_id: Number(vProduct), name: vName.trim(), price: vPrice, is_active: vActive });
      } else {
        await adminCreateVariant({ product_id: Number(vProduct), name: vName.trim(), price: vPrice, is_active: vActive });
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
        <div className="adm-empty">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="adm-empty">No hay variantes{selectedProduct ? ' para este producto' : ''}.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="adm-table">
            <thead><tr><th>Nombre</th><th>Precio</th><th>Producto</th><th>Activa</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
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

  if (loading) return <div className="adm-empty">Cargando...</div>;

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
   MAIN PAGE (tabs)
   ================================================================ */
export default function AdminCatalogPage() {
  const [tab, setTab] = useState<Tab>('products');

  return (
    <AdminLayout>
      <div className="adm-tabs">
        <button className={`adm-tab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>Productos</button>
        <button className={`adm-tab${tab === 'categories' ? ' active' : ''}`} onClick={() => setTab('categories')}>Categorías</button>
        <button className={`adm-tab${tab === 'variants' ? ' active' : ''}`} onClick={() => setTab('variants')}>Variantes</button>
        <button className={`adm-tab${tab === 'extras' ? ' active' : ''}`} onClick={() => setTab('extras')}>Extras</button>
      </div>

      {tab === 'products' && <ProductsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'variants' && <VariantsTab />}
      {tab === 'extras' && <ExtrasTab />}
    </AdminLayout>
  );
}
