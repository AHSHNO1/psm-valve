/**
 * PM2 — تنظیمات اجرای سایت روی سرور (Production)
 * استفاده:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js --update-env
 *   pm2 save
 *
 * پورت: متغیر محیطی APP_PORT → فایل .app-port (ساختهٔ deploy/install.sh) → پیشفرض ۳۰۰۰
 *
 * ⚠️ instances باید همیشه ۱ باشد:
 *   ۱) محدودسازی نرخ ورود/فرم تماس در حافظهٔ همین پروسه انجام میشود.
 *   ۲) نوشتن دادهها (data/*.json و public/uploads) روی فایلسیستم است، نه دیتابیس.
 */
const fs = require("fs");
const path = require("path");

/**
 * پورت اپ از سه منبع به ترتیب اولویت: APP_PORT (محیط) → .app-port (فایل محلی) → ۳۰۰۰.
 * همین مقدار هم برای «next start -p» و هم برای متغیر PORT استفاده میشود.
 */
function resolveAppPort() {
  if (process.env.APP_PORT) return String(process.env.APP_PORT).trim();
  try {
    const file = path.join(__dirname, ".app-port");
    if (fs.existsSync(file)) {
      const value = fs.readFileSync(file, "utf8").trim();
      if (/^\d{2,5}$/.test(value)) return value;
    }
  } catch {
    // خواندن فایل ناموفق بود → پیشفرض
  }
  return "3000";
}

const APP_PORT = resolveAppPort();

module.exports = {
  apps: [
    {
      name: "psm-valve",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${APP_PORT}`,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "20s",
      kill_timeout: 8000,
      max_memory_restart: "1200M",
      time: true,
      merge_logs: true,
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      env: {
        NODE_ENV: "production",
        PORT: APP_PORT
        // بقیهٔ متغیرها از فایل .env.production در ریشهٔ پروژه خوانده میشوند.
      }
    }
  ]
};