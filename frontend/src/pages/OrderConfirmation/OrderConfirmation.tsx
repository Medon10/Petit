import { Link, useParams } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import '../Home/Home.css';
import './OrderConfirmation.css';

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = String(params.id ?? '');

  return (
    <div className="orderConfirmation-wrap">
      <Header />
      <main className="orderConfirmation-page" aria-label="Pedido confirmado">
        <section className="orderConfirmation-card">
          <span className="orderConfirmation-pill">Confirmado</span>
          <h1>Pedido recibido</h1>
          <p>Gracias por elegir Petit Accesorios.</p>
          {id && id !== 'ok' ? (
            <p className="orderConfirmation-id">
              Numero de pedido: <strong>#{id}</strong>
            </p>
          ) : null}
          <Link className="orderConfirmation-button" to="/">
            Volver al inicio
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

