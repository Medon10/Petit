import { Link, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import '../Home/Home.css';
import './Order.css';

type OrderConfirmationItem = {
  key: string;
  name: string;
  quantity: number;
  total: number;
};

type OrderConfirmationState = {
  orderNumber: string;
  total: number;
  items: OrderConfirmationItem[];
};

function moneyAr(amount: number) {
  if (!Number.isFinite(amount)) return '$0';
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}

export default function OrderPage() {
  const params = useParams();
  const location = useLocation();
  const state = (location.state || null) as OrderConfirmationState | null;

  const orderNumber = String(state?.orderNumber || params.id || '');
  const total = Number(state?.total || 0);
  const items = Array.isArray(state?.items) ? state.items : [];

  const bankAlias = (import.meta as any).env?.VITE_BANK_ALIAS || 'ALIAS.NO.CONFIGURADO';
  const bankHolder = (import.meta as any).env?.VITE_BANK_HOLDER || 'Petit Accesorios';
  const whatsappNumber = String((import.meta as any).env?.VITE_WHATSAPP_NUMBER || '5491100000000').replace(/\D/g, '');

  const whatsappText = encodeURIComponent(
    `Hola! Acabo de realizar el pedido #${orderNumber} por ${moneyAr(total)}. Adjunto comprobante de transferencia y coordinamos por acá los detalles finales de grabado/diseño.`
  );
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="order-page">
      <Helmet>
        <title>Pedido confirmado | Petit Accesorios</title>
        <meta name="description" content="Tu pedido fue registrado correctamente. Comparti el comprobante por WhatsApp para validarlo." />
      </Helmet>
      <Header />

      <main className="order-main" aria-label="Pedido confirmado">
        <section className="order-hero">
          <div className="order-check" aria-hidden="true">OK</div>
          <h1>Gracias por tu compra</h1>
          <p>
            Tu pedido <strong>#{orderNumber || 'N/A'}</strong> fue recibido correctamente.
          </p>
          <div className="order-heroDivider" />
        </section>

        <div className="order-grid">
          <section className="order-detailsPanel">
            <div className="order-transferCard">
              <h2>Paga mediante transferencia</h2>
              <div className="order-transferData">
                <div>
                  <span>Alias</span>
                  <strong>{bankAlias}</strong>
                </div>
                <div>
                  <span>Titular</span>
                  <strong>{bankHolder}</strong>
                </div>
              </div>
            </div>

            <div className="order-actionPanel">
              <p>
                Envia el comprobante y coordinamos por WhatsApp los detalles finales de grabado, personalizacion y entrega.
              </p>
              <a className="order-whatsappBtn" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                Enviar comprobante por WhatsApp
              </a>
              <Link className="order-backLink" to="/">
                Volver al inicio
              </Link>
            </div>
          </section>

          <aside className="order-summaryPanel" aria-label="Resumen del pedido">
            <h3>Resumen del pedido</h3>
            {items.length > 0 ? (
              <>
                <div className="order-items">
                  {items.map((item) => (
                    <article key={item.key} className="order-item">
                      <div className="order-thumb" aria-hidden="true">
                        {item.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="order-itemContent">
                        <p>{item.name}</p>
                        <div className="order-itemRow">
                          <span>x{item.quantity}</span>
                          <strong>{moneyAr(item.total)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="order-totals">
                  <div>
                    <span>Subtotal</span>
                    <span>{moneyAr(total)}</span>
                  </div>
                  <div>
                    <span>Envio</span>
                    <span>Gratis</span>
                  </div>
                  <div className="is-total">
                    <span>Total</span>
                    <strong>{moneyAr(total)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <p className="order-empty">No se encontro el detalle de items en esta sesion, pero tu pedido ya fue registrado.</p>
            )}
          </aside>
        </div>

        <div className="order-footNote" aria-hidden="true">
          <span>Autenticidad</span>
          <span>Retiro coordinado</span>
          <span>Compra segura</span>
        </div>
      </main>

      <Footer />
    </div>
  );
}

