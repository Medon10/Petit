import { sendMail } from './mail.service.js';

export interface LowStockAlertItem {
  code: string;
  name: string;
  currentStock: number;
  threshold: number;
}

export async function sendLowStockNotification(params: {
  orderId?: number;
  customerName?: string;
  pieces: LowStockAlertItem[];
}): Promise<void> {
  const { orderId, customerName, pieces } = params;
  if (!pieces.length) return;

  const subject =
    pieces.length === 1
      ? `⚠️ Alerta de Stock Bajo: ${pieces[0].code} - ${pieces[0].name} (${pieces[0].currentStock} u. restantes)`
      : `⚠️ Alerta de Stock Bajo: ${pieces.length} piezas llegaron al punto de pedido`;

  const rows = pieces
    .map(
      (p) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f1f1;font-weight:700;color:#111;">
        <span style="display:inline-block;padding:2px 8px;background:#f3f4f6;border-radius:4px;font-family:monospace;margin-right:6px;">${p.code}</span>
        ${p.name}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f1f1;text-align:center;font-weight:800;color:${
        p.currentStock <= 0 ? '#dc2626' : '#d97706'
      };">
        ${p.currentStock} u.
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f1f1;text-align:center;color:#6b7280;">
        ≤ ${p.threshold} u.
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;margin:0;padding:20px;background:#fdf9f7;color:#333;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #f3e8ee;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
    <div style="background:#111827;padding:20px 24px;color:#fff;">
      <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.01em;">Petit Admin Studio</h2>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Control de Inventario — Alerta de Reposición</p>
    </div>
    <div style="padding:24px;">
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <strong style="color:#92400e;font-size:14px;display:block;">⚠️ Atención: Stock en punto de pedido</strong>
        <span style="color:#78350f;font-size:13px;">
          ${
            orderId
              ? `El pedido <strong>#${orderId}</strong> (${customerName || 'Cliente'}) consumió unidades y las siguientes piezas alcanzaron o superaron el umbral mínimo:`
              : 'Las siguientes piezas alcanzaron o superaron el umbral mínimo de reposición:'
          }
        </span>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9fafb;text-align:left;">
            <th style="padding:10px 14px;border-bottom:2px solid #e5e7eb;color:#4b5563;">Pieza</th>
            <th style="padding:10px 14px;border-bottom:2px solid #e5e7eb;text-align:center;color:#4b5563;">Stock Restante</th>
            <th style="padding:10px 14px;border-bottom:2px solid #e5e7eb;text-align:center;color:#4b5563;">Punto Pedido</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <p style="font-size:13px;color:#6b7280;line-height:1.5;margin-bottom:24px;">
        Recordá realizar la orden de compra al proveedor correspondiente o ajustar el stock físico desde el panel de administración.
      </p>

      <div style="text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'https://petitaccesorios.com'}/admin/inventario" style="display:inline-block;padding:12px 24px;background:#db2777;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">
          Ver Panel de Inventario
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;">
      Notificación automática de Petit ✨
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendMail({ subject, html });
  } catch (err: any) {
    console.error('[mail] Error enviando alerta de stock bajo:', err?.message || err);
  }
}
