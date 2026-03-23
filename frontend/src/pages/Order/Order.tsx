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
    `Hola! Acabo de realizar el pedido #${orderNumber} por ${moneyAr(total)}. Adjunto comprobante de transferencia.`
  );
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="petit-orderOk">
      <Helmet>
        <title>Pedido confirmado | Petit Accesorios</title>
        <meta name="description" content="Tu pedido fue registrado correctamente. Compartí el comprobante por WhatsApp para validarlo." />
      </Helmet>
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Pedido confirmado">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Pedido confirmado</h2>
            <div className="ph-divider" />
          </div>

          <div className="ph-orderCard">
            <p className="ph-orderBadge">Gracias por tu compra</p>
            <h3 className="ph-orderNumber">Pedido #{orderNumber || 'N/A'}</h3>

            {items.length > 0 ? (
              <div className="ph-orderSection">
                <h4 className="ph-orderSectionTitle">Resumen del pedido</h4>
                <div className="ph-orderItems">
                  {items.map((item) => (
                    <div key={item.key} className="ph-orderItem">
                      <div className="ph-orderItemName">{item.name}</div>
                      <div className="ph-orderItemRow">
                        <span>x{item.quantity}</span>
                        <strong>{moneyAr(item.total)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ph-orderTotal">
                  <span>Total</span>
                  <strong>{moneyAr(total)}</strong>
                </div>
              </div>
            ) : null}

            <div className="ph-orderSection">
              <h4 className="ph-orderSectionTitle">Datos para transferencia</h4>
              <div className="ph-bankBox">
                <p><span>Alias:</span> {bankAlias}</p>
                <p><span>Titular:</span> {bankHolder}</p>
              </div>
              <p className="ph-orderInstructions">
                Realizá la transferencia y enviá el comprobante por WhatsApp.
              </p>
            </div>

            <div className="ph-orderActions">
              <a className="ph-primaryButton ph-primaryLink" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                Enviar comprobante por WhatsApp
              </a>
              <Link className="ph-secondaryLink" to="/">Volver al inicio</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

