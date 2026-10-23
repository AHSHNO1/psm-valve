import fs from "fs";
import path from "path";

const DATA_DIR = process.env.PSM_DATA_DIR
  ? path.resolve(process.env.PSM_DATA_DIR)
  : path.join(process.cwd(), "data");

const DATA_FILE_MODE = 0o600;
const DATA_DIR_MODE = 0o700;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: DATA_DIR_MODE });
  }
}

export function readJSON(file, fallback = null) {
  ensureDir();
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch {
    return fallback;
  }
}

/** مسیر مطلق دایرکتوری داده (برای اسکن فایل‌های json) */
export function getDataDir() {
  return DATA_DIR;
}

export function writeJSON(file, data) {
  ensureDir();
  const full = path.join(DATA_DIR, file);
  const contents = JSON.stringify(data, null, 2);
  writeAtomic(full, contents);
  return data;
}

/**
 * نوشتن اتمیک: ابتدا فایل موقت، سپس rename.
 * اگر پروسه وسط نوشتن قطع شود، فایل اصلی سالم می‌ماند.
 */
function writeAtomic(full, contents) {
  const tmp = `${full}.${process.pid}.${Date.now().toString(36)}.tmp`;
  // دادهٔ پنل شامل هش رمز، کاربران و پیام‌های تماس است؛ فقط برای کاربر سرویس قابل خواندن باشد.
  fs.writeFileSync(tmp, contents, { encoding: "utf8", mode: DATA_FILE_MODE });
  try {
    fs.renameSync(tmp, full);
  } catch (error) {
    // ویندوز اگر مقصد باز باشد ممکن است rename را رد کند.
    if (error.code === "EPERM" || error.code === "EEXIST" || error.code === "EBUSY") {
      fs.writeFileSync(full, contents, { encoding: "utf8", mode: DATA_FILE_MODE });
      fs.rmSync(tmp, { force: true });
      return;
    }
    fs.rmSync(tmp, { force: true });
    throw error;
  }
}

export function getMessages() {
  return readJSON("messages.json", []);
}

export function addMessage(msg) {
  const list = getMessages();
  const newMsg = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    read: false,
    replied: false,
    ...msg
  };
  list.unshift(newMsg);
  writeJSON("messages.json", list);
  return newMsg;
}

export function getSettings() {
  return readJSON("settings.json", {});
}

export function updateSettings(patch) {
  const current = getSettings();
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  writeJSON("settings.json", updated);
  return updated;
}
