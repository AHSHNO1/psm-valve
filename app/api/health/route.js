import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getDataDir } from "@/lib/db";
import { isMailConfigured } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// آستانهٔ هشدار دیسک: کمتر از این مقدار، نوشتن فایل‌های دادهٔ JSON ریسکی می‌شود.
const DISK_MIN_FREE_BYTES = 200 * 1024 * 1024;

let appVersion = "";
try {
  appVersion = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")).version || "";
} catch {
  // نسخهٔ اختیاری است؛ نبود آن سلامت را تغییر نمی‌دهد.
}

/**
 * endpoint سلامت برای مانیتورینگ بیرونی (uptime monitor / aaPanel).
 * بدون احراز هویت و بدون افشای مسیرهای سرور؛ فقط وضعیت سطح بالا.
 * ?deep=1 → آزمایش نوشتن روی دایرکتوری داده هم انجام می‌شود (پیش‌فرض فقط خواندنی).
 */
export async function GET(request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";
  const checks = {};
  let degraded = false;

  // ۱) دایرکتوری داده
  try {
    const dataDir = getDataDir();
    const stat = await fsp.stat(dataDir);
    checks.dataDir = { status: stat.isDirectory() ? "ok" : "error" };
    if (!stat.isDirectory()) degraded = true;
  } catch (error) {
    checks.dataDir = { status: "error", error: error?.code || "stat-failed" };
    degraded = true;
  }

  // ۲) فایل تنظیمات — خراب بودن JSON وضعیت اضطراری واقعی است
  try {
    const settingsPath = path.join(getDataDir(), "settings.json");
    const raw = await fsp.readFile(settingsPath, "utf8");
    JSON.parse(raw);
    checks.settings = { status: "ok" };
  } catch (error) {
    if (error?.code === "ENOENT") {
      // نصب تازه: تنظیمات هنوز ساخته نشده — هشدار، نه خطا
      checks.settings = { status: "warn", note: "settings.json یافت نشد" };
    } else {
      checks.settings = { status: "error", error: error?.code || "unparseable" };
      degraded = true;
    }
  }

  // ۳) فضای دیسک (اگر هستهٔ سیستم پشتیبانی کند)
  try {
    const sf = await fsp.statfs(getDataDir());
    const freeBytes = sf.bavail * sf.bsize;
    const totalBytes = sf.blocks * sf.bsize;
    checks.disk = { status: freeBytes >= DISK_MIN_FREE_BYTES ? "ok" : "error", freeBytes, totalBytes };
    if (freeBytes < DISK_MIN_FREE_BYTES) degraded = true;
  } catch {
    checks.disk = { status: "unknown" };
  }

  // ۴) آزمایش نوشتن (فقط در حالت deep)
  if (deep) {
    const probe = path.join(getDataDir(), `.health-probe.${process.pid}.tmp`);
    try {
      fs.writeFileSync(probe, String(Date.now()), { encoding: "utf8" });
      checks.dataWritable = { status: "ok" };
    } catch (error) {
      checks.dataWritable = { status: "error", error: error?.code || "write-failed" };
      degraded = true;
    } finally {
      try {
        fs.rmSync(probe, { force: true });
      } catch {}
    }
  }

  // ۵) وضعیت mailer — صرفاً اطلاعاتی؛ SMTP در health چک نمی‌شود (کندی/اثر جانبی ندارد)
  checks.mailer = { configured: isMailConfigured() };

  return NextResponse.json(
    {
      status: degraded ? "degraded" : "ok",
      checks,
      uptimeSeconds: Math.round(process.uptime()),
      version: appVersion || undefined,
      timestamp: new Date().toISOString()
    },
    { status: degraded ? 503 : 200 }
  );
}
