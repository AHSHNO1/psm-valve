/**
 * PSM VALVE — فایل راهانداز برای هاست اشتراکی cPanel / CloudLinux (Passenger)
 *
 * این فایل باید در «Application root» برنامهٔ Node در cPanel قرار بگیرد و
 * در پنل cPanel (Setup Node.js App) بهعنوان Startup file ثبت شود.
 *
 * نکتهٔ Passenger: پورت را خود Passenger از متغیر PORT میدهد؛ نباید پورت
 * ثابتی انتخاب شود. اپلیکیشن باید روی همان PORT گوش بدهد.
 *
 * راهنمای کامل: deploy/cpanel/README.md
 */
const { createServer } = require("http");
const next = require("next");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`[psm-valve] سرویس روی پورت ${port} آماده است`);
    });
  })
  .catch((error) => {
    console.error("[psm-valve] راهاندازی اپلیکیشن ناموفق بود:", error);
    process.exit(1);
  });