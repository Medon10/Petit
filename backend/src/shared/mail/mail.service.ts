import nodemailer from 'nodemailer';

// ── Configuration ──────────────────────────────────────────────────────
const MAIL_ENABLED = (process.env.MAIL_ENABLED ?? 'false').toLowerCase() === 'true';
const MAIL_TO = process.env.MAIL_TO || '';
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || '';

// ── Transporter (lazy singleton) ───────────────────────────────────────
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  return _transporter;
}

// ── Public API ─────────────────────────────────────────────────────────

export interface SendMailOptions {
  /** Override default recipient (MAIL_TO) */
  to?: string;
  subject: string;
  html: string;
}

/**
 * Send an email using the configured SMTP transport.
 * Silently skips when MAIL_ENABLED is false or credentials are missing.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
  if (!MAIL_ENABLED) {
    console.log('[mail] MAIL_ENABLED=false — email skipped.');
    return;
  }

  const to = options.to || MAIL_TO;
  if (!to) {
    console.warn('[mail] No recipient configured (MAIL_TO). Email skipped.');
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mail] SMTP credentials missing. Email skipped.');
    return;
  }

  try {
    const info = await getTransporter().sendMail({
      from: MAIL_FROM,
      to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[mail] Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('[mail] Failed to send email:', error);
  }
}

export { MAIL_ENABLED, MAIL_TO, MAIL_FROM };
