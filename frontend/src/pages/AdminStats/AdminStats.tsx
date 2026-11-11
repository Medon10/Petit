import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminLayout from '../../componentes/admin/AdminLayout';
import { clearAdminToken } from '../../shared/api';
import {
  MONTH_NAMES,
  adminGetBreakdown,
  adminGetMonthly,
  adminGetSummary,
  adminGetTop,
  categoryLabel,
  currentWeekRange,
  formatDateAR,
  formatMoney,
  getMonthWeeks,
  monthRange,
  type BreakdownDto,
  type MonthlyDto,
  type SummaryDto,
  type TopDto,
} from '../../shared/adminFinanceApi';
import '../../componentes/admin/AdminLayout.css';
import './AdminStats.css';

/** Variación porcentual vs período anterior. null si no hay base de comparación. */
function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / Math.abs(prev)) * 100);
}

function Delta({ cur, prev, inverse = false }: { cur: number; prev: number; inverse?: boolean }) {
  const pct = pctChange(cur, prev);
  if (pct === null) return <span className="adm-statDelta neutral">sin período previo</span>;
  if (pct === 0) return <span className="adm-statDelta neutral">igual al período previo</span>;
  const up = pct > 0;
  const good = inverse ? !up : up;
  return (
    <span className={`adm-statDelta ${good ? 'good' : 'bad'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs período previo
    </span>
  );
}

const compactMoney = (n: number) => (Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);

export default function AdminStatsPage() {
  const nav = useNavigate();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState(0); // 0 = todo el año, -1 = esta semana, 1..12 = mes
  const [week, setWeek] = useState(0); // 0 = todo el mes, 1..5 = semana del mes

  const [summary, setSummary] = useState<SummaryDto | null>(null);
  const [monthly, setMonthly] = useState<MonthlyDto | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownDto | null>(null);
  const [top, setTop] = useState<TopDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const monthWeeks = month > 0 ? getMonthWeeks(year, month) : [];

  useEffect(() => {
    let cancelled = false;
    let range: { from: string; to: string };
    if (month === -1) {
      range = currentWeekRange();
    } else if (month === 0) {
      range = { from: `${year}-01-01`, to: `${year}-12-31` };
    } else {
      const selectedWeek = week > 0 ? getMonthWeeks(year, month).find((w) => w.week === week) : undefined;
      range = selectedWeek ? { from: selectedWeek.from, to: selectedWeek.to } : monthRange(year, month);
    }

    async function run() {
      setLoading(true);
      setError('');
      try {
        const [s, m, b, t] = await Promise.all([
          adminGetSummary(range.from, range.to),
          adminGetMonthly(year),
          adminGetBreakdown(range.from, range.to),
          adminGetTop(range.from, range.to),
        ]);
        if (cancelled) return;
        setSummary(s);
        setMonthly(m);
        setBreakdown(b);
        setTop(t);
      } catch (e) {
        if (cancelled) return;
        if (!onAuthErr(e)) setError((e as Error).message || 'No se pudieron cargar las estadísticas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [year, month, week, onAuthErr]);

  const cur = summary?.current;
  const prev = summary?.previous;
  const chartData = (monthly?.months ?? []).map((m) => ({
    name: MONTH_NAMES[m.month - 1].slice(0, 3),
    Ingresos: m.ingresos,
    Gastos: m.gastos + m.inversion,
    Ganancia: m.gananciaNeta,
  }));
  const maxCategory = Math.max(1, ...(breakdown?.byCategory ?? []).map((c) => c.total));
  const maxSupplier = Math.max(1, ...(breakdown?.bySupplier ?? []).map((c) => c.total));
  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Estadísticas | Petit</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="adm-header">
        <h1 className="adm-h1">Estadísticas</h1>
        <div className="adm-statFilters">
          <select
            className="adm-select"
            aria-label="Año"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setWeek(0);
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            className="adm-select"
            aria-label="Mes"
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setWeek(0);
            }}
          >
            <option value={0}>Todo el año</option>
            <option value={-1}>Esta semana</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          {month > 0 && (
            <select
              className="adm-select"
              aria-label="Semana"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
            >
              <option value={0}>Todo el mes</option>
              {monthWeeks.map((w) => (
                <option key={w.week} value={w.week}>{w.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {summary && (
        <p className="adm-statRange">
          {formatDateAR(summary.range.from)} – {formatDateAR(summary.range.to)} · comparado con{' '}
          {formatDateAR(summary.previousRange.from)} – {formatDateAR(summary.previousRange.to)}
        </p>
      )}

      <div className={`adm-statGrid${loading ? ' loading' : ''}`}>
        <div className="adm-card adm-statCard">
          <span className="adm-statLabel">Ingresos</span>
          <strong className="adm-statValue">{formatMoney(cur?.ingresos ?? 0)}</strong>
          <Delta cur={cur?.ingresos ?? 0} prev={prev?.ingresos ?? 0} />
          {(cur?.ingresosExternos ?? 0) > 0 && (
            <small className="adm-statSub">Incluye {formatMoney(cur?.ingresosExternos ?? 0)} de ingresos externos</small>
          )}
        </div>
        <div className="adm-card adm-statCard">
          <span className="adm-statLabel">Gastos</span>
          <strong className="adm-statValue">{formatMoney(cur?.gastos ?? 0)}</strong>
          <Delta cur={cur?.gastos ?? 0} prev={prev?.gastos ?? 0} inverse />
        </div>
        <div className="adm-card adm-statCard">
          <span className="adm-statLabel">Inversión</span>
          <strong className="adm-statValue">{formatMoney(cur?.inversion ?? 0)}</strong>
          <Delta cur={cur?.inversion ?? 0} prev={prev?.inversion ?? 0} inverse />
        </div>
        <div className="adm-card adm-statCard">
          <span className="adm-statLabel">Ganancia neta</span>
          <strong className={`adm-statValue ${(cur?.gananciaNeta ?? 0) < 0 ? 'neg' : ''}`}>{formatMoney(cur?.gananciaNeta ?? 0)}</strong>
          <Delta cur={cur?.gananciaNeta ?? 0} prev={prev?.gananciaNeta ?? 0} />
        </div>
      </div>

      <div className="adm-statMini">
        <div className="adm-card">
          <span className="adm-statLabel">Ganancia operativa</span>
          <strong>{formatMoney(cur?.gananciaOperativa ?? 0)}</strong>
          <small>Ingresos − gastos (sin inversión)</small>
        </div>
        <div className="adm-card">
          <span className="adm-statLabel">Pedidos</span>
          <strong>{cur?.pedidos ?? 0}</strong>
          <small>En proceso o completados</small>
        </div>
        <div className="adm-card">
          <span className="adm-statLabel">Ticket promedio</span>
          <strong>{formatMoney(cur?.ticketPromedio ?? 0)}</strong>
          <small>Ventas de la tienda / pedidos</small>
        </div>
      </div>

      <div className="adm-card">
        <h2 className="adm-cardTitle">Ingresos vs gastos · {year}</h2>
        <p style={{ margin: '-10px 0 16px', fontSize: '13px', color: '#71717a' }}>
          Verde: pedidos + ingresos externos · Rosa: compras e insumos · Línea negra: resultado neto mensual.
        </p>
        <div className="adm-statChart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} fontSize={12} width={56} />
              <Tooltip formatter={(v) => formatMoney(Number(v))} cursor={{ fill: 'rgba(219,39,119,0.06)' }} />
              <Legend />
              <Bar dataKey="Ingresos" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Gastos" fill="#db2777" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Line type="monotone" dataKey="Ganancia" stroke="#111" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {monthly && (
          <p className="adm-statNote">
            Acumulado {year}: ingresos {formatMoney(monthly.totals.ingresos)} · gastos {formatMoney(monthly.totals.gastos)} · inversión{' '}
            {formatMoney(monthly.totals.inversion)} · ganancia neta {formatMoney(monthly.totals.gananciaNeta)}
          </p>
        )}
      </div>

      <div className="adm-statCols">
        <div className="adm-card">
          <h2 className="adm-cardTitle">Gastos por categoría</h2>
          {breakdown && breakdown.byCategory.length === 0 && <p className="adm-empty">Sin gastos en el período.</p>}
          {breakdown?.byCategory.map((c) => (
            <div className="adm-statBarRow" key={c.category}>
              <div className="adm-statBarTop"><span>{categoryLabel(c.category)}</span><strong>{formatMoney(c.total)}</strong></div>
              <div className="adm-statBarTrack"><div className="adm-statBarFill" style={{ width: `${(c.total / maxCategory) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="adm-card">
          <h2 className="adm-cardTitle">Gastos por proveedor</h2>
          {breakdown && breakdown.bySupplier.length === 0 && <p className="adm-empty">Sin gastos en el período.</p>}
          {breakdown?.bySupplier.map((c) => (
            <div className="adm-statBarRow" key={c.supplier}>
              <div className="adm-statBarTop"><span>{c.supplier}</span><strong>{formatMoney(c.total)}</strong></div>
              <div className="adm-statBarTrack"><div className="adm-statBarFill alt" style={{ width: `${(c.total / maxSupplier) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="adm-statCols">
        <div className="adm-card">
          <h2 className="adm-cardTitle">Productos más vendidos</h2>
          {top && top.items.length === 0 ? (
            <p className="adm-empty">Sin ventas en el período.</p>
          ) : (
            <table className="adm-table">
              <thead>
                <tr><th>Producto</th><th className="adm-num">Unid.</th><th className="adm-num">Ingresos</th></tr>
              </thead>
              <tbody>
                {top?.items.map((i) => (
                  <tr key={`${i.product}-${i.variant}`}>
                    <td>{i.product}{i.variant ? <span className="adm-statVariant"> · {i.variant}</span> : null}</td>
                    <td className="adm-num">{i.unidades}</td>
                    <td className="adm-num">{formatMoney(i.ingresos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="adm-card">
          <h2 className="adm-cardTitle">Extras más pedidos</h2>
          {top && top.extras.length === 0 ? (
            <p className="adm-empty">Sin extras en el período.</p>
          ) : (
            <table className="adm-table">
              <thead>
                <tr><th>Extra</th><th className="adm-num">Unid.</th><th className="adm-num">Ingresos</th></tr>
              </thead>
              <tbody>
                {top?.extras.map((e) => (
                  <tr key={e.extra}>
                    <td>{e.extra}</td>
                    <td className="adm-num">{e.unidades}</td>
                    <td className="adm-num">{formatMoney(e.ingresos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
