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
              <h2 className="qs-subtitle">Nuestra historia</h2>
              <p>
                Petit Accesorios nació de una pasión por los detalles y el diseño personalizado. Somos
                un emprendimiento argentino dedicado a crear joyas únicas en acero quirúrgico, con
                técnica de grabado láser de alta precisión.
              </p>
              <p>
                Cada pieza que sale de nuestro taller lleva consigo una historia: un nombre, una fecha,
                una frase que significa algo especial para quien la usa o la regala. Eso es lo que nos
                diferencia: no fabricamos accesorios en serie, sino piezas pensadas para perdurar.
              </p>
            </section>

            <section className="qs-section">
              <h2 className="qs-subtitle">Por qué acero quirúrgico</h2>
              <p>
                Elegimos el acero quirúrgico porque es el material más seguro y duradero para usar en
                contacto con la piel. Es hipoalergénico, no se oscurece con el tiempo, resiste el
                agua y mantiene su brillo sin necesidad de cuidados especiales.
              </p>
              <p>
                A diferencia de los metales bañados, nuestras piezas no pierden su color con el uso
                diario. Podés ponértelas en la ducha, en el mar, en el gimnasio: están diseñadas para
                acompañarte en tu rutina.
              </p>
            </section>

            <section className="qs-section">
              <h2 className="qs-subtitle">Grabado láser personalizado</h2>
              <p>
                Utilizamos tecnología de grabado láser de alta precisión que nos permite reproducir
                textos, fechas, firmas e incluso dibujos con un nivel de detalle que no se logra con
                técnicas tradicionales. El resultado es un acabado permanente, elegante y resistente
                al paso del tiempo.
              </p>
              <p>
                Podés personalizar casi cualquier pieza de nuestro catálogo con el texto que elijas.
                Si tenés una idea especial, escribinos por WhatsApp y lo hacemos realidad.
              </p>
            </section>

            <section className="qs-section">
              <h2 className="qs-subtitle">Nuestro compromiso</h2>
              <p>
                Nos tomamos el tiempo necesario para que cada pedido esté perfecto antes de salir.
                Revisamos el grabado, el acabado y el embalaje con atención al detalle, porque sabemos
                que muchas veces nuestras piezas son regalos que acompañan momentos importantes.
              </p>
              <p>
                Enviamos a todo el país y siempre estamos disponibles por WhatsApp para responder
                dudas, asesorarte en la elección y hacer el seguimiento de tu pedido.
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
