import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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

export function writeJSON(file, data) {
  ensureDir();
  const full = path.join(DATA_DIR, file);
  fs.writeFileSync(full, JSON.stringify(data, null, 2), "utf8");
  return data;
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
