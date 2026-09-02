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
        <link rel="canonical" href="https://petitaccesorios.com.ar/quienes-somos" />
        <meta property="og:title" content="Quiénes Somos | Petit Accesorios" />
        <meta property="og:description" content="Conocé la historia de Petit Accesorios: una marca argentina de joyas personalizadas en acero quirúrgico con grabado láser." />
        <meta property="og:url" content="https://petitaccesorios.com.ar/quienes-somos" />
        <meta name="twitter:title" content="Quiénes Somos | Petit Accesorios" />
        <meta name="twitter:description" content="Conocé la historia de Petit Accesorios." />
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
                Petit nació en octubre de 2025, de una manera completamente inesperada. Todo comenzó cuando mi máquina láser se rompió y me puse a investigar que otra cosa podía hacer además de trabajos en madera, ahí fue donde descubrí el mundo de los accesorios personalizados.

                Siempre me gustaron los accesorios, pero nunca imagine que además iba a poder personalizarlos y transformarlos en un accesorio único. Así que no dudé ni un minuto en investigar, aprender y lanzarme a este nuevo mundo. Estaba tan segura de que quería intentar con este nuevo rubro que decidí apostar de lleno desde el principio, realizando directamente mi primera compra mayorista.

                A la hora de elegir un nombre, buscaba algo simple, pequeño, pero con un gran significado. Así nació Petit, que significa pequeño y representa exactamente lo que quiero transmitir con cada creación: la magia está en los pequeños detalles.

                Cada pieza de Petit es diseñada, grabada y preparada por mí, con mucho amor y dedicación. Mi intención siempre fue crear algo más que un accesorio: quiero que, desde el momento en que abrís el paquete, vivas una experiencia única y especial.

                Gracias por acompañarme, por valorar lo hecho con amor y por permitirme seguir creciendo y haciendo realidad este emprendimiento que nació de manera inesperada, pero que hoy significa mucho para mí.
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
