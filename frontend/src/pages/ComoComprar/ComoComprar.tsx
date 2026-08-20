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
                    Muchos de nuestros productos pueden grabarse con un texto a elección: nombres,
                    fechas, frases o firmas. En la página del producto vas a encontrar el campo para
                    ingresar la personalización. Si tenés alguna duda sobre qué podés grabar, escribinos
                    por WhatsApp antes de hacer el pedido.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">03</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Agregalo al carrito</h2>
                  <p>
                    Seleccioná la variante que quieras (por ejemplo, el material o el tamaño si
                    corresponde) y hacé clic en "Agregar al carrito". Podés seguir comprando y
                    agregar más productos antes de finalizar.
                  </p>
                </div>
              </div>

              <div className="cc-step">
                <div className="cc-stepNum">04</div>
                <div className="cc-stepContent">
                  <h2 className="cc-stepTitle">Completá el checkout</h2>
                  <p>
                    Cuando estés listo, ingresá tu nombre, correo electrónico y la dirección de
                    envío. Revisá el resumen de tu pedido y confirmá.
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
                    Enviamos a todo el país por correo argentino. También podés
                    coordinar el retiro en persona si estás en la zona. Los tiempos de entrega
                    varían según el destino y la disponibilidad de stock.
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
