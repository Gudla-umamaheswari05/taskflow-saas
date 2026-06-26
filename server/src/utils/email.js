import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendEmail({ to, subject, html }) {
  // In dev, if SMTP isn't configured, just log the email instead of failing.
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV EMAIL] to=${to} subject="${subject}"\n${html}`);
    return;
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}

export function verifyEmailTemplate(name, link) {
  return `<p>Hi ${name},</p><p>Confirm your email for TaskFlow:</p><p><a href="${link}">${link}</a></p>`;
}

export function resetPasswordTemplate(name, link) {
  return `<p>Hi ${name},</p><p>Reset your TaskFlow password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`;
}
