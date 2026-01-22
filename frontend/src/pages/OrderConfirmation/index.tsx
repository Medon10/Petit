import { Link, useParams } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import '../Home/Home.css';
import './styles.css';

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = String(params.id ?? '');

  return (
    <div className="petit-orderOk">
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Pedido confirmado">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Pedido confirmado</h2>
            <div className="ph-divider" />
          </div>

          <div className="ph-okCard">
            <p className="ph-okText">Gracias por tu compra.</p>
            {id && id !== 'ok' ? <p className="ph-okMeta">Tu número de pedido es: <strong>#{id}</strong></p> : null}
            <Link className="ph-primaryButton ph-primaryLink" to="/">Volver al inicio</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
