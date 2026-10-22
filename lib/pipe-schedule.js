// ============================================================
// ASME B36.10M — ابعاد لوله فولادی بدون درز/جوشی (میلی‌متر)
// مرجع سریع برای ماشین‌حساب لوله و جدول استانداردها.
// ضخامت‌ها برای Sch 40 و Sch 80؛ برای سایزهای بزرگ‌تر از ۱۲ اینچ
// این دو شِدول در بسیاری از جداول با XS/Sch 80 هم‌ارز گزارش می‌شوند.
// ============================================================

export const PIPE_SCHEDULE = [
  { nps: '1/8"',   dn: 6,   inch: 0.125, od: 10.3,  sch40: 1.73, sch80: 2.41 },
  { nps: '1/4"',   dn: 8,   inch: 0.25,  od: 13.7,  sch40: 2.24, sch80: 3.02 },
  { nps: '3/8"',   dn: 10,  inch: 0.375, od: 17.1,  sch40: 2.31, sch80: 3.20 },
  { nps: '1/2"',   dn: 15,  inch: 0.5,   od: 21.3,  sch40: 2.77, sch80: 3.73 },
  { nps: '3/4"',   dn: 20,  inch: 0.75,  od: 26.7,  sch40: 2.87, sch80: 3.91 },
  { nps: '1"',     dn: 25,  inch: 1,     od: 33.4,  sch40: 3.38, sch80: 4.55 },
  { nps: '1-1/4"', dn: 32,  inch: 1.25,  od: 42.2,  sch40: 3.56, sch80: 4.85 },
  { nps: '1-1/2"', dn: 40,  inch: 1.5,   od: 48.3,  sch40: 3.68, sch80: 5.08 },
  { nps: '2"',     dn: 50,  inch: 2,     od: 60.3,  sch40: 3.91, sch80: 5.54 },
  { nps: '2-1/2"', dn: 65,  inch: 2.5,   od: 73.0,  sch40: 5.16, sch80: 7.01 },
  { nps: '3"',     dn: 80,  inch: 3,     od: 88.9,  sch40: 5.49, sch80: 7.62 },
  { nps: '3-1/2"', dn: 90,  inch: 3.5,   od: 101.6, sch40: 5.74, sch80: 8.08 },
  { nps: '4"',     dn: 100, inch: 4,     od: 114.3, sch40: 6.02, sch80: 8.56 },
  { nps: '5"',     dn: 125, inch: 5,     od: 141.3, sch40: 6.55, sch80: 9.53 },
  { nps: '6"',     dn: 150, inch: 6,     od: 168.3, sch40: 7.11, sch80: 10.97 },
  { nps: '8"',     dn: 200, inch: 8,     od: 219.1, sch40: 8.18, sch80: 12.70 },
  { nps: '10"',    dn: 250, inch: 10,    od: 273.0, sch40: 9.27, sch80: 15.09 },
  { nps: '12"',    dn: 300, inch: 12,    od: 323.8, sch40: 10.31, sch80: 17.48 },
  { nps: '14"',    dn: 350, inch: 14,    od: 355.6, sch40: 11.13, sch80: 19.05 },
  { nps: '16"',    dn: 400, inch: 16,    od: 406.4, sch40: 12.70, sch80: 21.44 },
  { nps: '18"',    dn: 450, inch: 18,    od: 457.0, sch40: 14.27, sch80: 23.83 },
  { nps: '20"',    dn: 500, inch: 20,    od: 508.0, sch40: 15.09, sch80: 26.19 },
  { nps: '24"',    dn: 600, inch: 24,    od: 610.0, sch40: 17.48, sch80: 30.96 }
];

export const PIPE_SCHEDULES = ["40", "80"];

export function findPipeByNps(nps) {
  return PIPE_SCHEDULE.find((row) => row.nps === nps) || null;
}

export function pipeWallThickness(row, schedule = "40") {
  if (!row) return null;
  const wall = schedule === "80" ? row.sch80 : row.sch40;
  return Number.isFinite(wall) ? wall : null;
}

/** قطر داخلی (mm) بر اساس OD و ضخامت دیواره */
export function pipeInsideDiameter(row, schedule = "40") {
  const wall = pipeWallThickness(row, schedule);
  if (!Number.isFinite(wall)) return null;
  const id = row.od - 2 * wall;
  return id > 0 ? +id.toFixed(2) : null;
}

/** سطح مقطع جریان (m²) برای قطر داخلی */
export function pipeFlowArea(row, schedule = "40") {
  const id = pipeInsideDiameter(row, schedule);
  if (!id) return null;
  return +(Math.PI * Math.pow(id / 2000, 2)).toFixed(6);
}

/** نزدیک‌ترین لولهٔ استاندارد به یک قطر (mm) — برای تفسیر نتیجهٔ محاسبه */
export function nearestPipeSize(diameterMm) {
  const value = Number(diameterMm);
  if (!Number.isFinite(value) || value <= 0) return null;
  let best = null;
  let bestDiff = Infinity;
  for (const row of PIPE_SCHEDULE) {
    const id40 = pipeInsideDiameter(row, "40");
    const id80 = pipeInsideDiameter(row, "80");
    for (const [schedule, id] of [["40", id40], ["80", id80]]) {
      if (!id) continue;
      const diff = Math.abs(id - value);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = { ...row, schedule, insideDiameter: id, difference: +diff.toFixed(2) };
      }
    }
  }
  return best;
}
