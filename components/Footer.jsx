"use client";
import Link from "next/link";
import { useDictionary } from "./Providers";
import { COMPANY } from "@/lib/company-info";

// ============================================================
// ICONS
// ============================================================
function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconFax() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
function IconMail({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconMobile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function IconWhatsapp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
function IconAparat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l7 4.5-7 4.5z" />
    </svg>
  );
}
function IconBale() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
    </svg>
  );
}
function IconRubika() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.18L18 8v8l-6 3.82L6 16V8l6-3.82z" />
    </svg>
  );
}
function IconEitaa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.59L6.17 12.17l1.41-1.41L10.59 13.76l5.83-5.83 1.41 1.41-7.24 7.25z" />
    </svg>
  );
}
function IconFlask() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v6l4 12H5l4-12V3z" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ============================================================
// BRAND LOGO — placeholder «PSM» (بعداً عکس واقعی جایگزین شود)
// ============================================================
function BrandLogo() {
  return (
    <div className="w-12 h-12 rounded-xl grid place-items-center shadow-md overflow-hidden"
      style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)" }}>
      {/* اگر فایل logo در public/logo/logo-icon.png هست، این خط را از کامنت خارج کن: */}
      {/* <img src="/logo/logo-icon.png" alt="PSM" width="48" height="48" style={{objectFit:"contain"}} /> */}
      <span className="text-[#1A1D21] font-black text-sm">PSM</span>
    </div>
  );
}

// ============================================================
// MAIN FOOTER
// ============================================================
export default function Footer() {
  const { locale, t } = useDictionary();
  const isFa = locale === "fa";

  const links = [
    { h: "/" + locale + "/products", l: t.nav.products },
    { h: "/" + locale + "/services", l: t.nav.services || (isFa ? "خدمات" : "Services") },
    { h: "/" + locale + "/sizing", l: t.nav.sizing },
    { h: "/" + locale + "/media?tab=articles", l: t.nav.articles },
    { h: "/" + locale + "/about", l: t.nav.about },
    { h: "/" + locale + "/contact", l: t.nav.contact }
  ];

  const intlSocials = [
    { name: "Instagram", Icon: IconInstagram, url: COMPANY.social.instagram, color: "#E4405F", handle: COMPANY.social.instagramHandle },
    { name: "WhatsApp", Icon: IconWhatsapp, url: COMPANY.social.whatsapp, color: "#25D366", handle: "+98 918 893 9209" },
    { name: "Aparat", Icon: IconAparat, url: COMPANY.social.aparat, color: "#ED145B", handle: "@petrosazehmihan" }
  ];

  const iranianSocials = [
    { name: isFa ? "بله" : "Bale", url: "https://ble.ir/psm_commercial", color: "#00A650", Icon: IconBale },
    { name: isFa ? "روبیکا" : "Rubika", url: "https://rubika.ir/Psm_commercial", color: "#7B2CBF", Icon: IconRubika },
    { name: isFa ? "ایتا" : "Eitaa", url: "https://eitaa.com/Psm_commercial", color: "#F5A623", Icon: IconEitaa }
  ];

  const knowledgeTexts = {
    fa: { title: "شرکت دانش‌بنیان", type: "تولیدی نوع یک" },
    en: { title: "Knowledge-Based", type: "Production Type I" },
    ar: { title: "شركة قائمة على المعرفة", type: "إنتاجية النوع الأول" },
    ru: { title: "Наукоемкая компания", type: "Производство тип I" }
  };
  const K = knowledgeTexts[locale] || knowledgeTexts.en;

  const footerLabels = {
    fa: {
      office: "دفتر مرکزی",
      factory: "کارخانه",
      phone: "تلفن",
      phone2: "تلفن ۲",
      fax: "فکس",
      mobile: "همراه",
      hours: "ساعات کاری",
      hoursValue: "شنبه تا پنجشنبه: ۷:۰۰ – ۱۵:۰۰",
      hoursClosed: "جمعه: تعطیل",
      socialIntl: "بین‌المللی",
      socialIran: "پیام‌رسان‌های ایرانی",
      socialTitle: "شبکه‌های اجتماعی",
      slogan: "آمده‌ایم ملی بسازیم تا بمانیم",
      description: "دانش‌بنیان تولیدی نوع یک در زمینه طراحی و تولید شیرهای کنترلی صنعتی طبق استاندارد IEC 60534"
    },
    en: {
      office: "Head Office",
      factory: "Factory",
      phone: "Phone",
      phone2: "Phone 2",
      fax: "Fax",
      mobile: "Mobile",
      hours: "Working Hours",
      hoursValue: "Sat – Thu: 7:00 – 15:00",
      hoursClosed: "Friday: Closed",
      socialIntl: "International",
      socialIran: "Iranian Messengers",
      socialTitle: "Follow Us",
      slogan: "We build nationally to last",
      description: "Knowledge-based manufacturer of industrial control valves per IEC 60534"
    },
    ar: {
      office: "المكتب الرئيسي",
      factory: "المصنع",
      phone: "هاتف",
      phone2: "هاتف ٢",
      fax: "فاكس",
      mobile: "جوال",
      hours: "ساعات العمل",
      hoursValue: "السبت – الخميس: ٧:٠٠ – ١٥:٠٠",
      hoursClosed: "الجمعة: مغلق",
      socialIntl: "دولي",
      socialIran: "رسائل إيرانية",
      socialTitle: "تابعنا",
      slogan: "نبني وطنياً لنبقى",
      description: "شركة قائمة على المعرفة لتصنيع صمامات التحكم الصناعية"
    },
    ru: {
      office: "Офис",
      factory: "Завод",
      phone: "Телефон",
      phone2: "Телефон 2",
      fax: "Факс",
      mobile: "Мобильный",
      hours: "Рабочие часы",
      hoursValue: "Сб – Чт: 7:00 – 15:00",
      hoursClosed: "Пятница: закрыто",
      socialIntl: "Международные",
      socialIran: "Иранские мессенджеры",
      socialTitle: "Подписаться",
      slogan: "Строим для страны, чтобы остаться",
      description: "Наукоемкое производство промышленных регулирующих клапанов"
    }
  };
  const F = footerLabels[locale] || footerLabels.en;

  return (
    <footer className="border-t mt-24" style={{ borderColor: "var(--border)" }}>
      <div className="container-x py-14 grid md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* ============ Column 1: Brand ============ */}
        <div className="lg:col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <BrandLogo />
            <div>
              <div className="font-black leading-tight" style={{ color: "var(--text)" }}>
                {t.common.company}
              </div>
              <div className="text-xs font-semibold tracking-widest" style={{ color: "var(--gold)" }}>
                {t.common.tagline}
              </div>
            </div>
          </div>

          <div className="text-xs font-bold italic mb-3" style={{ color: "var(--gold)" }}>
            «{F.slogan}»
          </div>

          <p className="text-sm leading-7 max-w-md mb-5" style={{ color: "var(--text-soft)" }}>
            {F.description}
          </p>

          <div className="p-3 rounded-xl flex items-start gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(224, 168, 26, 0.08), rgba(184, 133, 10, 0.04))",
              border: "1px solid rgba(224, 168, 26, 0.25)"
            }}>
            <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
              style={{ background: "linear-gradient(135deg, #E0A81A, #B8850A)", color: "#FFFFFF" }}>
              <IconFlask />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black flex items-center gap-1" style={{ color: "var(--text)" }}>
                <span style={{ color: "var(--gold)" }}><IconCheck /></span>
                {K.title}
              </div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: "var(--gold)" }}>
                {K.type}
              </div>
            </div>
          </div>
        </div>

        {/* ============ Column 2: Quick links ============ */}
        <div>
          <h4 className="font-black mb-5" style={{ color: "var(--gold)" }}>
            {t.footer.quickLinks}
          </h4>
          <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-soft)" }}>
            {links.map(function(l) {
              return (
                <li key={l.h}>
                  <Link href={l.h} className="hover:text-gold-500 transition">
                    {l.l}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ============ Column 3: Contact ============ */}
        <div>
          <h4 className="font-black mb-5" style={{ color: "var(--gold)" }}>
            {t.footer.contact}
          </h4>

          <ul className="space-y-3 text-xs leading-relaxed" style={{ color: "var(--text-soft)" }}>
            {/* Address */}
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconPin /></span>
              <div>
                <div className="font-bold" style={{ color: "var(--text)" }}>{F.office}</div>
                <div>{COMPANY.address.office[locale] || COMPANY.address.office.en}</div>
                <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {isFa ? "کدپستی" : "Postal"}: {COMPANY.address.postalCode}
                </div>
              </div>
            </li>

            {/* Office Phone 1 */}
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconPhone /></span>
              <div>
                <div className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                  {F.phone}
                </div>
                <a href="tel:+988634131533"
                  className="font-mono hover:text-gold-500 transition"
                  style={{ direction: "ltr", display: "inline-block" }}>
                  +98 86 3413 1533
                </a>
              </div>
            </li>

            {/* Office Phone 2 */}
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconPhone /></span>
              <div>
                <div className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                  {F.phone2}
                </div>
                <a href="tel:+988634131918"
                  className="font-mono hover:text-gold-500 transition"
                  style={{ direction: "ltr", display: "inline-block" }}>
                  +98 86 3413 1918
                </a>
              </div>
            </li>

            {/* Mobile */}
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconMobile /></span>
              <div>
                <div className="text-[10px] font-bold mb-0.5" style={{ color: "var(--text-muted)" }}>
                  {F.mobile}
                </div>
                {COMPANY.phone.mobile.map(function(m, i) {
                  return (
                    <a key={i} href={"tel:" + m.replace(/\s/g, "")}
                      className="font-mono hover:text-gold-500 transition block"
                      style={{ direction: "ltr" }}>
                      {m}
                    </a>
                  );
                })}
              </div>
            </li>

            {/* Fax */}
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconFax /></span>
              <div>
                <div className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                  {F.fax}
                </div>
                <span className="font-mono" style={{ direction: "ltr", display: "inline-block" }}>
                  {COMPANY.fax.office}
                </span>
              </div>
            </li>

            {/* Emails with icons */}
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconMail size={14} /></span>
              <div>
                <div className="text-[10px] font-bold mb-0.5" style={{ color: "var(--text-muted)" }}>
                  {isFa ? "ایمیل" : "Email"}
                </div>
                <a href={"mailto:" + COMPANY.email.primary}
                  className="hover:text-gold-500 transition block"
                  style={{ direction: "ltr" }}>
                  {COMPANY.email.primary}
                </a>
                <a href={"mailto:" + COMPANY.email.secondary}
                  className="hover:text-gold-500 transition block"
                  style={{ direction: "ltr" }}>
                  {COMPANY.email.secondary}
                </a>
              </div>
            </li>

            {/* Working Hours (NEW) */}
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconClock /></span>
              <div>
                <div className="text-[10px] font-bold mb-0.5" style={{ color: "var(--text-muted)" }}>
                  {F.hours}
                </div>
                <div style={{ color: "var(--text)" }}>{F.hoursValue}</div>
                <div className="mt-0.5" style={{ color: "#E81123", fontWeight: 700 }}>
                  {F.hoursClosed}
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* ============ Column 4: Social ============ */}
        <div>
          <h4 className="font-black mb-5" style={{ color: "var(--gold)" }}>
            {F.socialTitle}
          </h4>

          <div className="mb-5">
            <div className="text-[10px] font-black tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}>
              {F.socialIntl}
            </div>
            <div className="flex flex-wrap gap-2">
              {intlSocials.map(function(s) {
                const Icon = s.Icon;
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name + (s.handle ? " — " + s.handle : "")}
                    className="w-10 h-10 rounded-xl grid place-items-center transition-all hover:scale-110 hover:shadow-lg"
                    style={{
                      background: s.color + "15",
                      border: "1px solid " + s.color + "40",
                      color: s.color
                    }}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}>
              {F.socialIran}
            </div>
            <div className="flex flex-wrap gap-2">
              {iranianSocials.map(function(s) {
                const Icon = s.Icon;
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all hover:scale-105 hover:shadow-lg"
                    style={{
                      background: s.color + "15",
                      border: "1px solid " + s.color + "40",
                      color: s.color
                    }}
                  >
                    <Icon />
                    <span>{s.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============ Bottom bar ============ */}
      <div className="border-t py-5"
        style={{ borderColor: "var(--border)", color: "var(--text-soft)" }}>
        <div className="container-x flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-center sm:text-start" style={{ color: "var(--text-soft)" }}>
            Designed by <span style={{ color: "var(--gold)", fontWeight: 900 }}>IT Department</span> | All rights reserved ©2027
          </div>
          <a
            href="mailto:it@psmvalve.com"
            className="flex items-center gap-2 hover:text-gold-500 transition font-mono text-[11px]"
            style={{ direction: "ltr" }}
          >
            <span style={{ color: "var(--gold)" }}>
              <IconMail size={14} />
            </span>
            <span>it@psmvalve.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
}