"use client";
import { TrendingUp, TrendingDown, Lightbulb, Zap, AlertCircle } from "lucide-react";
import { VALVE_SIZES, velocityExceedsGuide } from "@/lib/sizing-advanced";

export default function AdvancedTips({ result, form, fluid, locale }) {
  if (!result || result.error) return null;

  const L = {
    fa: {
      title: "توصیه‌های مهندسی",
      subtitle: "پیشنهادهای هوشمند بر اساس نقطه کاری شما",
      openingLow: "بازشدگی خیلی پایین",
      openingLowText: "در بازشدگی {x}٪، کنترل ناپایدار است و احتمال سایش بالاست. سایز کوچک‌تر عملکرد بهتری دارد.",
      openingHigh: "بازشدگی خیلی بالا",
      openingHighText: "در بازشدگی {x}٪، فضایی برای افزایش ظرفیت نیست. سایز بزرگ‌تر ایمن‌تر است.",
      openingOptimal: "بازشدگی بهینه",
      openingOptimalText: "نقطه کاری شما در محدوده بهینه است. بهترین تعادل کنترل و رزرو.",
      flowIncrease: "افزایش دبی ۲۰٪",
      flowIncreaseText: "با افزایش ۲۰٪ دبی، بازشدگی به {x}٪ می‌رسد — {status}",
      flowSafe: "در محدوده ایمن",
      flowRisk: "در محدوده پرخطر",
      cavitationHigh: "کاویتاسیون بالا",
      cavitationHighText: "استفاده از trim ضد کاویتاسیون یا متریال سخت (Stellite) توصیه می‌شود.",
      cavitationFlashing: "فلاشینگ",
      cavitationFlashingText: "نیاز به طراحی خاص با متریال مقاوم به فرسایش (کاربید تنگستن).",
      choked: "جریان Choked",
      chokedText: "افت فشار ورودی را کاهش دهید یا از سایز بزرگ‌تر استفاده کنید.",
      noiseHigh: "سطح نویز بالا",
      noiseHighText: "نویز {x} dB فراتر از حد مجاز است. از trim کم‌نویز یا عایق‌بندی صوتی استفاده کنید.",
      velocityHigh: "سرعت بالا",
      velocityHighText: "سرعت {x} m/s فرسایش لوله را تشدید می‌کند. سایز بزرگ‌تر توصیه می‌شود.",
      recommendedSize: "سایز پیشنهادی نهایی",
      recommendedSizeText: "با توجه به تمام پارامترها، سایز {x} بهترین گزینه است."
    },
    en: {
      title: "Engineering Tips",
      subtitle: "Smart recommendations based on your operating point",
      openingLow: "Opening Too Low",
      openingLowText: "At {x}% opening, control is unstable and wear is high. A smaller size performs better.",
      openingHigh: "Opening Too High",
      openingHighText: "At {x}% opening, there's no room for capacity increase. A larger size is safer.",
      openingOptimal: "Optimal Opening",
      openingOptimalText: "Your operating point is in the optimal range. Best balance of control and reserve.",
      flowIncrease: "Flow Increase +20%",
      flowIncreaseText: "With 20% more flow, opening rises to {x}% — {status}",
      flowSafe: "within safe range",
      flowRisk: "in risk zone",
      cavitationHigh: "High Cavitation",
      cavitationHighText: "Anti-cavitation trim or hardened material (Stellite) is recommended.",
      cavitationFlashing: "Flashing",
      cavitationFlashingText: "Requires special design with erosion-resistant material (tungsten carbide).",
      choked: "Choked Flow",
      chokedText: "Reduce inlet pressure drop or use a larger size.",
      noiseHigh: "High Noise Level",
      noiseHighText: "Noise at {x} dB exceeds safe limits. Use low-noise trim or acoustic insulation.",
      velocityHigh: "High Velocity",
      velocityHighText: "Velocity of {x} m/s accelerates pipe erosion. Larger size recommended.",
      recommendedSize: "Final Recommended Size",
      recommendedSizeText: "Considering all parameters, size {x} is the best choice."
    },
    ar: {
      title: "نصائح هندسية",
      subtitle: "توصيات ذكية بناءً على نقطة التشغيل",
      openingLow: "الفتح منخفض جداً",
      openingLowText: "عند {x}% الفتح، التحكم غير مستقر. حجم أصغر أفضل.",
      openingHigh: "الفتح مرتفع جداً",
      openingHighText: "عند {x}% الفتح، لا مجال للزيادة. حجم أكبر أكثر أماناً.",
      openingOptimal: "فتح مثالي",
      openingOptimalText: "نقطة التشغيل في النطاق الأمثل.",
      flowIncrease: "زيادة التدفق 20%",
      flowIncreaseText: "مع زيادة 20% في التدفق، يرتفع الفتح إلى {x}% — {status}",
      flowSafe: "في النطاق الآمن",
      flowRisk: "في منطقة الخطر",
      cavitationHigh: "تجويف عالي",
      cavitationHighText: "يوصى بـ trim مضاد للتجويف أو مادة صلبة.",
      cavitationFlashing: "وميض",
      cavitationFlashingText: "يتطلب تصميم خاص بمادة مقاومة للتآكل.",
      choked: "تدفق مختنق",
      chokedText: "قلل انخفاض ضغط الدخول أو استخدم حجم أكبر.",
      noiseHigh: "مستوى ضوضاء عالي",
      noiseHighText: "الضوضاء {x} dB تتجاوز الحدود الآمنة.",
      velocityHigh: "سرعة عالية",
      velocityHighText: "السرعة {x} m/s تسرّع تآكل الأنبوب. حجم أكبر موصى به.",
      recommendedSize: "الحجم النهائي الموصى به",
      recommendedSizeText: "مع مراعاة جميع المعايير، الحجم {x} هو الأفضل."
    },
    ru: {
      title: "Инженерные советы",
      subtitle: "Умные рекомендации по вашей рабочей точке",
      openingLow: "Открытие слишком низкое",
      openingLowText: "При {x}% открытия контроль нестабилен. Меньший размер лучше.",
      openingHigh: "Открытие слишком высокое",
      openingHighText: "При {x}% нет запаса для роста. Больший размер безопаснее.",
      openingOptimal: "Оптимальное открытие",
      openingOptimalText: "Рабочая точка в оптимальном диапазоне.",
      flowIncrease: "Расход +20%",
      flowIncreaseText: "При +20% расхода открытие вырастет до {x}% — {status}",
      flowSafe: "в безопасной зоне",
      flowRisk: "в опасной зоне",
      cavitationHigh: "Высокая кавитация",
      cavitationHighText: "Рекомендуется антикавитационный trim или Stellite.",
      cavitationFlashing: "Вспышка",
      cavitationFlashingText: "Требуется специальный дизайн с карбидом вольфрама.",
      choked: "Критический поток",
      chokedText: "Уменьшите перепад или используйте больший размер.",
      noiseHigh: "Высокий уровень шума",
      noiseHighText: "Шум {x} дБ превышает норму.",
      velocityHigh: "Высокая скорость",
      velocityHighText: "Скорость {x} m/s ускоряет эрозию. Больший размер рекомендуется.",
      recommendedSize: "Итоговый размер",
      recommendedSizeText: "С учетом всех параметров, размер {x} — оптимальный."
    }
  }[locale] || {};

  const tips = [];

  // 1. Opening analysis
  if (result.openingPercent < 20) {
    tips.push({
      icon: "warning",
      color: "#F59E0B",
      title: L.openingLow,
      text: L.openingLowText.replace("{x}", result.openingPercent)
    });
  } else if (result.openingPercent > 85) {
    tips.push({
      icon: "warning",
      color: "#F59E0B",
      title: L.openingHigh,
      text: L.openingHighText.replace("{x}", result.openingPercent)
    });
  } else {
    tips.push({
      icon: "check",
      color: "#10B981",
      title: L.openingOptimal,
      text: L.openingOptimalText
    });
  }

  // 2. Flow increase simulation
  if (fluid !== "steam") {
    const q = form.Q || form.W || 100;
    const increaseRatio = 1.2;
    const newCv = result.Cv * increaseRatio;
    const newOpening = Math.min(100, Math.round((newCv / result.size.cv) * 100));
    const isSafe = newOpening <= 90;
    tips.push({
      icon: "trend",
      color: isSafe ? "#0078D4" : "#F59E0B",
      title: L.flowIncrease,
      text: L.flowIncreaseText
        .replace("{x}", newOpening)
        .replace("{status}", isSafe ? L.flowSafe : L.flowRisk)
    });
  }

  // 3. Cavitation
  if (result.cavitationRisk === "high") {
    tips.push({
      icon: "warning",
      color: "#F59E0B",
      title: L.cavitationHigh,
      text: L.cavitationHighText
    });
  } else if (result.cavitationRisk === "flashing") {
    tips.push({
      icon: "danger",
      color: "#E81123",
      title: L.cavitationFlashing,
      text: L.cavitationFlashingText
    });
  }

  // 4. Choked
  if (result.choked) {
    tips.push({
      icon: "danger",
      color: "#E81123",
      title: L.choked,
      text: L.chokedText
    });
  }

  // 5. Noise
  if (result.noise && result.noise > 85) {
    tips.push({
      icon: "warning",
      color: "#F59E0B",
      title: L.noiseHigh,
      text: L.noiseHighText.replace("{x}", result.noise)
    });
  }

  // 6. Velocity
  if (result.velocity && velocityExceedsGuide({ fluidType: result.fluidType, velocity: result.velocity, mach: result.mach })) {
    tips.push({
      icon: "warning",
      color: "#F59E0B",
      title: L.velocityHigh,
      text: L.velocityHighText.replace("{x}", result.velocity)
    });
  }

  if (tips.length === 0) return null;

  function TipIcon({ type, color }) {
    const common = { size: 16, color: color };
    if (type === "check") return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
    if (type === "danger") return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    );
    if (type === "trend") return <TrendingUp size={16} color={color} />;
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
  }

  return (
    <div className="card-glass p-5">
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg, #E0A81A, #B8850A)",
          color: "#FFFFFF"
        }}>
          <Lightbulb size={18} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--text)" }}>
            {L.title}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>
            {L.subtitle}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {tips.map(function(tip, i) {
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 11,
              background: tip.color + "08",
              border: "1px solid " + tip.color + "30"
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                display: "grid", placeItems: "center",
                background: tip.color + "18",
                flexShrink: 0
              }}>
                <TipIcon type={tip.icon} color={tip.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>
                  {tip.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-soft)", fontWeight: 600, lineHeight: 1.6 }}>
                  {tip.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
