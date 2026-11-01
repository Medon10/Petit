import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../componentes/admin/AdminLayout';
import { clearAdminToken } from '../../shared/api';
import {
  MONTH_NAMES,
  adminCreateIncome,
  adminDeleteIncome,
  adminGetIncomes,
  adminUpdateIncome,
  formatDateAR,
  formatMoney,
  monthRange,
  type IncomeDto,
  type IncomeInput,
} from '../../shared/adminFinanceApi';
import '../../componentes/admin/AdminLayout.css';
import '../AdminExpenses/AdminExpenses.css';
import './AdminIncomes.css';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminIncomesPage() {
  const nav = useNavigate();
  const thisYear = new Date().getFullYear();

  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState(0); // 0 = todo el año
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [incomes, setIncomes] = useState<IncomeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fDate, setFDate] = useState(todayISO());
  const [fDescription, setFDescription] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fNotes, setFNotes] = useState('');
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
      const res = await adminGetIncomes({ ...range, q: debouncedSearch });
      setIncomes(res.data);
    } catch (e) {
      if (!onAuthErr(e)) setError((e as Error).message || 'No se pudieron cargar los ingresos');
    } finally {
      setLoading(false);
    }
  }, [year, month, debouncedSearch, onAuthErr]);

  useEffect(() => {
    load();
  }, [load]);

  // Agrupa por mes (más reciente primero) y calcula totales.
  const { groups, total } = useMemo(() => {
    const map = new Map<string, IncomeDto[]>();
    let sum = 0;
    for (const i of incomes) {
      const key = i.date.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), i]);
      sum += Number(i.amount);
    }
    const groups = [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, rows]) => ({
        key,
        label: `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
        rows,
        total: rows.reduce((acc, r) => acc + Number(r.amount), 0),
      }));
    return { groups, total: sum };
  }, [incomes]);

  function openCreate() {
    setEditingId(null);
    setFDate(todayISO());
    setFDescription('');
    setFAmount('');
    setFNotes('');
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(i: IncomeDto) {
    setEditingId(i.id);
    setFDate(i.date);
    setFDescription(i.description);
    setFAmount(String(Number(i.amount)));
    setFNotes(i.notes ?? '');
    setFormError('');
    setModalOpen(true);
  }

  async function onSave() {
    setFormError('');
    if (!fDate) return setFormError('La fecha es requerida');
    if (!fDescription.trim()) return setFormError('Escribí una descripción');
    const amount = Number(fAmount);
    if (fAmount === '' || !Number.isFinite(amount) || amount <= 0) return setFormError('El monto debe ser mayor a 0');

    const body: IncomeInput = {
      date: fDate,
      description: fDescription.trim(),
      amount,
      notes: fNotes.trim(),
    };

    setSaving(true);
    try {
      if (editingId) await adminUpdateIncome(editingId, body);
      else await adminCreateIncome(body);
      setModalOpen(false);
      await load();
    } catch (e) {
      if (!onAuthErr(e)) setFormError((e as Error).message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(i: IncomeDto) {
    const label = `${formatDateAR(i.date)} · ${i.description} (${formatMoney(i.amount)})`;
    if (!window.confirm(`¿Eliminar el ingreso del ${label}? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteIncome(i.id);
      await load();
    } catch (err) {
      if (!onAuthErr(err)) setError((err as Error).message || 'No se pudo eliminar');
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Ingresos | Petit</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="adm-header">
        <h1 className="adm-h1">Ingresos externos</h1>
        <button type="button" className="adm-btnPrimary" onClick={openCreate}>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Nuevo ingreso
        </button>
      </div>

      <p className="adm-statRange">
        Ventas fuera de la tienda web (en persona, ferias, etc.). Se suman a los ingresos de Estadísticas.
      </p>

      <div className="adm-card adm-expToolbar">
        <div className="adm-field">
          <label className="adm-label" htmlFor="inc-year">Año</label>
          <select id="inc-year" className="adm-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="inc-month">Mes</label>
          <select id="inc-month" className="adm-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            <option value={0}>Todo el año</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="adm-field adm-expSearch">
          <label className="adm-label" htmlFor="inc-search">Buscar</label>
          <input
            id="inc-search"
            className="adm-input"
            placeholder="Descripción o nota…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-expKpis">
        <div className="adm-card adm-expKpi">
          <span className="adm-expKpiLabel">Total ingresos externos</span>
          <strong className="adm-incKpiValue">{formatMoney(total)}</strong>
        </div>
        <div className="adm-card adm-expKpi">
          <span className="adm-expKpiLabel">Registros</span>
          <strong>{incomes.length}</strong>
        </div>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <div className="adm-card adm-empty">Cargando…</div>
      ) : groups.length === 0 ? (
        <div className="adm-card adm-empty">No hay ingresos externos registrados en este período.</div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="adm-expMonth">
            <div className="adm-expMonthHead">
              <h2>{g.label}</h2>
              <span className="adm-incKpiValue">{formatMoney(g.total)}</span>
            </div>
            <div className="adm-card adm-incTableCard">
              <div className="adm-expTableWrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Detalle</th>
                      <th className="adm-num">Monto</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((i) => (
                      <tr key={i.id}>
                        <td>{formatDateAR(i.date)}</td>
                        <td>
                          <span className="adm-incDesc">{i.description}</span>
                          {i.notes && <span className="adm-incNote">{i.notes}</span>}
                        </td>
                        <td className="adm-num adm-incAmount">{formatMoney(i.amount)}</td>
                        <td>
                          <div className="adm-incActions">
                            <button type="button" className="adm-btnSmall" aria-label="Editar ingreso" onClick={() => openEdit(i)}>
                              <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                            </button>
                            <button type="button" className="adm-btnSmall" aria-label="Eliminar ingreso" onClick={() => onDelete(i)}>
                              <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))
      )}

      {modalOpen && (
        <div className="adm-modalOverlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !saving && setModalOpen(false)}>
          <div className="adm-modal adm-incModal" role="dialog" aria-modal="true" aria-labelledby="inc-modal-title">
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle" id="inc-modal-title">{editingId ? 'Editar ingreso' : 'Nuevo ingreso'}</h2>
              <button type="button" className="adm-modalClose" aria-label="Cerrar" onClick={() => setModalOpen(false)} disabled={saving}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="adm-modalBody">
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label" htmlFor="inc-date">Fecha</label>
                  <input id="inc-date" type="date" className="adm-input" value={fDate} onChange={(e) => setFDate(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label className="adm-label" htmlFor="inc-desc">Descripción</label>
                  <input
                    id="inc-desc"
                    className="adm-input"
                    placeholder="Ej. Venta en feria"
                    value={fDescription}
                    onChange={(e) => setFDescription(e.target.value)}
                  />
                </div>
                <div className="adm-field">
                  <label className="adm-label" htmlFor="inc-amount">Monto</label>
                  <input
                    id="inc-amount"
                    className="adm-input"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    value={fAmount}
                    onChange={(e) => setFAmount(e.target.value)}
                  />
                </div>
                <div className="adm-field">
                  <label className="adm-label" htmlFor="inc-notes">Nota (opcional)</label>
                  <input id="inc-notes" className="adm-input" value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
                </div>

                {formError && <p className="adm-error">{formError}</p>}
              </div>
            </div>

            <div className="adm-modalFooter">
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
