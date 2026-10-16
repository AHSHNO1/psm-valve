/**
 * PM2 — تنظیمات اجرای سایت روی سرور (Production)
 * استفاده:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js --update-env
 *   pm2 save
 *
 * ⚠️ instances باید همیشه ۱ باشد:
 *   ۱) محدودسازی نرخ ورود/فرم تماس در حافظهٔ همین پروسه انجام میشود.
 *   ۲) نوشتن دادهها (data/*.json و public/uploads) روی فایلسیستم است، نه دیتابیس.
 */
module.exports = {
  apps: [
    {
      name: "psm-valve",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
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
        PORT: "3000"
        // بقیهٔ متغیرها از فایل .env.production در ریشهٔ پروژه خوانده میشوند.
      }
    }
  ]
};