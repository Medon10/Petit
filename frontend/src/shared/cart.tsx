import { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: { productId: number; variantId?: number | null; extraIds?: number[]; quantity?: number }) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = 'petit_cart_v1';

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
  if (!json) return { items: [] };
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

    return { items: normalized as CartItem[] };
  } catch {
    return { items: [] };
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
          return { items: [next, ...prev.items] };
        });
      },
      removeItem: (key: string) => {
        setState((prev) => ({ items: prev.items.filter((i) => i.key !== key) }));
      },
      setQuantity: (key: string, quantity: number) => {
        const safeQty = Math.max(1, Number(quantity) || 1);
        setState((prev) => ({
          items: prev.items.map((i) => (i.key === key ? { ...i, quantity: safeQty } : i)),
        }));
      },
      clear: () => setState({ items: [] }),
    };
  }, [state.items, totalItems, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
