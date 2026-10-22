#!/usr/bin/env node
/**
 * چرخش رمز مدیر پنل.
 *
 *   node scripts/rotate-admin-password.mjs                       (تعاملی، امن‌ترین)
 *   printf '%s' "$PASSWORD" | node scripts/rotate-admin-password.mjs --stdin
 *   node scripts/rotate-admin-password.mjs --password-file <path>
 *   node scripts/rotate-admin-password.mjs --password <pass>     (فقط سازگاری)
 *   ... [--username <name>]   نام کاربری مدیر را هم تنظیم می‌کند (پیش‌فرض: مقدار فعلی)
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

function parseArgs(argv) {
  const opts = { password: "", passwordFile: "", stdin: false, username: "" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--password") opts.password = argv[++i] || "";
    else if (arg.startsWith("--password=")) opts.password = arg.slice("--password=".length);
    else if (arg === "--password-file") opts.passwordFile = argv[++i] || "";
    else if (arg.startsWith("--password-file=")) opts.passwordFile = arg.slice("--password-file=".length);
    else if (arg === "--username") opts.username = argv[++i] || "";
    else if (arg.startsWith("--username=")) opts.username = arg.slice("--username=".length);
    else if (arg === "--stdin") opts.stdin = true;
    else fail(`گزینهٔ ناشناخته: ${arg}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.password) {
    console.warn("⚠ رمز روی خط فرمان ممکن است در تاریخچهٔ شل بماند؛ روش تعاملی یا --stdin امن‌تر است.");
  }

  let password = "";
  if (opts.passwordFile) {
    if (!fs.existsSync(opts.passwordFile)) fail(`فایل رمز پیدا نشد: ${opts.passwordFile}`);
    password = fs.readFileSync(opts.passwordFile, "utf8").replace(/\r?\n$/, "");
  } else if (opts.stdin) {
    password = fs.readFileSync(0, "utf8").replace(/\r?\n$/, "");
  } else if (opts.password) {
    password = opts.password;
  } else {
    if (!process.stdin.isTTY) {
      fail("اجرای تعاملی ممکن نیست؛ از --stdin یا --password-file استفاده کنید یا در ترمینال اجرا کنید.");
    }
    password = await askHidden("رمز جدید مدیر: ");
    const again = await askHidden("تکرار رمز جدید: ");
    if (password !== again) fail("رمزها یکسان نیستند.");
  }

  if (password.length < MIN_LENGTH) {
    fail(`رمز باید دست‌کم ${MIN_LENGTH} کاراکتر باشد.`);
  }
  if (opts.username && !/^[A-Za-z0-9._@-]{1,64}$/.test(opts.username)) {
    fail("نام کاربری باید ۱ تا ۶۴ کاراکتر و شامل حروف، رقم یا . _ @ - باشد.");
  }

  const existing = fs.existsSync(ADMIN_FILE)
    ? JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"))
    : {};

  const username = opts.username || existing.username || process.env.ADMIN_USERNAME || "admin";
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
