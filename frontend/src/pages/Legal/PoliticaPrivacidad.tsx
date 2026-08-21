import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import './Legal.css';

export default function PoliticaPrivacidadPage() {
  return (
    <div className="legal-page">
      <Helmet>
        <title>Política de Privacidad | Petit Accesorios</title>
        <meta
          name="description"
          content="Política de privacidad de Petit Accesorios. Conocé cómo recopilamos, usamos y protegemos tus datos personales."
        />
        <link rel="canonical" href="https://petitaccesorios.com.ar/privacidad" />
        <meta property="og:title" content="Política de Privacidad | Petit Accesorios" />
        <meta property="og:description" content="Política de privacidad de Petit Accesorios." />
        <meta property="og:url" content="https://petitaccesorios.com.ar/privacidad" />
      </Helmet>
      <Header />

      <main className="legal-main">
        <div className="legal-container">
          <div className="legal-hero">
            <h1 className="legal-title">Política de Privacidad</h1>
            <div className="legal-divider" />
          </div>

          <div className="legal-body">
            <h2>1. Responsable del tratamiento</h2>
            <p>
              Petit Accesorios (en adelante, "nosotros") es responsable del tratamiento de los
              datos personales recopilados a través del sitio web{' '}
              <a href="https://petitaccesorios.com.ar">petitaccesorios.com.ar</a> (en adelante,
              "el Sitio").
            </p>

            <h2>2. Datos que recopilamos</h2>
            <p>
              Recopilamos únicamente los datos necesarios para procesar tu pedido y brindarte
              una mejor experiencia de compra:
            </p>
            <ul>
              <li><strong>Nombre completo:</strong> para identificar tu pedido.</li>
              <li><strong>Correo electrónico (opcional):</strong> para comunicaciones sobre el estado del pedido.</li>
              <li><strong>Teléfono (opcional):</strong> para coordinar detalles de entrega y personalización.</li>
              <li><strong>Dirección de envío:</strong> únicamente si elegís la opción de envío a domicilio.</li>
              <li><strong>Notas del pedido:</strong> información adicional que proporciones voluntariamente.</li>
            </ul>

            <h2>3. Finalidad del tratamiento</h2>
            <p>
              Utilizamos tus datos personales exclusivamente para:
            </p>
            <ul>
              <li>Procesar y gestionar tu pedido.</li>
              <li>Coordinar la entrega o retiro del producto.</li>
              <li>Coordinar la personalización del grabado.</li>
              <li>Responderte consultas a través de WhatsApp o correo electrónico.</li>
            </ul>
            <p>
              No utilizamos tus datos para enviar publicidad no solicitada ni los compartimos
              con terceros con fines comerciales.
            </p>

            <h2>4. Base legal</h2>
            <p>
              El tratamiento de tus datos se basa en la Ley 25.326 de Protección de Datos
              Personales de la República Argentina y sus normas reglamentarias. Al realizar
              una compra, prestás tu consentimiento para el tratamiento de los datos necesarios
              para cumplir con el contrato de compraventa.
            </p>

            <h2>5. Conservación de los datos</h2>
            <p>
              Conservamos tus datos personales mientras sean necesarios para la finalidad para
              la que fueron recopilados y durante los plazos legales aplicables.
            </p>

            <h2>6. Seguridad</h2>
            <p>
              Adoptamos medidas de seguridad técnicas y organizativas razonables para proteger
              tus datos personales contra el acceso no autorizado, la alteración, la divulgación
              o la destrucción. El sitio utiliza conexión segura HTTPS para la transmisión de datos.
            </p>

            <h2>7. Derechos del titular</h2>
            <p>
              De acuerdo con la Ley 25.326, tenés derecho a:
            </p>
            <ul>
              <li>Acceder a tus datos personales.</li>
              <li>Solicitar la rectificación de datos inexactos.</li>
              <li>Solicitar la supresión de tus datos.</li>
              <li>Oponerte al tratamiento de tus datos.</li>
            </ul>
            <p>
              Para ejercer estos derechos, podés contactarnos a través de{' '}
              <a href="https://wa.me/5492473417518" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>.
            </p>
            <p>
              La DIRECCIÓN NACIONAL DE PROTECCIÓN DE DATOS PERSONALES, organismo de control de la
              Ley 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan
              quienes resulten afectados en sus derechos.
            </p>

            <h2>8. Cookies</h2>
            <p>
              El Sitio utiliza almacenamiento local del navegador (localStorage) para mantener el
              carrito de compras y las preferencias de búsqueda. No utilizamos cookies de
              seguimiento ni herramientas de rastreo de terceros.
            </p>

            <h2>9. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad en cualquier momento. La versión
              vigente siempre estará disponible en esta página.
            </p>

            <h2>10. Contacto</h2>
            <p>
              Para cualquier consulta sobre esta Política de Privacidad, podés contactarnos
              a través de{' '}
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
