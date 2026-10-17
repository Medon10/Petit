import { orm } from '../shared/bdd/orm.js';
import { Variant } from '../variant/variant.entity.js';
import { VariantCost } from './variant-cost.entity.js';
import { VariantComponent } from '../supply/variant-component.entity.js';

function inputError(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 400;
  return err;
}

export type VariantCostInput = {
  cost_piece?: unknown;
  cost_engraving?: unknown;
  cost_chain?: unknown;
  cost_labor?: unknown;
  cost_packaging?: unknown;
  cost_other?: unknown;
  price_web?: unknown;
  notes?: unknown;
};

export type BatchCostUpdateInput = {
  field?: unknown;
  value?: unknown;
  category_id?: unknown;
};

// Costos por defecto según categoría de producto si no fue configurado aún
function getDefaultCostsForCategory(categoryName: string = ''): {
  costEngraving: number;
  costChain: number;
  costLabor: number;
  costPackaging: number;
} {
  const cat = categoryName.toLowerCase();
  if (cat.includes('llavero')) {
    return { costEngraving: 2500, costChain: 800, costLabor: 3500, costPackaging: 500 };
  }
  if (cat.includes('mascota')) {
    return { costEngraving: 2500, costChain: 200, costLabor: 3500, costPackaging: 500 };
  }
  if (cat.includes('pulsera')) {
    return { costEngraving: 2500, costChain: 800, costLabor: 3500, costPackaging: 1000 };
  }
  // Collares / Medallas / Compartir / Fotograbado
  return { costEngraving: 2500, costChain: 600, costLabor: 3500, costPackaging: 1000 };
}

export async function listPricing(params: { category_id?: unknown; q?: unknown } = {}) {
  const em = orm.em.fork();

  const where: any = {};
  const and: any[] = [];

  const categoryId = Number(params.category_id);
  if (Number.isFinite(categoryId) && categoryId > 0) {
    and.push({ product: { category: categoryId } });
  }

  const q = String(params.q ?? '').trim();
  if (q) {
    and.push({
      $or: [
        { name: { $ilike: `%${q}%` } },
        { product: { name: { $ilike: `%${q}%` } } },
      ],
    });
  }

  if (and.length) where.$and = and;

  const variants = await em.find(
    Variant as any,
    where,
    {
      populate: ['product', 'product.category'] as any,
      orderBy: [{ product: { category: { id: 'ASC' } } }, { product: { id: 'ASC' } }, { id: 'ASC' }] as any,
    } as any
  );

  // Traer costos y componentes de variantes en paralelo
  const variantIds = variants.map((v: any) => v.id);
  const [costsList, componentsList] = await Promise.all([
    em.find(VariantCost as any, { variant: { $in: variantIds } }),
    em.find(VariantComponent as any, { variant: { $in: variantIds } }, { populate: ['supply'] as any }),
  ]);

  const costsMap = new Map<number, any>();
  for (const c of costsList as any[]) {
    costsMap.set(c.variant.id, c);
  }

  const componentsMap = new Map<number, any>();
  for (const comp of componentsList as any[]) {
    componentsMap.set(comp.variant.id, comp);
  }

  let totalMarginSum = 0;
  let totalProfitSum = 0;
  let healthyCount = 0;
  let warningCount = 0;
  let criticalCount = 0;

  const data = variants.map((v: any) => {
    const costRecord = costsMap.get(v.id);
    const component = componentsMap.get(v.id);
    const catName = v.product?.category?.name || '';
    const defaults = getDefaultCostsForCategory(catName);

    const costPiece = costRecord ? Number(costRecord.costPiece) : 0;
    const costEngraving = costRecord ? Number(costRecord.costEngraving) : defaults.costEngraving;
    const costChain = costRecord ? Number(costRecord.costChain) : defaults.costChain;
    const costLabor = costRecord ? Number(costRecord.costLabor) : defaults.costLabor;
    const costPackaging = costRecord ? Number(costRecord.costPackaging) : defaults.costPackaging;
    const costOther = costRecord ? Number(costRecord.costOther) : 0;

    const totalCost = Math.round((costPiece + costEngraving + costChain + costLabor + costPackaging + costOther) * 100) / 100;
    const priceWeb = Number(v.price) || 0;

    const suggested15 = Math.round(totalCost * 1.5);
    const suggested20 = Math.round(totalCost * 2.0);

    const profit = Math.round((priceWeb - totalCost) * 100) / 100;
    const marginPercent = priceWeb > 0 ? Math.round((profit / priceWeb) * 1000) / 10 : 0;
    const markupPercent = totalCost > 0 ? Math.round(((priceWeb - totalCost) / totalCost) * 1000) / 10 : 0;

    const status: 'healthy' | 'warning' | 'critical' =
      marginPercent >= 50 ? 'healthy' : marginPercent >= 40 ? 'warning' : 'critical';

    if (status === 'healthy') healthyCount++;
    else if (status === 'warning') warningCount++;
    else criticalCount++;

    totalMarginSum += marginPercent;
    totalProfitSum += profit;

    return {
      variantId: v.id,
      variantName: v.name,
      productId: v.product?.id,
      productName: v.product?.name,
      categoryId: v.product?.category?.id,
      categoryName: catName,
      imageUrl: v.imageUrl || v.product?.imageUrl || null,
      isActive: v.isActive !== false,
      priceWeb,
      linkedSupply: component && component.supply ? {
        id: component.supply.id,
        code: component.supply.code,
        name: component.supply.name,
      } : null,
      costs: {
        costPiece,
        costEngraving,
        costChain,
        costLabor,
        costPackaging,
        costOther,
        totalCost,
      },
      metrics: {
        suggested15,
        suggested20,
        profit,
        marginPercent,
        markupPercent,
        status,
      },
      notes: costRecord?.notes || null,
    };
  });

  const count = data.length;
  const averageMargin = count > 0 ? Math.round((totalMarginSum / count) * 10) / 10 : 0;
  const averageProfit = count > 0 ? Math.round(totalProfitSum / count) : 0;

  return {
    summary: {
      totalVariants: count,
      averageMargin,
      averageProfit,
      healthyCount,
      warningCount,
      criticalCount,
    },
    data,
  };
}

export async function updateVariantPricing(variantId: number, input: VariantCostInput) {
  const em = orm.em.fork();
  const variant = (await em.findOne(Variant as any, { id: variantId }, { populate: ['product', 'product.category'] as any })) as any;
  if (!variant) throw inputError('Variante no encontrada');

  // Si se envió un nuevo precio de venta web, actualizar la variante directamente
  if (input.price_web !== undefined && input.price_web !== null && String(input.price_web).trim() !== '') {
    const pw = Number(input.price_web);
    if (!Number.isFinite(pw) || pw < 0) throw inputError('El precio web debe ser un número válido >= 0');
    variant.price = String(pw);
  }

  let costRecord = (await em.findOne(VariantCost as any, { variant: variantId })) as any;
  if (!costRecord) {
    const defaults = getDefaultCostsForCategory(variant.product?.category?.name || '');
    costRecord = em.create(VariantCost as any, {
      variant,
      costPiece: '0',
      costEngraving: String(defaults.costEngraving),
      costChain: String(defaults.costChain),
      costLabor: String(defaults.costLabor),
      costPackaging: String(defaults.costPackaging),
      costOther: '0',
    });
  }

  if (input.cost_piece !== undefined) {
    const v = Number(input.cost_piece);
    if (!Number.isFinite(v) || v < 0) throw inputError('Costo de pieza inválido');
    costRecord.costPiece = String(v);
  }
  if (input.cost_engraving !== undefined) {
    const v = Number(input.cost_engraving);
    if (!Number.isFinite(v) || v < 0) throw inputError('Costo de grabado inválido');
    costRecord.costEngraving = String(v);
  }
  if (input.cost_chain !== undefined) {
    const v = Number(input.cost_chain);
    if (!Number.isFinite(v) || v < 0) throw inputError('Costo de cadena/accesorio inválido');
    costRecord.costChain = String(v);
  }
  if (input.cost_labor !== undefined) {
    const v = Number(input.cost_labor);
    if (!Number.isFinite(v) || v < 0) throw inputError('Costo de mano de obra inválido');
    costRecord.costLabor = String(v);
  }
  if (input.cost_packaging !== undefined) {
    const v = Number(input.cost_packaging);
    if (!Number.isFinite(v) || v < 0) throw inputError('Costo de packaging inválido');
    costRecord.costPackaging = String(v);
  }
  if (input.cost_other !== undefined) {
    const v = Number(input.cost_other);
    if (!Number.isFinite(v) || v < 0) throw inputError('Costo varios inválido');
    costRecord.costOther = String(v);
  }
  if (input.notes !== undefined) {
    costRecord.notes = String(input.notes ?? '').trim() || null;
  }

  costRecord.updatedAt = new Date();
  await em.flush();

  const refreshed = await listPricing({ q: variant.name });
  const item = refreshed.data.find((d) => d.variantId === variantId);
  return item || null;
}

export async function batchUpdateCosts(input: BatchCostUpdateInput) {
  const field = String(input.field ?? '').trim();
  const allowedFields = ['cost_engraving', 'cost_chain', 'cost_labor', 'cost_packaging'];
  if (!allowedFields.includes(field)) {
    throw inputError(`Campo de costo inválido. Campos permitidos: ${allowedFields.join(', ')}`);
  }

  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) {
    throw inputError('El valor de costo debe ser un número >= 0');
  }

  const em = orm.em.fork();
  const where: any = {};
  const categoryId = Number(input.category_id);
  if (Number.isFinite(categoryId) && categoryId > 0) {
    where.product = { category: categoryId };
  }

  const variants = await em.find(Variant as any, where, { populate: ['product', 'product.category'] as any });
  if (variants.length === 0) return { updatedCount: 0 };

  const variantIds = variants.map((v: any) => v.id);
  const costsList = (await em.find(VariantCost as any, { variant: { $in: variantIds } })) as any[];
  const costsMap = new Map<number, any>();
  for (const c of costsList) {
    costsMap.set(c.variant.id, c);
  }

  let updatedCount = 0;
  for (const v of variants as any[]) {
    let costRecord = costsMap.get(v.id);
    if (!costRecord) {
      const defaults = getDefaultCostsForCategory(v.product?.category?.name || '');
      costRecord = em.create(VariantCost as any, {
        variant: v,
        costPiece: '0',
        costEngraving: String(defaults.costEngraving),
        costChain: String(defaults.costChain),
        costLabor: String(defaults.costLabor),
        costPackaging: String(defaults.costPackaging),
        costOther: '0',
      });
      costsMap.set(v.id, costRecord);
    }

    if (field === 'cost_engraving') costRecord.costEngraving = String(value);
    else if (field === 'cost_chain') costRecord.costChain = String(value);
    else if (field === 'cost_labor') costRecord.costLabor = String(value);
    else if (field === 'cost_packaging') costRecord.costPackaging = String(value);

    costRecord.updatedAt = new Date();
    updatedCount++;
  }

  await em.flush();
  return { updatedCount, message: `Se actualizaron ${updatedCount} variantes correctamente` };
}
