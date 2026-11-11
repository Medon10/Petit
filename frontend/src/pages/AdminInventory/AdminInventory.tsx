import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../componentes/admin/AdminLayout';
import Skeleton from '../../componentes/shared/Skeleton';
import { clearAdminToken } from '../../shared/api';
import {
  fetchSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  adjustSupplyStock,
  fetchSupplyMovements,
  type SupplyDto,
  type StockMovementDto,
} from '../../shared/adminInventoryApi';
import '../../componentes/admin/AdminLayout.css';
import './AdminInventory.css';

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const movementLabels: Record<string, string> = {
  initial: 'Stock inicial',
  purchase: 'Compra',
  sale: 'Venta (Pedido)',
  sale_reversal: 'Reversión (Pedido cancelado)',
  adjustment: 'Ajuste manual',
};

export default function AdminInventoryPage() {
  const nav = useNavigate();

  const [supplies, setSupplies] = useState<SupplyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal Crear / Editar
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplyDto | null>(null);
  const [fCode, setFCode] = useState('');
  const [fName, setFName] = useState('');
  const [fStock, setFStock] = useState('0');
  const [fThreshold, setFThreshold] = useState('5');
  const [fActive, setFActive] = useState(true);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState('');

  // Modal Ajustar Stock
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<SupplyDto | null>(null);
  const [targetStock, setTargetStock] = useState('0');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Modal Historial de Movimientos
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<SupplyDto | null>(null);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const onAuthErr = useCallback(
    (e: unknown) => {
      const msg = String((e as Error)?.message ?? '');
      if (msg.includes('401') || msg.toLowerCase().includes('token')) {
        clearAdminToken();
        nav('/admin/login');
        return true;
      }
      return false;
    },
    [nav]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchSupplies({
        q: search.trim() || undefined,
        low_stock_only: lowStockOnly,
        limit: 200,
      });
      setSupplies(res.data);
    } catch (e: any) {
      if (!onAuthErr(e)) {
        setError(e?.message || 'Error al cargar el inventario');
      }
    } finally {
      setLoading(false);
    }
  }, [search, lowStockOnly, onAuthErr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPIs
  const kpis = useMemo(() => {
    const totalPieces = supplies.length;
    const totalUnits = supplies.reduce((acc, s) => acc + s.stock, 0);
    const lowStockCount = supplies.filter((s) => s.isLowStock).length;
    const linkedVariantsTotal = supplies.reduce((acc, s) => acc + s.linkedVariantsCount, 0);
    return { totalPieces, totalUnits, lowStockCount, linkedVariantsTotal };
  }, [supplies]);

  // Abrir modal nueva pieza
  function openCreateModal() {
    setEditingItem(null);
    setFCode('');
    setFName('');
    setFStock('0');
    setFThreshold('5');
    setFActive(true);
    setItemError('');
    setEditModalOpen(true);
  }

  // Abrir modal editar pieza
  function openEditModal(item: SupplyDto) {
    setEditingItem(item);
    setFCode(item.code);
    setFName(item.name);
    setFStock(String(item.stock));
    setFThreshold(String(item.lowStockThreshold));
    setFActive(item.isActive);
    setItemError('');
    setEditModalOpen(true);
  }

  // Guardar pieza (crear / editar)
  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    setItemError('');

    if (!fCode.trim()) {
      setItemError('El código de la pieza es requerido');
      return;
    }
    if (!fName.trim()) {
      setItemError('El nombre de la pieza es requerido');
      return;
    }

    setSavingItem(true);
    try {
      if (editingItem) {
        await updateSupply(editingItem.id, {
          code: fCode.trim().toUpperCase(),
          name: fName.trim(),
          low_stock_threshold: Number(fThreshold) || 5,
          is_active: fActive,
        });
      } else {
        await createSupply({
          code: fCode.trim().toUpperCase(),
          name: fName.trim(),
          stock: Number(fStock) || 0,
          low_stock_threshold: Number(fThreshold) || 5,
          is_active: fActive,
        });
      }
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      if (!onAuthErr(err)) {
        setItemError(err?.message || 'Error al guardar pieza');
      }
    } finally {
      setSavingItem(false);
    }
  }

  // Abrir modal ajuste
  function openAdjustModal(item: SupplyDto) {
    setAdjustItem(item);
    setTargetStock(String(item.stock));
    setAdjustNote('');
    setAdjustError('');
    setAdjustModalOpen(true);
  }

  // Modificar stock con botones +/- del stepper o píldoras rápidas
  function handleStepChange(step: number) {
    const current = Number(targetStock);
    const validCurrent = Number.isInteger(current) ? current : (adjustItem?.stock || 0);
    setTargetStock(String(validCurrent + step));
  }

  // Guardar ajuste
  async function handleSaveAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustItem) return;
    setAdjustError('');

    const ns = Number(targetStock);
    if (!targetStock.trim() || !Number.isInteger(ns)) {
      setAdjustError('Ingrese un número entero válido para el stock');
      return;
    }

    const delta = ns - adjustItem.stock;
    if (delta === 0) {
      setAdjustModalOpen(false);
      return;
    }

    const defaultNote = delta > 0 ? `Ingreso de stock (+${delta})` : `Ajuste / Salida (${delta})`;
    const note = adjustNote.trim() || defaultNote;

    setAdjusting(true);
    try {
      await adjustSupplyStock(adjustItem.id, { new_stock: ns, note });
      setAdjustModalOpen(false);
      await loadData();
    } catch (err: any) {
      if (!onAuthErr(err)) {
        setAdjustError(err?.message || 'Error al ajustar stock');
      }
    } finally {
      setAdjusting(false);
    }
  }

  // Abrir historial
  async function openHistoryModal(item: SupplyDto) {
    setHistoryItem(item);
    setHistoryModalOpen(true);
    setLoadingMovements(true);
    try {
      const res = await fetchSupplyMovements(item.id, { limit: 100 });
      setMovements(res.data);
    } catch (err: any) {
      onAuthErr(err);
    } finally {
      setLoadingMovements(false);
    }
  }

  // Eliminar pieza definitivamente
  async function handleDeleteSupply(item: SupplyDto) {
    const linkedWarning =
      item.linkedVariantsCount > 0
        ? ` Se desvinculará de ${item.linkedVariantsCount} variante(s).`
        : '';
    if (!confirm(`¿Eliminar pieza "${item.code} - ${item.name}"?${linkedWarning}`)) return;
    setError('');
    try {
      await deleteSupply(item.id);
      await loadData();
    } catch (err: any) {
      if (!onAuthErr(err)) {
        setError(err?.message || 'Error al eliminar pieza');
      }
    }
  }

  // Diferencia calculada en tiempo real
  const targetStockNum = Number(targetStock);
  const isValidStockNum = targetStock.trim() !== '' && Number.isInteger(targetStockNum);
  const deltaCalc = adjustItem && isValidStockNum ? targetStockNum - adjustItem.stock : 0;

  return (
    <AdminLayout>
      <Helmet>
        <title>Inventario de Piezas | Petit Admin</title>
      </Helmet>

      <div className="adm-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="adm-h1">Inventario de Piezas</h1>
          <p className="adm-textMuted" style={{ margin: '4px 0 0' }}>
            Control de stock por código base de pieza física (ej. A1, C7, P10).
          </p>
        </div>
        <button className="adm-btnPrimary" type="button" onClick={openCreateModal}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nueva Pieza
        </button>
      </div>

      {/* KPI Cards */}
      <div className="adm-invKpis">
        <div className="adm-invKpiCard">
          <span className="adm-invKpiLabel">Total Piezas</span>
          <span className="adm-invKpiValue">{kpis.totalPieces}</span>
        </div>
        <div className="adm-invKpiCard">
          <span className="adm-invKpiLabel">Unidades Físicas</span>
          <span className="adm-invKpiValue ok">{kpis.totalUnits}</span>
        </div>
        <div className="adm-invKpiCard">
          <span className="adm-invKpiLabel">Stock Bajo o Crítico</span>
          <span className={`adm-invKpiValue ${kpis.lowStockCount > 0 ? 'alert' : ''}`}>
            {kpis.lowStockCount}
          </span>
        </div>
        <div className="adm-invKpiCard">
          <span className="adm-invKpiLabel">Variantes Vinculadas</span>
          <span className="adm-invKpiValue">{kpis.linkedVariantsTotal}</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="adm-card adm-invToolbar">
        <div className="adm-invFilters">
          <div className="adm-invSearch">
            <input
              type="text"
              className="adm-input"
              placeholder="Buscar por código (A1, C9) o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="adm-invFilterCheckbox">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            Solo stock bajo
          </label>
        </div>
        {(search || lowStockOnly) && (
          <button
            type="button"
            className="adm-btnSecondary"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => {
              setSearch('');
              setLowStockOnly(false);
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <div className="adm-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="adm-card" style={{ display: 'grid', gap: 12 }}>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      ) : supplies.length === 0 ? (
        <div className="adm-card adm-empty">
          No se encontraron piezas registradas con los filtros seleccionados.
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Código</th>
                <th>Pieza</th>
                <th style={{ width: 140 }}>Stock Actual</th>
                <th>Variantes vinculadas</th>
                <th style={{ width: 90 }}>Estado</th>
                <th style={{ width: 170, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((item) => {
                const isCritical = item.stock <= 0;
                const isLow = !isCritical && item.stock <= item.lowStockThreshold;

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="adm-codeBadge">{item.code}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#111827' }}>{item.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`adm-stockNumber ${isCritical ? 'critical' : isLow ? 'low' : 'good'
                          }`}
                        title={
                          isCritical
                            ? 'Stock en cero o negativo (demanda sin reposición)'
                            : isLow
                              ? `Stock bajo (umbral: ${item.lowStockThreshold} u.)`
                              : 'Stock saludable'
                        }
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          {isCritical ? 'warning' : isLow ? 'info' : 'check_circle'}
                        </span>
                        {item.stock} u.
                      </span>
                    </td>
                    <td>
                      {item.linkedVariants.length > 0 ? (
                        <div className="adm-linkedVariantsList">
                          {item.linkedVariants.map((v) => (
                            <span
                              key={v.variantId}
                              className="adm-variantTag"
                              title={`${v.productName ? `${v.productName} - ` : ''}${v.variantName} (usa ${v.quantity} u.)`}
                            >
                              {v.productName ? `${v.productName}: ` : ''}{v.variantName}
                              {v.quantity > 1 ? ` (x${v.quantity})` : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="adm-variantNone">Sin variantes asociadas</span>
                      )}
                    </td>
                    <td>
                      <span className={`adm-badge ${item.isActive ? 'green' : 'gray'}`}>
                        {item.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="adm-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="adm-btnSmall"
                          title="Ajustar Stock (+/- o conteo)"
                          onClick={() => openAdjustModal(item)}
                        >
                          <span className="material-symbols-outlined">tune</span>
                        </button>
                        <button
                          className="adm-btnSmall"
                          title="Historial de movimientos"
                          onClick={() => openHistoryModal(item)}
                        >
                          <span className="material-symbols-outlined">history</span>
                        </button>
                        <button
                          className="adm-btnSmall"
                          title="Editar pieza"
                          onClick={() => openEditModal(item)}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="adm-btnSmall"
                          title="Eliminar pieza"
                          onClick={() => handleDeleteSupply(item)}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PIEZA */}
      {editModalOpen && (
        <div className="adm-modalOverlay" onClick={() => setEditModalOpen(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">
                {editingItem ? `Editar Pieza ${editingItem.code}` : 'Nueva Pieza de Inventario'}
              </h2>
              <button className="adm-modalClose" onClick={() => setEditModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="adm-modalBody">
                <div className="adm-form">
                  <div className="adm-field">
                    <label className="adm-label">Código único (ej. A1, C7, P10)</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ej. A1, BD1, HP1..."
                      value={fCode}
                      onChange={(e) => setFCode(e.target.value.toUpperCase())}
                      style={{ textTransform: 'uppercase', fontWeight: 700 }}
                      required
                    />
                  </div>

                  <div className="adm-field">
                    <label className="adm-label">Nombre descriptivo de la pieza</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Ej. Círculo 30mm, Dije Corazón..."
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      required
                    />
                  </div>

                  {!editingItem && (
                    <div className="adm-field">
                      <label className="adm-label">Stock físico inicial</label>
                      <input
                        type="number"
                        className="adm-input"
                        value={fStock}
                        onChange={(e) => setFStock(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="adm-field">
                    <label className="adm-label">Alerta de stock bajo (umbral)</label>
                    <input
                      type="number"
                      className="adm-input"
                      value={fThreshold}
                      onChange={(e) => setFThreshold(e.target.value)}
                      min="0"
                      required
                    />
                    <small style={{ color: '#6b7280', fontSize: 11 }}>
                      Avisará en amarillo/rojo cuando el stock sea menor o igual a este número.
                    </small>
                  </div>

                  <label className="adm-checkbox" style={{ marginTop: 6 }}>
                    <input
                      type="checkbox"
                      checked={fActive}
                      onChange={(e) => setFActive(e.target.checked)}
                    />
                    Pieza activa en el taller
                  </label>

                  {itemError && <div className="adm-error">{itemError}</div>}
                </div>
              </div>

              <div className="adm-modalFooter">
                <button
                  type="button"
                  className="adm-btnCancel"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="adm-btnPrimary"
                  disabled={savingItem}
                >
                  {savingItem ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear Pieza'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTAR STOCK */}
      {adjustModalOpen && adjustItem && (
        <div className="adm-modalOverlay" onClick={() => setAdjustModalOpen(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">
                Ajustar Stock: {adjustItem.code} - {adjustItem.name}
              </h2>
              <button className="adm-modalClose" onClick={() => setAdjustModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveAdjust}>
              <div className="adm-modalBody">
                <div className="adm-adjustCurrentStock">
                  <span>Stock actual registrado:</span>
                  <strong>{adjustItem.stock} unidades</strong>
                </div>

                <label className="adm-label" style={{ marginBottom: 8, display: 'block' }}>
                  Nuevo stock físico (escribí el conteo o usá los botones + / -):
                </label>

                {/* Stepper interactivo directo */}
                <div className="adm-stepperGroup">
                  <button
                    type="button"
                    className="adm-stepperBtn minus"
                    onClick={() => handleStepChange(-1)}
                    title="Restar 1 unidad"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <div className="adm-stepperInputWrap">
                    <input
                      type="number"
                      className="adm-stepperInput"
                      value={targetStock}
                      onChange={(e) => setTargetStock(e.target.value)}
                      autoFocus
                      required
                    />
                    <span className="adm-stepperUnit">u.</span>
                  </div>
                  <button
                    type="button"
                    className="adm-stepperBtn plus"
                    onClick={() => handleStepChange(1)}
                    title="Sumar 1 unidad"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>

                {/* Píldoras de ajuste rápido táctil para tablet */}
                <div className="adm-quickPills">
                  <button type="button" className="adm-quickPill sub" onClick={() => handleStepChange(-10)}>-10</button>
                  <button type="button" className="adm-quickPill sub" onClick={() => handleStepChange(-5)}>-5</button>
                  <button type="button" className="adm-quickPill sub" onClick={() => handleStepChange(-1)}>-1</button>
                  <button type="button" className="adm-quickPill add" onClick={() => handleStepChange(1)}>+1</button>
                  <button type="button" className="adm-quickPill add" onClick={() => handleStepChange(5)}>+5</button>
                  <button type="button" className="adm-quickPill add" onClick={() => handleStepChange(10)}>+10</button>
                  <button type="button" className="adm-quickPill add" onClick={() => handleStepChange(20)}>+20</button>
                </div>

                {/* Resumen de diferencia */}
                <div className="adm-deltaSummary">
                  <span style={{ fontSize: 13, color: '#475569' }}>Diferencia calculada:</span>
                  <strong
                    style={{
                      fontSize: 15,
                      color: deltaCalc > 0 ? '#059669' : deltaCalc < 0 ? '#dc2626' : '#6b7280',
                    }}
                  >
                    {deltaCalc > 0 ? `+${deltaCalc} u. (aumenta)` : deltaCalc < 0 ? `${deltaCalc} u. (disminuye)` : 'Sin cambios'}
                  </strong>
                </div>

                <div className="adm-field">
                  <label className="adm-label">Motivo o detalle (opcional)</label>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="Ej. Compra a proveedor, recuento físico, rotura..."
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                  />
                  <div className="adm-notePills">
                    <button type="button" className="adm-notePill" onClick={() => setAdjustNote('Compra a proveedor')}>Compra a proveedor</button>
                    <button type="button" className="adm-notePill" onClick={() => setAdjustNote('Recuento físico')}>Recuento físico</button>
                    <button type="button" className="adm-notePill" onClick={() => setAdjustNote('Rotura / Descarte')}>Rotura / Descarte</button>
                    <button type="button" className="adm-notePill" onClick={() => setAdjustNote('Devolución')}>Devolución</button>
                  </div>
                </div>

                {adjustError && <div className="adm-error">{adjustError}</div>}
              </div>

              <div className="adm-modalFooter">
                <button
                  type="button"
                  className="adm-btnCancel"
                  onClick={() => setAdjustModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="adm-btnPrimary"
                  disabled={adjusting}
                >
                  {adjusting ? 'Guardando...' : 'Guardar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE MOVIMIENTOS */}
      {historyModalOpen && historyItem && (
        <div className="adm-modalOverlay" onClick={() => setHistoryModalOpen(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="adm-modalHeader">
              <div>
                <h2 className="adm-modalTitle">
                  Historial: {historyItem.code} - {historyItem.name}
                </h2>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  Stock actual: <strong>{historyItem.stock} u.</strong>
                </span>
              </div>
              <button className="adm-modalClose" onClick={() => setHistoryModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="adm-modalBody">
              {loadingMovements ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </div>
              ) : movements.length === 0 ? (
                <div className="adm-empty" style={{ padding: '24px 0' }}>
                  No hay movimientos registrados para esta pieza.
                </div>
              ) : (
                <div className="adm-movementLog">
                  {movements.map((m) => {
                    const isPositive = m.delta > 0;
                    const isNegative = m.delta < 0;

                    return (
                      <div key={m.id} className="adm-movementItem">
                        <div className="adm-movementMain">
                          <span className="adm-movementTitle">
                            {movementLabels[m.type] || m.type}
                            {m.orderId && (
                              <span style={{ color: '#db2777', fontWeight: 600 }}>
                                #{m.orderId} {m.customerName ? `(${m.customerName})` : ''}
                              </span>
                            )}
                          </span>
                          {m.note && <span style={{ color: '#4b5563' }}>{m.note}</span>}
                          <span className="adm-movementMeta">{formatDate(m.createdAt)}</span>
                        </div>
                        <div
                          className={`adm-movementDelta ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'
                            }`}
                        >
                          {isPositive ? `+${m.delta}` : m.delta}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="adm-modalFooter">
              <button
                type="button"
                className="adm-btnPrimary"
                onClick={() => setHistoryModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
