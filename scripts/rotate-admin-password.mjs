#!/usr/bin/env node
/**
 * چرخش رمز مدیر پنل.
 *
 *   node scripts/rotate-admin-password.mjs
 *
 * رمز به‌صورت bcrypt (cost 12) در data/admin.json ذخیره می‌شود؛ فایل قبلی
 * با پسوند .backup-<timestamp> کنار گذاشته می‌شود. رمز در تاریخچهٔ پوسته
 * ذخیره نمی‌شود و هنگام تایپ نمایش داده نمی‌شود.
 *
 * نکته: توکن‌های ۷ روزهٔ صادرشده با تغییر رمز باطل نمی‌شوند. برای باطل کردن
 * فوری همهٔ نشست‌ها، JWT_SECRET را هم عوض کنید.
 */
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const MIN_LENGTH = 12;
const DATA_DIR = path.join(process.cwd(), "data");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");
const COST = 12;

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = function (chunk) {
      if (muted || chunk.includes(question)) return;
      process.stdout.write(chunk);
    };
    process.stdout.write(question);
    muted = true;
    rl.question("", (answer) => {
      muted = false;
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function fail(message) {
  console.error("✖ " + message);
  process.exit(1);
}

async function main() {
  const argPassword = process.argv[2] === "--password" ? process.argv[3] : "";
  if (process.argv[2] === "--password") {
    console.warn("⚠ رمز روی خط فرمان ممکن است در تاریخچهٔ شل بماند؛ روش تعاملی امن‌تر است.");
  }

  if (!process.stdin.isTTY && !argPassword) {
    fail("اجرای تعاملی ممکن نیست؛ از --password استفاده کنید یا در ترمینال اجرا کنید.");
  }

  const password = argPassword || (await askHidden("رمز جدید مدیر: "));
  if (!argPassword) {
    const again = await askHidden("تکرار رمز جدید: ");
    if (password !== again) fail("رمزها یکسان نیستند.");
  }

  if (password.length < MIN_LENGTH) {
    fail(`رمز باید دست‌کم ${MIN_LENGTH} کاراکتر باشد.`);
  }

  const existing = fs.existsSync(ADMIN_FILE)
    ? JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"))
    : {};

  const username = existing.username || process.env.ADMIN_USERNAME || "admin";
  const passwordHash = await bcrypt.hash(password, COST);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(ADMIN_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(ADMIN_FILE, `${ADMIN_FILE}.backup-${stamp}`);
  }

  const tmp = `${ADMIN_FILE}.tmp`;
  fs.writeFileSync(
    tmp,
    JSON.stringify({ username, passwordHash, updatedAt: new Date().toISOString() }, null, 2),
    { encoding: "utf8", mode: 0o600 }
  );
  fs.renameSync(tmp, ADMIN_FILE);

  console.log("✅ رمز مدیر به‌روزرسانی شد.");
  console.log(`   کاربر: ${username}`);
  console.log("   برای باطل کردن نشست‌های فعلی، JWT_SECRET را هم عوض کنید.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
