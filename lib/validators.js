// ============================================================
// VALIDATORS — اعتبارسنج‌های خالص (قابل تست با node --test)
// الگوبرداری از سبک اعتبارسنجی app/api/news/route.js:
// بررسی آرایه، سقف تعداد، فیلدهای مجاز (whitelist) و فیلدهای الزامی.
// این فایل هیچ وابستگی به Next ندارد تا مستقیماً در تست‌ها ایمپورت شود.
// ============================================================

export const BULK_LIMIT = 500;

/** مقدار چندزبانه: رشتهٔ پر، یا شیءِ زبانی با حداقل یک مقدار رشته‌ایِ پر */
export function isLocalizedText(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.values(value).some((v) => typeof v === "string" && v.trim().length > 0);
  }
  return false;
}

/** رشتهٔ ساده با سقف طول */
export function isText(value, max = 2000) {
  return typeof value === "string" && value.length <= max;
}

/** شناسهٔ slug مثل news */
export function isValidSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/** شناسهٔ آیتم: رشتهٔ کوتاه و بی‌فاصلهٔ ابتدا/انتها */
export function isValidId(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 120 &&
    !/[\\/]|\.\./.test(value);
}

/** تصویر/فایل: مسیر داخلی (/uploads, /images, /logo) یا http(s) — بدون traversal */
export function isFileUrl(value, { required = false } = {}) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return !required;
  if (/^https?:\/\/\S+$/i.test(trimmed)) return true;
  if (trimmed.startsWith("//") || trimmed.includes("..")) return false;
  return /^\/[a-zA-Z0-9._\-/]+$/.test(trimmed);
}

/** لینک داخلی یا خارجی برای cta */
export function isHref(value) {
  return isFileUrl(value) || (typeof value === "string" && value.trim() === "#");
}

export function isBoolean(value) {
  return typeof value === "boolean";
}

export function isInteger(value) {
  return Number.isFinite(value) && Number.isInteger(value) && Math.abs(value) <= 1e6;
}

/**
 * هستهٔ مشترک اعتبارسنجی فهرست‌های bulk.
 * schema: { fieldName: { required, check(value) -> boolean, label } }
 * فقط فیلدهای موجود در schema ذخیره می‌شوند (whitelist)؛ فیلدهای ناشناخته دور می‌روند.
 */
export function validateBulkList(list, { label = "آیتم", schema, limit = BULK_LIMIT } = {}) {
  if (!Array.isArray(list)) {
    return { ok: false, error: `فهرست «${label}» معتبر نیست.` };
  }
  if (list.length > limit) {
    return { ok: false, error: `تعداد «${label}» از حد مجاز (${limit}) بیشتر است.` };
  }

  const fields = Object.keys(schema);
  const items = [];
  for (let index = 0; index < list.length; index += 1) {
    const raw = list[index];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, error: `${label} شمارهٔ ${index + 1} معتبر نیست.` };
    }
    // مقدار null/undefined «غایب» حساب می‌شود: برای فیلد الزامی خطا،
    // برای فیلد اختیاری بی‌خیال.
    const has = (field) =>
      Object.prototype.hasOwnProperty.call(raw, field) && raw[field] !== null && raw[field] !== undefined;
    for (const field of fields) {
      const rule = schema[field];
      if (rule.required && !has(field)) {
        return { ok: false, error: `${label} شمارهٔ ${index + 1}: فیلد «${rule.label || field}» الزامی است.` };
      }
      if (has(field) && !rule.check(raw[field])) {
        return { ok: false, error: `${label} شمارهٔ ${index + 1}: «${rule.label || field}» معتبر نیست.` };
      }
    }
    const cleaned = {};
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(raw, field)) cleaned[field] = raw[field];
    }
    items.push(cleaned);
  }
  return { ok: true, items };
}

// ---------- نمودار فیلدهای هر دامنه ----------
const localized = (required = false) => ({ required, check: (v) => (required ? isLocalizedText(v) : v === undefined || isLocalizedText(v)) });
const idField = () => ({ required: true, check: isValidId });
const booleanField = () => ({ check: isBoolean });
const orderField = () => ({ check: isInteger });
const fileField = (required = false) => ({ required, check: (v) => isFileUrl(v, { required }) });

export function validateFaqs(list) {
  return validateBulkList(list, {
    label: "پرسش‌ها",
    schema: {
      id: idField(),
      category: localized(),
      question: localized(true),
      answer: localized(true),
      order: orderField(),
      active: booleanField()
    }
  });
}

export function validateServices(list) {
  return validateBulkList(list, {
    label: "خدمات",
    schema: {
      slug: { required: true, check: isValidSlug },
      icon: { check: (v) => isText(v, 60) },
      name: localized(true),
      short: localized(),
      image: fileField(),
      order: orderField(),
      active: booleanField()
    }
  });
}

export function validatePartners(list) {
  return validateBulkList(list, {
    label: "همکاران",
    schema: {
      id: idField(),
      name: localized(true),
      logo: fileField(),
      url: { check: isHref },
      order: orderField(),
      active: booleanField()
    }
  });
}

export function validateTestimonials(list) {
  return validateBulkList(list, {
    label: "نظرها",
    schema: {
      id: idField(),
      name: localized(true),
      role: localized(),
      text: localized(true),
      rating: { check: (v) => Number.isFinite(v) && v >= 0 && v <= 5 },
      image: fileField(),
      order: orderField(),
      active: booleanField()
    }
  });
}

export function validateSliders(list) {
  return validateBulkList(list, {
    label: "اسلایدها",
    schema: {
      id: idField(),
      title: localized(true),
      subtitle: localized(),
      image: fileField(true),
      ctaText: localized(),
      ctaHref: { check: isHref },
      order: orderField(),
      active: booleanField()
    }
  });
}

export function validateCertificates(list) {
  return validateBulkList(list, {
    label: "گواهی‌ها",
    schema: {
      id: idField(),
      title: localized(true),
      issuer: localized(),
      validity: localized(),
      image: fileField(),
      order: orderField(),
      active: booleanField()
    }
  });
}

// ---------- whitelist برای تنظیمات/برندینگ (PATCH) ----------
/**
 * کلیدهای ناشناخته را رد می‌کند و لیست آن‌ها را در پیام خطا برمی‌گرداند.
 * knownKeys: مجموعهٔ کلیدهای مجاز. allowedExtra: کلیدهای اضافیِ مستند (مثل updatedAt).
 */
export function whitelistKeys(body, knownKeys, { allowUnknown = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "ساختار ارسالی معتبر نیست." };
  }
  const known = new Set(knownKeys);
  const unknown = Object.keys(body).filter((key) => !known.has(key));
  if (unknown.length && !allowUnknown) {
    return { ok: false, error: `کلیدهای ناشناخته مجاز نیستند: ${unknown.join(", ")}`, unknown };
  }
  const clean = {};
  for (const key of Object.keys(body)) if (known.has(key)) clean[key] = body[key];
  return { ok: true, data: clean };
}
