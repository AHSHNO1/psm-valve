"use client";
import Link from "next/link";
import { useDictionary } from "./Providers";

// ============ SVG ICONS (inline, no dependencies) ============
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
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
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
function IconYoutube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function IconLinkedin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconBale() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}
function IconRubika() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.18L18 8v8l-6 3.82L6 16V8l6-3.82zM12 6l-4 2.5v7l4 2.5 4-2.5v-7L12 6z" />
    </svg>
  );
}
function IconEitaa() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm3.5 6.5l-4 4c-.2.2-.5.2-.7 0l-2-2c-.2-.2-.2-.5 0-.7s.5-.2.7 0l1.65 1.65 3.65-3.65c.2-.2.5-.2.7 0s.2.5 0 .7z" />
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

export default function Footer() {
  const { locale, t } = useDictionary();

  const links = [
    { h: "/" + locale + "/products", l: t.nav.products },
    { h: "/" + locale + "/services", l: t.nav.services || (locale === "fa" ? "خدمات" : "Services") },
    { h: "/" + locale + "/sizing", l: t.nav.sizing },
    { h: "/" + locale + "/media?tab=articles", l: t.nav.articles },
    { h: "/" + locale + "/about", l: t.nav.about },
    { h: "/" + locale + "/contact", l: t.nav.contact }
  ];

  const intlSocials = [
    { name: "Instagram", Icon: IconInstagram, url: "https://instagram.com/psmvalve", color: "#E4405F" },
    { name: "WhatsApp", Icon: IconWhatsapp, url: "https://wa.me/989891234567", color: "#25D366" },
    { name: "YouTube", Icon: IconYoutube, url: "https://youtube.com/@psmvalve", color: "#FF0000" },
    { name: "LinkedIn", Icon: IconLinkedin, url: "https://linkedin.com/company/psmvalve", color: "#0A66C2" },
    { name: "Telegram", Icon: IconTelegram, url: "https://t.me/psmvalve", color: "#0088CC" }
  ];

  const iranianSocials = [
    { name: "بله", url: "https://ble.ir/psmvalve", color: "#00A650", Icon: IconBale },
    { name: "روبیکا", url: "https://rubika.ir/psmvalve", color: "#7B2CBF", Icon: IconRubika },
    { name: "ایتا", url: "https://eitaa.com/psmvalve", color: "#F5A623", Icon: IconEitaa }
  ];

  const knowledgeTexts = {
    fa: { title: "شرکت دانش‌بنیان", type: "تولیدی نوع یک" },
    en: { title: "Knowledge-Based", type: "Production Type I" },
    ar: { title: "شركة قائمة على المعرفة", type: "إنتاجية النوع الأول" },
    ru: { title: "Наукоемкая компания", type: "Производство тип I" }
  };
  const K = knowledgeTexts[locale] || knowledgeTexts.en;

  return (
    <footer className="border-t mt-24" style={{ borderColor: "var(--border)" }}>
      <div className="container-x py-14 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Column 1: Brand + Knowledge badge */}
        <div className="lg:col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl grid place-items-center shadow-md"
              style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)" }}>
              <span className="text-[#1A1D21] font-black">PSM</span>
            </div>
            <div>
              <div className="font-black" style={{ color: "var(--text)" }}>
                {t.common.company}
              </div>
              <div className="text-xs font-semibold tracking-widest" style={{ color: "var(--gold)" }}>
                {t.common.tagline}
              </div>
            </div>
          </div>

          <p className="text-sm leading-7 max-w-md mb-5" style={{ color: "var(--text-soft)" }}>
            {t.footer.desc}
          </p>

          {/* Knowledge badge */}
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

        {/* Column 2: Quick links */}
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

        {/* Column 3: Contact */}
        <div>
          <h4 className="font-black mb-5" style={{ color: "var(--gold)" }}>
            {t.footer.contact}
          </h4>
          <ul className="space-y-3 text-sm" style={{ color: "var(--text-soft)" }}>
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconPin /></span>
              {t.common.address}
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconPhone /></span>
              {t.common.phone}
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--gold)" }}><IconMail /></span>
              {t.common.email}
            </li>
          </ul>
        </div>

        {/* Column 4: Social */}
        <div>
          <h4 className="font-black mb-5" style={{ color: "var(--gold)" }}>
            {locale === "fa" ? "شبکه‌های اجتماعی" : "Follow Us"}
          </h4>

          <div className="mb-5">
            <div className="text-[10px] font-black tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}>
              {locale === "fa" ? "بین‌المللی" : "International"}
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
                    title={s.name}
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
              {locale === "fa" ? "پیام‌رسان‌های ایرانی" : "Iranian Messengers"}
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
                    className="h-10 px-3 rounded-xl flex items-center gap-2 text-xs font-black transition-all hover:scale-105 hover:shadow-lg"
                    style={{
                      background: s.color + "15",
                      border: "1px solid " + s.color + "40",
                      color: s.color
                    }}
                  >
                    <Icon />
                    {s.name}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t py-6 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-soft)" }}>
        © {new Date().getFullYear()} {t.common.company} — {t.footer.rights}
      </div>
    </footer>
  );
}
