import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../componentes/admin/AdminLayout';
import {
  adminGetOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  clearAdminToken,
  type OrderDto,
} from '../../shared/api';
import '../../componentes/admin/AdminLayout.css';

const STATUS_OPTIONS = ['pending', 'paid', 'completed', 'cancelled'] as const;

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const statusColor: Record<string, string> = {
  pending: 'yellow',
  paid: 'blue',
  completed: 'green',
  cancelled: 'red',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrdersPage() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  function onAuthErr(e: any) {
    const msg = String(e?.message ?? '');
    if (msg.includes('401') || msg.includes('token')) {
      clearAdminToken();
      nav('/admin/login');
    }
  }

  const load = useCallback(async () => {
    try {
      setOrders(await adminGetOrders());
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const o = await adminGetOrder(id);
      setDetail(o);
    } catch (e: any) {
      onAuthErr(e);
    } finally {
      setDetailLoading(false);
    }
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

  return (
    <AdminLayout>
      <div className="adm-header">
        <h1 className="adm-h1">Pedidos</h1>
      </div>

      {loading ? (
        <div className="adm-empty">Cargando...</div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">No hay pedidos.</div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700 }}>#{o.id}</td>
                  <td>{o.customerName}</td>
                  <td>
                    <span className={`adm-badge ${statusColor[o.status] ?? 'gray'}`}>
                      {statusLabel[o.status] ?? o.status}
                    </span>
                  </td>
                  <td>${o.total}</td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>
                    <button className="adm-btnSmall" title="Ver detalle" onClick={() => openDetail(o.id)}>
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {(detail || detailLoading) && (
        <div className="adm-modalOverlay" onClick={() => { setDetail(null); setDetailLoading(false); }}>
          <div className="adm-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modalHeader">
              <h2 className="adm-modalTitle">
                {detailLoading ? 'Cargando...' : `Pedido #${detail?.id}`}
              </h2>
              <button className="adm-modalClose" onClick={() => { setDetail(null); setDetailLoading(false); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

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
                  </div>

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
                            padding: '4px 12px',
                          }}
                          disabled={statusUpdating || detail.status === s}
                          onClick={() => changeStatus(detail.id, s)}
                        >
                          {statusLabel[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {detail.items && detail.items.length > 0 && (
                    <div>
                      <div className="adm-label" style={{ marginBottom: 8 }}>Ítems</div>
                      <table className="adm-table" style={{ fontSize: 13 }}>
                        <thead>
                          <tr><th>Producto</th><th>Variante</th><th>Cant.</th><th>Precio</th></tr>
                        </thead>
                        <tbody>
                          {detail.items.map((item) => (
                            <>
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
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
                    Total: ${detail.total}
                  </div>
                </div>
              </div>
            )}

            <div className="adm-modalFooter">
              <button className="adm-btnCancel" onClick={() => { setDetail(null); setDetailLoading(false); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
