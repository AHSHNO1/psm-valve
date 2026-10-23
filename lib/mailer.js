import nodemailer from "nodemailer";

// ============================================================
// MAILER — اعلان پیام‌های فرم تماس
// پیام‌ها همیشه در پنل ادمین ذخیره می‌شوند؛ این ماژول فقط
// یک نسخهٔ ایمیلی به صندوق شرکت می‌فرستد (اختیاری).
// ============================================================

const DEFAULT_TO = "psmvalve@gmail.com";

let transporter = null;
let transporterKey = "";

function getConfig() {
  return {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    to: process.env.CONTACT_TO || DEFAULT_TO
  };
}

export function isMailConfigured() {
  const config = getConfig();
  return Boolean(config.host && config.user && config.pass && config.to);
}

function getTransporter(config) {
  const key = `${config.host}:${config.port}:${config.user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  transporterKey = key;
  return transporter;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * ارسال اعلان ایمیل برای یک پیام فرم تماس.
 * در صورت ارسال نشدن، خطا پرتاب نمی‌کند؛ فقط نتیجه برمی‌گرداند.
 */
export async function sendContactNotification(message) {
  const config = getConfig();
  if (!isMailConfigured()) {
    return { sent: false, reason: "not-configured" };
  }

  const name = message?.name || "";
  const email = message?.email || "";
  const phone = message?.phone || "—";
  const body = message?.message || "";
  const createdAt = message?.createdAt || new Date().toISOString();

  const lines = [
    "پیام جدید از فرم تماس سایت",
    "",
    `نام: ${name}`,
    `ایمیل: ${email}`,
    `تلفن: ${phone}`,
    `تاریخ: ${createdAt}`,
    "",
    "متن پیام:",
    body
  ];

  const html = `
    <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;line-height:1.9;color:#1A1D21">
      <h2 style="margin:0 0 12px">پیام جدید از فرم تماس سایت</h2>
      <table style="border-collapse:collapse;font-size:13px">
        <tr><td style="padding:4px 10px;color:#666">نام</td><td style="padding:4px 10px;font-weight:bold">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:4px 10px;color:#666">ایمیل</td><td style="padding:4px 10px">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 10px;color:#666">تلفن</td><td style="padding:4px 10px">${escapeHtml(phone)}</td></tr>
        <tr><td style="padding:4px 10px;color:#666">تاریخ</td><td style="padding:4px 10px">${escapeHtml(createdAt)}</td></tr>
      </table>
      <div style="margin-top:14px;padding:12px;border:1px solid #E5E7EB;border-radius:8px;background:#F9FAFB;white-space:pre-wrap">${escapeHtml(body)}</div>
    </div>
  `;

  try {
    await getTransporter(config).sendMail({
      from: `"PSM Valve" <${config.user}>`,
      to: config.to,
      replyTo: email || undefined,
      subject: `پیام جدید از سایت — ${name}`,
      text: lines.join("\n"),
      html
    });
    return { sent: true };
  } catch (error) {
    console.error("Contact notification email failed:", error?.message || error);
    return { sent: false, reason: "send-failed" };
  }
}

/**
 * ایمیل بازیابی دسترسی مدیر: نام کاربری + لینک یک‌بارمصرف بازنشانی رمز.
 * گیرنده از ADMIN_RECOVERY_EMAIL (یا در نبودش CONTACT_TO/SMTP_USER) خوانده میشود.
 */
export async function sendRecoveryEmail({ username, resetUrl, expiresMinutes, to }) {
  const config = getConfig();
  if (!isMailConfigured()) {
    return { sent: false, reason: "not-configured" };
  }

  const recipient = to || config.to;
  const minutes = Number(expiresMinutes || 15);
  const lines = [
    "درخواست بازیابی دسترسی پنل مدیریت PSM Valve",
    "",
    `نام کاربری شما: ${username}`,
    `لینک بازنشانی رمز (تا ${minutes} دقیقه معتبر است و فقط یک بار قابل استفاده است):`,
    resetUrl,
    "",
    "اگر این درخواست را شما نکردهاید، این ایمیل را نادیده بگیرید؛ رمز فعلی تغییر نکرده است."
  ];

  const html = `
    <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;line-height:2;color:#1A1D21">
      <h2 style="margin:0 0 12px">بازیابی دسترسی پنل مدیریت</h2>
      <p style="margin:0 0 8px">نام کاربری شما:</p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:bold;direction:ltr;text-align:left">${escapeHtml(username)}</p>
      <p style="margin:0 0 8px">برای انتخاب رمز جدید روی دکمهٔ زیر کلیک کنید. لینک تا ${minutes} دقیقه معتبر است و فقط یک بار قابل استفاده است.</p>
      <p style="margin:16px 0">
        <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#F5C518;color:#1F2124;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold">بازنشانی رمز عبور</a>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#666;direction:ltr;text-align:left;word-break:break-all">${escapeHtml(resetUrl)}</p>
      <p style="margin:14px 0 0;font-size:13px;color:#666">اگر این درخواست را شما نکردهاید، این ایمیل را نادیده بگیرید؛ رمز فعلی تغییر نکرده است.</p>
    </div>
  `;

  try {
    await getTransporter(config).sendMail({
      from: `"PSM Valve" <${config.user}>`,
      to: recipient,
      subject: "بازیابی دسترسی پنل مدیریت PSM Valve",
      text: lines.join("\n"),
      html
    });
    return { sent: true };
  } catch (error) {
    console.error("Recovery email failed:", error?.message || error);
    return { sent: false, reason: "send-failed" };
  }
}
