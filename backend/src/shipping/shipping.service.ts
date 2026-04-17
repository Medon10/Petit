import { randomUUID } from 'node:crypto';

import { orm } from '../shared/bdd/orm.js';
import { OrderRepository } from '../order/order.repository.js';

export type ShippingQuoteExtraInput = {
  extra_id?: number;
  extraId?: number;
  quantity?: number;
};

export type ShippingQuoteItemInput = {
  product_id?: number;
  productId?: number;
  variant_id?: number;
  variantId?: number;
  quantity?: number;
  extras?: ShippingQuoteExtraInput[];
};

export type CreateShippingQuoteInput = {
  postal_code?: string;
  postalCode?: string;
  items?: ShippingQuoteItemInput[];
};

export type ShippingQuoteDto = {
  quoteId: string;
  provider: string;
  service: string;
  postalCode: string;
  cost: number;
  etaMinDays: number;
  etaMaxDays: number;
  expiresAt: string;
  expiresInSeconds: number;
  currency: 'ARS';
};

export class ShippingQuoteError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type NormalizedExtra = {
  extraId: number;
  quantity: number;
};

type NormalizedItem = {
  productId: number;
  variantId: number;
  quantity: number;
  extras: NormalizedExtra[];
};

type StoredShippingQuote = {
  quoteId: string;
  provider: string;
  service: string;
  postalCode: string;
  cost: number;
  etaMinDays: number;
  etaMaxDays: number;
  expiresAtMs: number;
  itemsSignature: string;
};

const QUOTE_TTL_MINUTES = Number.parseInt(process.env.SHIPPING_QUOTE_TTL_MINUTES || '15', 10);
const quoteTtlMs = Number.isFinite(QUOTE_TTL_MINUTES) && QUOTE_TTL_MINUTES > 0 ? QUOTE_TTL_MINUTES * 60 * 1000 : 15 * 60 * 1000;

const MAX_QUOTES_IN_MEMORY = 3000;
const quoteStore = new Map<string, StoredShippingQuote>();

function normalizePostalCode(raw: unknown) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

export function normalizeAndValidatePostalCode(raw: unknown) {
  const normalized = normalizePostalCode(raw);
  if (!/^[A-Z0-9]{4,8}$/.test(normalized)) {
    throw new ShippingQuoteError('shipping_postal_code_invalid', 'Codigo postal invalido. Usa 4 a 8 caracteres alfanumericos.');
  }
  return normalized;
}

function normalizeItems(rawItems: unknown): NormalizedItem[] {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (items.length === 0) {
    throw new ShippingQuoteError('shipping_items_required', 'items es requerido para cotizar envio.');
  }

  return items.map((item: any, itemIndex) => {
    const productId = Number(item?.product_id ?? item?.productId);
    const variantId = Number(item?.variant_id ?? item?.variantId);
    const quantity = Number(item?.quantity ?? 1);

    if (!Number.isFinite(productId) || productId <= 0) {
      throw new ShippingQuoteError('shipping_items_invalid', `product_id invalido en item #${itemIndex + 1}.`);
    }

    if (!Number.isFinite(variantId) || variantId <= 0) {
      throw new ShippingQuoteError('shipping_items_invalid', `variant_id invalido en item #${itemIndex + 1}.`);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ShippingQuoteError('shipping_items_invalid', `quantity invalido en item #${itemIndex + 1}.`);
    }

    const extrasRaw = Array.isArray(item?.extras) ? item.extras : [];
    const extras = extrasRaw.map((extra: any, extraIndex: number) => {
      const extraId = Number(extra?.extra_id ?? extra?.extraId);
      const extraQuantity = Number(extra?.quantity ?? 1);

      if (!Number.isFinite(extraId) || extraId <= 0) {
        throw new ShippingQuoteError(
          'shipping_items_invalid',
          `extra_id invalido en item #${itemIndex + 1}, extra #${extraIndex + 1}.`
        );
      }

      if (!Number.isFinite(extraQuantity) || extraQuantity <= 0) {
        throw new ShippingQuoteError(
          'shipping_items_invalid',
          `quantity invalido en item #${itemIndex + 1}, extra #${extraIndex + 1}.`
        );
      }

      return {
        extraId,
        quantity: Math.trunc(extraQuantity),
      } as NormalizedExtra;
    });

    return {
      productId: Math.trunc(productId),
      variantId: Math.trunc(variantId),
      quantity: Math.trunc(quantity),
      extras,
    } as NormalizedItem;
  });
}

export function buildOrderItemsSignature(itemsInput: unknown) {
  const items = normalizeItems(itemsInput);
  const sortedItems = items
    .map((item) => {
      const extras = [...item.extras]
        .sort((a, b) => (a.extraId === b.extraId ? a.quantity - b.quantity : a.extraId - b.extraId))
        .map((extra) => `${extra.extraId}:${extra.quantity}`)
        .join(',');
      return `${item.productId}:${item.variantId}:${item.quantity}:${extras}`;
    })
    .sort();
  return sortedItems.join('|');
}

async function calculateItemsSubtotal(items: NormalizedItem[]) {
  const em = orm.em.fork();
  let subtotal = 0;

  for (const item of items) {
    const product = await OrderRepository.findProductOrThrow(em, item.productId);
    const variant = await OrderRepository.findVariantOrThrow(em, item.variantId, item.productId);

    const unitPrice = Number((variant as any).price);
    if (!Number.isFinite(unitPrice)) {
      throw new ShippingQuoteError('shipping_variant_price_invalid', 'No se pudo calcular la cotizacion: precio de variante invalido.');
    }

    subtotal += unitPrice * item.quantity;

    for (const extraInput of item.extras) {
      const extra = await OrderRepository.findExtraOrThrow(em, extraInput.extraId);
      const extraUnitPrice = Number((extra as any).price);
      if (!Number.isFinite(extraUnitPrice)) {
        throw new ShippingQuoteError('shipping_extra_price_invalid', 'No se pudo calcular la cotizacion: precio de extra invalido.');
      }
      subtotal += extraUnitPrice * extraInput.quantity;
    }
  }

  return subtotal;
}

function getUnits(items: NormalizedItem[]) {
  let units = 0;
  for (const item of items) {
    units += item.quantity;
    for (const extra of item.extras) units += extra.quantity;
  }
  return Math.max(units, 1);
}

function getZone(postalCode: string) {
  const digits = postalCode.replace(/\D/g, '');
  const first = Number.parseInt(digits.slice(0, 1) || '0', 10);

  if (!Number.isFinite(first)) {
    return { multiplier: 1.2, etaMinDays: 3, etaMaxDays: 6, service: 'Estandar Nacional' };
  }

  if (first <= 1) {
    return { multiplier: 1.0, etaMinDays: 1, etaMaxDays: 3, service: 'Urbano Express' };
  }

  if (first <= 4) {
    return { multiplier: 1.2, etaMinDays: 2, etaMaxDays: 4, service: 'Estandar Centro' };
  }

  if (first <= 6) {
    return { multiplier: 1.35, etaMinDays: 3, etaMaxDays: 6, service: 'Regional' };
  }

  return { multiplier: 1.55, etaMinDays: 4, etaMaxDays: 8, service: 'Larga Distancia' };
}

function roundCost(value: number) {
  const rounded = Math.round(value / 50) * 50;
  return Math.max(1200, rounded);
}

function buildAggregatorQuote(input: { postalCode: string; subtotal: number; units: number }) {
  const provider = process.env.SHIPPING_AGGREGATOR_PROVIDER || 'Agregador Nacional';
  const zone = getZone(input.postalCode);

  const base = 1800;
  const perUnit = input.units * 220;
  const insured = Math.min(input.subtotal * 0.025, 5500);
  const cost = roundCost((base + perUnit + insured) * zone.multiplier);

  return {
    provider,
    service: zone.service,
    cost,
    etaMinDays: zone.etaMinDays,
    etaMaxDays: zone.etaMaxDays,
  };
}

function pruneExpiredQuotes(nowMs = Date.now()) {
  for (const [quoteId, quote] of quoteStore.entries()) {
    if (quote.expiresAtMs <= nowMs) quoteStore.delete(quoteId);
  }

  if (quoteStore.size <= MAX_QUOTES_IN_MEMORY) return;

  // Keep memory bounded by deleting oldest expirations first.
  const quotesByExpiration = [...quoteStore.values()].sort((a, b) => a.expiresAtMs - b.expiresAtMs);
  const amountToDelete = quoteStore.size - MAX_QUOTES_IN_MEMORY;
  for (let i = 0; i < amountToDelete; i += 1) {
    quoteStore.delete(quotesByExpiration[i].quoteId);
  }
}

function toPublicQuote(quote: StoredShippingQuote): ShippingQuoteDto {
  const now = Date.now();
  const expiresInSeconds = Math.max(1, Math.floor((quote.expiresAtMs - now) / 1000));

  return {
    quoteId: quote.quoteId,
    provider: quote.provider,
    service: quote.service,
    postalCode: quote.postalCode,
    cost: quote.cost,
    etaMinDays: quote.etaMinDays,
    etaMaxDays: quote.etaMaxDays,
    expiresAt: new Date(quote.expiresAtMs).toISOString(),
    expiresInSeconds,
    currency: 'ARS',
  };
}

export async function createShippingQuote(input: CreateShippingQuoteInput) {
  pruneExpiredQuotes();

  const postalCode = normalizeAndValidatePostalCode(input.postal_code ?? input.postalCode);
  const normalizedItems = normalizeItems(input.items);
  const itemsSignature = buildOrderItemsSignature(normalizedItems);
  const subtotal = await calculateItemsSubtotal(normalizedItems);

  const quoteFromAggregator = buildAggregatorQuote({
    postalCode,
    subtotal,
    units: getUnits(normalizedItems),
  });

  const quoteId = randomUUID();
  const now = Date.now();
  const quote: StoredShippingQuote = {
    quoteId,
    provider: quoteFromAggregator.provider,
    service: quoteFromAggregator.service,
    postalCode,
    cost: quoteFromAggregator.cost,
    etaMinDays: quoteFromAggregator.etaMinDays,
    etaMaxDays: quoteFromAggregator.etaMaxDays,
    expiresAtMs: now + quoteTtlMs,
    itemsSignature,
  };

  quoteStore.set(quoteId, quote);
  return toPublicQuote(quote);
}

export function validateShippingQuoteForOrder(input: {
  quoteId?: unknown;
  postalCode?: unknown;
  items?: unknown;
}) {
  pruneExpiredQuotes();

  const quoteId = String(input.quoteId ?? '').trim();
  if (!quoteId) {
    throw new ShippingQuoteError('shipping_quote_required', 'shipping.quote_id es requerido para envio a domicilio.');
  }

  const quote = quoteStore.get(quoteId);
  if (!quote) {
    throw new ShippingQuoteError('shipping_quote_not_found', 'La cotizacion de envio no existe o ya no esta disponible.');
  }

  if (quote.expiresAtMs <= Date.now()) {
    quoteStore.delete(quoteId);
    throw new ShippingQuoteError('shipping_quote_expired', 'La cotizacion de envio vencio. Volve a cotizar antes de confirmar.');
  }

  const postalCode = normalizeAndValidatePostalCode(input.postalCode);
  if (quote.postalCode !== postalCode) {
    throw new ShippingQuoteError('shipping_quote_postal_code_mismatch', 'El codigo postal no coincide con la cotizacion seleccionada.');
  }

  const itemsSignature = buildOrderItemsSignature(input.items);
  if (quote.itemsSignature !== itemsSignature) {
    throw new ShippingQuoteError('shipping_quote_items_mismatch', 'El carrito cambio desde la cotizacion seleccionada. Volve a cotizar.');
  }

  return {
    quoteId: quote.quoteId,
    provider: quote.provider,
    service: quote.service,
    postalCode: quote.postalCode,
    cost: quote.cost,
    etaMinDays: quote.etaMinDays,
    etaMaxDays: quote.etaMaxDays,
    expiresAt: new Date(quote.expiresAtMs),
  };
}
