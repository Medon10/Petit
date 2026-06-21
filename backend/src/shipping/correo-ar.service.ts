/**
 * correo-ar.service.ts
 *
 * Integración con Correo Argentino.
 * Modos de operación:
 *   1. API MiCorreo (real): se activa cuando CORREO_AR_CLIENT_ID y
 *      CORREO_AR_CLIENT_SECRET están configurados en .env.
 *   2. Tabla de tarifas (fallback): usa una tabla de precios por zona basada
 *      en los primeros dígitos del código postal de destino.
 *      Ideal para empezar sin credenciales comerciales.
 *
 * Para joyería personalizada, asumimos un paquete pequeño de ~300g.
 * El peso configurable via CORREO_AR_DEFAULT_WEIGHT_GRAMS (default: 300).
 */

const MICORREO_PROD_URL = 'https://api.correoargentino.com.ar/micorreo/v1';
const MICORREO_QA_URL = 'https://apitest.correoargentino.com.ar/micorreo/v1';

const CLIENT_ID = process.env.CORREO_AR_CLIENT_ID || '';
const CLIENT_SECRET = process.env.CORREO_AR_CLIENT_SECRET || '';
const USE_REAL_API = !!(CLIENT_ID && CLIENT_SECRET);
const USE_QA = String(process.env.CORREO_AR_ENV || '').toLowerCase() === 'qa';
const API_BASE = USE_QA ? MICORREO_QA_URL : MICORREO_PROD_URL;

// Código postal de origen (dónde está el negocio).
// Configurable via CORREO_AR_ORIGIN_POSTAL_CODE.
const ORIGIN_CP = process.env.CORREO_AR_ORIGIN_POSTAL_CODE || '5000';

// Peso por defecto del paquete en gramos (joyería = paquete pequeño).
const DEFAULT_WEIGHT_G = Number(process.env.CORREO_AR_DEFAULT_WEIGHT_GRAMS || '300');
const safeWeight = Number.isFinite(DEFAULT_WEIGHT_G) && DEFAULT_WEIGHT_G > 0 ? DEFAULT_WEIGHT_G : 300;

export type CorreoQuoteResult = {
  provider: 'Correo Argentino';
  service: string;
  cost: number;
  etaMinDays: number;
  etaMaxDays: number;
};

// ─── Token cache para la API real ────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) return cachedToken;

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Correo Argentino: error de autenticación (${res.status}): ${body}`);
  }

  const json = await res.json() as { access_token: string; expires_in?: number };
  cachedToken = json.access_token;
  tokenExpiresAt = now + (Number(json.expires_in ?? 3600) * 1000);
  return cachedToken;
}

// ─── Driver: API MiCorreo ─────────────────────────────────────
async function quoteFromApi(destPostalCode: string): Promise<CorreoQuoteResult> {
  const token = await getToken();

  const body = {
    postalCodeFrom: ORIGIN_CP,
    postalCodeTo: destPostalCode,
    packageType: 'P',   // P = Paquete
    weightInGrams: safeWeight,
    // Dimensiones mínimas para joyería (caja pequeña):
    lengthInCm: 15,
    widthInCm: 10,
    heightInCm: 5,
  };

  const res = await fetch(`${API_BASE}/rates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Correo Argentino: error al cotizar (${res.status}): ${errBody}`);
  }

  const json = await res.json() as any;

  // El response de MiCorreo puede variar según el contrato.
  // Tomamos el primer servicio disponible (generalmente "Encomienda Clásica").
  const services = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : [json]);
  const first = services[0];

  if (!first || !first.price) {
    throw new Error('Correo Argentino: respuesta inesperada de la API de cotización.');
  }

  const cost = Math.round(Number(first.price));
  const service = String(first.serviceDescription || first.service || 'Encomienda Clásica');
  const etaMinDays = Number(first.deliveryTimeMin ?? first.etaMin ?? 3);
  const etaMaxDays = Number(first.deliveryTimeMax ?? first.etaMax ?? 8);

  return {
    provider: 'Correo Argentino',
    service,
    cost,
    etaMinDays: Number.isFinite(etaMinDays) ? etaMinDays : 3,
    etaMaxDays: Number.isFinite(etaMaxDays) ? etaMaxDays : 8,
  };
}

// ─── Driver: Tabla de tarifas por zona ───────────────────────
/**
 * Zonas de Correo Argentino aproximadas según primeros dígitos del CP destino.
 * Basado en el mapa de zonas radiales que usa CA en sus tarifas de lista.
 *
 * Origen: Córdoba (CP 5xxx) — ajustar si el negocio está en otra ciudad.
 * Para un origen en Buenos Aires (1xxx–1999), las zonas cambian; se puede
 * configurar la lógica por CORREO_AR_ORIGIN_POSTAL_CODE en el futuro.
 *
 * Precios de referencia 2025 (Encomienda Clásica, paquete ~300g):
 * - Zona 1 (local / CABA / AMBA): ~$3.500–4.000
 * - Zona 2 (hasta ~500 km): ~$4.500–5.500
 * - Zona 3 (hasta ~1000 km): ~$5.500–7.000
 * - Zona 4 (todo el país): ~$7.000–9.500
 *
 * Nota: Los precios se actualizan por inflación. Se puede ajustar via
 * CORREO_AR_BASE_COST_ZONE_1..4 en .env.
 */

type ZoneConfig = {
  service: string;
  cost: number;
  etaMinDays: number;
  etaMaxDays: number;
};

function getZoneConfig(): ZoneConfig[] {
  // Permite ajustar precios base por variable de entorno sin deploy.
  const z1 = Number(process.env.CORREO_AR_BASE_COST_ZONE_1 || '4000');
  const z2 = Number(process.env.CORREO_AR_BASE_COST_ZONE_2 || '5500');
  const z3 = Number(process.env.CORREO_AR_BASE_COST_ZONE_3 || '6500');
  const z4 = Number(process.env.CORREO_AR_BASE_COST_ZONE_4 || '8500');

  return [
    { service: 'Encomienda Clásica – Zona 1', cost: z1, etaMinDays: 2, etaMaxDays: 4 },
    { service: 'Encomienda Clásica – Zona 2', cost: z2, etaMinDays: 3, etaMaxDays: 5 },
    { service: 'Encomienda Clásica – Zona 3', cost: z3, etaMinDays: 4, etaMaxDays: 7 },
    { service: 'Encomienda Clásica – Zona 4', cost: z4, etaMinDays: 5, etaMaxDays: 10 },
  ];
}

/**
 * Determina la zona (0–3) según el primer y segundo dígito del CP de destino.
 * Escrito para origen en la región de Buenos Aires / Córdoba (los dos casos
 * más comunes para emprendimientos). Se puede ampliar en el futuro.
 */
function getZoneIndex(destCP: string): number {
  const digits = destCP.replace(/\D/g, '');
  const firstTwo = Number(digits.slice(0, 2) || '0');
  const first = Number(digits.slice(0, 1) || '0');

  const originDigits = ORIGIN_CP.replace(/\D/g, '');
  const originFirst = Number(originDigits.slice(0, 1) || '0');

  // Si origen y destino empiezan igual → zona 1 (local/regional).
  if (originFirst === first) return 0;

  // Buenos Aires (1xxx–1999) y Gran Buenos Aires (1600–1900): zona 1 entre sí.
  if (first === 1 && originFirst <= 2) return 0;
  if (originFirst === 1 && first <= 2) return 0;

  // CP entre 1 y 4 (Litoral, Pampeana, Cuyo): zona 2 desde GBA/CBA.
  if (firstTwo <= 40) return 1;

  // CP entre 4 y 6 (NOA, NEA, Centro): zona 3.
  if (firstTwo <= 60) return 2;

  // Patagonia y resto: zona 4.
  return 3;
}

function quoteFromTable(destPostalCode: string): CorreoQuoteResult {
  const zones = getZoneConfig();
  const zoneIdx = Math.min(getZoneIndex(destPostalCode), zones.length - 1);
  const zone = zones[zoneIdx];

  return {
    provider: 'Correo Argentino',
    service: zone.service,
    cost: zone.cost,
    etaMinDays: zone.etaMinDays,
    etaMaxDays: zone.etaMaxDays,
  };
}

// ─── Punto de entrada público ─────────────────────────────────
export async function quoteCorreoArgentino(destPostalCode: string): Promise<CorreoQuoteResult> {
  if (USE_REAL_API) {
    return await quoteFromApi(destPostalCode);
  }
  return quoteFromTable(destPostalCode);
}

export function isUsingRealApi() {
  return USE_REAL_API;
}
