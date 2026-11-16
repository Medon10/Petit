import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '../../componentes/admin/AdminLayout';
import Pagination from '../../componentes/shared/Pagination';
import Skeleton from '../../componentes/shared/Skeleton';
import {
  adminGetOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminUpdateOrderPayment,
  clearAdminToken,
  type OrderDto,
} from '../../shared/api';
import '../../componentes/admin/AdminLayout.css';
import './AdminOrders.css';

const STATUS_OPTIONS = ['pending', 'processing', 'completed', 'cancelled'] as const;

const statusLabel: Record<string, string> = {
  pending: 'Orden creada, esperando transferencia',
  processing: 'Comprobante recibido, en proceso',
  completed: 'Pedido completado',
  cancelled: 'Cancelado',
};

const statusLabelShort: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const statusColor: Record<string, string> = {
  pending: 'yellow',
  processing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const PAYMENT_OPTIONS = ['unpaid', 'deposit', 'paid'] as const;

const paymentLabelShort: Record<string, string> = {
  unpaid: 'No pagado',
  deposit: 'Seña',
  paid: 'Pagado',
};

const paymentColor: Record<string, string> = {
  unpaid: 'red',
  deposit: 'yellow',
  paid: 'green',
};

function formatMoney(n: number) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
}

function getOrderPaymentAmounts(order: Pick<OrderDto, 'total' | 'paymentStatus' | 'paidAmount'>) {
  const total = Number(order.total) || 0;
  const pStatus = order.paymentStatus || 'unpaid';
  const rawPaid = Number(order.paidAmount) || 0;
  const paid = pStatus === 'paid' ? total : pStatus === 'deposit' ? Math.min(Math.max(0, rawPaid), total || rawPaid) : 0;
  const remaining = Math.max(0, total - paid);
  return { total, pStatus, paid, remaining };
}

const shippingLabel: Record<string, string> = {
  pickup: 'Retiro',
  delivery: 'Envio coordinado',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

export default function AdminOrdersPage() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'deposit' | 'paid'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<OrderDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  const [depositEditing, setDepositEditing] = useState(false);
  const [depositInput, setDepositInput] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const onAuthErr = useCallback((e: any) => {
    const msg = String(e?.message ?? '');
    if (msg.includes('401') || msg.includes('token')) {
      clearAdminToken();
      nav('/admin/login');
    }
  }, [nav]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentFilter, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminGetOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        paymentStatus: paymentFilter === 'all' ? undefined : paymentFilter,
        q: debouncedSearch || undefined,
        page,
        limit: 20,
      });
      setOrders(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages || 1);
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, debouncedSearch, page, onAuthErr]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    setPaymentError('');
    setDepositEditing(false);
    setDepositInput('');
    try {
      const o = await adminGetOrder(id);
      setDetail(o);
      if (o?.paymentStatus === 'deposit') {
        setDepositEditing(true);
        setDepositInput(String(Number(o.paidAmount ?? 0) || ''));
      }
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetail(null);
    setDetailLoading(false);
    setDepositEditing(false);
    setPaymentError('');
  }

  async function changeStatus(id: number, status: string) {
    setStatusUpdating(true);
    try {
      await adminUpdateOrderStatus(id, status);
      if (detail && detail.id === id) {
        setDetail({ ...detail, status });
      }
      await load();
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function savePayment(id: number, paymentStatus: 'unpaid' | 'deposit' | 'paid', paidAmount?: number) {
    setPaymentUpdating(true);
    setPaymentError('');
    try {
      const res = await adminUpdateOrderPayment(id, { payment_status: paymentStatus, paid_amount: paidAmount });
      const updated = res?.data;
      if (detail && detail.id === id && updated) {
        setDetail(updated);
        setDepositEditing(updated.paymentStatus === 'deposit');
        if (updated.paymentStatus === 'deposit') {
          setDepositInput(String(Number(updated.paidAmount ?? 0) || ''));
        } else {
          setDepositInput('');
        }
      }
      await load();
    } catch (e: any) {
      onAuthErr(e);
      setPaymentError(e?.message || 'No se pudo actualizar el pago');
    } finally {
      setPaymentUpdating(false);
    }
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Pedidos | Petit</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="adm-header">
        <h1 className="adm-h1">Pedidos</h1>
      </div>

      <div className="adm-card adm-ordersToolbar">
        <div className="adm-field" style={{ minWidth: 220 }}>
          <label className="adm-label" htmlFor="orders-status">Estado</label>
          <select
            id="orders-status"
            className="adm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
              <option value="all">Todos</option>
              <option value="pending">Pendiente de pago</option>
              <option value="processing">En proceso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div className="adm-field" style={{ minWidth: 180 }}>
          <label className="adm-label" htmlFor="orders-payment">Pago</label>
          <select
            id="orders-payment"
            className="adm-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
          >
              <option value="all">Todos</option>
              <option value="unpaid">No pagado</option>
              <option value="deposit">Seña</option>
              <option value="paid">Pagado</option>
          </select>
        </div>

        <div className="adm-field" style={{ minWidth: 300, flex: 1 }}>
          <label className="adm-label" htmlFor="orders-search">Buscar</label>
          <input
            id="orders-search"
            className="adm-input"
            placeholder="Cliente, email, teléfono o #pedido"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="adm-ordersCount" aria-live="polite">
          {total} resultado(s)
        </div>
      </div>

      {loading ? (
        <div className="adm-card" style={{ display: 'grid', gap: 10 }} aria-label="Cargando pedidos">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} variant="text" height={14} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">No hay pedidos.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Entrega</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const { pStatus, paid, remaining } = getOrderPaymentAmounts(o);
                return (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700 }}>#{o.id}</td>
                  <td>{o.customerName}</td>
                  <td>
                    <span className={`adm-badge ${statusColor[o.status] ?? 'gray'}`}>
                      {statusLabelShort[o.status] ?? o.status}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge ${paymentColor[pStatus] ?? 'gray'}`}>
                      {paymentLabelShort[pStatus] ?? pStatus}
                    </span>
                    {pStatus === 'deposit' && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, whiteSpace: 'nowrap' }}>
                        Pagó ${formatMoney(paid)} · Falta ${formatMoney(remaining)}
                      </div>
                    )}
                  </td>
                  <td>{shippingLabel[o.shippingMethod || 'pickup'] || 'Retiro'}</td>
                  <td>${o.total}</td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>
                    <button
                      className="adm-btnSmall"
                      aria-label={`Ver detalle del pedido #${o.id}`}
                      title="Ver detalle"
                      onClick={() => openDetail(o.id)}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {(detail || detailLoading) && (
        <div
          className="adm-modalOverlay"
          onClick={closeDetail}
          onKeyDown={(e) => { if (e.key === 'Escape') closeDetail(); }}
          role="presentation"
        >
          <div className="adm-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">
                {detailLoading ? 'Detalle de pedido' : `Pedido #${detail?.id}`}
              </h2>
              <button className="adm-modalClose" aria-label="Cerrar detalle del pedido" onClick={closeDetail}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            {detailLoading ? (
              <div className="adm-modalBody" style={{ display: 'grid', gap: 10 }} aria-label="Cargando detalle">
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="75%" />
                <Skeleton variant="text" width="60%" />
              </div>
            ) : null}

            {detail && (
              <div className="adm-modalBody">
                <div className="adm-form" style={{ gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div className="adm-label">Cliente</div>
                      <div>{detail.customerName}</div>
                    </div>
                    <div>
                      <div className="adm-label">Email</div>
                      <div>{detail.customerEmail || '—'}</div>
                    </div>
                    <div>
                      <div className="adm-label">Teléfono</div>
                      <div>{detail.customerPhone || '—'}</div>
                    </div>
                    <div>
                      <div className="adm-label">Fecha</div>
                      <div>{formatDate(detail.createdAt)}</div>
                    </div>
                    <div>
                      <div className="adm-label">Entrega</div>
                      <div>{shippingLabel[detail.shippingMethod || 'pickup'] || 'Retiro'}</div>
                    </div>
                    <div>
                      <div className="adm-label">Codigo postal</div>
                      <div>{detail.shippingPostalCode || '—'}</div>
                    </div>
                  </div>

                  {detail.shippingMethod === 'delivery' && (
                    <div>
                      <div className="adm-label">Dirección de entrega</div>
                      <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ flex: 1 }}>
                          {[detail.shippingAddressLine1, detail.shippingAddressLine2, detail.shippingCity, detail.shippingProvince]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </span>
                        <button
                          className="adm-btnSmall"
                          title="Copiar datos de envío"
                          onClick={() => {
                            const addr = [detail.shippingAddressLine1, detail.shippingAddressLine2, detail.shippingCity, detail.shippingProvince, detail.shippingPostalCode ? `CP ${detail.shippingPostalCode}` : ''].filter(Boolean).join(', ');
                            copyToClipboard(`Pedido #${detail.id} — ${detail.customerName}\nDirección: ${addr}`);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {detail.shippingMethod === 'delivery' && (
                    <div>
                      <div className="adm-label">Envio</div>
                      <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 6, fontSize: 14 }}>
                        Coordinado por WhatsApp{detail.shippingCost ? ` · $${detail.shippingCost}` : ''}
                      </div>
                    </div>
                  )}

                  {detail.notes && (
                    <div>
                      <div className="adm-label">Notas</div>
                      <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 6, fontSize: 14 }}>{detail.notes}</div>
                    </div>
                  )}

                  <div>
                    <div className="adm-label">Estado</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          className={`adm-badge ${statusColor[s]}${detail.status === s ? '' : ' adm-badgeOutline'}`}
                          style={{
                            cursor: detail.status === s ? 'default' : 'pointer',
                            opacity: statusUpdating ? 0.5 : 1,
                            border: detail.status === s ? '2px solid currentColor' : '2px solid transparent',
                            padding: '6px 14px',
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                          }}
                          disabled={statusUpdating || detail.status === s}
                          onClick={() => changeStatus(detail.id, s)}
                        >
                          {statusLabelShort[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const { total: totalNum, pStatus, paid } = getOrderPaymentAmounts(detail);
                    const activeBtn = depositEditing ? 'deposit' : pStatus;
                    const draftNum = Number(depositInput.replace(',', '.'));
                    const hasDraft = depositEditing && depositInput.trim() !== '' && Number.isFinite(draftNum) && draftNum >= 0;
                    const displayPaid = hasDraft ? draftNum : paid;
                    const displayRemaining = Math.max(0, totalNum - displayPaid);

                    return (
                      <div>
                        <div className="adm-label">Pago</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                          {PAYMENT_OPTIONS.map((p) => {
                            const isSelected = activeBtn === p;
                            const isDisabled = paymentUpdating || (p !== 'deposit' && isSelected);
                            return (
                              <button
                                key={p}
                                type="button"
                                className={`adm-badge ${paymentColor[p]}${isSelected ? '' : ' adm-badgeOutline'}`}
                                style={{
                                  cursor: isDisabled ? 'default' : 'pointer',
                                  opacity: paymentUpdating ? 0.5 : 1,
                                  border: isSelected ? '2px solid currentColor' : '2px solid transparent',
                                  padding: '6px 14px',
                                  fontSize: 12,
                                  whiteSpace: 'nowrap',
                                }}
                                disabled={isDisabled}
                                onClick={() => {
                                  if (p === 'deposit') {
                                    setPaymentError('');
                                    setDepositEditing(true);
                                    if (!depositInput && pStatus === 'deposit' && Number(detail.paidAmount) > 0) {
                                      setDepositInput(String(Number(detail.paidAmount)));
                                    }
                                  } else {
                                    setDepositEditing(false);
                                    savePayment(detail.id, p);
                                  }
                                }}
                              >
                                {paymentLabelShort[p]}
                              </button>
                            );
                          })}
                        </div>

                        {(depositEditing || pStatus === 'deposit') && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                            <label htmlFor="order-deposit-amount" style={{ fontSize: 13, fontWeight: 600 }}>
                              Monto abonado ($):
                            </label>
                            <input
                              id="order-deposit-amount"
                              type="number"
                              min="1"
                              step="0.01"
                              max={totalNum > 0 ? totalNum : undefined}
                              className="adm-input"
                              style={{ width: 150, padding: '6px 10px' }}
                              placeholder="Ej: 15000"
                              value={depositInput}
                              onChange={(e) => setDepositInput(e.target.value)}
                              disabled={paymentUpdating}
                            />
                            <button
                              type="button"
                              className="adm-btnPrimary"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              disabled={paymentUpdating}
                              onClick={() => {
                                const parsed = Number(depositInput.replace(',', '.'));
                                savePayment(detail.id, 'deposit', parsed);
                              }}
                            >
                              Guardar seña
                            </button>
                          </div>
                        )}

                        <div style={{ marginTop: 8, fontSize: 13, color: '#374151', background: '#f9fafb', padding: '8px 10px', borderRadius: 6 }}>
                          {activeBtn === 'deposit' ? (
                            <>
                              <strong>Pagó:</strong> ${formatMoney(displayPaid)} · <strong>Falta pagar:</strong> ${formatMoney(displayRemaining)}{' '}
                              <span style={{ color: '#6b7280' }}>(de ${formatMoney(totalNum)})</span>
                            </>
                          ) : pStatus === 'paid' ? (
                            <>
                              <strong>Pagado completo:</strong> ${formatMoney(totalNum)} · <strong>Falta pagar:</strong> $0.00
                            </>
                          ) : (
                            <>
                              <strong>Pagó:</strong> $0.00 · <strong>Falta pagar:</strong> ${formatMoney(totalNum)}
                            </>
                          )}
                        </div>

                        {paymentError && (
                          <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{paymentError}</div>
                        )}
                      </div>
                    );
                  })()}

                  {detail.items && detail.items.length > 0 && (
                    <div>
                      <div className="adm-label" style={{ marginBottom: 8 }}>Ítems</div>
                      <table className="adm-table" style={{ fontSize: 13 }}>
                        <thead>
                          <tr><th>Producto</th><th>Variante</th><th>Cant.</th><th>Precio</th></tr>
                        </thead>
                        <tbody>
                          {detail.items.map((item) => (
                            <Fragment key={`row-${item.id}`}>
                              <tr key={`item-${item.id}`}>
                                <td>{item.productName}</td>
                                <td>{item.variantName ?? '—'}</td>
                                <td>{item.quantity}</td>
                                <td>${item.unitPrice}</td>
                              </tr>
                              {item.extras?.map((ex) => (
                                <tr key={`extra-${item.id}-${ex.id}`} style={{ background: '#fafafa' }}>
                                  <td style={{ paddingLeft: 24, fontSize: 12, color: '#888' }}>+ {ex.extraName}</td>
                                  <td style={{ fontSize: 12, color: '#888' }}>{ex.categoryType ?? ''}</td>
                                  <td style={{ fontSize: 12, color: '#888' }}>{ex.quantity}</td>
                                  <td style={{ fontSize: 12, color: '#888' }}>${ex.unitPrice}</td>
                                </tr>
                              ))}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
                    Total: ${detail.total}
                  </div>

                  {/* Quick-action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: 12, marginTop: 4 }}>
                    {detail.customerPhone && (
                      <a
                        href={`https://wa.me/${detail.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${detail.customerName.split(' ')[0]}! Te escribimos por tu pedido #${detail.id} de Petit Accesorios.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adm-btnSmall"
                        title="Escribir por WhatsApp"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', textDecoration: 'none' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chat</span>
                        WhatsApp
                      </a>
                    )}
                    <button
                      className="adm-btnSmall"
                      title="Copiar resumen del pedido"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px' }}
                      onClick={() => {
                        const { total: totalNum, pStatus, paid, remaining } = getOrderPaymentAmounts(detail);
                        const paymentText =
                          pStatus === 'deposit'
                            ? `${paymentLabelShort[pStatus]} (Pagó: $${formatMoney(paid)} · Falta: $${formatMoney(remaining)})`
                            : pStatus === 'paid'
                              ? `${paymentLabelShort[pStatus]} ($${formatMoney(totalNum)})`
                              : `${paymentLabelShort[pStatus]} (Falta: $${formatMoney(totalNum)})`;
                        const itemsText = (detail.items || []).map(it => `  - ${it.productName}${it.variantName ? ` (${it.variantName})` : ''} x${it.quantity}`).join('\n');
                        copyToClipboard(`Pedido #${detail.id}\nCliente: ${detail.customerName}\nEstado: ${statusLabel[detail.status] ?? detail.status}\nPago: ${paymentText}\nTotal: $${detail.total}\nItems:\n${itemsText}`);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>summarize</span>
                      Copiar resumen
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="adm-modalFooter">
              <button className="adm-btnCancel" onClick={closeDetail}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AdminLayout>
  );
}
