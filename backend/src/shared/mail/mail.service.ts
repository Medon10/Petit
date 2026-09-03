import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// ── Helpers ────────────────────────────────────────────────────────────

function getMailConfig() {
  const enabledRaw = (process.env.MAIL_ENABLED || '').trim().toLowerCase();
  const enabled = enabledRaw === 'true' || enabledRaw === '1';

  const to = (process.env.MAIL_TO || '').trim();
  const from = (process.env.MAIL_FROM || process.env.SMTP_USER || '').trim();

  // Resend API key (uses HTTPS - never blocked by cloud hosts)
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();

  // SMTP credentials (fallback for local dev)
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number((process.env.SMTP_PORT || '587').trim());
  const smtpSecure = (process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true' || smtpPort === 465;
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

  return { enabled, to, from, resendApiKey, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass };
}

// ── SMTP transporter (lazy singleton) ──────────────────────────────────

let _transporter: nodemailer.Transporter | null = null;

function getSmtpTransporter(cfg: ReturnType<typeof getMailConfig>): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return _transporter;
}

// ── Public API ─────────────────────────────────────────────────────────

export interface SendMailOptions {
  to?: string;
  subject: string;
  html: string;
}

/**
 * Send an email. Priority order:
 * 1. Resend API (HTTPS, recommended for Railway / cloud)
 * 2. SMTP (Gmail App Password, works locally)
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
  const cfg = getMailConfig();

  if (!cfg.enabled) {
    console.log('[mail] MAIL_ENABLED is not "true". Email skipped. Value was:', process.env.MAIL_ENABLED);
    return;
  }

  const recipient = (options.to || cfg.to).trim();
  if (!recipient) {
    console.warn('[mail] No recipient configured (MAIL_TO). Email skipped.');
    return;
  }

  // ── 1. Resend API (preferred — HTTPS, works everywhere) ──────────
  if (cfg.resendApiKey && cfg.resendApiKey.startsWith('re_')) {
    try {
      console.log(`[mail] Sending via Resend API to ${recipient}...`);
      const resend = new Resend(cfg.resendApiKey);

      // Resend does NOT allow sending from @gmail.com or other public domains without DNS verification.
      // Use custom domain only if configured and not a generic email provider, otherwise use Resend's test sender:
      const isCustomDomain = cfg.from && !cfg.from.includes('@gmail.com') && !cfg.from.includes('@hotmail.') && !cfg.from.includes('@yahoo.');
      const sender = isCustomDomain ? cfg.from : 'Petit Tienda <onboarding@resend.dev>';

      const { error } = await resend.emails.send({
        from: sender,
        to: [recipient],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('[mail] Resend API error:', error);
      } else {
        console.log(`[mail] Email successfully sent via Resend to ${recipient}`);
      }
      return;
    } catch (err: any) {
      console.error('[mail] Resend send failed:', err?.message || err);
      // Fall through to SMTP
    }
  }

  // ── 2. SMTP fallback (local dev / Gmail App Password) ────────────
  if (!cfg.smtpUser || !cfg.smtpPass) {
    console.warn('[mail] No email provider configured. Set RESEND_API_KEY or SMTP_USER+SMTP_PASS. Email skipped.');
    return;
  }

  try {
    console.log(`[mail] Sending via SMTP (${cfg.smtpHost}:${cfg.smtpPort}) to ${recipient}...`);
    const transporter = getSmtpTransporter(cfg);
    const info = await transporter.sendMail({
      from: cfg.from || recipient,
      to: recipient,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[mail] Email successfully sent via SMTP: ${info.messageId}`);
  } catch (error: any) {
    console.error('[mail] SMTP send failed:', error?.message || error);
    if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNREFUSED' || error?.code === 'ESOCKET') {
      console.error('[mail] TIP: Railway/cloud hosts block SMTP ports. Use RESEND_API_KEY instead.');
    }
  }
}
