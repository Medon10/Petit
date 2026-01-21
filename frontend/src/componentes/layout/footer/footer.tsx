import './footer.css';

export default function Footer() {
  return (
    <footer className="ph-footer">
      <div className="ph-container">
        <div className="ph-footerGrid">
          <div className="ph-footerBrand">
            <div className="ph-footerBrandHeader">
              <div className="ph-footerLogo" aria-hidden="true">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12,24 L24,6 L36,24 L24,42 Z" fill="currentColor"></path>
                </svg>
              </div>
              <span className="ph-footerBrandName">Petit</span>
            </div>
            <p className="ph-footerText">
              Joyería minimalista en acero quirúrgico. Diseñamos piezas que cuentan tu historia con
              elegancia y durabilidad.
            </p>
            <div className="ph-social">
              <a className="ph-socialLink" href="#" aria-label="Instagram">
                <svg className="ph-socialIcon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.484 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h5 className="ph-footerTitle">Colecciones</h5>
            <ul className="ph-footerLinks">
              <li><a href="#">Novedades</a></li>
              <li><a href="#">Pulseras</a></li>
              <li><a href="#">Medallas</a></li>
              <li><a href="#">Anillos</a></li>
            </ul>
          </div>

          <div>
            <h5 className="ph-footerTitle">Atención al Cliente</h5>
            <ul className="ph-footerLinks">
              <li><a href="#">Envíos y Entregas</a></li>
              <li><a href="#">Cambios y Devoluciones</a></li>
              <li><a href="#">Guía de Talles</a></li>
              <li><a href="#">Preguntas Frecuentes</a></li>
            </ul>
          </div>

          <div>
            <h5 className="ph-footerTitle">Newsletter</h5>
            <p className="ph-footerSmall">Suscríbete y recibe un 10% en tu primera compra.</p>
            <form className="ph-newsletter" onSubmit={(e) => e.preventDefault()}>
              <input className="ph-input" type="email" placeholder="Tu correo electrónico" />
              <button className="ph-button" type="submit">Suscribirse</button>
            </form>
          </div>
        </div>

        <div className="ph-footerBottom">
          <p>© 2026 Petit Joyas. Todos los derechos reservados.</p>
          <div className="ph-footerBottomLinks">
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
