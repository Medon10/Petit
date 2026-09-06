import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import './ComoComprar.css';

export default function ComoComprarPage() {
  return (
    <div className="cc-page">
      <Helmet>
        <title>Cómo Comprar | Petit Accesorios</title>
        <meta
          name="description"
          content="Aprendé cómo comprar en Petit Accesorios: elegí tu producto, personalizalo, pagá y recibilo en tu casa o retiralo en sucursal."
        />
        <link rel="canonical" href="https://petitaccesorios.com.ar/como-comprar" />
        <meta property="og:title" content="Cómo Comprar | Petit Accesorios" />
        <meta property="og:description" content="Aprendé cómo comprar en Petit Accesorios: elegí tu producto, personalizalo, pagá y recibilo en tu casa." />
        <meta property="og:url" content="https://petitaccesorios.com.ar/como-comprar" />
        <meta name="twitter:title" content="Cómo Comprar | Petit Accesorios" />
        <meta name="twitter:description" content="Aprendé cómo comprar en Petit Accesorios." />
      </Helmet>
      <Header />

      <main className="cc-main">
        <div className="cc-container">
          <div className="cc-hero">
            <h1 className="cc-title">Cómo Comprar</h1>
            <div className="cc-divider" />
          </div>

          <div className="cc-body">
            <div className="cc-steps">
              <div className="cc-step">
                <div className="cc-stepNum">01</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Elegí tu producto</h2>
                  <p>
                    Navegá por nuestras categorías o usá el buscador para encontrar la pieza que
                    más te guste. Podés ver fotos, descripción y variantes de cada producto antes
                    de decidirte.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">02</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Personalizalo</h2>
                  <p>
                    Nuestros productos se graban con un texto a elección: nombres,
                    fechas, frases o firmas. Al finalizar el pedido vas a encontrar
                    una sección que dice "Notas Adicionales" donde debes ingresar
                    la personalización de todos tus accesorios.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">03</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Agregalo al carrito</h2>
                  <p>
                    Seleccioná el producto que quieras y elegí la variante (por ejemplo, el tamaño o el modelo).
                    Además en algunos podrás agregar extras. Luego hacé clic en "Agregar al carrito". Podés seguir comprando y
                    agregar más productos antes de finalizar.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">04</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Completá el checkout</h2>
                  <p>
                    Cuando estés listo, ingresá tu nombre, correo electrónico y número de telefono.
                    Revisá el resumen de tu pedido y confirmá.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">05</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Medios de pago</h2>
                  <p>
                    Aceptamos transferencia bancaria / Mercado Pago y efectivo. Una vez que
                    recibamos la confirmación del pago, comenzamos a preparar tu pedido.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">06</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Envío y retiro</h2>
                  <p>
                    El envío a domicilio se realiza por Correo Argentino a todo el país únicamente para destinos fuera de Colón.
                    Si estás en Colón, el retiro es exclusivamente en domicilio. Los tiempos de entrega
                    varían entre 3 a 5 días.
                  </p>
                  <p>
                    Una vez despachado tu pedido, te enviamos el número de seguimiento para que
                    puedas rastrearlo en tiempo real.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">07</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Aclaraciones</h2>
                  <p>
                    Cada pieza incluye una cadena simple y el grabado de un lado sin costo adicional.
                    Si haces un fotograbado el grabado extra no se te cobra.
                    Para los pedidos en el mismo día se cobra un extra.
                  </p>
                  <p>
                    Antes de realizar el grabado en tu accesorio, te enviamos una muestra del diseño para que puedas verla y aprobarla con tranquilidad.
                    De esta forma te asegurás de que el grabado quede exactamente como querés. Cada pieza está hecha con mucho amor y sabemos que te va a encantar.
                  </p>
                </div>
              </div>
            </div>

            <div className="cc-cta">
              <p>¿Tenés dudas? Escribinos y te ayudamos.</p>
              <a
                href="https://wa.me/5492473417518"
                className="cc-ctaBtn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contactar por WhatsApp
              </a>
              <Link to="/categorias" className="cc-ctaBtnSecondary">
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
