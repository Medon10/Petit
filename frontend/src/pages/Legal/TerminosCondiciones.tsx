import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import './Legal.css';

export default function TerminosCondicionesPage() {
  return (
    <div className="legal-page">
      <Helmet>
        <title>Términos y Condiciones | Petit Accesorios</title>
        <meta
          name="description"
          content="Términos y condiciones de compra en Petit Accesorios. Conocé las reglas de uso, envíos, cambios y devoluciones."
        />
        <link rel="canonical" href="https://petitaccesorios.com.ar/terminos" />
        <meta property="og:title" content="Términos y Condiciones | Petit Accesorios" />
        <meta property="og:description" content="Términos y condiciones de compra en Petit Accesorios." />
        <meta property="og:url" content="https://petitaccesorios.com.ar/terminos" />
      </Helmet>
      <Header />

      <main className="legal-main">
        <div className="legal-container">
          <div className="legal-hero">
            <h1 className="legal-title">Términos y Condiciones</h1>
            <div className="legal-divider" />
          </div>

          <div className="legal-body">
            <h2>1. Generalidades</h2>
            <p>
              Los presentes Términos y Condiciones regulan el uso del sitio web de Petit Accesorios
              (en adelante, "el Sitio") y las compras realizadas a través del mismo. Al navegar y/o
              realizar una compra en el Sitio, el usuario acepta estos términos en su totalidad.
            </p>
            <p>
              Petit Accesorios se reserva el derecho de modificar estos Términos y Condiciones en
              cualquier momento, publicando la versión actualizada en esta página.
            </p>

            <h2>2. Productos</h2>
            <p>
              Todos los productos ofrecidos en el Sitio son accesorios de acero quirúrgico con
              grabado láser personalizado. Las imágenes son ilustrativas y pueden presentar
              variaciones menores respecto al producto final debido a la naturaleza artesanal
              del grabado.
            </p>
            <p>
              Los precios publicados están expresados en pesos argentinos (ARS) e incluyen IVA
              cuando corresponda. Petit Accesorios se reserva el derecho de modificar los precios
              sin previo aviso.
            </p>

            <h2>3. Proceso de compra</h2>
            <p>
              Para realizar una compra, el usuario debe seleccionar los productos deseados, agregarlos
              al carrito, completar los datos de envío y contacto, y confirmar el pedido. Una vez
              confirmado, el usuario recibirá las instrucciones de pago.
            </p>
            <p>
              El pedido se considerará confirmado una vez que Petit Accesorios verifique la recepción
              del pago mediante transferencia bancaria o el medio de pago acordado.
            </p>

            <h2>4. Medios de pago</h2>
            <p>
              Los medios de pago aceptados son:
            </p>
            <ul>
              <li>Transferencia bancaria</li>
              <li>Mercado Pago</li>
              <li>Efectivo (solo para retiro en persona)</li>
            </ul>

            <h2>5. Envíos</h2>
            <p>
              Petit Accesorios realiza envíos a todo el territorio de la República Argentina a
              través de Correo Argentino u otros servicios de mensajería. El costo y los tiempos
              de envío se coordinan por WhatsApp al momento de confirmar el pedido.
            </p>
            <p>
              También se ofrece la opción de retiro en persona, coordinando dirección y horario
              por WhatsApp.
            </p>

            <h2>6. Personalización</h2>
            <p>
              Los detalles de grabado (texto, tipografía, diseño) se coordinan por WhatsApp antes
              de la producción. Antes de realizar el grabado, se envía una muestra digital del
              diseño para la aprobación del cliente.
            </p>
            <p>
              Los productos personalizados no admiten cambio ni devolución, salvo que presenten
              defectos de fabricación.
            </p>

            <h2>7. Cambios y devoluciones</h2>
            <p>
              De acuerdo con la legislación argentina vigente (Ley 24.240 de Defensa del Consumidor),
              el usuario tiene derecho a revocar la aceptación durante el plazo de 10 días corridos
              contados a partir de la recepción del producto, siempre que no se trate de un producto
              personalizado.
            </p>
            <p>
              Para iniciar un reclamo o solicitar un cambio, el usuario debe contactarse a través
              de WhatsApp.
            </p>

            <h2>8. Propiedad intelectual</h2>
            <p>
              Todo el contenido del Sitio (textos, imágenes, logotipos, diseños) es propiedad de
              Petit Accesorios y está protegido por las leyes argentinas de propiedad intelectual.
              Queda prohibida su reproducción sin autorización previa.
            </p>

            <h2>9. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos Términos y Condiciones, podés contactarnos a
              través de{' '}
              <a href="https://wa.me/5492473417518" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>{' '}
              o por{' '}
              <a href="https://www.instagram.com/petit.laser/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>.
            </p>

            <p className="legal-lastUpdated">
              Última actualización: agosto de 2026
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
