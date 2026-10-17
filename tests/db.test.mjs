import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

// lib/db.js resolves its data directory at import time, so set it first.
const dataDir = mkdtempSync(path.join(tmpdir(), "psm-db-"));
process.env.PSM_DATA_DIR = dataDir;

const { readJSON, writeJSON, addMessage, getMessages } = await import("../lib/db.js");

test("writeJSON round-trips and leaves no temporary files behind", () => {
  writeJSON("sample.json", { hello: "world", count: 2 });
  assert.deepEqual(readJSON("sample.json"), { hello: "world", count: 2 });

  const leftovers = readdirSync(dataDir).filter((name) => name.endsWith(".tmp"));
  assert.deepEqual(leftovers, []);
});

test("writeJSON replaces an existing file atomically", () => {
  writeJSON("sample.json", { version: 1 });
  writeJSON("sample.json", { version: 2 });
  assert.deepEqual(readJSON("sample.json"), { version: 2 });
});

test("an interrupted write never corrupts the previous file", () => {
  writeJSON("critical.json", { keep: "me" });

  // Simulate a crash after the temp file is written but before the rename:
  // the partial file must not replace the committed one.
  const partial = path.join(dataDir, "critical.json.deadbeef.tmp");
  writeFileSync(partial, '{"broken":');
  assert.deepEqual(readJSON("critical.json"), { keep: "me" });

  rmSync(partial, { force: true });
});

test("messages are appended newest-first", () => {
  addMessage({ name: "Ali", email: "ali@example.com", message: "سلام" });
  addMessage({ name: "Sara", email: "sara@example.com", message: "Hi" });

  const list = getMessages();
  assert.equal(list.length, 2);
  assert.equal(list[0].name, "Sara");
  assert.ok(list[0].id && list[0].createdAt);
  assert.equal(list[0].read, false);
});

test("readJSON falls back on missing or corrupt files", () => {
  assert.equal(readJSON("missing.json", { fallback: true }).fallback, true);

  writeFileSync(path.join(dataDir, "corrupt.json"), "{not json");
  assert.deepEqual(readJSON("corrupt.json", []), []);
});
