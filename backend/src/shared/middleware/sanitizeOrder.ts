import { Request, Response, NextFunction } from 'express';

type OrderItemInput = {
  product_id?: number;
  productId?: number;
  variant_id?: number;
  variantId?: number;
  quantity?: number;
  extras?: Array<{ extra_id?: number; extraId?: number; quantity?: number }>;
};

type ShippingInput = {
  method?: string;
  postal_code?: string;
  postalCode?: string;
  address_line1?: string;
  addressLine1?: string;
  address_line2?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
};

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

export function sanitizeOrderInput(req: Request, res: Response, next: NextFunction) {
  const b = req.body || {};

  const itemsRaw: any[] = Array.isArray(b.items) ? b.items : [];
  const items = itemsRaw.map((it: OrderItemInput) => {
    const extrasRaw: any[] = Array.isArray((it as any).extras) ? (it as any).extras : [];
    return {
      product_id: it.product_id != null ? Number(it.product_id) : (it.productId != null ? Number(it.productId) : undefined),
      variant_id: it.variant_id != null ? Number(it.variant_id) : (it.variantId != null ? Number(it.variantId) : undefined),
      quantity: it.quantity != null ? Number(it.quantity) : 1,
      extras: extrasRaw.map((x) => ({
        extra_id: x.extra_id != null ? Number(x.extra_id) : (x.extraId != null ? Number(x.extraId) : undefined),
        quantity: x.quantity != null ? Number(x.quantity) : 1,
      })),
    };
  });

  const shippingRaw = b.shipping && typeof b.shipping === 'object' ? (b.shipping as ShippingInput) : {};
  const shippingMethodRaw = String(shippingRaw.method ?? '').toLowerCase();
  const shippingMethod = shippingMethodRaw === 'delivery' ? 'delivery' : 'pickup';

  const input = {
    customer_name: typeof b.customer_name === 'string' ? b.customer_name.trim() : (typeof b.customerName === 'string' ? b.customerName.trim() : undefined),
    customer_email: typeof b.customer_email === 'string' ? b.customer_email.trim() : (typeof b.customerEmail === 'string' ? b.customerEmail.trim() : undefined),
    customer_phone: typeof b.customer_phone === 'string' ? b.customer_phone.trim() : (typeof b.customerPhone === 'string' ? b.customerPhone.trim() : undefined),
    notes: typeof b.notes === 'string' ? b.notes : undefined,
    shipping: {
      method: shippingMethod,
      postal_code: readString(shippingRaw.postal_code ?? shippingRaw.postalCode),
      address_line1: readString(shippingRaw.address_line1 ?? shippingRaw.addressLine1),
      address_line2: readString(shippingRaw.address_line2 ?? shippingRaw.addressLine2),
      city: readString(shippingRaw.city),
      province: readString(shippingRaw.province),
    },
    items,
  } as any;

  (req as any).body.sanitizedInput = input;
  next();
}

type AdminOrderExtraInput = {
  id?: number;
  extra_id?: number | null;
  extraId?: number | null;
  quantity?: number;
};

type AdminOrderItemInput = {
  id?: number;
  product_id?: number;
  productId?: number;
  variant_id?: number | null;
  variantId?: number | null;
  quantity?: number;
  extras?: AdminOrderExtraInput[];
};

function readOptionalId(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function readNullableId(primary: unknown, fallback: unknown): number | null | undefined {
  if (primary === null || (primary === undefined && fallback === null)) return null;
  const raw = primary !== undefined ? primary : fallback;
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function sanitizeAdminOrderUpdateInput(req: Request, _res: Response, next: NextFunction) {
  const b = req.body || {};

  const itemsRaw: any[] = Array.isArray(b.items) ? b.items : [];
  const items = itemsRaw.map((it: AdminOrderItemInput) => {
    const extrasRaw: any[] = Array.isArray((it as any).extras) ? (it as any).extras : [];
    return {
      id: readOptionalId(it.id),
      product_id: readOptionalId(it.product_id ?? it.productId),
      variant_id: readNullableId(it.variant_id, it.variantId),
      quantity: it.quantity != null ? Number(it.quantity) : 1,
      extras: extrasRaw.map((x: AdminOrderExtraInput) => ({
        id: readOptionalId(x.id),
        extra_id: readNullableId(x.extra_id, x.extraId),
        quantity: x.quantity != null ? Number(x.quantity) : 1,
      })),
    };
  });

  const shippingRaw = b.shipping && typeof b.shipping === 'object' ? (b.shipping as ShippingInput) : {};
  const shippingMethodRaw = String(shippingRaw.method ?? '').toLowerCase();
  const shippingMethod = shippingMethodRaw === 'delivery' ? 'delivery' : 'pickup';

  const customerNameRaw = b.customer_name !== undefined ? b.customer_name : b.customerName;
  const customerEmailRaw = b.customer_email !== undefined ? b.customer_email : b.customerEmail;
  const customerPhoneRaw = b.customer_phone !== undefined ? b.customer_phone : b.customerPhone;

  const input = {
    customer_name: typeof customerNameRaw === 'string' ? customerNameRaw.trim() : undefined,
    customer_email: typeof customerEmailRaw === 'string' ? customerEmailRaw.trim() : undefined,
    customer_phone: typeof customerPhoneRaw === 'string' ? customerPhoneRaw.trim() : undefined,
    notes: typeof b.notes === 'string' ? b.notes.trim() : undefined,
    shipping: {
      method: shippingMethod,
      postal_code: readString(shippingRaw.postal_code ?? shippingRaw.postalCode),
      address_line1: readString(shippingRaw.address_line1 ?? shippingRaw.addressLine1),
      address_line2: readString(shippingRaw.address_line2 ?? shippingRaw.addressLine2),
      city: readString(shippingRaw.city),
      province: readString(shippingRaw.province),
    },
    items,
  } as any;

  (req as any).body.sanitizedInput = input;
  next();
}
