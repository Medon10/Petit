import type { ShippingQuoteDto, ShippingQuoteItemInput } from './api';
import type { CartItem } from './cart';

export function normalizePostalCode(raw: unknown) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

export function isPostalCodeValid(raw: unknown) {
  const normalized = normalizePostalCode(raw);
  return /^[A-Z0-9]{4,8}$/.test(normalized);
}

export function hasItemsWithoutVariant(items: CartItem[]) {
  return items.some((item) => item.variantId == null);
}

export function buildShippingQuoteItems(items: CartItem[]): ShippingQuoteItemInput[] {
  return items
    .filter((item) => item.variantId != null)
    .map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId as number,
      quantity: item.quantity,
      extras: item.extraIds.map((extraId) => ({
        extra_id: extraId,
        quantity: 1,
      })),
    }));
}

export function buildShippingQuoteKey(postalCode: string, items: ShippingQuoteItemInput[]) {
  const itemSignature = items
    .map((item) => {
      const extras = (item.extras || [])
        .map((extra) => `${extra.extra_id}:${extra.quantity ?? 1}`)
        .sort()
        .join(',');
      return `${item.product_id}:${item.variant_id}:${item.quantity}:${extras}`;
    })
    .sort()
    .join('|');

  return `${normalizePostalCode(postalCode)}|${itemSignature}`;
}

export function isShippingQuoteExpired(quote: ShippingQuoteDto | null | undefined) {
  if (!quote?.expiresAt) return true;
  const expirationMs = Date.parse(quote.expiresAt);
  if (!Number.isFinite(expirationMs)) return true;
  return expirationMs <= Date.now();
}

export function formatShippingEta(quote: ShippingQuoteDto | null | undefined) {
  if (!quote) return '';
  if (!Number.isFinite(quote.etaMinDays) || !Number.isFinite(quote.etaMaxDays)) return '';
  if (quote.etaMinDays === quote.etaMaxDays) return `${quote.etaMinDays} dia(s)`;
  return `${quote.etaMinDays} a ${quote.etaMaxDays} dias`; 
}

export function formatQuoteExpiration(expiresAt: string | undefined) {
  if (!expiresAt) return '';
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
