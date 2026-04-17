import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ShippingMethod, ShippingQuoteDto } from './api';

export type CartItem = {
  key: string;
  productId: number;
  variantId: number | null;
  extraIds: number[];
  quantity: number;
  addedAt: number;
};

type CartState = {
  items: CartItem[];
  shipping: CartShippingState;
};

export type CartShippingState = {
  method: ShippingMethod;
  postalCode: string;
  quote: ShippingQuoteDto | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  shipping: CartShippingState;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: { productId: number; variantId?: number | null; extraIds?: number[]; quantity?: number }) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  setShippingPostalCode: (postalCode: string) => void;
  setShippingQuote: (quote: ShippingQuoteDto | null) => void;
  clearShippingQuote: () => void;
  setShippingAddress: (patch: Partial<Pick<CartShippingState, 'addressLine1' | 'addressLine2' | 'city' | 'province'>>) => void;
  resetShipping: () => void;
  clear: () => void;
};

const STORAGE_KEY = 'petit_cart_v2';

function normalizePostalCode(raw: unknown) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function defaultShippingState(): CartShippingState {
  return {
    method: 'pickup',
    postalCode: '',
    quote: null,
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
  };
}

function normalizeQuote(raw: any): ShippingQuoteDto | null {
  if (!raw || typeof raw !== 'object') return null;

  const quoteId = String(raw.quoteId ?? '').trim();
  const provider = String(raw.provider ?? '').trim();
  const service = String(raw.service ?? '').trim();
  const postalCode = normalizePostalCode(raw.postalCode);
  const cost = Number(raw.cost);
  const etaMinDays = Number(raw.etaMinDays);
  const etaMaxDays = Number(raw.etaMaxDays);
  const expiresAt = String(raw.expiresAt ?? '').trim();
  const expiresInSeconds = Number(raw.expiresInSeconds ?? 0);
  const currency = String(raw.currency ?? 'ARS').toUpperCase() as 'ARS';

  if (!quoteId || !provider || !service || !postalCode) return null;
  if (!Number.isFinite(cost) || cost < 0) return null;
  if (!Number.isFinite(etaMinDays) || !Number.isFinite(etaMaxDays)) return null;
  if (!expiresAt) return null;

  return {
    quoteId,
    provider,
    service,
    postalCode,
    cost,
    etaMinDays,
    etaMaxDays,
    expiresAt,
    expiresInSeconds: Number.isFinite(expiresInSeconds) ? Math.max(0, Math.trunc(expiresInSeconds)) : 0,
    currency,
  };
}

function normalizeShipping(raw: any): CartShippingState {
  const base = defaultShippingState();
  if (!raw || typeof raw !== 'object') return base;

  const method = String(raw.method ?? '').toLowerCase() === 'delivery' ? 'delivery' : 'pickup';
  const postalCode = normalizePostalCode(raw.postalCode);
  const quote = normalizeQuote(raw.quote);

  return {
    method,
    postalCode,
    quote,
    addressLine1: typeof raw.addressLine1 === 'string' ? raw.addressLine1 : '',
    addressLine2: typeof raw.addressLine2 === 'string' ? raw.addressLine2 : '',
    city: typeof raw.city === 'string' ? raw.city : '',
    province: typeof raw.province === 'string' ? raw.province : '',
  };
}

function normalizeExtraIds(extraIds: number[]) {
  return Array.from(new Set(extraIds.filter((n) => Number.isFinite(n))))
    .map((n) => Number(n))
    .sort((a, b) => a - b);
}

function makeKey(productId: number, variantId: number | null, extraIds: number[]) {
  const v = variantId == null ? '' : String(variantId);
  const e = normalizeExtraIds(extraIds).join(',');
  return `${productId}|${v}|${e}`;
}

function safeParse(json: string | null): CartState {
  if (!json) return { items: [], shipping: defaultShippingState() };
  try {
    const parsed = JSON.parse(json);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const normalized: CartItem[] = items
      .map((it: any) => {
        const productId = Number(it?.productId);
        const variantIdRaw = it?.variantId;
        const variantId = variantIdRaw == null || variantIdRaw === '' ? null : Number(variantIdRaw);
        const extraIds = Array.isArray(it?.extraIds) ? it.extraIds.map((x: any) => Number(x)) : [];
        const quantity = Math.max(1, Number(it?.quantity ?? 1));
        const addedAt = Number(it?.addedAt ?? Date.now());
        if (!Number.isFinite(productId)) return null;
        const key = makeKey(productId, Number.isFinite(variantId as any) ? (variantId as any) : null, extraIds);
        return {
          key,
          productId,
          variantId: Number.isFinite(variantId as any) ? (variantId as any) : null,
          extraIds: normalizeExtraIds(extraIds),
          quantity: Number.isFinite(quantity) ? quantity : 1,
          addedAt: Number.isFinite(addedAt) ? addedAt : Date.now(),
        } as CartItem;
      })
      .filter(Boolean);

    return {
      items: normalized as CartItem[],
      shipping: normalizeShipping(parsed?.shipping),
    };
  } catch {
    return { items: [], shipping: defaultShippingState() };
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(() => safeParse(localStorage.getItem(STORAGE_KEY)));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const totalItems = useMemo(() => state.items.reduce((sum, it) => sum + it.quantity, 0), [state.items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items: state.items,
      totalItems,
      shipping: state.shipping,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((v) => !v),
      addItem: ({ productId, variantId = null, extraIds = [], quantity = 1 }) => {
        const safeQty = Math.max(1, Number(quantity) || 1);
        const safeVariantId = variantId == null ? null : Number(variantId);
        const safeExtras = normalizeExtraIds(extraIds);
        const key = makeKey(productId, Number.isFinite(safeVariantId as any) ? (safeVariantId as any) : null, safeExtras);

        setState((prev) => {
          const existing = prev.items.find((i) => i.key === key);
          if (existing) {
            return {
              ...prev,
              items: prev.items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + safeQty } : i)),
            };
          }
          const next: CartItem = {
            key,
            productId,
            variantId: Number.isFinite(safeVariantId as any) ? (safeVariantId as any) : null,
            extraIds: safeExtras,
            quantity: safeQty,
            addedAt: Date.now(),
          };
          return {
            ...prev,
            items: [next, ...prev.items],
          };
        });
      },
      removeItem: (key: string) => {
        setState((prev) => ({
          ...prev,
          items: prev.items.filter((i) => i.key !== key),
        }));
      },
      setQuantity: (key: string, quantity: number) => {
        const safeQty = Math.max(1, Number(quantity) || 1);
        setState((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.key === key ? { ...i, quantity: safeQty } : i)),
        }));
      },
      setShippingMethod: (method: ShippingMethod) => {
        const normalizedMethod = method === 'delivery' ? 'delivery' : 'pickup';
        setState((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            method: normalizedMethod,
            quote: normalizedMethod === 'pickup' ? null : prev.shipping.quote,
          },
        }));
      },
      setShippingPostalCode: (postalCode: string) => {
        const normalized = normalizePostalCode(postalCode);
        setState((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            postalCode: normalized,
            quote: prev.shipping.quote?.postalCode === normalized ? prev.shipping.quote : null,
          },
        }));
      },
      setShippingQuote: (quote: ShippingQuoteDto | null) => {
        setState((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            method: quote ? 'delivery' : prev.shipping.method,
            postalCode: quote ? normalizePostalCode(quote.postalCode) : prev.shipping.postalCode,
            quote,
          },
        }));
      },
      clearShippingQuote: () => {
        setState((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            quote: null,
          },
        }));
      },
      setShippingAddress: (patch) => {
        setState((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            addressLine1: patch.addressLine1 != null ? patch.addressLine1 : prev.shipping.addressLine1,
            addressLine2: patch.addressLine2 != null ? patch.addressLine2 : prev.shipping.addressLine2,
            city: patch.city != null ? patch.city : prev.shipping.city,
            province: patch.province != null ? patch.province : prev.shipping.province,
          },
        }));
      },
      resetShipping: () => {
        setState((prev) => ({
          ...prev,
          shipping: defaultShippingState(),
        }));
      },
      clear: () => setState({ items: [], shipping: defaultShippingState() }),
    };
  }, [state.items, state.shipping, totalItems, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
