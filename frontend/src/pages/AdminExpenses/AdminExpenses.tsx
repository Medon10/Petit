import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../componentes/admin/AdminLayout';
import { clearAdminToken } from '../../shared/api';
import {
  EXPENSE_CATEGORIES,
  MONTH_NAMES,
  adminCreateExpense,
  adminDeleteExpense,
  adminGetExpenses,
  adminGetSuppliers,
  adminUpdateExpense,
  categoryLabel,
  formatDateAR,
  formatMoney,
  monthRange,
  type ExpenseCategory,
  type ExpenseDto,
  type ExpenseInput,
  type SupplierDto,
} from '../../shared/adminFinanceApi';
import '../../componentes/admin/AdminLayout.css';
import './AdminExpenses.css';

type LineForm = {
  key: number;
  description: string;
  category: ExpenseCategory;
  quantity: string;
  unitCost: string;
  total: string;
  totalTouched: boolean;
};

let lineKey = 0;
const newLine = (): LineForm => ({
  key: ++lineKey,
  description: '',
  category: 'insumos',
  quantity: '',
  unitCost: '',
  total: '',
  totalTouched: false,
});

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const categoryBadge: Record<string, string> = {
  insumos: 'blue',
  packaging: 'teal',
  equipamiento: 'purple',
  inversion: 'orange',
  envios: 'yellow',
  publicidad: 'green',
  otros: 'gray',
};

export default function AdminExpensesPage() {
  const nav = useNavigate();
  const thisYear = new Date().getFullYear();

  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState(0); // 0 = todos
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fDate, setFDate] = useState(todayISO());
  const [fSupplier, setFSupplier] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fLines, setFLines] = useState<LineForm[]>([newLine()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const range = month === 0 ? { from: `${year}-01-01`, to: `${year}-12-31` } : monthRange(year, month);
      const res = await adminGetExpenses({ ...range, q: debouncedSearch, limit: 500 });
      setExpenses(res.data);
    } catch (e) {
      if (!onAuthErr(e)) setError((e as Error).message || 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, [year, month, debouncedSearch, onAuthErr]);

  useEffect(() => {
    load();
  }, [load]);

  const loadSuppliers = useCallback(async () => {
    try {
      setSuppliers((await adminGetSuppliers()).data);
    } catch (e) {
      onAuthErr(e);
    }
  }, [onAuthErr]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Totales y agrupación por mes
  const { groups, totalOperativo, totalInversion } = useMemo(() => {
    const map = new Map<string, ExpenseDto[]>();
    let op = 0;
    let inv = 0;
    for (const e of expenses) {
      const key = e.date.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), e]);
      for (const i of e.items) {
        if (i.category === 'inversion') inv += Number(i.total);
        else op += Number(i.total);
      }
    }
    const groups = [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, rows]) => ({
        key,
        label: `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
        rows,
        total: rows.reduce((acc, r) => acc + Number(r.total), 0),
      }));
    return { groups, totalOperativo: op, totalInversion: inv };
  }, [expenses]);

  function openCreate() {
    setEditingId(null);
    setFDate(todayISO());
    setFSupplier('');
    setFNotes('');
    setFLines([newLine()]);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(e: ExpenseDto) {
    setEditingId(e.id);
    setFDate(e.date);
    setFSupplier(e.supplier?.name ?? '');
    setFNotes(e.notes ?? '');
    setFLines(
      e.items.map((i) => ({
        key: ++lineKey,
        description: i.description,
        category: i.category,
        quantity: i.quantity != null ? String(i.quantity) : '',
        unitCost: i.unitCost != null ? String(Number(i.unitCost)) : '',
        total: String(Number(i.total)),
        totalTouched: true,
      }))
    );
    setFormError('');
    setModalOpen(true);
  }

  function updateLine(key: number, patch: Partial<LineForm>) {
    setFLines((lines) =>
      lines.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        // Autocalcula el total mientras el usuario no lo haya editado a mano.
        if (!next.totalTouched && ('quantity' in patch || 'unitCost' in patch)) {
          const q = Number(next.quantity);
          const u = Number(next.unitCost);
          next.total = next.quantity && next.unitCost && Number.isFinite(q * u) ? String(Math.round(q * u * 100) / 100) : '';
        }
        return next;
      })
    );
  }

  const formTotal = fLines.reduce((acc, l) => acc + (Number(l.total) || 0), 0);

  async function onSave() {
    setFormError('');
    if (!fDate) return setFormError('La fecha es requerida');
    for (let i = 0; i < fLines.length; i++) {
      const l = fLines[i];
      if (!l.description.trim()) return setFormError(`Línea ${i + 1}: falta la descripción`);
      if (l.total === '' || !Number.isFinite(Number(l.total)) || Number(l.total) < 0) {
        return setFormError(`Línea ${i + 1}: el total es requerido`);
      }
      if (l.quantity !== '' && (!Number.isInteger(Number(l.quantity)) || Number(l.quantity) <= 0)) {
        return setFormError(`Línea ${i + 1}: la cantidad debe ser un entero mayor a 0`);
      }
    }

    const body: ExpenseInput = {
      date: fDate,
      supplier_name: fSupplier.trim(),
      notes: fNotes.trim(),
      items: fLines.map((l) => ({
        description: l.description.trim(),
        category: l.category,
        quantity: l.quantity !== '' ? Number(l.quantity) : null,
        unit_cost: l.unitCost !== '' ? Number(l.unitCost) : null,
        total: Number(l.total),
      })),
    };

    setSaving(true);
    try {
      if (editingId) await adminUpdateExpense(editingId, body);
      else await adminCreateExpense(body);
      setModalOpen(false);
      await Promise.all([load(), loadSuppliers()]);
    } catch (e) {
      if (!onAuthErr(e)) setFormError((e as Error).message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(e: ExpenseDto) {
    const label = `${formatDateAR(e.date)}${e.supplier ? ` · ${e.supplier.name}` : ''} (${formatMoney(e.total)})`;
    if (!window.confirm(`¿Eliminar la compra del ${label}? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteExpense(e.id);
      await load();
    } catch (err) {
      if (!onAuthErr(err)) setError((err as Error).message || 'No se pudo eliminar');
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Gastos | Petit</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="adm-header">
        <h1 className="adm-h1">Gastos</h1>
        <button type="button" className="adm-btnPrimary" onClick={openCreate}>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Nueva compra
        </button>
      </div>

      <div className="adm-card adm-expToolbar">
        <div className="adm-field">
          <label className="adm-label" htmlFor="exp-year">Año</label>
          <select id="exp-year" className="adm-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="exp-month">Mes</label>
          <select id="exp-month" className="adm-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            <option value={0}>Todo el año</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="adm-field adm-expSearch">
          <label className="adm-label" htmlFor="exp-search">Buscar</label>
          <input
            id="exp-search"
            className="adm-input"
            placeholder="Proveedor, producto o nota…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-expKpis">
        <div className="adm-card adm-expKpi">
          <span className="adm-expKpiLabel">Gasto operativo</span>
          <strong>{formatMoney(totalOperativo)}</strong>
        </div>
        <div className="adm-card adm-expKpi">
          <span className="adm-expKpiLabel">Inversión</span>
          <strong>{formatMoney(totalInversion)}</strong>
        </div>
        <div className="adm-card adm-expKpi">
          <span className="adm-expKpiLabel">Compras</span>
          <strong>{expenses.length}</strong>
        </div>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <div className="adm-card adm-empty">Cargando…</div>
      ) : groups.length === 0 ? (
        <div className="adm-card adm-empty">No hay compras registradas en este período.</div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="adm-expMonth">
            <div className="adm-expMonthHead">
              <h2>{g.label}</h2>
              <span>{formatMoney(g.total)}</span>
            </div>
            {g.rows.map((e) => (
              <article key={e.id} className="adm-card adm-expCard">
                <header className="adm-expCardHead">
                  <div>
                    <strong>{formatDateAR(e.date)}</strong>
                    {e.supplier && <span className="adm-expSupplier">{e.supplier.name}</span>}
                    {e.notes && <span className="adm-expNotes">{e.notes}</span>}
                  </div>
                  <div className="adm-actions">
                    <strong className="adm-expTotal">{formatMoney(e.total)}</strong>
                    <button type="button" className="adm-btnSmall" aria-label="Editar compra" onClick={() => openEdit(e)}>
                      <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>
                    <button type="button" className="adm-btnSmall" aria-label="Eliminar compra" onClick={() => onDelete(e)}>
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </header>
                <div className="adm-expTableWrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Detalle</th>
                        <th>Categoría</th>
                        <th className="adm-num">Cant.</th>
                        <th className="adm-num">Unitario</th>
                        <th className="adm-num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.items.map((i) => (
                        <tr key={i.id}>
                          <td>{i.description}</td>
                          <td><span className={`adm-badge ${categoryBadge[i.category] ?? 'gray'}`}>{categoryLabel(i.category)}</span></td>
                          <td className="adm-num">{i.quantity ?? '—'}</td>
                          <td className="adm-num">{i.unitCost != null ? formatMoney(i.unitCost) : '—'}</td>
                          <td className="adm-num">{formatMoney(i.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </section>
        ))
      )}

      {modalOpen && (
        <div className="adm-modalOverlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !saving && setModalOpen(false)}>
          <div className="adm-modal adm-expModal" role="dialog" aria-modal="true" aria-labelledby="exp-modal-title">
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle" id="exp-modal-title">{editingId ? 'Editar compra' : 'Nueva compra'}</h2>
              <button type="button" className="adm-modalClose" aria-label="Cerrar" onClick={() => setModalOpen(false)} disabled={saving}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="adm-modalBody">
              <div className="adm-form">
                <div className="adm-expFormRow">
                  <div className="adm-field">
                    <label className="adm-label" htmlFor="exp-date">Fecha</label>
                    <input id="exp-date" type="date" className="adm-input" value={fDate} onChange={(e) => setFDate(e.target.value)} />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label" htmlFor="exp-supplier">Proveedor / local</label>
                    <input
                      id="exp-supplier"
                      className="adm-input"
                      list="exp-suppliers"
                      placeholder="Ej. Zona once"
                      value={fSupplier}
                      onChange={(e) => setFSupplier(e.target.value)}
                    />
                    <datalist id="exp-suppliers">
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="adm-field">
                  <label className="adm-label" htmlFor="exp-notes">Nota (opcional)</label>
                  <input id="exp-notes" className="adm-input" value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
                </div>

                <div className="adm-expLines">
                  <div className="adm-expLine adm-expLineHead" aria-hidden="true">
                    <span>Detalle</span>
                    <span>Categoría</span>
                    <span>Cant.</span>
                    <span>Unitario</span>
                    <span>Total</span>
                    <span />
                  </div>
                  {fLines.map((l, idx) => (
                    <div className="adm-expLine" key={l.key}>
                      <input
                        className="adm-input"
                        aria-label={`Detalle línea ${idx + 1}`}
                        placeholder="Medalla 20mm"
                        value={l.description}
                        onChange={(e) => updateLine(l.key, { description: e.target.value })}
                      />
                      <select
                        className="adm-select"
                        aria-label={`Categoría línea ${idx + 1}`}
                        value={l.category}
                        onChange={(e) => updateLine(l.key, { category: e.target.value as ExpenseCategory })}
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        className="adm-input"
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        aria-label={`Cantidad línea ${idx + 1}`}
                        value={l.quantity}
                        onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                      />
                      <input
                        className="adm-input"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={`Unitario línea ${idx + 1}`}
                        value={l.unitCost}
                        onChange={(e) => updateLine(l.key, { unitCost: e.target.value })}
                      />
                      <input
                        className="adm-input"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={`Total línea ${idx + 1}`}
                        value={l.total}
                        onChange={(e) => updateLine(l.key, { total: e.target.value, totalTouched: true })}
                      />
                      <button
                        type="button"
                        className="adm-btnSmall"
                        aria-label={`Quitar línea ${idx + 1}`}
                        disabled={fLines.length === 1}
                        onClick={() => setFLines((ls) => ls.filter((x) => x.key !== l.key))}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                      </button>
                    </div>
                  ))}
                  <button type="button" className="adm-uploadBtn" onClick={() => setFLines((ls) => [...ls, newLine()])}>
                    <span className="material-symbols-outlined" aria-hidden="true">add</span>
                    Agregar línea
                  </button>
                </div>

                {formError && <p className="adm-error">{formError}</p>}
              </div>
            </div>

            <div className="adm-modalFooter adm-expFooter">
              <span className="adm-expFooterTotal">Total: <strong>{formatMoney(formTotal)}</strong></span>
              <button type="button" className="adm-btnCancel" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
              <button type="button" className="adm-btnPrimary" onClick={onSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
