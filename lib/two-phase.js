// ============================================================
// Preliminary valve sizing estimates; these simplified equations are not a
// substitute for a complete IEC 60534 calculation or manufacturer validation.
//
// این فایل سایزینگ دو‌فازی (مایع + بخار در حال فلشینگ/جوشش) است. معادلهٔ
// تک‌فازی مایع در lib/sizing-advanced.js برای جریانی که در مسیر شیر می‌جوشد
// معتبر نیست، چون حجم ویژه مخلوط در گلوگاه چند برابر مایع است. چهار مدل
// مستقل پیاده‌سازی شده و همه با هم مقایسه می‌شوند؛ اختلاف خودِ این مدل‌ها
// پیام اصلی مهندسی است: سایزینگ دو‌فازی ذاتاً نامطمئن است.
// ============================================================

import {
  calcLiquidCv,
  calcGasCv,
  cvToSize,
  bodyVelocity,
  steamSaturationTempC
} from "./sizing-advanced.js";

// ============================================================
// ثابت‌های تبدیل واحد — همه از تعریف Cv استخراج شده‌اند، نه از جدول
// ============================================================
// تعریف Cv: ۱ Cv = ۱ US gal/min آب ۶۰°F با افت فشار ۱ psi.
//   دبی جرمی متناظر: 6.30902e-5 m³/s × 999 kg/m³ = 6.30271e-2 kg/s
//   افت فشار: 1 psi = 6894.757 Pa
// اوریفیس ایده‌آل: W = A·sqrt(2·ρ·ΔP) ⇒
//   A/Cv = 6.30271e-2 / sqrt(2·999·6894.757) = 6.30271e-2 / 3710.47 = 1.6986e-5 m²
// یعنی هر Cv ≈ ۱۷ mm² مساحت مؤثر (معادل رایج دیگر: Cv = 38·A[in²]؛
// 645.16/38 = 16.98 mm² ✓). پس این ثابت یک نتیجهٔ مستقیم از تعریف است.
export const CV_TO_AREA_M2 = 1.6986e-5;
export const CV_TO_AREA_MM2 = +(CV_TO_AREA_M2 * 1e6).toFixed(3); // ≈ 16.986
export const CV_PER_SQ_IN = 38; // معادل Cv = 38·A[in²] (همان ثابت بالا)

// نسبت Kv↔Cv همان چیزی است که موتور تک‌فازی استفاده می‌کند (IEC 60534-1): Cv = 1.156·Kv
export const CV_PER_KV = 1.156;

// نقطهٔ بحرانی آب (IAPWS، عدد مرجع شناخته‌شده): فقط برای کاهندهٔ hfg(T)
// با رابطهٔ واتسون استفاده می‌شود؛ برای سیالات دیگر کاربر باید Tc بدهد.
export const WATER_TC_K = 647.10;
export const WATER_PC_BAR = 221.2;

// پیش‌فرض‌های دو‌فازی. هر عددی که در منبع منتشرشده مطمئن نباشیم،
// عمداً کاربر-پذیر مانده و در notes ذکر می‌شود؛ هیچ استناد ساختگی ندارد.
const TWO_PHASE_DEFAULTS = {
  // N = ضریب عدم‌تعادل HNE (سبک Sheldon–Schreuder). جهت تصحیح از اندازه‌گیری‌های
  // فلشینگ آب است: ظرفیت پیش‌بینی‌شدهٔ HEM بالاتر از ظرفیت واقعی شیر است.
  // بازهٔ گزارش‌شده در عمل ~۱٫۰ تا ۲٫۰؛ عدد دقیق به تریم و زمان اقامت وابسته است،
  // پس پیش‌فرض ۱٫۴ فقط «راهنما» است و باید با آزمون سازنده جایگزین شود.
  N: 1.4,
  // تعداد گام‌های ادغام عددی مسیر فشار در HEM (قاعدهٔ ذوزنقه). ۴۰ گام برای
  // این بازهٔ فشاری خطای ادغام < ۰٫۵٪ می‌دهد؛ عدد دلخواه است، نه استاندارد.
  steps: 40,
  // نقطهٔ دوم فلاش در روش ω: p9 = 0.9·Ps → ضریب ۹ از خودِ همین نقطه مشتق می‌شود
  // (با ۰٫۹۵ ضریب ۱۹ می‌شود)؛ تعریف در تابع calcOmega اثبات شده است.
  p9Ratio: 0.9,
  // ظرفیت گرمایی مایع (kJ/kg·K) — آب ≈ ۴٫۱۸؛ برای سیالات دیگر کاربر مقدار می‌دهد.
  cpL: 4.18,
  // حرارت نهان مرجع (kJ/kg) در دمای مرجع. برای آب در ۱۰۰°C مقدار جدولی ۲۲۵۷ است.
  hfgRef: 2257,
  TrefK: 373.15,
  // نما واتسون: hfg(T) = hfg_ref·((Tc−T)/(Tc−Tref))^0.38 — توان رایج ۰٫۳۸.
  // آزمون: با لنگر ۲۲۵۷ در ۱۰۰°C، مقدار ۱۱۱°C را ۲۲۲۱ می‌دهد (جدول بخار ۲۲۲۳) و
  // مقدار ۱۷۵°C را ۱۹۹۸ (جدول ۲۰۳۱) ⇒ خطای ~۱٫۵٪ در بازهٔ کاربردی ما.
  watsonN: 0.38,
  MW: 18.015, // وزن مولکولی g/mol (بخار آب)
  k: 1.31,    // نسبت گرمای ویژه بخار آب (تقریب رایج، همان مقداری که موتور تک‌فازی می‌گیرد)
  Z: 1,       // ضریب تراکم‌پذیری — فقط وقتی rhoG داده نشده استفاده می‌شود
  FL: 0.9,
  xT: 0.7,
  // حد راهنمای سرعت مخلوط در بدنه برای سرویس فلشینگ: ISA RP75.23 روی تفکر
  // «انرژی جنبشی سیال خروجی» می‌گوید نه یک عدد ثابت. ۷۰ m/s یک راهنمای
  // صنعتی است، نه حد طراحی؛ کاربر باید با آزمون فرسایش سازنده تطبیق دهد.
  velocityLimitMs: 70,
  // آستانهٔ گزارش اختلاف مدل‌ها (بزرگ‌ترین Cv / کوچک‌ترین Cv)
  spreadFactor: 2,
  // ضریب دبی مؤثر گلوگاه. ۱ یعنی «اوریفیس ایده‌آل»؛ در نتیجهٔ x→۰ این موتور
  // دقیقاً به Cv = 1.156·Kv تک‌فازی می‌رسد (تطبیق تعریف‌ها، بند بالا).
  // تریم واقعی معمولاً Kd ≈ 0.85 دارد ⇒ Cv لازم ~۱۵٪ بیشتر؛ پس مقدار
  // پیش‌فرض ۱ یعنی نتیجه‌ها خوش‌بینانه‌اند و عمداً کاربر-پذیر مانده است.
  Kd: 1
};

export { TWO_PHASE_DEFAULTS };

// ============================================================
// مدل خواص اشباع (منبع خواص) — کامنت می‌کند که اعداد از کجا می‌آیند
// ============================================================
// بخار/آب: منحنی اشباع از جدول IAPWS-IF97 در steamSaturationTempC (همان جدول
// موتور تک‌فازی) می‌آید. برای فشارهای خارج از جدول یا سیال غیرآب، از
// Clausius–Clapeyron یک‌گام با شیب محلی استفاده می‌شود:
//   dp/dT = p·hfg·M/(R·T²)  ⇒  d ln p/d(1/T) = −hfg·M/R = −hfg/R_specific
// (با فرض بخار ایده‌آل و حجم مایع ناچیز). این تقریب فقط نزدیک نقطهٔ لنگر
// معتبر است؛ به همین دلیل در notes ذکر می‌شود که منبع خواص کجاست.

/**
 * دمای اشباع (K) در فشار مطلق pBar برای سیال با خواص داده‌شده.
 * آب (۰.۲ … ۲۰۰ bar): جدول IF97. خارج از جدول هیچ حدسی زده نمی‌شود:
 * Clausius–Clapeyron فقط در همسایگی نقطهٔ لنگر اعتبار دارد (اینجا |ln p/Pv| ≤ ln 2
 * یعنی تا دو‌برابر فشار لنگر)؛ بیرون آن null برمی‌گردد و مدل‌ها صریحاً
 * می‌گویند «خواص در این فشار معلوم نیست» — نه یک عدد بی‌معنی.
 * (آزمون: مسیر ۱۰ → ۰٫۲ bar آبِ اشباع؛ بیرون جدول ⇒ HEM باید خطا بدهد،
 *  نه شار ۳۰۰٬۰۰۰ kg/m²·s که از حجم ویژهٔ اشتباه مایع می‌آمد.)
 */
function satTempK(pBar, ctx) {
  if (!Number.isFinite(pBar) || pBar <= 0) return null;
  if (ctx.useWaterTable) {
    const tC = steamSaturationTempC(pBar);
    return tC == null ? null : tC + 273.15;
  }
  if (ctx.Pv_bar == null) return null; // لنگر CC را نداریم: حدس نمی‌زنیم
  if (Math.abs(Math.log(pBar / ctx.Pv_bar)) > Math.log(2)) return null; // خارج از همسایگی لنگر
  const Rv = 8.314 / ctx.MW; // kJ/(kg·K) — ثابت گاز ویژهٔ بخار
  const hfg = hfgWatson(ctx.TanchorK, ctx);
  // ln(p/Pv) = −(Rv/hfg)·(1/T − 1/Tanchor) ⇒ 1/T = 1/Tanchor + (Rv/hfg)·ln(p/Pv)
  const invT = 1 / ctx.TanchorK + (Math.log(pBar / ctx.Pv_bar) * Rv) / hfg;
  return invT > 0 ? 1 / invT : null;
}

/** فشار اشباع (bar) در دمای T_K — معکوس تابع بالا (بدون حدس خارج از محدوده). */
function satPressureBar(T_K, ctx) {
  if (!Number.isFinite(T_K) || T_K <= 0) return null;
  if (ctx.useWaterTable) {
    // جدول (p ↔ T) را با جست‌وجوی هندسی معکوس می‌کنیم؛ همان دادهٔ IF97،
    // بدون کپی جدول در این فایل.
    let lo = 0.0001;
    let hi = 400;
    for (let i = 0; i < 60; i++) {
      const mid = Math.sqrt(lo * hi); // میانهٔ هندسی — منحنی بخار در مقیاس log خطی‌تر است
      const tMid = steamSaturationTempC(mid);
      if (tMid == null) break;
      if (tMid + 273.15 > T_K) hi = mid;
      else lo = mid;
    }
    const p = Math.sqrt(lo * hi);
    // خارج از بازهٔ جدول (۰٫۲ … ۲۰۰ bar) مقدار جدولی نداریم ⇒ null
    return steamSaturationTempC(p) == null ? null : p;
  }
  if (ctx.Pv_bar == null) return null;
  const Rv = 8.314 / ctx.MW;
  const hfg = hfgWatson(ctx.TanchorK, ctx);
  const p = ctx.Pv_bar * Math.exp(-(Rv / hfg) * (1 / T_K - 1 / ctx.TanchorK));
  if (!(p > 0)) return null;
  return Math.abs(Math.log(p / ctx.Pv_bar)) > Math.log(2) ? null : p;
}

/** حرارت نهان واتسون: hfg(T) = hfgRef·((Tc−T)/(Tc−Tref))^n. */
function hfgWatson(T_K, ctx) {
  if (!Number.isFinite(T_K) || ctx.TcK == null) return ctx.hfgRef;
  const num = Math.max(0, ctx.TcK - T_K);
  const den = Math.max(1e-6, ctx.TcK - ctx.TrefK);
  const hfg = ctx.hfgRef * Math.pow(num / den, ctx.watsonN);
  return hfg > 0 ? hfg : ctx.hfgRef;
}

/**
 * کنتکست خواص: یک‌بار از ورودی کاربر ساخته می‌شود.
 * lref = نقطهٔ لنگر منحنی اشباع: (Tsat(P1), Pv(T)) با ترجیح دادهٔ کاربر.
 */
function buildPropertyContext({ T, Pv, Pc, MW, cpL, hfgRef, TrefK, watsonN, Z, k }) {
  const mw = Number.isFinite(MW) && MW > 0 ? MW : TWO_PHASE_DEFAULTS.MW;
  const isWaterish = mw > 17 && mw < 19;
  const TgivenK = Number.isFinite(T) ? T + 273.15 : null;
  // نقطهٔ لنگر: دمای جاری؛ اگر داده نشده دمای مرجع hfg (پیش‌فرض ۳۷۳٫۱۵ K).
  const TanchorK = TgivenK != null ? TgivenK : TWO_PHASE_DEFAULTS.TrefK;
  return {
    MW: mw,
    Z: Number.isFinite(Z) && Z > 0 ? Z : 1,
    k: Number.isFinite(k) && k > 1 ? k : TWO_PHASE_DEFAULTS.k,
    cpL: Number.isFinite(cpL) && cpL > 0 ? cpL : TWO_PHASE_DEFAULTS.cpL,
    hfgRef: Number.isFinite(hfgRef) && hfgRef > 0 ? hfgRef : TWO_PHASE_DEFAULTS.hfgRef,
    // دمای مرجع hfgRef؛ اگر کاربر ندهد همان مرجع آب (۱۰۰°C) در نظر Tc، نقطهٔ
    // بحرانی — برای واتسون لازم است.
    TrefK: Number.isFinite(TrefK) && TrefK > 0 ? TrefK : TWO_PHASE_DEFAULTS.TrefK,
    watsonN: Number.isFinite(watsonN) && watsonN > 0 ? watsonN : TWO_PHASE_DEFAULTS.watsonN,
    // نقطهٔ بحرانی: Pc داده‌شده فقط «فشار» است و Tc آن را نداریم؛ برای آب از
    // IAPWS (۶۴۷٫۱ K) می‌آید و برای سایر سیالات عمداً null می‌ماند تا در واتسون
    // عدد ساختگی وارد نشود — آنگاه hfg در مسیر ثابت فرض می‌شود و در notes می‌آید.
    TcK: isWaterish ? WATER_TC_K : null,
    // لنگر فشار: Pv(T) که کاربر داده (همان تعریف فیلد Pv در موتور تک‌فازی)؛
    // در نبودش، فشار بخارِ محاسبه‌شده در دمای ورودی از جدول/CC.
    Pv_bar: Number.isFinite(Pv) && Pv > 0 ? Pv : null,
    Pc_bar: Number.isFinite(Pc) && Pc > 0 ? Pc : null,
    useWaterTable: isWaterish,
    TanchorK
  };
}

/** فشار بخار در دمای ورودی (bar) — منبع: Pv کاربر، یا جدول IF97/CC. */
function inletVapourPressureBar(T_K, ctx) {
  if (ctx.Pv_bar != null) return ctx.Pv_bar;
  return satPressureBar(T_K, ctx);
}

/** دمای اشباع در فشار ورودی (K) — با همان منبع خواص. */
function inletSatTempK(P1, ctx) {
  return satTempK(P1, ctx);
}

/**
 * نام کوتاه منبع خواص که واقعاً بکار آمده — UI و گزارش آن را ترجمه می‌کنند.
 * چرا مهم است: MW (که کاربر برای سیال غیرآب می‌دهد) همین منبع را انتخاب می‌کند،
 * پس یک MWِ مانده از حالت گاز، یک سرویس آب را بی‌صدا از جدول بخار خارج می‌کند.
 */
function propertySourceId(ctx) {
  return ctx.useWaterTable ? "iapws-if97" : "clausius-clapeyron";
}

// ============================================================
// فلاش‌ها
// ============================================================

/**
 * فلاش آنتالپیک (موازنت انرژی دو‌فازی، حالت پایدار پایین‌دست).
 * با h = h_f(T) + x·hfg(T) و h_f(T1) − h_f(T2) ≈ cpL·(T1 − T2):
 *   x2 = x1·hfg(T1)/hfg(T2) + cpL·(T1 − Tsat(P2))/hfg(T2)
 * جملهٔ اول لازم است وگرنه بخارِ از پیش موجود (و سرد شدنش) در موازنت انرژی
 * دیده نمی‌شود و کیفیت خروجی برای بخار تر بیش‌ازحد بالا می‌رود.
 * لنگهٔ دمای مایع: دمای جریان نمی‌تواند از Tsat(P1) بالاتر باشد، مگر در حد
 * بخار خالص (x1 = ۱ که سوپرهیت معنادار است)؛ پس T1 = min(Tجریان, Tsat(P1))
 * برای x1 < ۱. آزمون: ۱۰ bar → ۱.۵ bar آب اشباع x1=۰ ⇒ x2 = ۰٫۱۲۹ در برابر
 * ۰٫۱۳۱۵ جدول IAPWS؛ و x1=۰٫۸ ⇒ x2 = ۰٫۸۴۳ در برابر ۰٫۸۵۶ جدول (~۱٫۵٪ کم).
 * اگر Tsat(P2) بیرون از دامنهٔ منبع خواص باشد خروجی { x: null,
 * propertiesUnavailable: true } است — کیفیت خروجی جعل نمی‌شود.
 */
export function flashIsenthalpic({ P1, P2, T1_K, x1, rhoL, rhoG, Pv, Pc, T, MW, cpL, hfgRef, TrefK, watsonN, Z, k }) {
  const ctx = buildPropertyContext({ T, Pv, Pc, MW, cpL, hfgRef, TrefK, watsonN, Z, k });
  const T2K = satTempK(P2, ctx);
  if (T2K == null || !Number.isFinite(T1_K)) {
    // خواص اشباع در P2 بیرون از دامنهٔ منبع است ⇒ حالت پایین‌دست محاسبه نمی‌شود.
    // عمداً x1 را به‌عنوان «کیفیت خروجی» برنمی‌گردانیم: آن عدد این ظاهر را
    // می‌دهد که فلاش رخ نداده، در حالی که فقط مقدارش معلوم نیست (خطای جهت‌دار
    // در گزارش). مصرف‌کننده از outletQuality = null + هشدار آگاه می‌شود.
    return { x: null, propertiesUnavailable: true, propertySource: propertySourceId(ctx), TsatP2C: null, outletTempC: null, rhoM: null };
  }
  // لنگهٔ دمای مایع: تا مایع در ورودی هست (x1 < ۱) دمای آن از Tsat(P1) بیشتر
  // نمی‌شود؛ برای بخار خالص سوپرهیت همان دمای جریان است.
  const Tsat1K = Number.isFinite(P1) ? satTempK(P1, ctx) : null;
  const T1K = x1 < 1 && Tsat1K != null ? Math.min(T1_K, Tsat1K) : T1_K;
  const hfg2 = hfgWatson(T2K, ctx);
  const xFlash = (ctx.cpL * Math.max(0, T1K - T2K)) / hfg2;
  const xCarry = x1 > 0 ? (x1 * hfgWatson(T1K, ctx)) / hfg2 : 0;
  const x = Math.min(1, Math.max(0, xCarry + xFlash));
  const rhoM = mixtureDensity({ x, rhoL, rhoG });
  // دمای خروجی: دو‌فازی ⇒ دمای اشباع P2؛ مایع زیرسردِ بدون فلاش ⇒ همان T1
  return { x, propertySource: propertySourceId(ctx), TsatP2C: +(T2K - 273.15).toFixed(1), outletTempC: +((x > 0 ? T2K : T1K) - 273.15).toFixed(1), rhoM };
}

/**
 * فلاش ایزنتروپیک (مسیر بکار در گلوگاه — HEM و نقطهٔ دوم ω):
 *   s_مخلوط(P1) = s_مایع(T1) + x1·hfg(T1)/T1
 *   x(p) = [cpL·ln(T1/T(p))]·T(p)/hfg(T(p)) + x1·T(p)·hfg(T1)/(hfg(T(p))·T1)
 * یعنی مایع سوپرهیت‌شده تا T(p) تبخیر می‌شود و بخار موجود هم مقیاس می‌گیرد.
 * آزمون (۱۰→۹ bar اشباع): x ≈ ۰٫۰۰۹۴ — همان‌قدر که یک فلاش کوچک انتظار دارد.
 */
function flashIsentropicQuality(pBar, inlet, ctx) {
  const Tk = satTempK(pBar, ctx);
  if (Tk == null) return null; // خواص اشباع در این فشار معلوم نیست (خارج از جدول)
  const hfgT = hfgWatson(Tk, ctx);
  const hfg1 = hfgWatson(inlet.T_K, ctx);
  const fromLiquid = (ctx.cpL * Math.log(inlet.T_K / Tk) * Tk) / hfgT;
  const fromVapour = (inlet.x * Tk * hfg1) / (hfgT * inlet.T_K);
  const x = Math.min(1, Math.max(0, fromLiquid + fromVapour));
  return x;
}

/**
 * حجم ویژهٔ تعادلی مخلوط در فشار p (m³/kg) روی مسیر گلوگاه.
 *
 * دو حد فیزیکی برای بخار در مسیر:
 *   (الف) بخارِ تولیدشده از فلاش: روی منحنی اشباع می‌نشیند ⇒
 *         ρG(p) = ρG1·(p/P1)·(T1/Tsat(p))   (گاز ایده‌آل در دمای اشباع)
 *   (ب) بخار از پیش موجود: تقریباً ایزنتروپیک منبسط می‌شود ⇒
 *         ρG(p) = ρG1·(p/P1)^(1/k)
 * وزن ترکیب = کسیر جرمی بخارِ ورودی (x1). این تقریب مستند است و هر دو حد
 * را درست می‌دهد: x1=0 ⇒ فقط منحنی اشباع (فلشینگ مایع)، x1=1 ⇒ ایزنتروپ
 * گاز که با معادلهٔ تک‌فازی گاز مطابقت می‌شود (آزمون x→۱ در تست‌ها).
 * آزمون حد (الف): آب اشباع ۱۰ → ۹ bar: ρG = ۴٫۶۸ در برابر ۴٫۶۵ جدول (~۰٫۶٪).
 */
function equilibriumSpecVolume(pBar, inlet, ctx) {
  const x = flashIsentropicQuality(pBar, inlet, ctx);
  if (x == null) return null; // خارج از دامنهٔ خواص: عدد ساختگی برنمی‌گردانیم
  const Tk = satTempK(pBar, ctx);
  const pr = pBar / inlet.P1;
  const fDome = Tk != null && inlet.T_K > 0 ? pr * (inlet.T_K / Tk) : pr;
  const fIsen = Math.pow(pr, 1 / ctx.k);
  const factor = (1 - inlet.x) * fDome + inlet.x * fIsen;
  const rhoG = inlet.rhoG * factor;
  if (!(rhoG > 0)) return { v: 1 / inlet.rhoL, x };
  return { v: (1 - x) / inlet.rhoL + x / rhoG, x };
}

// ============================================================
// چگالی مخلوط همگن (no-slip)
// ============================================================

/**
 * چگالی مخلوط همگن بدون لغزش: ρm = 1/(x/ρG + (1−x)/ρL).
 * x = کسیر جرمی بخار (quality). ورودی نامعتبر → null (موتور پرتاب نمی‌کند).
 */
export function mixtureDensity({ x, rhoL, rhoG }) {
  if (!Number.isFinite(x) || x < 0 || x > 1) return null;
  if (!Number.isFinite(rhoL) || rhoL <= 0 || !Number.isFinite(rhoG) || rhoG <= 0) return null;
  const v = x / rhoG + (1 - x) / rhoL;
  return v > 0 ? +(1 / v).toFixed(3) : null;
}

// ============================================================
// شار جرمی → Cv
// ============================================================

/**
 * A = (W/3600)/G و Cv = A/CV_TO_AREA_M2.
 * با Kd=1 این تبدیل دقیقاً با Cv = 1.156·Kv تک‌فازی سازگار است (بند ثابت‌ها).
 */
function fluxToCv(W_kgph, G_kgm2s, Kd) {
  if (!(G_kgm2s > 0) || !(W_kgph > 0)) return { Cv: null, areaMm2: null };
  const areaM2 = (W_kgph / 3600) / (G_kgm2s * Kd);
  const Cv = areaM2 / CV_TO_AREA_M2;
  return { Cv: +Cv.toFixed(2), areaMm2: +(areaM2 * 1e6).toFixed(2) };
}

// بررسی مشترک ورودی‌ها — همهٔ خطاها به‌جای throw، شیء { error } برمی‌گردانند.
function validateInputs(p) {
  if (!Number.isFinite(p.W) || p.W <= 0) return "W must be a positive total mass flow (kg/h)";
  if (!Number.isFinite(p.x)) return "x (vapour mass fraction) is required";
  if (p.x < 0 || p.x > 1) return "x must be between 0 and 1";
  if (!Number.isFinite(p.P1) || !Number.isFinite(p.P2)) return "P1 and P2 must be absolute pressures in bar";
  if (p.P1 <= 0 || p.P2 <= 0) return "P1 and P2 must be positive absolute pressures";
  if (p.P1 <= p.P2) return "P1 must be greater than P2";
  if (!Number.isFinite(p.rhoL) || p.rhoL <= 0) return "rhoL (liquid density, kg/m3) must be positive";
  // rhoG فقط وقتی بخار در ورودی وجود دارد لازم است (x = ۰ ⇒ حد مایع)
  if (p.x > 0 && (!Number.isFinite(p.rhoG) || p.rhoG <= 0)) {
    return "rhoG (vapour density at P1, kg/m3) must be positive when x > 0";
  }
  if (Number.isFinite(p.rhoG) && p.rhoG > 0 && p.rhoG >= p.rhoL) {
    return "rhoG must be lower than rhoL — check that the densities are at the flowing temperature";
  }
  if (Number.isFinite(p.N) && p.N <= 0) return "N (non-equilibrium factor) must be positive";
  return null;
}

/**
 * نقطهٔ شروع فلاش روی مسیر: اگر مایع زیرسرد باشد (T1 < Tsat(P1)) تا رسیدن
 * فشار به Pv(T1) هیچ بخاری تولید نمی‌شود. این «تأخیر شروع جوشش» یک
 * نتیجهٔ مستقیم تعادل ترمودینامیکی است، نه یک ثابت ساختگی.
 */
function flashOnsetBar(P1, inlet, ctx) {
  // ورودی از پیش دو‌فازی (x > ۰) در حالت اشباع است ⇒ Pv(T1) = P1 و فلاش از همان
  // دهانهٔ ورودی آغاز می‌شود. این شرط باید پیش از Pv کاربر بیاید: اگر کاربر Pv را
  // برای دمای دیگری (یا پیش‌فرض فرم) داده باشد، آن عدد با ورودیِ بخاردار نمی‌خواند
  // و مسیرِ فلاش را تا فشارهای بی‌ربط عقب می‌اندازد.
  if (inlet.x > 0) return P1;
  const Pv1 = inletVapourPressureBar(inlet.T_K, ctx);
  // ورودی اشباع/دو‌فازی (Pv ≥ P1): فلاش از همان ابتدا. ورودی زیرسرد: از Pv(T1).
  if (Pv1 == null || Pv1 >= P1) return P1;
  return Pv1 > 0 ? Pv1 : P1;
}

// ============================================================
// مدل ۱: HEM — همگن تعادلی با ادغام عددی مسیر فشار
// ============================================================

/**
 * ادغام ذوزنقه‌ای ∫v dp از P1 تا فشار گلوگاه با فلاش ایزنتروپیک تعادلی.
 *   G = sqrt(2·∫v dp)/v_throat   (برنولی روی ایزنتروپ + پیوستگی)
 * بررسی حد: v ثابت ⇒ G = sqrt(2·Δp·ρ) که همان برنولی مایع است.
 */
export function hemMassFlux({ P1, Pt, inlet, ctx, steps }) {
  if (!(Pt > 0) || Pt >= P1) return null;
  const n = Math.max(2, Math.round(steps));
  const onset = flashOnsetBar(P1, inlet, ctx);
  // حجم ویژهٔ مسیر: بالای نقطهٔ آغاز فلاش مایع تراکم‌ناپذیر، پایین‌تر از آن
  // حالت تعادلی. اگر خواص آن فشار از دامنهٔ جدول بیرون باشد null برمی‌گردد و
  // کل ادغام بی‌اعتبار می‌شود (یک عدد حدسی جای آن نمی‌گذاریم).
  const volAt = (q) => {
    if (q > onset) return 1 / inlet.rhoL;
    const eq = equilibriumSpecVolume(q, inlet, ctx);
    return eq == null ? null : eq.v;
  };
  let integral = 0;
  let prevP = P1;
  let prevV = volAt(P1);
  if (prevV == null) return null;
  for (let i = 1; i <= n; i++) {
    const p = i === n ? Pt : P1 - (i * (P1 - Pt)) / n; // گام آخر دقیقاً Pt
    const v = volAt(p);
    if (v == null) return null;
    integral += 0.5 * (prevV + v) * (prevP - p); // ∫ v dp (مثبت، چون p نزولی است)
    prevP = p;
    prevV = v;
  }
  if (!(integral > 0) || !(prevV > 0)) return null;
  // integral بر حسب bar·m³/kg است ⇒ ×1e5 می‌شود J/kg؛ G = √(2∫v dp)/v_throat
  return {
    G: Math.sqrt(2 * integral * 1e5) / prevV,
    vThroat: prevV
  };
}

/**
 * HEM با جست‌وجوی فشار گلوگاه: بیشینه‌سازی عددی G روی Pt ∈ [P2, P1).
 * اگر بیشینه داخل بازه باشد ⇒ خفگی (choked)؛ اگر در Pt=P2 باشد ⇒ غیرخفه.
 */
export function calcTwoPhaseHem(params) {
  const p = params || {};
  const err = validateInputs(p);
  if (err) return { error: err };
  const steps = Number.isFinite(p.steps) && p.steps > 1 ? p.steps : TWO_PHASE_DEFAULTS.steps;

  return assembleTwoPhaseResult({
    model: "hem",
    params: p,
    solve: (inlet, ctx) => {
      const scanN = 60;
      // اگر فلاش در مسیر رخ نمی‌دهد (P2 ≥ Pv(T1)) کل مسیر تراکم‌ناپذیر است و
      // ادغام به همان برنولی مایع/مخلوط می‌رسد؛ صریح و پیش از جست‌وجو می‌نویسیمش
      // تا نه خطای عددی ادغامِ طولانی حد درست را جابه‌جا کند و نه دامنهٔ جدول خواص.
      const onset = flashOnsetBar(p.P1, inlet, ctx);
      if (p.P2 >= onset) {
        const rho = mixtureDensity({ x: inlet.x, rhoL: p.rhoL, rhoG: inlet.rhoG });
        if (rho > 0) {
          return {
            G: Math.sqrt(2 * (p.P1 - p.P2) * 1e5 * rho),
            vThroat: 1 / rho,
            throatP: p.P2,
            etaCritical: null,
            choked: false,
            extraNote: "P2 ≥ Pv(T1) ⇒ در هیچ نقطه‌ای از شیر بخار تولید نمی‌شود؛ HEM به برنولی تک‌فازی تقلیل می‌یابد",
            extraNoteEn: "P2 >= Pv(T1) => no vapour is generated anywhere inside the valve; HEM reduces to single-phase Bernoulli"
          };
        }
      }
      let best = null;
      let skipped = 0;
      for (let i = 0; i <= scanN; i++) {
        // گام آخر دقیقاً P2 (سرریز فلات‌پوینت زیرِ دامنهٔ جدول خواص نرود)
        const Pt = i === scanN ? p.P2 : p.P1 - (i * (p.P1 - p.P2)) / scanN;
        const r = hemMassFlux({ P1: p.P1, Pt, inlet, ctx, steps });
        // اگر مسیر از دامنهٔ خواص بیرون زد این آزمون کنار می‌رود (نه یک شار غلط)
        if (!r || !(r.G > 0)) { skipped++; continue; }
        if (!best || r.G > best.G) best = { ...r, Pt };
      }
      if (!best) {
        return { error: "No throat state on the pressure path has usable saturation properties — the steam table covers 0.2 … 200 bar and Clausius–Clapeyron only near the anchor pressure. For water leave MW empty so the steam table is used, otherwise supply Pv/Pc at the flowing temperature or reduce the drop" };
      }
      // پهنای گام جست‌وجو: اگر بیشینه یک گام بالاتر از P2 باشد، خفه تلقی می‌شود
      const searchWidth = (p.P1 - p.P2) / scanN;
      const choked = best.Pt > p.P2 + searchWidth * 0.5;
      const appliedPt = choked ? best.Pt : p.P2;
      return {
        G: best.G,
        vThroat: best.vThroat,
        throatP: appliedPt,
        // ηc فقط وقتی معنادار است که مسیر واقعاً به بیشینهٔ شار برسد
        etaCritical: choked ? +(appliedPt / p.P1).toFixed(3) : null,
        choked,
        skippedTrials: skipped,
        extraNote: skipped > 0
          ? skipped + " آزمون فشار گلوگاه بیرون از دامنهٔ جدول خواص (۰٫۲ … ۲۰۰ bar آب) بود و کنار گذاشته شد"
          : null
      };
    },
    notes: [
      "HEM: ادغام عددی ∫v dp روی مسیر ایزنتروپیک تعادلی با " + steps + " گام ذوزنقه‌ای",
      "فشار گلوگاه از بیشینه‌سازی عددی شار جرمی (۶۰ آزمون روی بازهٔ فشار) می‌آید",
      "فرض‌ها: no-slip، تعادل کامل در گلوگاه، ρG(p) از گاز ایده‌آل روی نقطهٔ واقعی ورودی",
      "HEM تعادل کامل می‌گیرد ⇒ نسبت به واقعیتِ فلشینگ (تأخیر بخارزدن) ظرفیت را بیش‌ازحد و Cv را کم‌تر می‌دهد؛ نسبت به ω (که آن هم تعادلی است) فقط چند دهم درصد — این تفاوت را «خوش‌بینی» نام نکنید",
      "خفگی کاویتاسیونی مایع (FL/FF) در این مدل نیست؛ برای مایع زیرسرد calcLiquidCv را استفاده کنید"
    ]
  });
}

// ============================================================
// مدل ۲: HNE — همگن غیرتعادلی (سبک Sheldon–Schreuder) با ضریب N
// ============================================================

/**
 * تخمین زمان اقامت در گلوگاه (محاسبهٔ راهنما، نه بخشی از همبستگی):
 *   d_throat = √(4A/π) با A از همان Cv (قطر معادل گلوگاه، نه بدنهٔ شیر)
 *   u_throat = G·v_throat (سرعت مخلوط در گلوگاه از پیوستگی جرمی)
 *   τ ≈ ۱٫۵·d_throat/u_throat
 * طول مسیر = ۱٫۵× قطر (فرض هندسی مستند؛ نسبت رایج L/D برای نشیمن).
 * آزمون: آب اشباع ۱۰→۱٫۵ bar با G ≈ ۶۵۰۰ و v_t ≈ ۰٫۰۰۳۱ ⇒ u ≈ ۲۰ m/s
 * و τ ≈ ۴ ms؛ در حد چند میلی‌ثانیه برای فلاش کامل آب کم است ⇒ عدم‌تعادل.
 */
function residenceTimeMs(G, vThroat, Cv) {
  const areaM2 = Number.isFinite(Cv) && Cv > 0 ? Cv * CV_TO_AREA_M2 : NaN;
  const dM = areaM2 > 0 ? Math.sqrt((4 * areaM2) / Math.PI) : NaN;
  const u = G * vThroat; // m/s (سرعت حجمی مخلوط در گلوگاه)
  if (!(dM > 0) || !(u > 0)) return null;
  return +((1.5 * dM / u) * 1000).toFixed(2);
}

export function calcTwoPhaseHne(params) {
  const p = params || {};
  const err = validateInputs(p);
  if (err) return { error: err };
  const N = Number.isFinite(p.N) && p.N > 0 ? p.N : TWO_PHASE_DEFAULTS.N;
  const steps = Number.isFinite(p.steps) && p.steps > 1 ? p.steps : TWO_PHASE_DEFAULTS.steps;

  return assembleTwoPhaseResult({
    model: "hne",
    params: p,
    solve: (inlet, ctx) => {
      const hem = calcTwoPhaseHem({ ...p, steps });
      if (hem.error) return hem;
      const G = hem.massFlux / N; // N>1 ⇒ ظرفیت کمتر ⇒ Cv بیشتر
      // حجم ویژهٔ گلوگاه از HEM می‌آید (همان نقطهٔ خفگی)؛ تقسیم شار بر N
      // زمان اقامت را بلندتر می‌کند و در نتیجهٔ τ لحاظ می‌شود.
      const vThroat = hem.throatSpecificVolumeM3kg > 0
        ? hem.throatSpecificVolumeM3kg
        : 1 / inlet.rhoM;
      return {
        G,
        vThroat,
        throatP: hem.choked ? hem.criticalPressureRatio * p.P1 : p.P2,
        etaCritical: hem.choked ? hem.criticalPressureRatio : null,
        choked: hem.choked,
        hemCv: hem.Cv,
        residenceMs: residenceTimeMs(G, vThroat, hem.Cv * N)
      };
    },
    notes: [
      "HNE (Sheldon–Schreuder): شار HEM تقسیم بر ضریب عدم‌تعادل N = " + N,
      "جهت تصحیح از اندازه‌گیری‌های فلشینگ آب است؛ قدر آن به تریم وابسته است",
      "N در بازهٔ ۱٫۰ (تعادل کامل) تا ۲٫۰ (عدم‌تعادل شدید) انتخاب شود — کاربر-پذیر",
      "این موتور ثابت زمان اقامت منتشرشده‌ای را نمی‌شناسد، پس عدد را اختراع نکرده است"
    ]
  });
}

// ============================================================
// مدل ۳: روش ω لوینگ (AIChE / بندهای پیوست II روش API 520 و IEC 60534-2-1)
// ============================================================

/**
 * تعریف دو‌نقطه‌ای ω:  ω = 9·(v9/vs − 1) با p9 = 0.9·Ps.
 * ضریب ۹ از همان نقطهٔ نمونه‌گیری می‌آید، نه یک ثابت جدولی:
 * مسیر ω  v(p) = vs·(1 + ω·(Ps/p − 1))  ⇒ در p = 0.9·Ps دقیقاً
 * v9/vs = 1 + ω·(1/0.9 − 1) = 1 + ω/9  ⇒  ω = 9·(v9/vs − 1).
 * اگر به‌جای ۰٫۹ از r نمونه بگیریم ضریب ۱/(۱/r − ۱) می‌شود (r = ۰٫۹۵ ⇒ ۱۹ ⇒ ۲۰)؛
 * پس p9Ratio کاربر-پذیر است و ضریب هم از آن مشتق می‌شود، حدس نیست.
 */
export function calcOmega({ P1, vs, v9, p9Ratio = 0.9 }) {
  if (!(P1 > 0) || !(vs > 0) || !(v9 > 0)) return null;
  const r = Number.isFinite(p9Ratio) && p9Ratio > 0 && p9Ratio < 1 ? p9Ratio : 0.9;
  const omega = (v9 / vs - 1) / (1 / r - 1);
  return omega > 0 ? +omega.toFixed(3) : 0;
}

/**
 * شرط بحرانی ω: بیشینه‌سازی G(η) روی حجم‌ویژهٔ مسیر لوینگ.
 *
 * مسیر: v(p)/vs = 1 + ω·(Ps/p − 1)  ⇒ در گلوگاه v_t/vs = S = 1 − ω + ω/η
 * انرژی (شامل سرِ مایعِ زیرسرد از P1 تا Ps):
 *   ∫v dp = vs·Ps·[β + (1−ω)(1−η) + ω·ln(1/η)]،  β = (P1 − Ps)/Ps
 *   G² = 2∫v dp/v_t² = (2·Ps/vs)·[β + (1−ω)(1−η) + ω·ln(1/η)] / [1 − ω + ω/η]²
 * مشتق‌گیری صریح (dG/dη = 0) می‌دهد:
 *   F(η) = [(1−ω)η + ω]² − 2ω·[β + (1−ω)(1−η) − ω·ln η] = 0
 * که برای β = ۰ (ورودی اشباع) با بازکردن پرانتزها به فرم منتشرشدهٔ لوینگ
 * تبدیل می‌شود: (1−ω)²η² + 4ω(1−ω)η + 3ω² − ۲ω + ۲ω²·ln η = 0 — یعنی همان
 * معادله، نه یک ادعای استنادی.
 * F(0⁺) = −∞ و F(1⁻) = 1 − 2ωβ. اگر F(1) < ۰ باشد ریشه‌ای در بازه نیست:
 * شارِ بیشینه همان‌جا که فلاش شروع می‌شود به‌دست می‌آید ⇒ ηc ≈ ۱
 * (خفگی فوری؛ رفتار قابل‌انتظار مایع با زیرسرد زیاد).
 * بیسکشن ۴۰ گام، بدون وابستگی خارجی.
 */
export function omegaCriticalPressureRatio(omega, beta = 0) {
  if (!Number.isFinite(omega)) return null;
  if (omega <= 0) return 0; // مایع تراکم‌ناپذیر: خفگی ترمودینامیکی ندارد
  const w = Math.min(omega, 1000);
  const b = Number.isFinite(beta) && beta > 0 ? beta : 0;
  const F = (eta) => {
    if (!(eta > 0) || eta >= 1) return null;
    const lin = (1 - w) * eta + w;
    return lin * lin - 2 * w * (b + (1 - w) * (1 - eta) - w * Math.log(eta));
  };
  let lo = 1e-9;
  let hi = 1 - 1e-12;
  const fLo = F(lo);
  const fHi = F(hi);
  if (fLo == null || fHi == null) return null;
  if (fLo > 0) return 0;             // هیچ ریشه‌ای در بازه نیست ⇒ خفگی عملاً نمی‌رسد
  // ریشه بیرون از بازه ⇒ گلو بلافاصله پس ازآغاز فلاش خفه می‌شود.
  // قدر را ۰٫۹۹۹۹۹۹ می‌بندیم (نه دقیقاً ۱) تا فرمول شار همچنان متناهی بماند؛
  // شار حاصل آن‌گاه همان برنولی مایع تا Ps است: G = sqrt(۲·(P1−Ps)·ρL).
  if (fHi < 0) return 0.999999;
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi);
    const fMid = F(mid);
    if (fMid == null) break;
    if (fMid > 0) hi = mid;
    else lo = mid;
  }
  return +(0.5 * (lo + hi)).toFixed(4);
}

/**
 * شار جرمی ω (kg/m²·s):
 *   G² = (2·Ps/vs)·[β + (1−ω)(1−η) + ω·ln(1/η)]/(1 − ω + ω/η)²
 * در این تابع P1 همان «لنگهٔ اشباع» Ps است (P1 یا Pv(T1) اگر زیرسرد باشد) و
 * β = (P1_واقعی − Ps)/Ps سرِ بی‌بُعدِ مایعِ پیش‌اشت؛ η = P2/Ps.
 * حد ω→0 با β=۰: G² = 2·Ps(1−η)/vs = 2·Δp·ρ (برنولی مایع ✓)
 * حد ω→0 با β>۰: Ps·(β+1−η) = (P1−Ps)+Ps−P2 = P1−P2 ⇒ برنولی روی کل افت ✓
 * حد ω=1/k (بخار ایده‌آل، خفه): G² ~۲–۴٪ زیر فرم بستهٔ گاز (محافظه‌کارانه)
 */
export function omegaMassFlux({ P1, vs, omega, eta, beta = 0 }) {
  if (!(P1 > 0) || !(vs > 0) || !(eta > 0) || eta >= 1) return null;
  const psPa = P1 * 1e5;
  const w = Math.min(omega, 1000);
  if (w <= 1e-9) return Math.sqrt((2 * psPa * (beta + 1 - eta)) / vs);
  const num = beta + (1 - w) * (1 - eta) + w * Math.log(1 / eta);
  const den = (1 - w + w / eta) * (1 - w + w / eta);
  const G2 = (2 * psPa / vs) * (num / den);
  if (!Number.isFinite(G2) || G2 <= 0) {
    // واگرایی عددی نزدیک η→1 یا ω بسیار بزرگ: بازگشت به حد مایع
    return Math.sqrt((2 * psPa * (beta + 1 - eta)) / vs);
  }
  return Math.sqrt(G2);
}

export function calcTwoPhaseOmega(params) {
  const p = params || {};
  const err = validateInputs(p);
  if (err) return { error: err };
  const p9Ratio = Number.isFinite(p.p9Ratio) && p.p9Ratio > 0 && p.p9Ratio < 1 ? p.p9Ratio : TWO_PHASE_DEFAULTS.p9Ratio;

  return assembleTwoPhaseResult({
    model: "omega",
    params: p,
    solve: (inlet, ctx) => {
      const vs = inlet.v;
      // لنگهٔ روش ω «حالت اشباع» است، نه خودِ P1. اگر مایع زیرسرد باشد فلاش از
      // Ps = Pv(T1) شروع می‌شود و نقطهٔ دوم باید پایین‌تر از Ps نمونه گرفته شود
      // (ساختار بند API 520 برای مایع زیرسرد). سه شاخه:
      //   ۱) P2 ≥ Ps: در کل مسیر هیچ فلاشی رخ نمی‌دهد ⇒ مایع تک‌فازی، ω = ۰،
      //      برنولی روی ΔP کامل (هم‌حدی با calcLiquidCv در آزمون x→۰).
      //   ۲) Ps = P1 (ورودی اشباع/دو‌فازی): لنگه = P1، β = ۰، نقطهٔ دوم ۰٫۹·P1.
      //   ۳) P2 < Ps < P1 (ورودی زیرسردِ فلاش‌کننده داخل شیر): لنگه = Ps و
      //      β = (P1 − Ps)/Ps همان «سرِ» برنولی مایعِ پیش‌اشت از P1 تا Ps است.
      //      β در هر دو معادله (شار و شرط خفگی) لحاظ می‌شود، وگرنه ω شار را
      //      کم‌برآورد می‌کند و Cv را بی‌دلیل بزرگ‌تر از HEM می‌دهد (خطای جهت‌دار).
      //      با β: ω→۰ دقیقاً برنولی مایع روی کل ΔP را بازمی‌گرداند.
      const psat = flashOnsetBar(p.P1, inlet, ctx);
      const flashes = p.P2 < psat;
      const refP = flashes ? psat : p.P1;
      const beta = flashes && psat < p.P1 ? (p.P1 - psat) / psat : 0;
      const p9 = p9Ratio * refP;
      let v9 = vs;
      if (flashes && p9 < refP) {
        const eq = equilibriumSpecVolume(p9, inlet, ctx);
        // خواص اشباع در p9 در دسترس نیست ⇒ ω ساخته نمی‌شود (عدد ساختگی نمی‌دهیم)
        if (eq == null) {
          return { error: "The omega two-point flash needs saturation properties at p9 = " + p9.toFixed(3) + " bar, which are outside the property source in use (steam table 0.2 … 200 bar; Clausius–Clapeyron only within 2× of the anchor pressure). For water leave MW empty, otherwise supply Pv at the inlet temperature or reduce the drop" };
        }
        v9 = eq.v;
      }
      const omega = calcOmega({ P1: refP, vs, v9, p9Ratio });
      const etaApplied = p.P2 / refP;
      const etaC = omegaCriticalPressureRatio(omega, beta);
      const choked = etaC != null && etaC > 0 && etaApplied <= etaC;
      const etaEff = choked ? etaC : etaApplied;
      const G = omegaMassFlux({ P1: refP, vs, omega: omega || 0, eta: etaEff, beta });
      const liquidLimit = !(omega > 1e-6);
      return {
        G,
        omega,
        // حجم ویژهٔ مسیر ω در گلوگاه: v(η) = vs·(1 − ω + ω/η)
        vThroat: vs * (1 - (omega || 0) + (omega || 0) / etaEff),
        throatP: choked ? etaC * refP : p.P2,
        saturationPressureBar: +psat.toFixed(4),
        // ηc را همیشه برمی‌گردانیم (ویژگی مدل است)؛ شاخهٔ خفگی را choked می‌گوید
        etaCritical: liquidLimit ? null : etaC,
        choked,
        // برای یادداشت انگلیسی PDF
        beta: +beta.toFixed(4),
        anchorPressureBar: +refP.toFixed(3),
        p9Ratio,
        extraNote: liquidLimit
          ? "ω ≈ ۰ (تا فشار خروجی هیچ بخاری تولید نمی‌شود: P2 ≥ Pv(T1)) ⇒ روش ω به برنولی مایع تقلیل می‌یابد؛ " +
            "خفگی کاویتاسیونی (FL/FF) در آن نیست و برای مایع زیرسرد calcLiquidCv معتبرتر است"
          : "ω = " + (+omega).toFixed(2) + " از فلاش دو‌نقطه‌ای در p9 = " + p9Ratio + "·" +
            (psat < p.P1 ? "Ps (اشباع، ورودی زیرسرد)" : "P1 (ورودی اشباع)") + " = " + refP.toFixed(3) +
            " bar، ηc = " + (etaC != null ? (+etaC).toFixed(3) : "—") + " از حل عددی معادلهٔ متعالی" +
            (beta > 0 ? "؛ سرِ مایعِ زیرسرد β = (P1−Ps)/Ps = " + (+beta).toFixed(3) + " در شار و شرط خفگی لحاظ شد" : ""),
        extraNoteEn: liquidLimit
          ? "omega ~ 0 (no vapour is generated up to the outlet: P2 >= Pv(T1)) => the omega method reduces to liquid Bernoulli; it then carries no cavitation choking (FL/FF), where calcLiquidCv is the better basis"
          : "omega = " + (+omega).toFixed(2) + " from the two-point flash at p9 = " + p9Ratio + " x " +
            (psat < p.P1 ? "Ps (saturated anchor, subcooled inlet)" : "P1 (saturated inlet)") + " = " + refP.toFixed(3) +
            " bar, eta_c = " + (etaC != null ? (+etaC).toFixed(3) : "n/a") + " from the numerical solution of the transcendental equation" +
            (beta > 0 ? "; the subcooled-liquid head beta = (P1 - Ps)/Ps = " + (+beta).toFixed(3) + " was applied to both the flux and the choking criterion" : "")
      };
    },
    notes: [
      "روش ω لوینگ (AIChE / پیوست روش دو‌فازی API 520 و IEC 60534-2-1): دفاع‌پذیرترین گزینه",
      "مسیر انبساط: v(p) = vs·(1 + ω·(Ps/p − 1)) — خطی در ۱/p، نه ادغام کامل خواص",
      "لنگهٔ فشار = حالت اشباع (Ps = Pv(T1) یا P1 اگر ورودی اشباع است)؛ افت P1→Ps به‌صورت سرِ β = (P1−Ps)/Ps در شار افزوده می‌شود",
      "ηc از حل عددی (بیسکشن ۴۰ گام) معادلهٔ متعالی ω به‌دست می‌آید",
      "دو‌نقطه‌ای بودن ω یعنی فقط شیب حجم/فشار نزدیک Ps را می‌بیند؛ حساسیت به نقطهٔ نمونه (p9Ratio) تخمین را جابه‌جا می‌کند"
    ]
  });
}

// ============================================================
// مدل ۴: جمع سادهٔ Cv_l + Cv_g (مبنای مقایسه — crude)
// ============================================================

/**
 * Cv = Cv_مایع(بخش مایع، با کامل ΔP) + Cv_گاز(بخش بخار).
 * عمداً «crude» علامت‌گذاری شده:Interaction دو فازی، تولید بخار در گلوگاه و
 * کاهش چگالی مخلوط را نادیده می‌گیرد و برای فلشینگ معمولاً شیر را کوچک‌تر
 * از حد لازم پیشنهاد می‌کند (کمتر از واقع — خطرناک، نه محافظه‌کارانه).
 */
export function calcTwoPhaseAdditive(params) {
  const p = params || {};
  const err = validateInputs(p);
  if (err) return { error: err };
  const k = Number.isFinite(p.k) ? p.k : TWO_PHASE_DEFAULTS.k;
  const Z = Number.isFinite(p.Z) && p.Z > 0 ? p.Z : 1;
  const MW = Number.isFinite(p.MW) && p.MW > 0 ? p.MW : TWO_PHASE_DEFAULTS.MW;
  const FL = Number.isFinite(p.FL) ? p.FL : TWO_PHASE_DEFAULTS.FL;
  const xT = Number.isFinite(p.xT) ? p.xT : TWO_PHASE_DEFAULTS.xT;

  const T_C = Number.isFinite(p.T) ? p.T : 0;
  const T_K = T_C + 273.15;
  // اگر rhoG داده نشده، از گاز ایده‌آل در دمای ورودی می‌سازیم
  const rhoG = Number.isFinite(p.rhoG) && p.rhoG > 0 ? p.rhoG : (p.P1 * 1e5 * MW * 1e-3) / (Z * 8.314 * T_K);
  const rhoL = p.rhoL;

  // بخش مایع: دبی حجمی مایع در شرایط جاری، Gf = ρL/ρآب (۹۹۹ kg/m³ در ۶۰°F).
  // Pv عمداً صفر گرفته می‌شود: مدل جمع ساده فلاش را در بخش مایع نمی‌بیند
  // (همان ساده‌سازی خامی که آن را غیرقابل‌اتکا می‌کند) و تنها سقف فیزیکی
  // بازیافت FL²·P1 باقی می‌ماند. بدون Pv، calcLiquidCv مقدار Ff را نمی‌سازد.
  const qL = ((1 - p.x) * p.W) / rhoL; // m³/h
  const liq = calcLiquidCv({
    Q: qL,
    Gf: rhoL / 999,
    P1: p.P1,
    P2: p.P2,
    Pv: 0,
    Pc: p.Pc,
    FL
  });

  // بخش بخار: kg/h → Nm³/h با چگالی نرمال ρN = MW/22.414 kg/Nm³
  // (مول‌ولار حجم ۲۲٫۴۱۴ L/mol در ۰°C و ۱ atm — عدد استوکیومتری استاندارد)
  const rhoNormal = MW / 22.414;
  const qG = (p.x * p.W) / rhoNormal; // Nm³/h
  const gas = calcGasCv({
    Q: qG,
    Gg: MW / 28.96, // نسبت به هوا (۲۸٫۹۶ g/mol)
    T: T_C,
    P1: p.P1,
    P2: p.P2,
    Z,
    k,
    xT
  });

  if (liq.error || gas.error) return { error: liq.error || gas.error };
  const cvSum = liq.Cv + gas.Cv;
  if (!(cvSum > 0)) return { error: "The additive model needs a positive single-phase Cv from at least one phase" };

  return assembleTwoPhaseResult({
    model: "additive",
    params: { ...p, rhoG, x: p.x },
    solve: (inlet) => {
      // شار معادل از همان Cv (=W/3600/A) — برای مقایسه با بقیهٔ مدل‌ها
      const G = (p.W / 3600) / (cvSum * CV_TO_AREA_M2);
      return {
        fromCv: +cvSum.toFixed(2),
        G,
        // این مدل گلوگاه نمی‌شناسد؛ سرعت مخلوط با چگالی ورودی گرفته می‌شود
        vThroat: inlet.v,
        throatP: p.P2,
        etaCritical: null,
        choked: liq.choked === true || gas.choked === true,
        extraNote: "Cv_مایع = " + liq.Cv + " + Cv_بخار = " + gas.Cv + " (مدل جمع ساده، crude)",
        extraNoteEn: "Cv_liquid = " + liq.Cv + " + Cv_vapour = " + gas.Cv + " (additive model, crude by construction)"
      };    },
    notes: [
      "مدل جمع ساده (crude): Cv = Cv_مایع + Cv_بخار — فقط برای مقایسه",
      "تعامل دو‌فازی و تولید بخار در گلوگاه را نادیده می‌گیرد",
      "برای فلشینگ معمولاً Cv را به‌شدت کم‌تر از ω/HEM پیشنهاد می‌کند (اعتماد نکنید)"
    ]
  });
}

// ============================================================
// تجمیع نتیجه — ساختار خروجی یکسان برای هر چهار مدل
// ============================================================

function assembleTwoPhaseResult({ model, params: raw, solve, notes }) {
  const p = raw || {};
  const MW = Number.isFinite(p.MW) && p.MW > 0 ? p.MW : TWO_PHASE_DEFAULTS.MW;
  const Z = Number.isFinite(p.Z) && p.Z > 0 ? p.Z : 1;
  const Kd = Number.isFinite(p.Kd) && p.Kd > 0 ? p.Kd : TWO_PHASE_DEFAULTS.Kd;
  // در حد مایع خالص (x = ۰) چگالی بخار در وزن مخلوط هیچ نقشی ندارد؛
  // آن را برابر rhoL می‌گذاریم تا mixtureDensity مقدار بدهد.
  const rhoG = Number.isFinite(p.rhoG) && p.rhoG > 0 ? p.rhoG : p.rhoL;

  const T_K = Number.isFinite(p.T) ? p.T + 273.15 : TWO_PHASE_DEFAULTS.TrefK;
  const ctx = buildPropertyContext({
    T: p.T, Pv: p.Pv, Pc: p.Pc, MW, k: p.k,
    cpL: p.cpL, hfgRef: p.hfgRef, TrefK: p.TrefK, watsonN: p.watsonN, Z
  });
  const Tsat1K = inletSatTempK(p.P1, ctx);
  // اگر ورودی دو‌فازی است، دمای جریان دمای اشباع در P1 است (فرض تعادل در مخزن).
  const inletT_K = p.x > 0 && Tsat1K != null ? Tsat1K : T_K;
  const rhoM1 = mixtureDensity({ x: p.x, rhoL: p.rhoL, rhoG });
  const inlet = {
    x: p.x,
    P1: p.P1,
    rhoL: p.rhoL,
    rhoG,
    T_K: inletT_K,
    rhoM: rhoM1,
    v: rhoM1 != null ? 1 / rhoM1 : null
  };
  if (!(inlet.v > 0)) return { error: "Invalid mixture specific volume — check rhoL/rhoG" };

  const sol = solve(inlet, ctx);
  if (sol && sol.error) return sol;

  let Cv = sol.fromCv;
  let areaMm2 = sol.areaMm2;
  let G = sol.G;
  if (Cv == null) {
    const conv = fluxToCv(p.W, G, Kd);
    Cv = conv.Cv;
    areaMm2 = conv.areaMm2;
  }
  if (Cv == null || !(G > 0)) return { error: "Mass flux could not be computed for these inputs" };
  if (areaMm2 == null) areaMm2 = Cv * CV_TO_AREA_MM2;

  const Kv = +(Cv / CV_PER_KV).toFixed(2);
  const size = cvToSize(Cv);

  // کیفیت و چگالی خروجی از فلاش آنتالپیک (حالت پایین‌دست با بالانس انرژی تعیین می‌شود)
  const out = flashIsenthalpic({
    P1: p.P1, P2: p.P2, T1_K: inlet.T_K, x1: p.x, rhoL: p.rhoL, rhoG,
    Pv: p.Pv, Pc: p.Pc, T: p.T, MW, cpL: p.cpL, hfgRef: p.hfgRef, TrefK: p.TrefK, watsonN: p.watsonN, Z, k: p.k
  });
  const rhoM2 = out.rhoM != null ? out.rhoM : rhoM1;
  const qOutM3h = rhoM2 > 0 ? p.W / rhoM2 : 0;
  // حالت خروجی معلوم نیست ⇒ سرعت مخلوط خروجی هم معلوم نیست (qOutM3h تنها یک
  // کران پایین با چگالی ورودی است، نه دبی واقعی پایین‌دست).
  const outletKnown = out.x != null;
  const outletVelocityMps = outletKnown ? bodyVelocity(qOutM3h, size) : null;
  const vThroat = sol.vThroat > 0 ? sol.vThroat : inlet.v;
  const residenceMs = sol.residenceMs != null
    ? sol.residenceMs
    : residenceTimeMs(G, vThroat, Cv);

  const allNotes = [
    ...notes,
    "منبع خواص: " + (ctx.useWaterTable ? "جدول IAPWS-IF97 (steamSaturationTempC)" : "Clausius–Clapeyron با شیب محلی نقطهٔ لنگر") +
      "، واتسون n=" + ctx.watsonN + "، hfg_ref=" + ctx.hfgRef + " kJ/kg@" + ctx.TrefK.toFixed(0) + "K" +
      (ctx.TcK == null ? " (Tc نامعلوم ⇒ hfg در مسیر ثابت فرض شد)" : ""),
    "no-slip (سرعت یکسان دو فاز) فرض شده؛ slip معمولاً ظرفیت را کم می‌کند",
    "Kd مؤثر = " + Kd + (Kd >= 1 ? " (اوریفیس ایده‌آل — نتیجه خوش‌بینانه)" : " (حاشیهٔ دبی تریم لحاظ شده)"),
    "زمان اقامت تخمینی در گلوگاه ≈ " + (residenceMs != null ? residenceMs + " ms" : "محاسبه نشد") +
      " (طول مسیر ≈ ۱٫۵× قطر معادل گلوگاه، u = G·v_throat — فرض هندسی)",
    "این خروجی یک برآورد اولیه است، نه محاسبهٔ اعتباریسازی‌شدهٔ IEC 60534"
  ];
  if (sol.extraNote) allNotes.splice(1, 0, sol.extraNote);
  if (sol.hemCv != null) allNotes.splice(1, 0, "Cv معادل HEM = " + sol.hemCv + " (نسبت HNE/HEM = " + (Cv / sol.hemCv).toFixed(2) + ")");
  if (!outletKnown) {
    allNotes.splice(1, 0, "حالت خروجی محاسبه نشد: Tsat(P2 = " + p.P2 + " bar) بیرون از دامنهٔ منبع خواص (" +
      (ctx.useWaterTable ? "جدول بخار ۰٫۲ … ۲۰۰ bar" : "کلازیوس–کلاپیرون، فقط تا دو‌برابر فشار لنگر") +
      ") است ⇒ دبی حجمی گزارش‌شده با چگالی ورودی (کران پایین) حساب شده، نه دبی واقعی پایین‌دست");
  }

  return {
    model,
    Cv: +Cv.toFixed(2),
    Kv,
    areaMm2: +areaMm2.toFixed(2),
    // Kd مؤثری که در مساحت لحاظ شده — برای شفافیت دیتاشیت
    Kd: +Number(Kd).toFixed(3),
    massFlux: +G.toFixed(1),
    throatSpecificVolumeM3kg: +vThroat.toFixed(6),
    choked: sol.choked === true,
    criticalPressureRatio: sol.etaCritical != null ? +sol.etaCritical.toFixed(3) : null,
    throatPressureBar: sol.throatP != null ? +sol.throatP.toFixed(3) : null,
    // آزمون‌های کناررفتهٔ فشار گلوگاه (فقط HEM/HNE) — برای یادداشت انگلیسی PDF
    throatTrialsSkipped: sol.skippedTrials == null ? null : sol.skippedTrials,
    // پارامترهای خودِ مدل — برای نمایش در UI و گزارش (omega فقط در روش لوینگ هست)
    omega: Number.isFinite(sol.omega) ? +sol.omega.toFixed(3) : null,
    saturationPressureBar: Number.isFinite(sol.saturationPressureBar) ? sol.saturationPressureBar : null,
    outletQuality: out.x != null ? +out.x.toFixed(4) : null,
    outletTempC: out.outletTempC != null ? out.outletTempC : null,
    // تفکیک «فلاش نشده» از «فلاش محاسبه نشد» — گزارش باید دومی را اعلام کند
    outletStateKnown: outletKnown,
    propertySource: out.propertySource || propertySourceId(ctx),
    outletVelocityMps: outletVelocityMps != null ? +outletVelocityMps.toFixed(2) : null,
    residenceTimeMs: residenceMs != null ? residenceMs : null,
    inletDensity: rhoM1 != null ? +rhoM1.toFixed(1) : null,
    outletDensity: outletKnown && rhoM2 != null ? +rhoM2.toFixed(1) : null,
    qActualM3h: +qOutM3h.toFixed(2),
    size,
    capacityExceeded: size.capacityExceeded,
    indicative: true,
    notes: allNotes,
    // همان یادداشت‌ها به انگلیسی — بخش یادداشت‌های دیتاشیت PDF فقط ASCII می‌پذیرد
    notesEn: buildEnglishNotes({ model, ctx, Kd, residenceMs, sol, out, p, Cv, hemCv: sol.hemCv }),
    warnings: buildTwoPhaseWarnings({
      model, Cv, hemCv: sol.hemCv, outletVelocityMps, x: p.x, P1: p.P1, P2: p.P2,
      Pv: p.Pv, choked: sol.choked === true, residenceMs, Kd,
      outletKnown, propertySource: out.propertySource || propertySourceId(ctx), MW
    })
  };
}

// یادداشت‌های انگلیسی برای دیتاشیت PDF (خروجی چاپی انگلیسی است؛ یادداشت‌های
// موتور فارسی‌اند و با فونت standard jsPDF قابل رندر نیستند)
const METHOD_NOTE_EN = {
  omega: "Leung omega method (AIChE; two-point variant of the API 520 two-phase flow and IEC 60534-2-1 appendix): expansion path v(p) = vs*(1 + omega*(Ps/p - 1)), linear in 1/p. eta_c from a 40-step bisection of the transcendental omega equation.",
  hem: "Homogeneous Equilibrium Model: numerical integral of v dp along the isentropic equilibrium path, trapezoidal steps; throat pressure from a numerical maximisation of the mass flux.",
  hne: "Homogeneous Non-Equilibrium: HEM mass flux divided by the non-equilibrium factor N (calibrated on flashing-water tests; trim-dependent).",
  additive: "Additive (crude) model Cv = Cv_liquid + Cv_vapour — comparison only, not a sizing basis."
};

function buildEnglishNotes({ model, ctx, Kd, residenceMs, sol, out, p, Cv, hemCv }) {
  const list = [METHOD_NOTE_EN[model] || "Two-phase model not identified."];
  if (sol.extraNoteEn) list.push(sol.extraNoteEn);
  if (hemCv != null && Cv != null) {
    list.push("HEM-equivalent Cv = " + hemCv + " (HNE/HEM ratio = " + (Cv / hemCv).toFixed(2) + ")");
  }
  if (model === "omega") {
    list.push("Pressure anchor = the saturated state (Ps = Pv(T1), or P1 when the inlet is saturated); the P1 -> Ps drop is carried as liquid head.");
    list.push("The two-point omega only sees the volume/pressure slope near Ps; moving the sample point (p9 = " + (sol.p9Ratio || 0.9) + " x anchor) shifts the estimate.");
  }
  if (model === "hem" || model === "hne") {
    list.push("Full equilibrium is assumed: for real flashing (vapour-generation lag) this overstates capacity and understates Cv. Compared with omega (also equilibrium) the difference is fractions of a percent — do not call it 'conservatism'.");
    if (sol.skippedTrials) {
      list.push(sol.skippedTrials + " throat-pressure trials fell outside the water property table (0.2 … 200 bar) and were discarded instead of using a wrong flux.");
    }
  }
  if (model === "additive") {
    list.push("Ignores two-phase interaction and vaporisation inside the throat; for flashing service it usually recommends a far smaller Cv than omega/HEM — do not rely on it.");
  }
  list.push("Property source: " + (ctx.useWaterTable
    ? "IAPWS-IF97 steam table (saturation temperature by pressure)"
    : "Clausius-Clapeyron saturation curve anchored at Pv, valid only within 2x of the anchor pressure") +
    "; Watson exponent n = " + ctx.watsonN + ", hfg_ref = " + ctx.hfgRef + " kJ/kg at " + ctx.TrefK.toFixed(0) + " K" +
    (ctx.TcK == null ? " (critical temperature unknown — hfg held constant along the path)" : "") + ".");
  list.push("No-slip assumed (both phases travel at the same velocity); slip normally reduces capacity.");
  list.push("Effective Kd = " + Kd + (Kd >= 1 ? " (ideal orifice — optimistic result)" : " (trim capacity margin included)") + ".");
  list.push("Throat residence time ~ " + (residenceMs != null ? residenceMs + " ms" : "not computed") +
    " (path length ~ 1.5 x equivalent throat diameter, u = G*v_throat — geometric assumption).");
  if (out.x == null) {
    list.push("Outlet flash state not computed: Tsat(P2 = " + p.P2 + " bar) is outside the property source in use, so the reported volumetric flow uses the inlet density (lower bound), not the true downstream flow.");
  }
  list.push("Preliminary estimate only — not a validated IEC 60534 two-phase calculation.");
  return list;
}

// ============================================================
// هشدارها — شیء { type, key, params, text } همان سبک موتور تک‌فازی
// ============================================================

function buildTwoPhaseWarnings({ model, Cv, hemCv, outletVelocityMps, x, P1, P2, Pv, choked, residenceMs, Kd, outletKnown, propertySource, MW }) {
  const warnings = [];
  const add = (type, key, params, text) => warnings.push({ type, key, params: params || {}, text });

  // حالت خروجی محاسبه نشده: عدد نمی‌سازیم، صریح اعلام می‌کنیم
  if (outletKnown === false) {
    add("danger", "propertiesOutOfRange", { P2, propertySource, MW },
      `Saturation properties at the outlet pressure P2 = ${P2} bar are outside the property source in use (${propertySource === "iapws-if97" ? "IAPWS steam table, 0.2 … 200 bar" : `Clausius–Clapeyron, only within 2× the anchor pressure at MW = ${MW}`}) — the outlet flash state is not computed, so outlet quality, temperature and velocity are left blank and the Cv above comes from the throat path only. For water, leave MW empty so the steam table is used`);
  }

  // ورودی اشباع/نزدیک اشباع: فلشینگ از همان دهانهٔ ورودی
  if (Number.isFinite(Pv) && Pv > 0 && Number.isFinite(P1) && P1 > 0) {
    const rel = Math.abs(P1 - Pv) / P1;
    if (rel <= 0.05) {
      add("danger", "nearSaturation", { P1, Pv, relDiff: +rel.toFixed(3), relDiffPct: +(rel * 100).toFixed(1) },
        `Inlet pressure P1 = ${P1} bar is within ${(+rel * 100).toFixed(1)}% of the vapour pressure Pv = ${Pv} bar — the fluid flashes at the valve inlet; two-phase sizing is mandatory here`);
    }
  }

  // ورودی از پیش دو‌فازی: فلاش از دهانهٔ ورودی است و Pvِ پایین‌تر از P1 بی‌اعتبار می‌شود
  if (x > 0) {
    const pvOverridden = Number.isFinite(Pv) && Pv > 0 && Pv < P1;
    add("info", "inletTwoPhase", { x, Pv, P1, type: pvOverridden ? "pv" : "plain" },
      `Inlet vapour fraction x = ${x}: the stream is already two-phase before the trim, so flashing starts at the valve inlet` +
      (pvOverridden ? ` — the vapour pressure entered (Pv = ${Pv} bar) is below P1 and was not used for the flash onset, because a saturated inlet has Pv = P1` : ""));
  }

  // کیفیت بخار بالا: معادلهٔ گاز تک‌فازی را توصیه می‌کنیم
  if (x > 0.7) {
    add("warning", "highVapourFraction", { x },
      `Vapour mass fraction x = ${x} (> 0.7) — the mixture behaves as a gas/flashing vapour; size with the single-phase gas equation and use this two-phase result only as a cross-check`);
  }

  // خوش‌بینی HEM فقط در برابر «عدم‌تعادل» است، نه در برابر ω: هر دو تعادلی‌اند.
  if (model === "hem") {
    add("info", "hemOptimistic", { Cv, model },
      "HEM assumes full equilibrium at the throat, so its Cv is a lower bound: real flashing service vapourises late (no equilibrium), which the HNE factor N or the omega method is meant to cover. Against the omega model itself the difference here is only a few percent — both are equilibrium models, so do not read hem-vs-omega as the safety margin");
  }
  if (model === "hne" && hemCv != null) {
    add("info", "hemOptimistic", { hemCv, hneCv: Cv, ratio: +(Cv / hemCv).toFixed(2) },
      `HEM needed Cv = ${hemCv} while the non-equilibrium (HNE) model needs ${Cv} — the equilibrium (HEM) result undersizes this flashing service by the factor N`);
  }
  if (model === "additive") {
    add("danger", "additiveCrude", { Cv, model },
      "The additive Cv = Cv_liquid + Cv_gas model ignores vapour generation and mixture density at the throat; it is shown only as a comparison and is not acceptable for flashing service design");
  }

  // خفگی
  if (choked) {
    add("warning", "choked", { model, Cv },
      `Choked (critical) two-phase flow in the ${model} model — the mass flux no longer rises with a deeper pressure drop; a larger valve or a lower ΔP is the only way to more flow`);
  }

  // سرعت مخلوط خروجی — راهنمای انرژی جنبشی (ISA RP75.23 طرز فکر، نه حد سخت)
  const limit = TWO_PHASE_DEFAULTS.velocityLimitMs;
  if (Number.isFinite(outletVelocityMps) && outletVelocityMps > limit) {
    add("warning", "dropSize", { velocity: outletVelocityMps, limit },
      `Outlet mixture velocity ${outletVelocityMps} m/s exceeds the ${limit} m/s guideline for flashing water (kinetic-energy thinking of ISA RP75.23, not a hard limit) — select a larger body or a downstream diffuser/expanded outlet`);
  }

  // زمان اقامت کوتاه ⇒ تعادل کامل بعید است
  if (Number.isFinite(residenceMs) && residenceMs < 1 && (model === "hem" || model === "omega")) {
    add("info", "shortResidence", { residenceMs },
      `Estimated trim residence time ≈ ${residenceMs} ms — too short for full phase equilibrium; the HNE/omega results are the more realistic ones`);
  }

  // ضریب دبی ایده‌آل
  if (Kd >= 1) {
    add("info", "idealKd", { Kd },
      "Ideal-orifice discharge coefficient (Kd = 1) used in the Cv↔area conversion; real trim Kd ≈ 0.85 would raise the required Cv by about 15%");
  }

  return warnings;
}

/**
 * هشدار اختلاف مدل‌ها — فقط وقتی همهٔ مدل‌ها اجرا شده‌اند معنی دارد.
 * spread = بزرگ‌ترین Cv / کوچک‌ترین Cv.
 */
function modelSpreadWarning(cvByModel) {
  const values = cvByModel.filter((v) => Number.isFinite(v) && v > 0);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ratio = max / min;
  if (ratio < TWO_PHASE_DEFAULTS.spreadFactor) return null;
  return {
    type: "warning",
    key: "modelSpread",
    params: { minCv: +min.toFixed(1), maxCv: +max.toFixed(1), ratio: +ratio.toFixed(2) },
    text: `Two-phase models disagree by ${ratio.toFixed(2)}x (Cv ${min.toFixed(1)} … ${max.toFixed(1)}). Flashing-service sizing is genuinely uncertain — state the model used and confirm with the valve manufacturer`
  };
}

// ============================================================
// API اصلی: انتخاب مدل و مقایسهٔ مدل‌ها
// ============================================================

const MODEL_RUNNERS = {
  hem: calcTwoPhaseHem,
  hne: calcTwoPhaseHne,
  omega: calcTwoPhaseOmega,
  additive: calcTwoPhaseAdditive
};

/**
 * سایزینگ دو‌فازی. model = "omega" (پیش‌فرض، دفاع‌پذیرترین) | "hem" | "hne" | "additive".
 * W در kg/h (جریان جرمی کل)، فشارها bar مطلق، rhoL/rhoG چگالی فازها در شرایط
 * ورودی (kg/m³)، x کسیر جرمی بخار.
 */
export function calcTwoPhaseCv(params) {
  const p = params || {};
  const model = p.model == null || p.model === "" ? "omega" : String(p.model).toLowerCase();
  const runner = MODEL_RUNNERS[model];
  if (!runner) {
    return { error: `Unknown two-phase model "${p.model}" — use omega, hem, hne or additive` };
  }
  return runner(p);
}

/**
 * اجرای هر چهار مدل روی یک ورودی مشترک برای نمایش پراکندگی در UI.
 * خروجی: [{ model, Cv, ratioVsOmega, error }] + هشدار modelSpread روی نتیجهٔ ω.
 */
export function compareTwoPhaseModels(params) {
  const p = params || {};
  const err = validateInputs(p);
  if (err) return { error: err, rows: [] };

  const omegaBase = calcTwoPhaseOmega(p);
  const rows = [];
  for (const model of ["omega", "hem", "hne", "additive"]) {
    const res = model === "omega" ? omegaBase : MODEL_RUNNERS[model](p);
    if (res.error) {
      rows.push({ model, Cv: null, ratioVsOmega: null, error: res.error });
    } else {
      const ratio = Number.isFinite(res.Cv) && Number.isFinite(omegaBase.Cv) && omegaBase.Cv > 0
        ? +(res.Cv / omegaBase.Cv).toFixed(3)
        : null;
      rows.push({
        model,
        Cv: res.Cv,
        ratioVsOmega: ratio,
        choked: res.choked,
        massFlux: res.massFlux,
        outletVelocityMps: res.outletVelocityMps,
        size: res.size ? res.size.size : null
      });
    }
  }

  const spread = modelSpreadWarning(rows.map((r) => r.Cv));
  const valid = rows.filter((r) => Number.isFinite(r.Cv));
  return {
    rows,
    Cv: omegaBase.Cv,
    Kv: omegaBase.Kv,
    size: omegaBase.size,
    model: "omega",
    ratioVsOmega: 1,
    minCv: valid.length ? Math.min(...valid.map((r) => r.Cv)) : null,
    maxCv: valid.length ? Math.max(...valid.map((r) => r.Cv)) : null,
    indicative: true,
    warnings: spread ? [...(omegaBase.warnings || []), spread] : (omegaBase.warnings || []),
    notes: [
      "پراکندگی مدل‌ها خودِ پیام مهندسی است: برای سرویس فلشینگ سایزینگ بین روش‌ها چند برابر فرق می‌کند",
      "برای تصمیم نهایی مدل را اعلام و با سازندهٔ شیر اعتبارسنجی کنید"
    ]
  };
}
