import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import './QuienesSomos.css';

export default function QuienesSomosPage() {
  return (
    <div className="qs-page">
      <Helmet>
        <title>Quiénes Somos | Petit Accesorios</title>
        <meta
          name="description"
          content="Conocé la historia de Petit Accesorios: una marca argentina de joyas personalizadas en acero quirúrgico con grabado láser."
        />
      </Helmet>
      <Header />

      <main className="qs-main">
        <div className="qs-container">
          <div className="qs-hero">
            <h1 className="qs-title">Quiénes Somos</h1>
            <div className="qs-divider" />
          </div>

          <div className="qs-body">
            <section className="qs-section">
              <p>
                En Petit creemos que cada persona tiene una historia que merece ser contada.
                Por eso, creamos accesorios personalizados donde cada pieza refleja momentos, emociones y recuerdos únicos.
                Nuestros grabados no son solo accesorios: son una forma de llevar contigo lo que más te representa y hace especial cada día.
                Y como queremos que te acompañen siempre, trabajamos en acero quirúrgico 304 y 316L,
                un material hipoalergénico, resistente y duradero, ideal para el uso diario y perfecto para todo tipo de piel.
                Cada detalle está pensado para reflejar lo que te hace único, porque en Petit, la magia está en los pequeños detalles.
              </p>
            </section>

            <div className="qs-cta">
              <p>¿Querés conocer nuestros productos?</p>
              <Link to="/categorias" className="qs-ctaBtn">
                Ver catálogo
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
