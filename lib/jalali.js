const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
  1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
];

function div(a, b) {
  return ~~(a / b);
}

function mod(a, b) {
  return a - ~~(a / b) * b;
}

function jalCal(jy) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  if (jy < jp || jy >= BREAKS[bl - 1]) return null;

  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  if (!r) return null;
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** تاریخ شمسی را به تاریخ میلادی تبدیل می‌کند. در صورت نامعتبر بودن null برمی‌گرداند. */
export function jalaliToGregorian(jy, jm, jd) {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return null;
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
  const jdn = j2d(jy, jm, jd);
  if (jdn === null) return null;
  const result = d2g(jdn);
  if (!result || result.gy < 600 || result.gy > 2500) return null;
  return result;
}

function toEnglishDigits(value) {
  return String(value || "").replace(/[۰-۹٠-٩]/g, function(digit) {
    return String("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(digit) % 10);
  });
}

/** رشتهٔ تاریخ (شمسی، میلادی یا ISO) را به YYYY-MM-DD تبدیل می‌کند. */
export function toIsoDate(value) {
  const text = toEnglishDigits(value).trim();
  if (!text) return "";
  const match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year >= 1700) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    const gregorian = jalaliToGregorian(year, month, day);
    if (!gregorian) return "";
    return `${gregorian.gy}-${String(gregorian.gm).padStart(2, "0")}-${String(gregorian.gd).padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  // رشته‌های بدون ساعت در وقت محلی خوانده می‌شوند؛ برای جلوگیری از جابه‌جایی روز
  // در toISOString، اجزای تاریخ محلی را برمی‌گردانیم.
  if (!/\d{1,2}:\d{2}/.test(text)) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }
  return parsed.toISOString().slice(0, 10);
}

/** تاریخ ذخیره‌شده (رشته یا آبجکت چندزبانه) را به YYYY-MM-DD تبدیل می‌کند. */
export function localizedDateIso(value) {
  if (!value) return "";
  if (typeof value === "string") return toIsoDate(value);
  if (typeof value !== "object") return "";
  for (const locale of ["fa", "en", "ar", "ru"]) {
    const iso = toIsoDate(value[locale]);
    if (iso) return iso;
  }
  return "";
}
