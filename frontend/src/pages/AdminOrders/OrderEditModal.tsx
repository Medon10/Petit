import { useCallback, useEffect, useMemo, useState } from 'react';
import Skeleton from '../../componentes/shared/Skeleton';
import {
  adminGetExtras,
  adminGetProducts,
  adminGetVariants,
  adminUpdateOrder,
  type ExtraDto,
  type OrderDto,
  type ProductDto,
  type ShippingMethod,
  type UpdateOrderInput,
  type VariantDto,
} from '../../shared/api';

type OrderEditModalProps = {
  order: OrderDto;
  onClose: () => void;
  onSaved: (updated: OrderDto, warnings: string[]) => void;
  onAuthErr: (e: unknown) => void;
};

type DraftExtra = {
  localKey: string;
  id?: number;
  originalExtraId: number | null;
  originalUnitPrice: number;
  originalExtraName: string;
  extraId: number | null;
  quantity: number;
};

type DraftItem = {
  localKey: string;
  id?: number;
  originalProductId: number | null;
  originalVariantId: number | null;
  originalUnitPrice: number;
  originalProductName: string;
  originalVariantName?: string;
  productId: number | null;
  variantId: number | null;
  quantity: number;
  extras: DraftExtra[];
  pendingExtraId: string;
};

function formatMoney(n: number) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
}

function extractRefId(ref: number | { id: number } | null | undefined): number | null {
  if (ref == null) return null;
  if (typeof ref === 'number') return Number.isFinite(ref) ? ref : null;
  if (typeof ref === 'object' && ref.id != null) {
    const n = Number(ref.id);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extraSortWeight(extra: ExtraDto) {
  const t = String(extra.categoryType ?? '').toLowerCase();
  if (t === 'servicio') return 0;
  if (t === 'dije') return 1;
  if (t === 'cadena') return 2;
  return 3;
}

function buildInitialDraftItems(order: OrderDto): DraftItem[] {
  return (order.items || []).map((item, idx) => {
    const productId = extractRefId(item.product);
    const variantId = extractRefId(item.variant);
    return {
      localKey: `item-${item.id}-${idx}`,
      id: item.id,
      originalProductId: productId,
      originalVariantId: variantId,
      originalUnitPrice: Number(item.unitPrice) || 0,
      originalProductName: item.productName,
      originalVariantName: item.variantName,
      productId,
      variantId,
      quantity: Math.max(1, Number(item.quantity) || 1),
      pendingExtraId: '',
      extras: (item.extras || []).map((ex, eIdx) => {
        const extraId = extractRefId(ex.extra);
        return {
          localKey: `extra-${item.id}-${ex.id}-${eIdx}`,
          id: ex.id,
          originalExtraId: extraId,
          originalUnitPrice: Number(ex.unitPrice) || 0,
          originalExtraName: ex.extraName,
          extraId,
          quantity: Math.max(1, Number(ex.quantity) || 1),
        };
      }),
    };
  });
}

export default function OrderEditModal({ order, onClose, onSaved, onAuthErr }: OrderEditModalProps) {
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [variants, setVariants] = useState<VariantDto[]>([]);
  const [extras, setExtras] = useState<ExtraDto[]>([]);

  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail || '');
  const [notes, setNotes] = useState(order.notes || '');

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    order.shippingMethod === 'delivery' ? 'delivery' : 'pickup'
  );
  const [shippingAddressLine1, setShippingAddressLine1] = useState(order.shippingAddressLine1 || '');
  const [shippingAddressLine2, setShippingAddressLine2] = useState(order.shippingAddressLine2 || '');
  const [shippingCity, setShippingCity] = useState(order.shippingCity || '');
  const [shippingProvince, setShippingProvince] = useState(order.shippingProvince || '');
  const [shippingPostalCode, setShippingPostalCode] = useState(order.shippingPostalCode || '');

  const [items, setItems] = useState<DraftItem[]>(() => buildInitialDraftItems(order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const [prods, vars, exts] = await Promise.all([
          adminGetProducts(),
          adminGetVariants(),
          adminGetExtras(),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setVariants(vars);
        setExtras(exts);
      } catch (e: unknown) {
        if (cancelled) return;
        onAuthErr(e);
        setCatalogError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo');
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [onAuthErr]);

  const productById = useMemo(() => {
    const map = new Map<number, ProductDto>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const variantById = useMemo(() => {
    const map = new Map<number, VariantDto>();
    for (const v of variants) map.set(v.id, v);
    return map;
  }, [variants]);

  const variantsByProductId = useMemo(() => {
    const map = new Map<number, VariantDto[]>();
    for (const v of variants) {
      const pid = extractRefId(v.product);
      if (pid == null) continue;
      const list = map.get(pid) || [];
      list.push(v);
      map.set(pid, list);
    }
    return map;
  }, [variants]);

  const extraById = useMemo(() => {
    const map = new Map<number, ExtraDto>();
    for (const e of extras) map.set(e.id, e);
    return map;
  }, [extras]);

  const activeProducts = useMemo(
    () =>
      products
        .filter((p) => p.isActive !== false)
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [products]
  );

  const activeExtras = useMemo(
    () =>
      extras
        .filter((e) => e.isActive !== false)
        .sort((a, b) => extraSortWeight(a) - extraSortWeight(b) || a.name.localeCompare(b.name, 'es')),
    [extras]
  );

  const getItemUnitPrice = useCallback(
    (item: DraftItem) => {
      const isPreserved =
        item.id != null &&
        item.productId === item.originalProductId &&
        item.variantId === item.originalVariantId;
      if (isPreserved) return item.originalUnitPrice;
      if (item.variantId != null) {
        const v = variantById.get(item.variantId);
        if (v) return Number(v.price) || 0;
      }
      return 0;
    },
    [variantById]
  );

  const getExtraUnitPrice = useCallback(
    (ex: DraftExtra) => {
      const isPreserved = ex.id != null && ex.extraId === ex.originalExtraId;
      if (isPreserved) return ex.originalUnitPrice;
      if (ex.extraId != null) {
        const found = extraById.get(ex.extraId);
        if (found) return Number(found.price) || 0;
      }
      return 0;
    },
    [extraById]
  );

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      subtotal += getItemUnitPrice(item) * qty;
      for (const ex of item.extras) {
        const exQty = Math.max(1, Number(ex.quantity) || 1);
        subtotal += getExtraUnitPrice(ex) * exQty;
      }
    }
    const shippingCost = Number(order.shippingCost) || 0;
    const newTotal = Math.round((subtotal + shippingCost) * 100) / 100;
    const oldTotal = Number(order.total) || 0;
    const delta = Math.round((newTotal - oldTotal) * 100) / 100;
    return { subtotal, newTotal, oldTotal, delta };
  }, [items, order.shippingCost, order.total, getItemUnitPrice, getExtraUnitPrice]);

  const paymentPreview = useMemo(() => {
    const pStatus = order.paymentStatus || 'unpaid';
    if (pStatus === 'unpaid') return null;
    const oldTotal = Number(order.total) || 0;
    const oldPaid =
      pStatus === 'paid'
        ? (Number(order.paidAmount) > 0 ? Number(order.paidAmount) : oldTotal)
        : (Number(order.paidAmount) || 0);

    if (pStatus === 'paid') {
      if (totals.newTotal > oldPaid + 0.001) {
        return {
          kind: 'info' as const,
          text: `Ya abonó $${formatMoney(oldPaid)}. Al guardar pasará a "Seña" y restará pagar $${formatMoney(totals.newTotal - oldPaid)}.`,
        };
      }
      if (totals.newTotal < oldPaid - 0.001) {
        return {
          kind: 'warning' as const,
          text: `El nuevo total ($${formatMoney(totals.newTotal)}) es menor a lo ya abonado ($${formatMoney(oldPaid)}). Quedarán $${formatMoney(oldPaid - totals.newTotal)} a favor del cliente.`,
        };
      }
      return null;
    }

    if (totals.newTotal < oldPaid - 0.001) {
      return {
        kind: 'warning' as const,
        text: `La seña abonada ($${formatMoney(oldPaid)}) supera el nuevo total ($${formatMoney(totals.newTotal)}). Pasará a "Pagado" con $${formatMoney(oldPaid - totals.newTotal)} a favor del cliente.`,
      };
    }
    if (Math.abs(totals.newTotal - oldPaid) <= 0.001) {
      return {
        kind: 'info' as const,
        text: `La seña abonada ($${formatMoney(oldPaid)}) cubre el nuevo total. Pasará a "Pagado".`,
      };
    }
    return {
      kind: 'info' as const,
      text: `Abonó $${formatMoney(oldPaid)} de seña. Faltará pagar $${formatMoney(totals.newTotal - oldPaid)}.`,
    };
  }, [order.paymentStatus, order.paidAmount, order.total, totals.newTotal]);

  function updateItem(localKey: string, updater: (item: DraftItem) => DraftItem) {
    setItems((prev) => prev.map((it) => (it.localKey === localKey ? updater(it) : it)));
  }

  function handleChangeProduct(localKey: string, nextProductId: number) {
    const activeVars = (variantsByProductId.get(nextProductId) || []).filter((v) => v.isActive !== false);
    const firstVariantId = activeVars[0]?.id ?? null;
    updateItem(localKey, (it) => ({
      ...it,
      productId: nextProductId,
      variantId: firstVariantId,
    }));
  }

  function handleAddProduct() {
    const candidate =
      activeProducts.find((p) => (variantsByProductId.get(p.id) || []).some((v) => v.isActive !== false)) ||
      activeProducts[0];
    if (!candidate) return;
    const activeVars = (variantsByProductId.get(candidate.id) || []).filter((v) => v.isActive !== false);
    const newItem: DraftItem = {
      localKey: `new-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      originalProductId: null,
      originalVariantId: null,
      originalUnitPrice: 0,
      originalProductName: '',
      productId: candidate.id,
      variantId: activeVars[0]?.id ?? null,
      quantity: 1,
      extras: [],
      pendingExtraId: '',
    };
    setItems((prev) => [...prev, newItem]);
  }

  function handleRemoveItem(localKey: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.localKey !== localKey));
  }

  function handleAddExtra(itemKey: string) {
    const target = items.find((it) => it.localKey === itemKey);
    if (!target || !target.pendingExtraId) return;
    const extraId = Number(target.pendingExtraId);
    const found = extraById.get(extraId);
    if (!found) return;

    updateItem(itemKey, (it) => ({
      ...it,
      pendingExtraId: '',
      extras: [
        ...it.extras,
        {
          localKey: `new-extra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          originalExtraId: null,
          originalUnitPrice: 0,
          originalExtraName: found.name,
          extraId,
          quantity: 1,
        },
      ],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    if (items.length === 0) {
      setError('El pedido debe tener al menos un ítem.');
      return;
    }

    for (const item of items) {
      if (!item.productId) {
        setError('Todos los ítems deben tener un producto seleccionado.');
        return;
      }
      const isLegacyNullVariant =
        item.id != null && item.originalVariantId == null && item.variantId == null;
      if (!item.variantId && !isLegacyNullVariant) {
        setError('Todos los ítems deben tener una variante seleccionada.');
        return;
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        setError('Las cantidades de los productos deben ser enteros mayores a 0.');
        return;
      }
      for (const ex of item.extras) {
        if (!Number.isInteger(ex.quantity) || ex.quantity <= 0) {
          setError('Las cantidades de los extras deben ser enteros mayores a 0.');
          return;
        }
      }
    }

    if (shippingMethod === 'delivery') {
      if (!shippingAddressLine1.trim() || !shippingCity.trim() || !shippingProvince.trim() || !shippingPostalCode.trim()) {
        setError('Completá dirección, ciudad, provincia y código postal para el envío a domicilio.');
        return;
      }
    }

    const payload: UpdateOrderInput = {
      customer_name: trimmedName,
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim(),
      notes: notes.trim(),
      shipping:
        shippingMethod === 'delivery'
          ? {
              method: 'delivery',
              address_line1: shippingAddressLine1.trim(),
              address_line2: shippingAddressLine2.trim() || undefined,
              city: shippingCity.trim(),
              province: shippingProvince.trim(),
              postal_code: shippingPostalCode.trim(),
            }
          : { method: 'pickup' },
      items: items.map((item) => ({
        id: item.id,
        product_id: item.productId as number,
        variant_id: item.variantId,
        quantity: item.quantity,
        extras: item.extras.map((ex) => ({
          id: ex.id,
          extra_id: ex.extraId,
          quantity: ex.quantity,
        })),
      })),
    };

    setSaving(true);
    try {
      const res = await adminUpdateOrder(order.id, payload);
      if (res?.data) {
        onSaved(res.data, Array.isArray(res.warnings) ? res.warnings : []);
      }
    } catch (err: unknown) {
      onAuthErr(err);
      setError(err instanceof Error ? err.message : 'No se pudo guardar los cambios del pedido.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="adm-modalOverlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !saving) onClose();
      }}
      role="presentation"
    >
      <div
        className="adm-modal adm-orderEditModal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-edit-title"
      >
        <div className="adm-modalHeader">
          <h2 id="order-edit-title" className="adm-modalTitle">
            Editar pedido #{order.id}
          </h2>
          <button
            type="button"
            className="adm-modalClose"
            aria-label="Cerrar edición del pedido"
            onClick={onClose}
            disabled={saving}
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="adm-modalBody">
            {order.status === 'processing' && (
              <div className="adm-orderNotice info" style={{ marginBottom: 14 }}>
                <span className="material-symbols-outlined" aria-hidden="true">inventory_2</span>
                <span>
                  Este pedido ya está <strong>En proceso</strong>: al guardar, el stock de insumos se ajustará automáticamente por la diferencia.
                </span>
              </div>
            )}

            {catalogLoading ? (
              <div style={{ display: 'grid', gap: 10, padding: '8px 0' }} aria-label="Cargando catálogo">
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="60%" />
              </div>
            ) : catalogError ? (
              <div className="adm-orderNotice warning">{catalogError}</div>
            ) : (
              <div className="adm-form" style={{ gap: 16 }}>
                {/* Cliente y notas */}
                <div>
                  <div className="adm-label" style={{ marginBottom: 8 }}>Datos del cliente y notas</div>
                  <div className="adm-orderEditGrid">
                    <div className="adm-field">
                      <label className="adm-label" htmlFor="edit-customer-name">Nombre *</label>
                      <input
                        id="edit-customer-name"
                        className="adm-input"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        disabled={saving}
                        required
                      />
                    </div>
                    <div className="adm-field">
                      <label className="adm-label" htmlFor="edit-customer-phone">Teléfono</label>
                      <input
                        id="edit-customer-phone"
                        className="adm-input"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className="adm-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="adm-label" htmlFor="edit-customer-email">Email</label>
                      <input
                        id="edit-customer-email"
                        type="email"
                        className="adm-input"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className="adm-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="adm-label" htmlFor="edit-order-notes">Notas (grabado, aclaraciones)</label>
                      <textarea
                        id="edit-order-notes"
                        className="adm-textarea"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={saving}
                        placeholder="Ej: Grabado modificado por WhatsApp..."
                      />
                    </div>
                  </div>
                </div>

                {/* Entrega */}
                <div>
                  <div className="adm-label" style={{ marginBottom: 8 }}>Entrega</div>
                  <div className="adm-orderEditGrid">
                    <div className="adm-field">
                      <label className="adm-label" htmlFor="edit-shipping-method">Método</label>
                      <select
                        id="edit-shipping-method"
                        className="adm-select"
                        value={shippingMethod}
                        onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                        disabled={saving}
                      >
                        <option value="pickup">Retiro</option>
                        <option value="delivery">Envío coordinado</option>
                      </select>
                    </div>
                    {shippingMethod === 'delivery' && (
                      <>
                        <div className="adm-field">
                          <label className="adm-label" htmlFor="edit-shipping-cp">Código postal *</label>
                          <input
                            id="edit-shipping-cp"
                            className="adm-input"
                            value={shippingPostalCode}
                            onChange={(e) => setShippingPostalCode(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                        <div className="adm-field">
                          <label className="adm-label" htmlFor="edit-shipping-addr1">Dirección *</label>
                          <input
                            id="edit-shipping-addr1"
                            className="adm-input"
                            value={shippingAddressLine1}
                            onChange={(e) => setShippingAddressLine1(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                        <div className="adm-field">
                          <label className="adm-label" htmlFor="edit-shipping-addr2">Piso / Depto</label>
                          <input
                            id="edit-shipping-addr2"
                            className="adm-input"
                            value={shippingAddressLine2}
                            onChange={(e) => setShippingAddressLine2(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                        <div className="adm-field">
                          <label className="adm-label" htmlFor="edit-shipping-city">Ciudad *</label>
                          <input
                            id="edit-shipping-city"
                            className="adm-input"
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                        <div className="adm-field">
                          <label className="adm-label" htmlFor="edit-shipping-province">Provincia *</label>
                          <input
                            id="edit-shipping-province"
                            className="adm-input"
                            value={shippingProvince}
                            onChange={(e) => setShippingProvince(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Ítems */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div className="adm-label">Ítems del pedido ({items.length})</div>
                    <button
                      type="button"
                      className="adm-btnSmall"
                      style={{ width: 'auto', padding: '0 10px', gap: 4, fontSize: 12, fontWeight: 700 }}
                      onClick={handleAddProduct}
                      disabled={saving || activeProducts.length === 0}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                      Agregar producto
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {items.map((item, idx) => {
                      const productObj = item.productId != null ? productById.get(item.productId) : undefined;
                      const prodOptions = [...activeProducts];
                      if (productObj && productObj.isActive === false) {
                        prodOptions.unshift(productObj);
                      }

                      const allProductVariants = item.productId != null ? (variantsByProductId.get(item.productId) || []) : [];
                      const activeProductVariants = allProductVariants.filter((v) => v.isActive !== false);
                      const currentVariantObj = item.variantId != null ? variantById.get(item.variantId) : undefined;
                      const showInactiveVariant =
                        currentVariantObj && currentVariantObj.isActive === false && extractRefId(currentVariantObj.product) === item.productId;
                      const isLegacyNullVariant = item.id != null && item.originalVariantId == null && item.variantId == null;

                      const unitPrice = getItemUnitPrice(item);
                      const extrasSubtotal = item.extras.reduce(
                        (acc, ex) => acc + getExtraUnitPrice(ex) * Math.max(1, Number(ex.quantity) || 1),
                        0
                      );
                      const lineTotal = unitPrice * Math.max(1, Number(item.quantity) || 1) + extrasSubtotal;

                      return (
                        <div key={item.localKey} className="adm-orderEditItem">
                          <div className="adm-orderEditItemHeader">
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#52525b' }}>
                              Ítem #{idx + 1}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                                Subtotal: ${formatMoney(lineTotal)}
                              </span>
                              <button
                                type="button"
                                className="adm-btnSmall"
                                title={items.length <= 1 ? 'El pedido debe tener al menos 1 ítem' : 'Quitar ítem'}
                                aria-label={`Quitar ítem ${idx + 1}`}
                                onClick={() => handleRemoveItem(item.localKey)}
                                disabled={saving || items.length <= 1}
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </div>

                          <div className="adm-orderEditItemControls">
                            <div className="adm-field">
                              <label className="adm-label">Producto</label>
                              <select
                                className="adm-select"
                                value={item.productId ?? ''}
                                onChange={(e) => handleChangeProduct(item.localKey, Number(e.target.value))}
                                disabled={saving}
                              >
                                {prodOptions.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}{p.isActive === false ? ' (inactivo)' : ''}
                                  </option>
                                ))}
                                {item.productId != null && !productObj && (
                                  <option value={item.productId}>
                                    {item.originalProductName || `Producto #${item.productId}`} (eliminado)
                                  </option>
                                )}
                              </select>
                            </div>

                            <div className="adm-field">
                              <label className="adm-label">Variante</label>
                              <select
                                className="adm-select"
                                value={item.variantId == null ? '__legacy_null__' : String(item.variantId)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateItem(item.localKey, (it) => ({
                                    ...it,
                                    variantId: val === '__legacy_null__' ? null : Number(val),
                                  }));
                                }}
                                disabled={saving}
                              >
                                {isLegacyNullVariant && (
                                  <option value="__legacy_null__">
                                    {item.originalVariantName || 'Variante original'} (eliminada) — ${formatMoney(item.originalUnitPrice)}
                                  </option>
                                )}
                                {showInactiveVariant && currentVariantObj && (
                                  <option value={currentVariantObj.id}>
                                    {currentVariantObj.name} (inactiva) — ${formatMoney(Number(currentVariantObj.price) || 0)}
                                  </option>
                                )}
                                {activeProductVariants.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name} — ${formatMoney(Number(v.price) || 0)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="adm-field">
                              <label className="adm-label">Cant.</label>
                              <div className="adm-orderEditQty">
                                <button
                                  type="button"
                                  className="adm-btnSmall"
                                  aria-label="Restar cantidad"
                                  onClick={() =>
                                    updateItem(item.localKey, (it) => ({
                                      ...it,
                                      quantity: Math.max(1, it.quantity - 1),
                                    }))
                                  }
                                  disabled={saving || item.quantity <= 1}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  className="adm-input"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.floor(Number(e.target.value) || 1));
                                    updateItem(item.localKey, (it) => ({ ...it, quantity: val }));
                                  }}
                                  disabled={saving}
                                />
                                <button
                                  type="button"
                                  className="adm-btnSmall"
                                  aria-label="Sumar cantidad"
                                  onClick={() =>
                                    updateItem(item.localKey, (it) => ({
                                      ...it,
                                      quantity: it.quantity + 1,
                                    }))
                                  }
                                  disabled={saving}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                            Precio unitario aplicado: <strong>${formatMoney(unitPrice)}</strong>
                            {item.id != null &&
                              item.productId === item.originalProductId &&
                              item.variantId === item.originalVariantId &&
                              ' (precio histórico del pedido)'}
                          </div>

                          {/* Extras */}
                          <div className="adm-orderEditExtras">
                            {item.extras.length > 0 && (
                              <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
                                {item.extras.map((ex) => {
                                  const extraObj = ex.extraId != null ? extraById.get(ex.extraId) : undefined;
                                  const exPrice = getExtraUnitPrice(ex);
                                  const displayName = extraObj?.name || ex.originalExtraName;
                                  return (
                                    <div key={ex.localKey} className="adm-orderEditExtraRow">
                                      <span style={{ flex: 1, fontSize: 12 }}>
                                        + {displayName} <span style={{ color: '#6b7280' }}>(${formatMoney(exPrice)} c/u)</span>
                                      </span>
                                      <div className="adm-orderEditQty" style={{ width: 'auto' }}>
                                        <button
                                          type="button"
                                          className="adm-btnSmall"
                                          style={{ width: 26, height: 26 }}
                                          onClick={() =>
                                            updateItem(item.localKey, (it) => ({
                                              ...it,
                                              extras: it.extras.map((row) =>
                                                row.localKey === ex.localKey
                                                  ? { ...row, quantity: Math.max(1, row.quantity - 1) }
                                                  : row
                                              ),
                                            }))
                                          }
                                          disabled={saving || ex.quantity <= 1}
                                        >
                                          −
                                        </button>
                                        <span style={{ minWidth: 20, textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
                                          {ex.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          className="adm-btnSmall"
                                          style={{ width: 26, height: 26 }}
                                          onClick={() =>
                                            updateItem(item.localKey, (it) => ({
                                              ...it,
                                              extras: it.extras.map((row) =>
                                                row.localKey === ex.localKey
                                                  ? { ...row, quantity: row.quantity + 1 }
                                                  : row
                                              ),
                                            }))
                                          }
                                          disabled={saving}
                                        >
                                          +
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        className="adm-btnSmall"
                                        style={{ width: 26, height: 26 }}
                                        title="Quitar extra"
                                        onClick={() =>
                                          updateItem(item.localKey, (it) => ({
                                            ...it,
                                            extras: it.extras.filter((row) => row.localKey !== ex.localKey),
                                          }))
                                        }
                                        disabled={saving}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="adm-orderEditAddExtra">
                              <select
                                className="adm-select"
                                style={{ height: 34, fontSize: 12 }}
                                value={item.pendingExtraId}
                                onChange={(e) =>
                                  updateItem(item.localKey, (it) => ({ ...it, pendingExtraId: e.target.value }))
                                }
                                disabled={saving || activeExtras.length === 0}
                              >
                                <option value="">Seleccionar extra para agregar...</option>
                                {activeExtras.map((ex) => (
                                  <option key={ex.id} value={ex.id}>
                                    {ex.name}
                                    {ex.categoryType ? ` (${ex.categoryType})` : ''} — ${formatMoney(Number(ex.price) || 0)}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="adm-btnSmall"
                                style={{ width: 'auto', height: 34, padding: '0 10px', gap: 4, fontSize: 12, fontWeight: 700 }}
                                onClick={() => handleAddExtra(item.localKey)}
                                disabled={saving || !item.pendingExtraId}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
                                Agregar extra
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resumen de totales */}
                <div className="adm-orderEditSummary">
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#52525b' }}>
                      Total anterior: <strong>${formatMoney(totals.oldTotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>
                        Nuevo total: ${formatMoney(totals.newTotal)}
                      </span>
                      {Math.abs(totals.delta) > 0.001 && (
                        <span className={`adm-badge ${totals.delta > 0 ? 'blue' : 'yellow'}`}>
                          {totals.delta > 0 ? `+$${formatMoney(totals.delta)}` : `-$${formatMoney(Math.abs(totals.delta))}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {paymentPreview && (
                    <div className={`adm-orderNotice ${paymentPreview.kind}`} style={{ marginTop: 10 }}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {paymentPreview.kind === 'warning' ? 'warning' : 'info'}
                      </span>
                      <span>{paymentPreview.text}</span>
                    </div>
                  )}
                </div>

                {error && <p className="adm-error">{error}</p>}
              </div>
            )}
          </div>

          <div className="adm-modalFooter">
            <button type="button" className="adm-btnCancel" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              type="submit"
              className="adm-btnPrimary"
              disabled={saving || catalogLoading || Boolean(catalogError)}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
