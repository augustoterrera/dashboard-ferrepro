import nodemailer from "nodemailer";
import { INVITE_TTL_LABEL, RESET_TTL_LABEL } from "@/lib/auth-tokens";

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/** NEXTAUTH_URL puede venir con barra final: sin esto los links salen con "//" */
function baseUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function from() {
  return `"${process.env.SMTP_FROM_NAME ?? "Soporte"}" <${process.env.SMTP_FROM_EMAIL}>`;
}

/** El nombre lo escribe un superadmin y termina interpolado en el HTML del mail. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render(c: {
  heading: string;
  highlight: string;
  intro: string;
  cta: string;
  url: string;
  footer: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;text-transform:uppercase;font-style:italic;color:#fff;">
        ${c.heading} <span style="color:#a855f7;">${c.highlight}</span>
      </h2>
      <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;">${c.intro}</p>
      <a href="${c.url}"
        style="display:inline-block;padding:12px 24px;background:#9333ea;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.05em;text-transform:uppercase;">
        ${c.cta}
      </a>
      <p style="margin:24px 0 0;font-size:11px;color:#475569;">${c.footer}</p>
    </div>
  `;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  await transporter().sendMail({
    from: from(),
    to: email,
    subject: "Restablecer contraseña",
    html: render({
      heading: "Restablecer",
      highlight: "Contraseña",
      intro: `Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        El enlace es válido por <strong style="color:#fff;">${RESET_TTL_LABEL}</strong>.`,
      cta: "Restablecer contraseña",
      url: `${baseUrl()}/auth/update-password?token=${token}`,
      footer: `Si no solicitaste este cambio, podés ignorar este correo.<br/>
        El enlace expirará automáticamente.`,
    }),
  });
}

export async function sendInviteEmail(
  email: string,
  token: string,
  name: string | null,
) {
  const greeting = name ? `Hola ${escapeHtml(name)}: ` : "";

  await transporter().sendMail({
    from: from(),
    to: email,
    subject: "Creá tu cuenta",
    html: render({
      heading: "Creá tu",
      highlight: "Cuenta",
      intro: `${greeting}se creó una cuenta para vos en el panel.
        Elegí una contraseña para activarla y empezar a usarla.
        El enlace es válido por <strong style="color:#fff;">${INVITE_TTL_LABEL}</strong>.`,
      cta: "Crear mi contraseña",
      url: `${baseUrl()}/auth/set-password?token=${token}`,
      footer: `Si no esperabas este correo, podés ignorarlo.<br/>
        El enlace expirará automáticamente.`,
    }),
  });
}
