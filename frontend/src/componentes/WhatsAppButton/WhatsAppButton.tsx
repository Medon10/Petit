import './WhatsAppButton.css';

const WA_NUMBER = '5491100000000'; // ← Reemplazar con el número real de Petit
const WA_MESSAGE = encodeURIComponent('Hola! Me interesa consultar por un producto de Petit Accesorios ');

export default function WhatsAppButton() {
  return (
    <a
      className="ph-waButton"
      href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="ph-waIcon">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.129 6.744 3.047 9.379L1.054 31.27l6.1-1.957a15.905 15.905 0 008.85 2.691C24.826 32 32 24.824 32 16.004 32 7.176 24.826 0 16.004 0zm9.294 22.622c-.39 1.097-1.927 2.008-3.164 2.273-.846.18-1.951.323-5.672-1.22-4.76-1.974-7.822-6.813-8.061-7.13-.228-.316-1.917-2.553-1.917-4.87 0-2.316 1.214-3.455 1.644-3.926.39-.428 1.022-.625 1.63-.625.196 0 .373.01.531.018.47.02.706.049 1.016.787.39.926 1.34 3.27 1.457 3.507.12.237.236.554.078.87-.148.326-.276.47-.514.746-.237.276-.462.487-.7.785-.216.257-.46.533-.196.983.265.45 1.177 1.942 2.527 3.146 1.738 1.549 3.2 2.028 3.66 2.252.39.19.86.152 1.138-.148.354-.374.79-.998 1.234-1.612.316-.437.714-.492 1.144-.316.436.168 2.769 1.305 3.244 1.543.474.237.79.355.908.553.117.197.117 1.145-.273 2.244z"/>
      </svg>
    </a>
  );
}
