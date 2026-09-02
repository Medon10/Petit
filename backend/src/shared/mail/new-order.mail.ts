import { sendMail } from './mail.service.js';

/**
 * Populated order shape returned by OrderRepository.populateOrder().
 * We use a loose type here to avoid coupling with the ORM entity.
 */
interface PopulatedOrderItem {
  productName?: string;
  variantName?: string;
  quantity?: number;
  unitPrice?: string;
  extras?: Array<{
    extraName?: string;
    quantity?: number;
    unitPrice?: string;
    categoryType?: string;
  }>;
}

interface PopulatedOrder {
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  shippingMethod: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
  shippingCost?: string;
  subtotal: string;
  total: string;
  createdAt?: Date | string;
  items?: PopulatedOrderItem[] | { getItems?: () => PopulatedOrderItem[] } | any;
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatCurrency(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date?: Date | string): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function shippingLabel(method: string): string {
  return method === 'delivery' ? '🚚 Envío a domicilio' : '🏪 Retiro en local';
}

function getItemsArray(order: PopulatedOrder): PopulatedOrderItem[] {
  const raw = order.items;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw.getItems === 'function') return raw.getItems();
  if (raw && typeof raw.toArray === 'function') return raw.toArray();
  return [];
}

// ── HTML Template ──────────────────────────────────────────────────────

function buildItemRows(items: PopulatedOrderItem[]): string {
  return items
    .map((item) => {
      const qty = item.quantity ?? 1;
      const unit = formatCurrency(item.unitPrice ?? '0');
      const lineTotal = formatCurrency(Number(item.unitPrice ?? 0) * qty);

      let extrasHtml = '';
      const extras = Array.isArray(item.extras) ? item.extras : [];
      if (extras.length > 0) {
        const extrasLines = extras
          .map((e) => {
            const eQty = e.quantity ?? 1;
            return `<span style="color:#888;font-size:13px;">+ ${e.extraName || 'Extra'} x${eQty} (${formatCurrency(e.unitPrice ?? '0')})</span>`;
          })
          .join('<br/>');
        extrasHtml = `<br/>${extrasLines}`;
      }

      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
            <strong>${item.productName || 'Producto'}</strong><br/>
            <span style="color:#888;font-size:13px;">${item.variantName || ''}</span>
            ${extrasHtml}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${unit}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${lineTotal}</td>
        </tr>`;
    })
    .join('');
}

function buildShippingSection(order: PopulatedOrder): string {
  if (order.shippingMethod !== 'delivery') return '';

  const parts = [
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    order.shippingCity,
    order.shippingProvince,
    order.shippingPostalCode ? `CP ${order.shippingPostalCode}` : '',
  ].filter(Boolean);

  return `
    <tr>
      <td colspan="4" style="padding:12px;background:#f8f9fa;border-radius:6px;">
        <strong>📍 Dirección de envío:</strong><br/>
        <span style="color:#555;">${parts.join(', ')}</span>
      </td>
    </tr>`;
}

export function buildNewOrderHtml(order: PopulatedOrder): string {
  const items = getItemsArray(order);

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">🛍️ ¡Nueva orden de compra!</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Orden #${order.id} — ${formatDate(order.createdAt)}</p>
          </td>
        </tr>

        <!-- Customer Info -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:16px;">
              <tr><td>
                <p style="margin:0 0 6px;font-size:15px;"><strong>👤 Cliente:</strong> ${order.customerName}</p>
                ${order.customerEmail ? `<p style="margin:0 0 6px;font-size:14px;color:#555;">📧 ${order.customerEmail}</p>` : ''}
                ${order.customerPhone ? `<p style="margin:0 0 6px;font-size:14px;color:#555;">📱 ${order.customerPhone}</p>` : ''}
                <p style="margin:0;font-size:14px;color:#555;">${shippingLabel(order.shippingMethod)}</p>
                ${order.notes ? `<p style="margin:8px 0 0;font-size:13px;color:#888;">📝 <em>${order.notes}</em></p>` : ''}
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Items Table -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr style="background:#f8f9fa;">
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#888;font-weight:600;">Producto</th>
                <th style="padding:10px 12px;text-align:center;font-size:13px;color:#888;font-weight:600;">Cant.</th>
                <th style="padding:10px 12px;text-align:right;font-size:13px;color:#888;font-weight:600;">P. Unit.</th>
                <th style="padding:10px 12px;text-align:right;font-size:13px;color:#888;font-weight:600;">Subtotal</th>
              </tr>
              ${buildItemRows(items)}
              ${buildShippingSection(order)}
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #f0f0f0;padding-top:16px;">
              <tr>
                <td style="font-size:14px;color:#888;">Subtotal</td>
                <td style="text-align:right;font-size:14px;">${formatCurrency(order.subtotal)}</td>
              </tr>
              ${order.shippingMethod === 'delivery' ? `
              <tr>
                <td style="font-size:14px;color:#888;padding-top:6px;">Costo de envío</td>
                <td style="text-align:right;font-size:14px;padding-top:6px;">${formatCurrency(order.shippingCost ?? '0')}</td>
              </tr>` : ''}
              <tr>
                <td style="font-size:18px;font-weight:700;padding-top:12px;color:#6366f1;">Total</td>
                <td style="text-align:right;font-size:18px;font-weight:700;padding-top:12px;color:#6366f1;">${formatCurrency(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:16px 32px;text-align:center;font-size:12px;color:#aaa;">
            Notificación automática — Petit ✨
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send the notification ──────────────────────────────────────────────

export async function sendNewOrderNotification(order: PopulatedOrder): Promise<void> {
  const html = buildNewOrderHtml(order);
  await sendMail({
    subject: `🛍️ Nueva orden #${order.id} — ${order.customerName} — ${formatCurrency(order.total)}`,
    html,
  });
}
