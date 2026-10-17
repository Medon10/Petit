import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../componentes/admin/AdminLayout';
import Skeleton from '../../componentes/shared/Skeleton';
import { clearAdminToken } from '../../shared/api';
import {
  fetchPricing,
  updateVariantPricing,
  batchUpdateCosts,
  type VariantCostItem,
  type PricingSummary,
} from '../../shared/adminPricingApi';
import '../../componentes/admin/AdminLayout.css';
import './AdminPricing.css';

function formatMoney(val: number): string {
  return `$${Math.round(val).toLocaleString('es-AR')}`;
}

type MarginFilterType = 'all' | 'healthy' | 'warning' | 'critical';

export default function AdminPricingPage() {
  const nav = useNavigate();

  const [items, setItems] = useState<VariantCostItem[]>([]);
  const [summary, setSummary] = useState<PricingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [marginFilter, setMarginFilter] = useState<MarginFilterType>('all');

  // Modal Edición Individual
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VariantCostItem | null>(null);
  const [fPiece, setFPiece] = useState('0');
  const [fEngraving, setFEngraving] = useState('0');
  const [fChain, setFChain] = useState('0');
  const [fLabor, setFLabor] = useState('0');
  const [fPackaging, setFPackaging] = useState('0');
  const [fOther, setFOther] = useState('0');
  const [fPriceWeb, setFPriceWeb] = useState('0');
  const [fNotes, setFNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Modal Actualización Masiva
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchField, setBatchField] = useState<'cost_engraving' | 'cost_chain' | 'cost_labor' | 'cost_packaging'>('cost_labor');
  const [batchCategoryId, setBatchCategoryId] = useState<string>('all');
  const [batchValue, setBatchValue] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [batchSuccess, setBatchSuccess] = useState('');

  const loadPricingData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchPricing();
      setItems(res.data);
      setSummary(res.summary);
    } catch (err: any) {
      if (err?.code === 'TOKEN_EXPIRED' || err?.message?.toLowerCase().includes('sesión')) {
        clearAdminToken();
        nav('/admin/login');
        return;
      }
      setError(err?.message || 'Error al cargar los costos y precios');
    } finally {
      setLoading(false);
    }
  }, [nav]);

  useEffect(() => {
    loadPricingData();
  }, [loadPricingData]);

  // Lista de categorías únicas encontradas en los datos
  const categoriesList = useMemo(() => {
    const map = new Map<number, string>();
    for (const it of items) {
      if (it.categoryId && it.categoryName) {
        map.set(it.categoryId, it.categoryName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Filtrado local en memoria para máxima velocidad de respuesta
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Búsqueda de texto
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = item.productName?.toLowerCase().includes(q);
        const matchVar = item.variantName?.toLowerCase().includes(q);
        const matchSupply = item.linkedSupply?.code?.toLowerCase().includes(q) || item.linkedSupply?.name?.toLowerCase().includes(q);
        if (!matchName && !matchVar && !matchSupply) return false;
      }

      // Filtro por categoría
      if (selectedCategory !== 'all') {
        if (String(item.categoryId) !== selectedCategory) return false;
      }

      // Filtro por estado de margen
      if (marginFilter !== 'all') {
        if (item.metrics.status !== marginFilter) return false;
      }

      return true;
    });
  }, [items, search, selectedCategory, marginFilter]);

  // Abrir modal de edición individual
  function openEditModal(item: VariantCostItem) {
    setEditingItem(item);
    setFPiece(String(item.costs.costPiece));
    setFEngraving(String(item.costs.costEngraving));
    setFChain(String(item.costs.costChain));
    setFLabor(String(item.costs.costLabor));
    setFPackaging(String(item.costs.costPackaging));
    setFOther(String(item.costs.costOther));
    setFPriceWeb(String(item.priceWeb));
    setFNotes(item.notes || '');
    setEditError('');
    setEditModalOpen(true);
  }

  // Cálculos en vivo del simulador en el modal de edición
  const simCostPiece = Math.max(0, Number(fPiece) || 0);
  const simCostEngraving = Math.max(0, Number(fEngraving) || 0);
  const simCostChain = Math.max(0, Number(fChain) || 0);
  const simCostLabor = Math.max(0, Number(fLabor) || 0);
  const simCostPackaging = Math.max(0, Number(fPackaging) || 0);
  const simCostOther = Math.max(0, Number(fOther) || 0);
  const simPriceWeb = Math.max(0, Number(fPriceWeb) || 0);

  const simTotalCost = Math.round((simCostPiece + simCostEngraving + simCostChain + simCostLabor + simCostPackaging + simCostOther) * 100) / 100;
  const simProfit = Math.round((simPriceWeb - simTotalCost) * 100) / 100;
  const simMarginPercent = simPriceWeb > 0 ? Math.round((simProfit / simPriceWeb) * 1000) / 10 : 0;
  const simMarkupPercent = simTotalCost > 0 ? Math.round((simProfit / simTotalCost) * 1000) / 10 : 0;
  const simSugg15 = Math.round(simTotalCost * 1.5);
  const simSugg20 = Math.round(simTotalCost * 2.0);

  const simStatus = simMarginPercent >= 50 ? 'healthy' : simMarginPercent >= 40 ? 'warning' : 'critical';

  // Guardar edición individual
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSavingEdit(true);
      setEditError('');
      const res = await updateVariantPricing(editingItem.variantId, {
        cost_piece: simCostPiece,
        cost_engraving: simCostEngraving,
        cost_chain: simCostChain,
        cost_labor: simCostLabor,
        cost_packaging: simCostPackaging,
        cost_other: simCostOther,
        price_web: simPriceWeb,
        notes: fNotes.trim() || undefined,
      });

      if (res.data) {
        setItems((prev) => prev.map((it) => (it.variantId === res.data!.variantId ? res.data! : it)));
      }
      setEditModalOpen(false);
      // Recargar para recalcular KPIs globales
      loadPricingData();
    } catch (err: any) {
      setEditError(err?.message || 'Error al guardar los cambios');
    } finally {
      setSavingEdit(false);
    }
  }

  // Guardar actualización masiva
  async function handleSaveBatch(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(batchValue);
    if (!Number.isFinite(val) || val < 0) {
      setBatchError('Ingresá un valor numérico válido mayor o igual a 0');
      return;
    }

    try {
      setSavingBatch(true);
      setBatchError('');
      setBatchSuccess('');

      const catId = batchCategoryId === 'all' ? undefined : Number(batchCategoryId);
      const res = await batchUpdateCosts({
        field: batchField,
        value: val,
        category_id: catId,
      });

      setBatchSuccess(res.message);
      setTimeout(() => {
        setBatchModalOpen(false);
        setBatchSuccess('');
        setBatchValue('');
        loadPricingData();
      }, 1000);
    } catch (err: any) {
      setBatchError(err?.message || 'Error al ejecutar la actualización masiva');
    } finally {
      setSavingBatch(false);
    }
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Precios y Márgenes | Petit Admin Studio</title>
      </Helmet>

      {/* Header */}
      <div className="adm-prHeader">
        <div className="adm-prTitle">
          <h1>Precios y Márgenes de Ganancia</h1>
          <p>Estructura de costos unitarios, márgenes de ganancia y sugerencias de precios.</p>
        </div>
        <button
          type="button"
          className="adm-btnPrimary"
          onClick={() => {
            setBatchError('');
            setBatchSuccess('');
            setBatchValue('');
            setBatchModalOpen(true);
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
          Actualización Masiva
        </button>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="adm-prKpis">
          <div className="adm-prKpiCard healthy">
            <span className="adm-prKpiLabel">Margen Promedio</span>
            <span className="adm-prKpiValue">{summary.averageMargin.toFixed(1)}%</span>
            <span className="adm-prKpiSub">Sobre precio de venta</span>
          </div>

          <div className="adm-prKpiCard">
            <span className="adm-prKpiLabel">Ganancia Promedio</span>
            <span className="adm-prKpiValue">{formatMoney(summary.averageProfit)}</span>
            <span className="adm-prKpiSub">Por unidad vendida</span>
          </div>

          <div className="adm-prKpiCard healthy">
            <span className="adm-prKpiLabel">Margen Saludable (≥50%)</span>
            <span className="adm-prKpiValue">{summary.healthyCount} u.</span>
            <span className="adm-prKpiSub">Variantes con alta rentabilidad</span>
          </div>

          <div className={`adm-prKpiCard ${summary.criticalCount > 0 ? 'critical' : 'healthy'}`}>
            <span className="adm-prKpiLabel">Para Revisar (&lt;40%)</span>
            <span className="adm-prKpiValue">{summary.criticalCount} u.</span>
            <span className="adm-prKpiSub">
              {summary.criticalCount === 0 ? 'Ninguna variante con margen crítico' : 'Revisar costos o precio de venta'}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="adm-card adm-prToolbar">
        <div className="adm-prSearchRow">
          <div className="adm-prSearchBox">
            <input
              type="text"
              className="adm-input"
              placeholder="Buscar por producto, variante o dije (ej. Círculo 25mm, A-25)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {(search || selectedCategory !== 'all' || marginFilter !== 'all') && (
            <button
              type="button"
              className="adm-btnSecondary"
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setMarginFilter('all');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {/* Categorías */}
          <div className="adm-prFilterPillsGroup">
            <span className="adm-prPillLabel">Categoría:</span>
            <button
              type="button"
              className={`adm-prPill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Todas
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`adm-prPill ${selectedCategory === String(cat.id) ? 'active' : ''}`}
                onClick={() => setSelectedCategory(String(cat.id))}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Margen */}
          <div className="adm-prFilterPillsGroup">
            <span className="adm-prPillLabel">Rentabilidad:</span>
            <button
              type="button"
              className={`adm-prPill ${marginFilter === 'all' ? 'active' : ''}`}
              onClick={() => setMarginFilter('all')}
            >
              Todas
            </button>
            <button
              type="button"
              className={`adm-prPill ${marginFilter === 'healthy' ? 'active' : ''}`}
              onClick={() => setMarginFilter('healthy')}
            >
              Saludables (≥50%)
            </button>
            <button
              type="button"
              className={`adm-prPill ${marginFilter === 'warning' ? 'active' : ''}`}
              onClick={() => setMarginFilter('warning')}
            >
              Atención (40-49%)
            </button>
            <button
              type="button"
              className={`adm-prPill ${marginFilter === 'critical' ? 'active' : ''}`}
              onClick={() => setMarginFilter('critical')}
            >
              Bajas (&lt;40%)
            </button>
          </div>
        </div>
      </div>

      {error && <div className="adm-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Main Table */}
      {loading ? (
        <div className="adm-card" style={{ display: 'grid', gap: 12 }}>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="adm-card adm-empty">
          No se encontraron variantes con los filtros seleccionados.
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 0 }}>
          <div className="adm-prTableWrap">
            <table className="adm-prTable">
              <thead>
                <tr>
                  <th>Producto y Variante</th>
                  <th>Costo de Fabricación</th>
                  <th>Precio Web</th>
                  <th>Sugeridos (1.5x / 2.0x)</th>
                  <th>Ganancia y Margen</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.variantId}>
                    {/* Producto */}
                    <td>
                      <div className="adm-prProdCell">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="adm-prProdThumb"
                            loading="lazy"
                          />
                        ) : (
                          <div className="adm-prProdFallback">
                            <span className="material-symbols-outlined">sell</span>
                          </div>
                        )}
                        <div className="adm-prProdMeta">
                          <span className="adm-prProdName">{item.productName}</span>
                          <span className="adm-prVariantName">{item.variantName}</span>
                          <div className="adm-prBadgesRow">
                            <span className="adm-prCatBadge">{item.categoryName}</span>
                            {item.linkedSupply && (
                              <span className="adm-prSupplyBadge" title={item.linkedSupply.name}>
                                Pieza: {item.linkedSupply.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Costo de fabricación */}
                    <td>
                      <div className="adm-prCostTotal">{formatMoney(item.costs.totalCost)}</div>
                      <div className="adm-prCostChips">
                        <span className="adm-prCostChip" title="Dije / Pieza">D: {formatMoney(item.costs.costPiece)}</span>
                        <span>·</span>
                        <span className="adm-prCostChip" title="Grabado">Gr: {formatMoney(item.costs.costEngraving)}</span>
                        <span>·</span>
                        <span className="adm-prCostChip" title="Cadena / Accesorio">Cad: {formatMoney(item.costs.costChain)}</span>
                        <span>·</span>
                        <span className="adm-prCostChip" title="Mano de obra">MO: {formatMoney(item.costs.costLabor)}</span>
                        <span>·</span>
                        <span className="adm-prCostChip" title="Packaging">Pack: {formatMoney(item.costs.costPackaging)}</span>
                      </div>
                    </td>

                    {/* Precio Web Actual */}
                    <td>
                      <div className="adm-prPrice">{formatMoney(item.priceWeb)}</div>
                    </td>

                    {/* Precios Sugeridos */}
                    <td>
                      <div className="adm-prSuggested">
                        <div className="adm-prSuggRow">
                          <span>x1.5 (50% markup):</span>
                          <strong>{formatMoney(item.metrics.suggested15)}</strong>
                        </div>
                        <div className="adm-prSuggRow">
                          <span>x2.0 (100% markup):</span>
                          <strong>{formatMoney(item.metrics.suggested20)}</strong>
                        </div>
                      </div>
                    </td>

                    {/* Ganancia & Margen */}
                    <td>
                      <div className="adm-prProfit">
                        <span className="adm-prProfitNum">+{formatMoney(item.metrics.profit)}</span>
                        <span
                          className={`adm-prMarginBadge ${item.metrics.status}`}
                          title={`Markup sobre costo: ${item.metrics.markupPercent}%`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            {item.metrics.status === 'healthy'
                              ? 'check_circle'
                              : item.metrics.status === 'warning'
                              ? 'info'
                              : 'warning'}
                          </span>
                          {item.metrics.marginPercent}% margen
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="adm-btnSecondary"
                        style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={() => openEditModal(item)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Editar Costos Individual */}
      {editModalOpen && editingItem && (
        <div className="adm-prModalOverlay" onClick={() => !savingEdit && setEditModalOpen(false)}>
          <div className="adm-prModal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-prModalHeader">
              <h3>Editar Costos y Precio de Venta</h3>
              <button
                type="button"
                className="adm-btnSecondary"
                style={{ padding: 4, minWidth: 'auto', border: 0 }}
                onClick={() => setEditModalOpen(false)}
                disabled={savingEdit}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="adm-prModalBody">
                {/* Banner de producto */}
                <div className="adm-prModalBanner">
                  {editingItem.imageUrl ? (
                    <img
                      src={editingItem.imageUrl}
                      alt={editingItem.productName}
                      className="adm-prProdThumb"
                    />
                  ) : (
                    <div className="adm-prProdFallback">
                      <span className="material-symbols-outlined">sell</span>
                    </div>
                  )}
                  <div className="adm-prModalBannerMeta">
                    <h4>{editingItem.productName}</h4>
                    <span>
                      Variante: <strong>{editingItem.variantName}</strong> · Categoría: {editingItem.categoryName}
                      {editingItem.linkedSupply && ` · Pieza: ${editingItem.linkedSupply.code}`}
                    </span>
                  </div>
                </div>

                {editError && <div className="adm-error">{editError}</div>}

                {/* Grid de Inputs de Costos */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#374151' }}>
                    Desglose de Costos de Fabricación ($)
                  </h4>
                  <div className="adm-prCostGrid">
                    <div className="adm-prField">
                      <label>Dije / Pieza</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fPiece}
                        onChange={(e) => setFPiece(e.target.value)}
                        required
                      />
                    </div>
                    <div className="adm-prField">
                      <label>Grabado Láser</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fEngraving}
                        onChange={(e) => setFEngraving(e.target.value)}
                        required
                      />
                    </div>
                    <div className="adm-prField">
                      <label>Cadena / Accesorio</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fChain}
                        onChange={(e) => setFChain(e.target.value)}
                        required
                      />
                    </div>
                    <div className="adm-prField">
                      <label>Mano de Obra</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fLabor}
                        onChange={(e) => setFLabor(e.target.value)}
                        required
                      />
                    </div>
                    <div className="adm-prField">
                      <label>Packaging</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fPackaging}
                        onChange={(e) => setFPackaging(e.target.value)}
                        required
                      />
                    </div>
                    <div className="adm-prField">
                      <label>Varios / Otros</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fOther}
                        onChange={(e) => setFOther(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Precio Web de Venta */}
                <div className="adm-prField" style={{ maxWidth: 220 }}>
                  <label>Precio de Venta en la Web ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={fPriceWeb}
                    onChange={(e) => setFPriceWeb(e.target.value)}
                    required
                  />
                </div>

                {/* Simulador en Vivo de Rentabilidad */}
                <div className="adm-prSimulator">
                  <span className="adm-prSimTitle">Simulación en Vivo de Rentabilidad</span>
                  <div className="adm-prSimMetrics">
                    <div className="adm-prSimItem">
                      <span className="adm-prSimItemLabel">Costo Total</span>
                      <span className="adm-prSimItemValue">{formatMoney(simTotalCost)}</span>
                    </div>
                    <div className="adm-prSimItem">
                      <span className="adm-prSimItemLabel">Ganancia Neta</span>
                      <span className="adm-prSimItemValue" style={{ color: '#059669' }}>
                        +{formatMoney(simProfit)}
                      </span>
                    </div>
                    <div className="adm-prSimItem">
                      <span className="adm-prSimItemLabel">Margen (%)</span>
                      <span
                        className={`adm-prMarginBadge ${simStatus}`}
                        style={{ marginTop: 2 }}
                        title={`Markup sobre costo: ${simMarkupPercent}%`}
                      >
                        {simMarginPercent}%
                      </span>
                    </div>
                    <div className="adm-prSimItem">
                      <span className="adm-prSimItemLabel">Sugerido 1.5x</span>
                      <span className="adm-prSimItemValue">{formatMoney(simSugg15)}</span>
                    </div>
                    <div className="adm-prSimItem">
                      <span className="adm-prSimItemLabel">Sugerido 2.0x</span>
                      <span className="adm-prSimItemValue">{formatMoney(simSugg20)}</span>
                    </div>
                  </div>
                </div>

                {/* Notas internas */}
                <div className="adm-prField">
                  <label>Notas Internas (Opcional)</label>
                  <textarea
                    placeholder="Ej. Cadena reforzada especial, costo de grabado promocional..."
                    value={fNotes}
                    onChange={(e) => setFNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-prModalFooter">
                <button
                  type="button"
                  className="adm-btnSecondary"
                  onClick={() => setEditModalOpen(false)}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="adm-btnPrimary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Guardando...' : 'Guardar Costos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Actualización Masiva */}
      {batchModalOpen && (
        <div className="adm-prModalOverlay" onClick={() => !savingBatch && setBatchModalOpen(false)}>
          <div className="adm-prModal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="adm-prModalHeader">
              <h3>Actualización Masiva de Costos</h3>
              <button
                type="button"
                className="adm-btnSecondary"
                style={{ padding: 4, minWidth: 'auto', border: 0 }}
                onClick={() => setBatchModalOpen(false)}
                disabled={savingBatch}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBatch}>
              <div className="adm-prModalBody">
                <p style={{ margin: 0, fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                  Actualizá un concepto de costo en todas las variantes o en una categoría específica cuando suban los insumos o la mano de obra.
                </p>

                {batchError && <div className="adm-error">{batchError}</div>}
                {batchSuccess && (
                  <div className="adm-card" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                    {batchSuccess}
                  </div>
                )}

                {/* Concepto */}
                <div className="adm-prField">
                  <label>Concepto a Actualizar</label>
                  <select
                    value={batchField}
                    onChange={(e) => setBatchField(e.target.value as any)}
                  >
                    <option value="cost_labor">Mano de Obra (Armado / Pulido)</option>
                    <option value="cost_engraving">Grabado Láser</option>
                    <option value="cost_chain">Cadena / Accesorio</option>
                    <option value="cost_packaging">Packaging / Bolsitas</option>
                  </select>
                </div>

                {/* Alcance de Categoría */}
                <div className="adm-prField">
                  <label>Aplicar a</label>
                  <select
                    value={batchCategoryId}
                    onChange={(e) => setBatchCategoryId(e.target.value)}
                  >
                    <option value="all">Todas las categorías</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        Solo {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nuevo valor */}
                <div className="adm-prField">
                  <label>Nuevo Valor Unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Ej. 3800"
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="adm-prModalFooter">
                <button
                  type="button"
                  className="adm-btnSecondary"
                  onClick={() => setBatchModalOpen(false)}
                  disabled={savingBatch}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="adm-btnPrimary"
                  disabled={savingBatch || !batchValue}
                >
                  {savingBatch ? 'Actualizando...' : 'Aplicar a Todas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
