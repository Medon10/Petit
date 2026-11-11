import { orm } from '../shared/bdd/orm.js';
import { Supply } from './supply.entity.js';
import { VariantComponent } from './variant-component.entity.js';
import { StockMovement, StockMovementType } from './stock-movement.entity.js';
import { Variant } from '../variant/variant.entity.js';
import { Product } from '../product/product.entity.js';
import { sendLowStockNotification } from '../shared/mail/low-stock.mail.js';

function inputError(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 400;
  return err;
}

export type SupplyInput = {
  code?: unknown;
  name?: unknown;
  stock?: unknown;
  low_stock_threshold?: unknown;
  lowStockThreshold?: unknown;
  is_active?: unknown;
  isActive?: unknown;
};

export type StockAdjustInput = {
  new_stock?: unknown;
  newStock?: unknown;
  delta?: unknown;
  note?: unknown;
};

export async function listSupplies(params: { q?: unknown; low_stock_only?: unknown; lowStockOnly?: unknown; page?: unknown; limit?: unknown }) {
  const em = orm.em.fork();
  const qb = em.createQueryBuilder(Supply as any, 's');

  const q = String(params.q ?? '').trim();
  if (q) {
    qb.andWhere('(s.code ILIKE ? OR s.name ILIKE ?)', [`%${q}%`, `%${q}%`]);
  }

  const lowStock = String(params.low_stock_only ?? params.lowStockOnly ?? '').toLowerCase();
  if (lowStock === 'true' || lowStock === '1') {
    qb.andWhere('s.stock <= s.low_stock_threshold');
  }

  const limitNum = Number(params.limit);
  const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 500) : 100;
  const pageNum = Number(params.page);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;

  qb.orderBy({ 's.code': 'ASC' });
  qb.limit(limit).offset((page - 1) * limit);

  const [rows, total] = await qb.getResultAndCount();
  if (rows.length > 0) {
    await em.populate(rows, ['variantComponents', 'variantComponents.variant', 'variantComponents.variant.product'] as any);
  }

  const data = rows.map((s: any) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    stock: s.stock,
    lowStockThreshold: s.lowStockThreshold,
    isLowStock: s.stock <= s.lowStockThreshold,
    isActive: s.isActive,
    linkedVariantsCount: s.variantComponents?.length || 0,
    linkedVariants: (s.variantComponents?.getItems?.() || []).map((vc: any) => ({
      variantId: vc.variant?.id,
      variantName: vc.variant?.name,
      productName: vc.variant?.product?.name,
      quantity: vc.quantity,
    })),
  }));

  return {
    data,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getSupply(id: number) {
  const em = orm.em.fork();
  const s = await em.findOne(
    Supply as any,
    { id },
    { populate: ['variantComponents', 'variantComponents.variant', 'variantComponents.variant.product'] as any } as any
  );
  if (!s) return null;
  const item = s as any;
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    stock: item.stock,
    lowStockThreshold: item.lowStockThreshold,
    isLowStock: item.stock <= item.lowStockThreshold,
    isActive: item.isActive,
    linkedVariants: (item.variantComponents?.getItems?.() || []).map((vc: any) => ({
      variantId: vc.variant?.id,
      variantName: vc.variant?.name,
      productName: vc.variant?.product?.name,
      quantity: vc.quantity,
    })),
  };
}

export async function createSupply(input: SupplyInput) {
  const code = String(input.code ?? '').trim().toUpperCase();
  if (!code) throw inputError('El código de la pieza es requerido (ej. A1, BD1)');

  const name = String(input.name ?? '').trim();
  if (!name) throw inputError('El nombre de la pieza es requerido (ej. Círculo 30mm)');

  const stock = input.stock !== undefined && input.stock !== null && String(input.stock).trim() !== ''
    ? Number(input.stock)
    : 0;
  if (!Number.isInteger(stock)) throw inputError('El stock inicial debe ser un número entero');

  const lowStockThreshold = input.low_stock_threshold ?? input.lowStockThreshold ?? 5;
  const thresholdNum = Number(lowStockThreshold);
  if (!Number.isInteger(thresholdNum) || thresholdNum < 0) {
    throw inputError('El umbral de stock bajo debe ser un número entero >= 0');
  }

  const em = orm.em.fork();
  const existing = await em.findOne(Supply as any, { code });
  if (existing) throw inputError(`Ya existe una pieza con el código '${code}'`);

  const s = em.create(Supply as any, {
    code,
    name,
    stock,
    lowStockThreshold: thresholdNum,
    isActive: input.is_active ?? input.isActive ?? true,
  }) as any;

  if (stock !== 0) {
    em.create(StockMovement as any, {
      supply: s,
      delta: stock,
      type: StockMovementType.INITIAL,
      note: 'Stock inicial al crear pieza',
    });
  }

  await em.flush();
  return await getSupply(s.id);
}

export async function updateSupply(id: number, input: SupplyInput) {
  const em = orm.em.fork();
  const s = (await em.findOne(Supply as any, { id })) as any;
  if (!s) return null;

  if (input.code !== undefined) {
    const code = String(input.code ?? '').trim().toUpperCase();
    if (!code) throw inputError('El código no puede quedar vacío');
    if (code !== s.code) {
      const existing = await em.findOne(Supply as any, { code, id: { $ne: id } });
      if (existing) throw inputError(`Ya existe otra pieza con el código '${code}'`);
      s.code = code;
    }
  }

  if (input.name !== undefined) {
    const name = String(input.name ?? '').trim();
    if (!name) throw inputError('El nombre no puede quedar vacío');
    s.name = name;
  }

  if (input.low_stock_threshold !== undefined || input.lowStockThreshold !== undefined) {
    const t = Number(input.low_stock_threshold ?? input.lowStockThreshold);
    if (!Number.isInteger(t) || t < 0) throw inputError('El umbral debe ser un entero >= 0');
    s.lowStockThreshold = t;
  }

  if (input.is_active !== undefined || input.isActive !== undefined) {
    s.isActive = Boolean(input.is_active ?? input.isActive);
  }

  await em.flush();
  return await getSupply(id);
}

export async function deleteSupply(id: number) {
  const em = orm.em.fork();
  const s = (await em.findOne(Supply as any, { id })) as any;
  if (!s) return null;

  await em.nativeDelete(VariantComponent as any, { supply: id });
  await em.nativeDelete(StockMovement as any, { supply: id });
  await em.removeAndFlush(s);
  return { id: s.id, code: s.code, name: s.name };
}

export async function adjustSupplyStock(id: number, input: StockAdjustInput) {
  const em = orm.em.fork();
  const s = (await em.findOne(Supply as any, { id })) as any;
  if (!s) return null;

  let delta: number;
  const currentStock = Number(s.stock);

  if (input.new_stock !== undefined || input.newStock !== undefined) {
    const newStock = Number(input.new_stock ?? input.newStock);
    if (!Number.isInteger(newStock)) throw inputError('new_stock debe ser un número entero');
    delta = newStock - currentStock;
  } else if (input.delta !== undefined) {
    delta = Number(input.delta);
    if (!Number.isInteger(delta)) throw inputError('delta debe ser un número entero (+/-)');
  } else {
    throw inputError('Debe especificar new_stock o delta');
  }

  if (delta === 0) {
    return await getSupply(id);
  }

  const note = String(input.note ?? '').trim() || 'Ajuste manual de inventario';

  s.stock = currentStock + delta;

  em.create(StockMovement as any, {
    supply: s,
    delta,
    type: StockMovementType.ADJUSTMENT,
    note,
  });

  await em.flush();

  if (s.stock <= s.lowStockThreshold && currentStock > s.lowStockThreshold) {
    sendLowStockNotification({
      pieces: [
        {
          code: s.code,
          name: s.name,
          currentStock: s.stock,
          threshold: s.lowStockThreshold,
        },
      ],
    }).catch((err) => console.error('[mail] Error enviando alerta stock bajo:', err));
  }

  return await getSupply(id);
}

export async function getSupplyMovements(supplyId: number, params: { page?: unknown; limit?: unknown }) {
  const em = orm.em.fork();
  const limitNum = Number(params.limit);
  const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 100) : 50;
  const pageNum = Number(params.page);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;

  const [rows, total] = await em.findAndCount(
    StockMovement as any,
    { supply: supplyId },
    {
      populate: ['order'] as any,
      orderBy: { createdAt: 'DESC', id: 'DESC' } as any,
      limit,
      offset: (page - 1) * limit,
    } as any
  );

  const data = rows.map((m: any) => ({
    id: m.id,
    delta: m.delta,
    type: m.type,
    note: m.note ?? null,
    orderId: m.order?.id ?? null,
    customerName: m.order?.customerName ?? null,
    createdAt: m.createdAt,
  }));

  return {
    data,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ── Vinculación Variante <-> Pieza ──────────────────────────

export async function getVariantComponent(variantId: number) {
  const em = orm.em.fork();
  const vc = (await em.findOne(
    VariantComponent as any,
    { variant: variantId },
    { populate: ['supply', 'variant', 'variant.product'] as any } as any
  )) as any;
  if (!vc) return null;
  return {
    id: vc.id,
    variantId: vc.variant.id,
    variantName: vc.variant.name,
    productName: vc.variant.product?.name,
    supplyId: vc.supply.id,
    supplyCode: vc.supply.code,
    supplyName: vc.supply.name,
    quantity: vc.quantity,
  };
}

export async function setVariantComponent(variantId: number, supplyId: number | null, quantity: number = 1) {
  const em = orm.em.fork();
  const variant = await em.findOne(Variant as any, { id: variantId });
  if (!variant) throw inputError('Variante no encontrada');

  const existing = await em.findOne(VariantComponent as any, { variant: variantId });

  if (!supplyId) {
    if (existing) {
      await em.removeAndFlush(existing);
    }
    return null;
  }

  const supply = await em.findOne(Supply as any, { id: supplyId });
  if (!supply) throw inputError('Pieza de inventario no encontrada');

  const qty = Number(quantity);
  const safeQty = Number.isInteger(qty) && qty > 0 ? qty : 1;

  if (existing) {
    (existing as any).supply = supply;
    (existing as any).quantity = safeQty;
    await em.flush();
    return await getVariantComponent(variantId);
  }

  const created = em.create(VariantComponent as any, {
    variant,
    supply,
    quantity: safeQty,
  });
  await em.flush();
  return await getVariantComponent(variantId);
}

export async function listAllVariantComponents() {
  const em = orm.em.fork();
  const rows = await em.find(
    VariantComponent as any,
    {},
    { populate: ['supply', 'variant'] as any } as any
  );
  return rows.map((vc: any) => ({
    variantId: vc.variant?.id,
    supplyId: vc.supply?.id,
    supplyCode: vc.supply?.code,
    supplyName: vc.supply?.name,
    quantity: vc.quantity,
  }));
}
