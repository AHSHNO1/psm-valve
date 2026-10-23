/**
 * اطلاعات شرکت — قالب، ادغام و اعتبارسنجی.
 * باگ رجیستری: certifications آرایهٔ آبجکت است؛ اعتبارسنج قدیمی فقط
 * آرایهٔ رشته می‌پذیرفت و PUT /api/company-info همیشه 400 می‌خورد.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const dataDir = mkdtempSync(path.join(tmpdir(), "psm-company-"));
process.env.PSM_DATA_DIR = dataDir;

const { COMPANY, getCompanyInfo, saveCompanyInfo, validateCompanyInfo } = await import(
  "../lib/company-info.js"
);

test("خروجی getCompanyInfo (بدون ویرایش) باید معتبر باشد — همان چیزی که ادمین PUT می‌کند", () => {
  assert.equal(validateCompanyInfo(getCompanyInfo()), true);
});

test("مجموعهٔ کامل ویرایش‌های واقعی ویرایشگر ادمین ذخیره می‌شود", () => {
  const edited = getCompanyInfo();
  edited.phone.office = "+98 86 0000 0000";
  edited.phone.mobile = ["+98 912 000 0000", "+98 918 000 0000", "+98 919 000 0000"];
  edited.fax.factory = "+98 86 1111 1111";
  edited.email.secondary = "office@psmvalve.com";
  edited.address.office.fa = "اراک، خیابان آزمایشی";
  edited.address.factoryCoordinates.latitude = "34.1000";
  edited.address.factoryCoordinates.longitude = "49.9000";
  edited.messengers.bale = "new_handle@";
  // certifications دست‌نخورده: آرایه‌ای از آبجکت {fa,en,icon} — قبلاً همین‌جا رد می‌شد
  assert.equal(validateCompanyInfo(edited), true);

  saveCompanyInfo(edited);
  const reread = getCompanyInfo();
  assert.equal(reread.phone.office, "+98 86 0000 0000");
  assert.equal(reread.address.office.fa, "اراک، خیابان آزمایشی");
  assert.deepEqual(reread.phone.mobile, ["+98 912 000 0000", "+98 918 000 0000", "+98 919 000 0000"]);
  assert.deepEqual(reread.certifications, COMPANY.certifications);
});

test("حذف همهٔ شماره‌های همراه مجاز است", () => {
  const edited = getCompanyInfo();
  edited.phone.mobile = [];
  assert.equal(validateCompanyInfo(edited), true);
});

test("آیتم گواهینامهٔ ناقص یا غیر آبجکت رد می‌شود", () => {
  const brokenItem = getCompanyInfo();
  brokenItem.certifications = [{ fa: "مجوز", en: "License" }];
  assert.equal(validateCompanyInfo(brokenItem), false);

  const notObject = getCompanyInfo();
  notObject.certifications = ["ISO 9001"];
  assert.equal(validateCompanyInfo(notObject), false);
});

test("مختصات خالی/ناعدد/خارج از بازه رد می‌شود — نه بی‌صدا (0,0)", () => {
  for (const [lat, lng] of [["", "49.8"], ["34.07", "  "], ["abc", "49.8"], ["34.07", "999"], ["120", "49.8"]]) {
    const edited = getCompanyInfo();
    edited.address.factoryCoordinates.latitude = lat;
    edited.address.factoryCoordinates.longitude = lng;
    assert.equal(validateCompanyInfo(edited), false, `باید رد شود: ${lat} , ${lng}`);
  }
});

test("فایل legacy (فقط مختصات) با قالب کامل ادغام می‌شود", () => {
  rmSync(path.join(dataDir, "company-info.json"), { force: true });
  writeFileSync(path.join(dataDir, "company-info.json"), JSON.stringify({
    address: { factoryCoordinates: { latitude: "34.0765", longitude: "49.8397" } }
  }));
  const merged = getCompanyInfo();
  assert.equal(merged.phone.office, COMPANY.phone.office);
  assert.equal(merged.address.factoryCoordinates.latitude, "34.0765");
  assert.equal(validateCompanyInfo(merged), true);
});

test("آیتم‌های خراب ذخیره‌شده روی الگوی قالب ترمیم می‌شوند", () => {
  rmSync(path.join(dataDir, "company-info.json"), { force: true });
  writeFileSync(path.join(dataDir, "company-info.json"), JSON.stringify({
    phone: { mobile: ["+98 912 000 0000", 42, null] },
    certifications: [{ fa: "مجوز آزمایشی", en: "Test License", icon: "award", junk: true }]
  }));
  const merged = getCompanyInfo();
  assert.deepEqual(merged.phone.mobile, ["+98 912 000 0000", "", ""]);
  assert.deepEqual(merged.certifications, [{ fa: "مجوز آزمایشی", en: "Test License", icon: "award" }]);
  assert.equal(validateCompanyInfo(merged), true);
});

test("فایل ذخیره‌شده روی دیسک ساختار قالب را دارد", () => {
  const saved = getCompanyInfo();
  saveCompanyInfo(saved);
  assert.ok(existsSync(path.join(dataDir, "company-info.json")));
  const raw = JSON.parse(readFileSync(path.join(dataDir, "company-info.json"), "utf8"));
  assert.deepEqual(Object.keys(raw).sort(), Object.keys(COMPANY).sort());
});
