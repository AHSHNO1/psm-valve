"use client";
import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Ruler, Table2, TrendingUp } from "lucide-react";

// برچسب‌های چهارزبانه برای بخش جداول Cv کاتالوگ
const LABELS = {
  fa: {
    title: "منحنی و جدول Cv کاتالوگ",
    subtitle: "Cv در برابر درصد بازشدگی — دادهٔ مرجع کاتالوگ PSM",
    ratedCv: "Cv نامی",
    nps: "NPS",
    ratio50: "نسبت Cv در ۵۰٪",
    rangeability: "دامنهٔ تنظیم",
    characteristic: "مشخصه",
    size: "سایز",
    opening: "بازشدگی",
    cv: "Cv",
    ofRated: "٪ از نامی",
    selectSize: "انتخاب سایز",
    chart: "نمودار",
    table: "جدول",
    cta: "این شیر را سایز کن",
    note: "مقادیر Cv بر پایهٔ آب (gpm، ۶۰°F، افت ۱ psi) در هر درصد بازشدگی.",
    measuredBadge: "دادهٔ اندازه‌گیری‌شده",
    estimatedBadge: "برآورد مهندسی",
    mixedBadge: "اندازه‌گیری‌شده + برآورد",
    estimateNote: "این جدول دادهٔ اندازه‌گیری‌شدهٔ کارخانه نیست: Cv از قانون مقیاس‌پذیری روی سری‌های اندازه‌گیری‌شده به‌دست آمده (خط آزمونِ برگشتی {band}، سطح اعتماد {confidence}). برای سفارش، عدد باید با مهندسی PSM تأیید شود.",
    confidence: "سطح اعتماد",
    backTestError: "خط آزمون",
    chars: { linear: "خطی", equal: "درصد مساوی", quick: "سریع‌بازشو", modified: "اصلاح‌شده", unknown: "—" }
  },
  en: {
    title: "Catalogue Cv curve & table",
    subtitle: "Cv vs opening percentage — PSM reference catalogue data",
    ratedCv: "Rated Cv",
    nps: "NPS",
    ratio50: "Cv ratio at 50%",
    rangeability: "Rangeability",
    characteristic: "Characteristic",
    size: "Size",
    opening: "Opening",
    cv: "Cv",
    ofRated: "% of rated",
    selectSize: "Select size",
    chart: "Chart",
    table: "Table",
    cta: "Size this valve",
    note: "Cv values are water-based (gpm, 60°F, 1 psi drop) at each opening.",
    measuredBadge: "Measured data",
    estimatedBadge: "Engineering estimate",
    mixedBadge: "Measured + estimated",
    estimateNote: "This table is not manufacturer measured data: Cv comes from the scaling law fitted to the measured series (back-test error {band}, confidence {confidence}). Confirm with PSM engineering before ordering.",
    confidence: "Confidence",
    backTestError: "Back-test error",
    chars: { linear: "Linear", equal: "Equal %", quick: "Quick", modified: "Modified", unknown: "—" }
  },
  ar: {
    title: "منحنى وجدول Cv للكتالوج",
    subtitle: "Cv مقابل نسبة الفتح — بيانات الكتالوج PSM المرجعية",
    ratedCv: "Cv الاسمي",
    nps: "NPS",
    ratio50: "نسبة Cv عند 50%",
    rangeability: "مدى التحكم",
    characteristic: "الخاصية",
    size: "المقاس",
    opening: "الفتح",
    cv: "Cv",
    ofRated: "٪ من الاسمي",
    selectSize: "اختر المقاس",
    chart: "الرسم",
    table: "الجدول",
    cta: "حدّد حجم هذا الصمام",
    note: "قيم Cv مبنية على الماء (gpm، 60°F، انخفاض 1 psi) عند كل نسبة فتح.",
    measuredBadge: "بيانات مقاسة",
    estimatedBadge: "تقدير هندسي",
    mixedBadge: "مقاس + مقدّر",
    estimateNote: "هذا الجدول ليس بيانات مصنع مقاسة: قيمة Cv من قانون التنسيق المطابَق على السلاسل المقاسة (خطأ الاختبار {band}، الثقة {confidence}). يجب التأكد مع مهندسي PSM قبل الطلب.",
    confidence: "مستوى الثقة",
    backTestError: "خطأ الاختبار",
    chars: { linear: "خطي", equal: "متساوي %", quick: "سريع", modified: "معدّل", unknown: "—" }
  },
  ru: {
    title: "Кривая и таблица Cv каталога",
    subtitle: "Cv против процента открытия — справочные данные каталога PSM",
    ratedCv: "Номинальный Cv",
    nps: "NPS",
    ratio50: "Отношение Cv при 50%",
    rangeability: "Диапазон",
    characteristic: "Характеристика",
    size: "Размер",
    opening: "Открытие",
    cv: "Cv",
    ofRated: "% от номинала",
    selectSize: "Выберите размер",
    chart: "График",
    table: "Таблица",
    cta: "Подобрать размер",
    note: "Значения Cv для воды (gpm, 60°F, перепад 1 psi) при каждом открытии.",
    measuredBadge: "Измеренные данные",
    estimatedBadge: "Инженерная оценка",
    mixedBadge: "Измерено + оценка",
    estimateNote: "Это не измеренные заводские данные: Cv получены по степенному закону, подогнанному по измеренным сериям (погрешность бэк-теста {band}, достоверность {confidence}). Перед заказом подтвердите у инженеров PSM.",
    confidence: "Достоверность",
    backTestError: "Погрешность бэк-теста",
    chars: { linear: "Линейная", equal: "Равнопроцентная", quick: "Быстр. дейст.", modified: "Модиф.", unknown: "—" }
  }
};

// سطح اعتماد برآورد، همان class های scripts/estimate-cv.mjs
const CONFIDENCE_LABELS = {
  fa: { "very-low": "خیلی کم", low: "کم", medium: "متوسط", high: "زیاد" },
  en: { "very-low": "very low", low: "low", medium: "medium", high: "high" },
  ar: { "very-low": "منخفضة جدا", low: "منخفضة", medium: "متوسطة", high: "عالية" },
  ru: { "very-low": "очень низкая", low: "низкая", medium: "средняя", high: "высокая" }
};

function fmt(value, digits) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(digits == null ? 2 : digits).replace(/\.?0+$/, "");
}

export default function ProductCvCatalog({ locale, seriesId, openings: openingsProp, sizes: sizesProp, provenance = "measured", estimate = null, productSlug }) {
  const L = LABELS[locale] || LABELS.en;
  const rtl = locale === "fa" || locale === "ar";
  const openings = Array.isArray(openingsProp) && openingsProp.length
    ? openingsProp
    : [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const sizes = useMemo(() => {
    const list = Array.isArray(sizesProp) ? sizesProp : [];
    return list.slice().sort((a, b) => (a.dnMm == null ? 1e9 : a.dnMm) - (b.dnMm == null ? 1e9 : b.dnMm));
  }, [sizesProp]);

  const [dn, setDn] = useState(sizes.length ? sizes[0].dn : null);

  // تریمِ نامی که در سرور انتخاب شده (بیشترین Cv / تمام‌باز)
  const size = sizes.find((s) => s.dn === dn) || sizes[0] || null;
  const ratedTrim = size?.rated || null;
  const curve = ratedTrim && Array.isArray(ratedTrim.curve) ? ratedTrim.curve : [];
  // سرچشمهٔ همین سایز (در سری مخلوط، بنچ سطح سری نمی‌تواند صادق باشد)
  const sizeSource = size ? size.source || (provenance === "estimated" ? "estimated" : "catalog") : "catalog";
  const isEstimate = sizeSource === "estimated";
  const badge = provenance === "estimated" || isEstimate
    ? { text: L.estimatedBadge, bg: "rgba(245,158,11,0.14)", fg: "#92400E" }
    : provenance === "mixed"
      ? { text: L.mixedBadge, bg: "rgba(245,158,11,0.14)", fg: "#92400E" }
      : { text: L.measuredBadge, bg: "rgba(16,185,129,0.12)", fg: "#065F46" };
  const band = estimate && Number.isFinite(estimate.errorPct)
    ? `±${Math.round(estimate.errorPct)}%`
    : isEstimate && Number.isFinite(size?.errorPct) ? `±${Math.round(size.errorPct)}%` : "±45%";
  const confidenceKey = (estimate && estimate.confidence) || (isEstimate ? size?.confidence : null);
  const confidence = (CONFIDENCE_LABELS[locale] || CONFIDENCE_LABELS.en)[confidenceKey] || confidenceKey || "—";
  // پارامتر dn در لینک سایزینگ عددی (mm) است؛ «DN15» به‌صورت خام پذیرفته نمی‌شود
  const sizingDn = Number(size?.dnMm) || Number(String(size?.dn || "").replace(/\D/g, ""));
  const points = useMemo(() => {
    const pairs = [{ opening: 0, cv: 0 }];
    openings.forEach((o, i) => {
      pairs.push({ opening: Number(o), cv: Number(curve[i]) });
    });
    return pairs.filter((p) => Number.isFinite(p.cv));
  }, [openings, curve]);

  if (!sizes.length || !size) return null;

  const cvTop = Math.max(size.cvMax || 0, ...points.map((p) => p.cv), 1);
  // ردیف‌های برآوردی حاشیهٔ نارنجی می‌گیرند؛ رنگ نباید بگذارد عدد تخمینی
  // در نگاه اول مثل دادهٔ کاتالوگ خوانده شود
  const cardBorder = isEstimate ? "1px solid rgba(245,158,11,0.45)" : "1px solid var(--border)";

  return (
    <section
      className="psm-cv"
      style={{
        marginTop: 40,
        border: cardBorder,
        borderRadius: 16,
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden"
      }}
    >
      <style jsx global>{`
        .psm-cv { min-width: 0; }
        .psm-cv *, .psm-cv *::before, .psm-cv *::after { box-sizing: border-box; }
        .psm-cv__head {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
          gap: 12px; padding: 16px 20px;
          background: linear-gradient(100deg, var(--glow, rgba(184,134,11,0.11)), transparent 78%);
          border-bottom: 1px solid var(--border);
        }
        .psm-cv__titles { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .psm-cv__icon {
          width: 34px; height: 34px; flex: 0 0 34px; border-radius: 10px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #E0A81A, #B8850A); color: #FFFFFF;
        }
        .psm-cv__title { margin: 0; font-size: 15px; font-weight: 900; color: var(--text); line-height: 1.4; }
        .psm-cv__sub { margin: 2px 0 0; font-size: 11.5px; font-weight: 600; color: var(--text-muted); }
        .psm-cv__select { display: flex; align-items: center; gap: 8px; }
        .psm-cv__select label { font-size: 11px; font-weight: 800; color: var(--text-soft); white-space: nowrap; }
        .psm-cv__select select {
          font-family: inherit; font-size: 12px; font-weight: 800; color: var(--text);
          background: var(--bg-soft); border: 1px solid var(--border-strong);
          border-radius: 10px; padding: 7px 12px; cursor: pointer; min-width: 96px;
        }
        .psm-cv__body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; padding: 18px 20px; }
        @media (min-width: 860px) { .psm-cv__body { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
        .psm-cv__facts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .psm-cv__fact {
          display: inline-flex; align-items: baseline; gap: 6px;
          padding: 6px 12px; border-radius: 10px;
          background: var(--bg-soft); border: 1px solid var(--border);
          font-size: 11px; font-weight: 700; color: var(--text-muted);
        }
        .psm-cv__fact b { font-size: 13px; font-weight: 900; color: var(--gold); }
        .psm-cv__chart { width: 100%; }
        .psm-cv__chart svg { width: 100%; height: auto; display: block; }
        .psm-cv__tablewrap { overflow-x: auto; max-width: 100%; }
        .psm-cv__table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .psm-cv__table th, .psm-cv__table td {
          padding: 8px 10px; text-align: center; border-bottom: 1px solid var(--border);
          color: var(--text-soft); white-space: nowrap;
        }
        .psm-cv__table th {
          font-size: 10.5px; font-weight: 900; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.04em; background: var(--bg-soft);
          position: sticky; top: 0;
        }
        .psm-cv__table td.num { font-family: monospace; direction: ltr; }
        .psm-cv__table tr:last-child td { border-bottom: 0; }
        .psm-cv__table tbody tr:hover td { background: var(--glow, rgba(184,134,11,0.10)); }
        .psm-cv__note { padding: 0 20px 14px; font-size: 11px; font-weight: 600; color: var(--text-muted); }
        .psm-cv__cta { padding: 0 20px 20px; }
      `}</style>

      <div className="psm-cv__head">
        <div className="psm-cv__titles">
          <span className="psm-cv__icon"><TrendingUp size={18} /></span>
          <div style={{ minWidth: 0 }}>
            <h2 className="psm-cv__title">
              {L.title}
              <span
                style={{
                  marginInlineStart: 8,
                  padding: "3px 9px",
                  borderRadius: 20,
                  fontSize: 9.5,
                  fontWeight: 900,
                  verticalAlign: "middle",
                  background: badge.bg,
                  color: badge.fg
                }}
              >
                {badge.text}
              </span>
            </h2>
            <p className="psm-cv__sub">{L.subtitle}</p>
          </div>
        </div>
        <div className="psm-cv__select">
          <label htmlFor="psm-cv-dn">{L.selectSize}</label>
          <select id="psm-cv-dn" value={size.dn} onChange={(e) => setDn(e.target.value)}>
            {sizes.map((s) => (
              <option key={s.dn} value={s.dn}>
                {s.source === "estimated" ? `${s.dn} · ${L.estimatedBadge}` : s.dn}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="psm-cv__facts" style={{ padding: "14px 20px 0" }}>
        <span className="psm-cv__fact">{L.ratedCv} <b dir="ltr">{fmt(size.cvMax, 1)}</b></span>
        {typeof size.nps === "number" && (
          <span className="psm-cv__fact">{L.nps} <b dir="ltr">{`${size.nps}"`}</b></span>
        )}
        {ratedTrim && (
          <span className="psm-cv__fact">
            {L.characteristic} <b>{L.chars[ratedTrim.characteristic] || L.chars.unknown}</b>
          </span>
        )}
        {ratedTrim && ratedTrim.ratio50 != null && (
          <span className="psm-cv__fact">{L.ratio50} <b dir="ltr">{fmt(ratedTrim.ratio50, 3)}</b></span>
        )}
        {ratedTrim && ratedTrim.rangeability != null && (
          <span className="psm-cv__fact">{L.rangeability} <b dir="ltr">{fmt(ratedTrim.rangeability, 1)}</b></span>
        )}
        {isEstimate && (
          <Fragment key={size.dn + "-trust"}>
            <span className="psm-cv__fact">{L.confidence} <b>{confidence}</b></span>
            <span className="psm-cv__fact">{L.backTestError} <b dir="ltr">{band}</b></span>
          </Fragment>
        )}
      </div>

      <div className="psm-cv__body" dir={rtl ? "rtl" : "ltr"}>
        {/* نمودار Cv بر حسب درصد بازشدگی — محور اعداد همیشه چپ‌به‌راست */}
        <div className="psm-cv__chart" dir="ltr">
          {points.length > 1 ? (
            <CvChart points={points} cvTop={cvTop} />
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>—</p>
          )}
        </div>

        {/* جدول ده‌نقطه‌ای Cv */}
        <div className="psm-cv__tablewrap" dir="ltr">
          <table className="psm-cv__table">
            <thead>
              <tr>
                <th>{L.opening} %</th>
                <th>{L.cv}</th>
                <th>{L.ofRated}</th>
              </tr>
            </thead>
            <tbody>
              {openings.map((o, i) => {
                const cv = Number(curve[i]);
                if (!Number.isFinite(cv)) return null;
                const pct = size.cvMax ? Math.round((cv / size.cvMax) * 100) : 0;
                return (
                  <tr key={o}>
                    <td className="num">{o}</td>
                    <td className="num">{fmt(cv, 1)}</td>
                    <td className="num">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="psm-cv__note">
        {isEstimate
          ? String(L.estimateNote).replace("{band}", band).replace("{confidence}", confidence)
          : L.note}
      </p>

      <div className="psm-cv__cta">
        <Link
          href={`/${locale}/sizing?series=${encodeURIComponent(seriesId)}${sizingDn >= 6 && sizingDn <= 2000 ? `&dn=${sizingDn}` : ""}`}
          className="btn-gold"
          style={{ alignSelf: "flex-start" }}
        >
          <Ruler size={16} /> {L.cta} <Table2 size={14} />
        </Link>
      </div>
    </section>
  );
}

// نمودار خطی ساده و سبک SVG (بدون وابستگی اضافه)
function CvChart({ points, cvTop }) {
  const w = 320;
  const h = 190;
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const x = (opening) => padL + (opening / 100) * plotW;
  const y = (cv) => padT + plotH - (cv / cvTop) * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.opening).toFixed(1)},${y(p.cv).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points[points.length - 1].opening).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * cvTop);
  const xTicks = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="psmCvArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map((tv, i) => (
        <g key={`y${i}`}>
          <line x1={padL} y1={y(tv)} x2={w - padR} y2={y(tv)} stroke="var(--border)" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3 3"} />
          <text x={padL - 6} y={y(tv) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">
            {fmt(tv, 0)}
          </text>
        </g>
      ))}

      {xTicks.map((ov, i) => (
        <text key={`x${i}`} x={x(ov)} y={h - padB + 16} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">
          {ov}
        </text>
      ))}

      <path d={area} fill="url(#psmCvArea)" stroke="none" />
      <path d={line} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle key={`p${i}`} cx={x(p.opening)} cy={y(p.cv)} r={i === points.length - 1 ? 3.5 : 2.5} fill="var(--gold)" />
      ))}

      <text x={padL + plotW / 2} y={h - 2} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--text-soft)">
        % opening
      </text>
    </svg>
  );
}
