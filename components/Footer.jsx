"use client";
import Link from "next/link";
import { useDictionary } from "./Providers";
import { COMPANY } from "@/lib/company-info";
import { MapPin, Phone, Smartphone, Mail, Printer, Clock, Check } from "lucide-react";

// ============================================================
// SOCIAL ICONS (inline SVG)
// ============================================================
function IconInstagram({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function IconWhatsapp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
function IconAparat({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l7 4.5-7 4.5z" />
    </svg>
  );
}
function IconBale({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
    </svg>
  );
}
function IconRubika({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.18L18 8v8l-6 3.82L6 16V8l6-3.82z" />
    </svg>
  );
}
function IconEitaa({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.59L6.17 12.17l1.41-1.41L10.59 13.76l5.83-5.83 1.41 1.41-7.24 7.25z" />
    </svg>
  );
}

// ============================================================
// BRAND LOGO
// ============================================================
function BrandLogo({ src }) {
  return (
    <div className="footer-brand-logo">
      {src && (
        <img
          src={src}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fb = e.currentTarget.nextElementSibling;
            if (fb) fb.style.display = "grid";
          }}
        />
      )}
      <span className="footer-brand-logo-fallback" style={{ display: src ? "none" : "grid" }}>PSM</span>
    </div>
  );
}

// ============================================================
// MAIN FOOTER
// ============================================================
export default function Footer({ logo }) {
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
    { name: "Instagram", Icon: IconInstagram, url: COMPANY.social.instagram, color: "#E4405F" },
    { name: "WhatsApp", Icon: IconWhatsapp, url: COMPANY.social.whatsapp, color: "#25D366" },
    { name: "Aparat", Icon: IconAparat, url: COMPANY.social.aparat, color: "#ED145B" }
  ];

  const iranianSocials = [
    { name: isFa ? "بله" : "Bale", url: "https://ble.ir/psm_commercial", color: "#00A650", Icon: IconBale },
    { name: isFa ? "روبیکا" : "Rubika", url: "https://rubika.ir/Psm_commercial", color: "#7B2CBF", Icon: IconRubika },
    { name: isFa ? "ایتا" : "Eitaa", url: "https://eitaa.com/Psm_commercial", color: "#F5A623", Icon: IconEitaa }
  ];

  const L = {
    fa: {
      office: "دفتر مرکزی",
      phone: "تلفن",
      mobile: "همراه",
      fax: "فکس",
      email: "ایمیل",
      hours: "ساعات کاری",
      hoursValue: "شنبه – پنجشنبه: ۷ تا ۱۵",
      hoursClosed: "جمعه: تعطیل",
      postal: "کدپستی",
      socialIntl: "بین‌المللی",
      socialIran: "پیام‌رسان‌های ایرانی",
      socialTitle: "ما را دنبال کنید",
      slogan: "آمده‌ایم ملی بسازیم تا بمانیم",
      knowledge: "دانش‌بنیان",
      knowledgeType: "تولیدی نوع یک",
      copyright: "تمامی حقوق محفوظ است"
    },
    en: {
      office: "Head Office",
      phone: "Phone",
      mobile: "Mobile",
      fax: "Fax",
      email: "Email",
      hours: "Hours",
      hoursValue: "Sat – Thu: 7:00 – 15:00",
      hoursClosed: "Friday: Closed",
      postal: "Postal",
      socialIntl: "International",
      socialIran: "Iranian Messengers",
      socialTitle: "Follow Us",
      slogan: "We build for our nation and build to last",
      knowledge: "Knowledge-Based",
      knowledgeType: "Production Type I",
      copyright: "All rights reserved"
    },
    ar: {
      office: "المكتب الرئيسي",
      phone: "هاتف",
      mobile: "جوال",
      fax: "فاكس",
      email: "بريد",
      hours: "ساعات العمل",
      hoursValue: "السبت – الخميس: ٧ – ١٥",
      hoursClosed: "الجمعة: مغلق",
      postal: "الرمز البريدي",
      socialIntl: "دولي",
      socialIran: "تطبيقات المراسلة الإيرانية",
      socialTitle: "تابعنا",
      slogan: "نبني من أجل وطننا ونبني لنبقى",
      knowledge: "قائمة على المعرفة",
      knowledgeType: "إنتاج من النوع الأول",
      copyright: "جميع الحقوق محفوظة"
    },
    ru: {
      office: "Офис",
      phone: "Телефон",
      mobile: "Мобильный",
      fax: "Факс",
      email: "Email",
      hours: "Часы",
      hoursValue: "Сб – Чт: 7:00 – 15:00",
      hoursClosed: "Пятница: закрыто",
      postal: "Индекс",
      socialIntl: "Международные",
      socialIran: "Иранские мессенджеры",
      socialTitle: "Подписаться",
      slogan: "Строим для страны, чтобы оставить наследие",
      knowledge: "Наукоёмкое производство",
      knowledgeType: "Тип I",
      copyright: "Все права защищены"
    }
  }[locale] || {};

  return (
    <footer className="footer-root">
      <div className="container-x">
        {/* ============ MAIN GRID ============ */}
        <div className="footer-grid">

          {/* ========== Column 1: Brand ========== */}
          <div className="footer-brand-col">
            <div className="footer-brand-head">
              <BrandLogo src={logo} />
              <div className="footer-brand-text">
                <div className="footer-brand-name">{t.common.company}</div>
                <div className="footer-brand-tag">{t.common.tagline}</div>
              </div>
            </div>

            <div className="footer-slogans">
              <p className="footer-slogan footer-slogan-primary">{L.slogan}</p>
              <p className="footer-slogan footer-slogan-secondary">
                {COMPANY.slogan[locale] || COMPANY.slogan.en}
              </p>
            </div>

            <div className="footer-knowledge-badge">
              <div className="footer-knowledge-icon">
                <Check size={12} strokeWidth={3} />
              </div>
              <div>
                <div className="footer-knowledge-title">{L.knowledge}</div>
                <div className="footer-knowledge-type">{L.knowledgeType}</div>
              </div>
            </div>
          </div>

          {/* ========== Column 2: Quick Links ========== */}
          <div>
            <h4 className="footer-heading">{t.footer.quickLinks}</h4>
            <ul className="footer-links">
              {links.map(function (l) {
                return (
                  <li key={l.h}>
                    <Link href={l.h} className="footer-link">
                      {l.l}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ========== Column 3: Contact (Compact) ========== */}
          <div className="footer-contact-col">
            <h4 className="footer-heading">{t.footer.contact}</h4>

            {/* Address */}
            <div className="fc-row fc-address">
              <MapPin size={13} className="fc-icon" />
              <div className="fc-text">
                <div>{COMPANY.address.office[locale] || COMPANY.address.office.en}</div>
                <div className="fc-muted">
                  {L.postal}: {COMPANY.address.postalCode}
                </div>
              </div>
            </div>

            {/* Phones — side by side */}
            <div className="fc-row">
              <Phone size={13} className="fc-icon" />
              <div className="fc-text fc-inline">
                <span className="fc-label">{L.phone}:</span>
                <a href="tel:+988634131533" className="fc-link" style={{ direction: "ltr" }}>
                  +98 86 3413 1533
                </a>
                <span className="fc-sep">·</span>
                <a href="tel:+988634131918" className="fc-link" style={{ direction: "ltr" }}>
                  +98 86 3413 1918
                </a>
              </div>
            </div>

            {/* Mobiles — side by side */}
            <div className="fc-row">
              <Smartphone size={13} className="fc-icon" />
              <div className="fc-text fc-inline">
                <span className="fc-label">{L.mobile}:</span>
                <a href="tel:+989128616063" className="fc-link" style={{ direction: "ltr" }}>
                  +98 912 861 6063
                </a>
                <span className="fc-sep">·</span>
                <a href="tel:+989188939209" className="fc-link" style={{ direction: "ltr" }}>
                  +98 918 893 9209
                </a>
              </div>
            </div>

            {/* Emails — side by side */}
            <div className="fc-row">
              <Mail size={13} className="fc-icon" />
              <div className="fc-text fc-inline">
                <span className="fc-label">{L.email}:</span>
                <a href={"mailto:" + COMPANY.email.primary} className="fc-link" style={{ direction: "ltr" }}>
                  {COMPANY.email.primary}
                </a>
                <span className="fc-sep">·</span>
                <a href={"mailto:" + COMPANY.email.secondary} className="fc-link" style={{ direction: "ltr" }}>
                  {COMPANY.email.secondary}
                </a>
              </div>
            </div>

            {/* Fax + Hours */}
            <div className="fc-row fc-two-col">
              <div className="fc-half">
                <Printer size={13} className="fc-icon" />
                <div className="fc-text fc-inline">
                  <span className="fc-label">{L.fax}:</span>
                  <span className="fc-link" style={{ direction: "ltr" }}>
                    {COMPANY.fax.office}
                  </span>
                </div>
              </div>
              <div className="fc-half">
                <Clock size={13} className="fc-icon" />
                <div className="fc-text fc-inline">
                  <span className="fc-label">{L.hours}:</span>
                  <span className="fc-link">{L.hoursValue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== Column 4: Social ========== */}
          <div>
            <h4 className="footer-heading">{L.socialTitle}</h4>

            <div className="footer-social-block">
              <div className="footer-social-label">{L.socialIntl}</div>
              <div className="footer-social-icons">
                {intlSocials.map(function (s) {
                  const Icon = s.Icon;
                  return (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      title={s.name}
                      className="footer-social-btn"
                      style={{ "--sc": s.color }}
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="footer-social-block">
              <div className="footer-social-label">{L.socialIran}</div>
              <div className="footer-social-pills">
                {iranianSocials.map(function (s) {
                  const Icon = s.Icon;
                  return (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      className="footer-messenger-pill"
                      style={{ "--sc": s.color }}
                    >
                      <Icon size={13} />
                      <span>{s.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============ BOTTOM BAR ============ */}
      <div className="footer-bottom">
        <div className="container-x footer-bottom-inner">
          <div className="footer-bottom-text">
            <span dir="ltr" lang="en">
              Designed by <span className="footer-bottom-it">IT Department ahshno</span>
            </span>
            <span className="footer-bottom-sep">|</span>
            {L.copyright} ©{new Date().getFullYear()}
          </div>
          <a href="mailto:it@psmvalve.com" className="footer-bottom-email">
            <Mail size={12} />
            <span>it@psmvalve.com</span>
          </a>
        </div>
      </div>

      {/* ============================================================
          STYLES
          ============================================================ */}
      <style jsx global>{`
        .footer-root {
          border-top: 1px solid var(--border);
          margin-top: 80px;
          background: var(--bg);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.9fr 1.8fr 1fr;
          align-items: start;
          gap: clamp(20px, 3vw, 36px);
          padding: 40px 0 32px;
        }
        .footer-grid > div { min-width: 0; }
        .footer-grid > div:not(.footer-brand-col):not(.footer-contact-col) {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        @media (max-width: 1100px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
            padding: 32px 0 24px;
          }
        }

        .footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-brand-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .footer-brand-logo {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #FFFFFF;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        .footer-brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .footer-brand-logo-fallback {
          display: none;
          color: #1A1D21;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 0.02em;
        }
        .footer-brand-text { min-width: 0; }
        .footer-brand-name {
          font-size: 14px;
          font-weight: 900;
          color: var(--text);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .footer-brand-tag {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--gold);
          margin-top: 2px;
        }
        .footer-slogans {
          display: grid;
          gap: 7px;
          padding-inline-start: 2px;
        }
        .footer-slogan {
          margin: 0;
          line-height: 1.65;
          text-wrap: pretty;
        }
        .footer-slogan-primary {
          color: var(--gold);
          font-size: 13px;
          font-weight: 900;
        }
        .footer-slogan-secondary {
          color: var(--text-soft);
          font-size: 12px;
          font-weight: 700;
        }
        .footer-knowledge-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(224, 168, 26, 0.10), rgba(184, 133, 10, 0.03));
          border: 1px solid rgba(224, 168, 26, 0.30);
          align-self: flex-start;
        }
        .footer-knowledge-icon {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #E0A81A, #B8850A);
          color: #FFFFFF;
          flex-shrink: 0;
        }
        .footer-knowledge-title {
          font-size: 11px;
          font-weight: 900;
          color: var(--text);
          line-height: 1.2;
        }
        .footer-knowledge-type {
          font-size: 9.5px;
          font-weight: 800;
          color: var(--gold);
          margin-top: 1px;
        }

        .footer-heading {
          font-size: 12px;
          font-weight: 900;
          color: var(--gold);
          margin-bottom: 14px;
          letter-spacing: 0.03em;
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .footer-link {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-soft);
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-link:hover {
          color: var(--gold);
        }

        .footer-contact-col {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .fc-row {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 12px;
          line-height: 1.55;
          color: var(--text-soft);
        }
        .fc-icon {
          color: var(--gold);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .fc-text {
          min-width: 0;
          flex: 1;
        }
        .fc-inline {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }
        .fc-label {
          font-weight: 800;
          color: var(--text-muted);
          font-size: 11px;
        }
        .fc-link {
          font-weight: 800;
          color: var(--text);
          font-family: monospace;
          text-decoration: none;
          font-size: 11.5px;
          transition: color 0.15s;
        }
        .fc-link:hover {
          color: var(--gold);
        }
        .fc-sep {
          color: var(--text-muted);
          opacity: 0.5;
          font-size: 10px;
          margin: 0 2px;
        }
        .fc-muted {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 600;
          margin-top: 2px;
          font-family: monospace;
          direction: ltr;
          text-align: start;
        }
        .fc-address .fc-text { font-weight: 600; }

        .fc-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 1280px) {
          .fc-two-col { grid-template-columns: 1fr; }
        }
        .fc-half {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 12px;
          line-height: 1.55;
          color: var(--text-soft);
        }

        .footer-social-block {
          margin-bottom: 16px;
        }
        .footer-social-label {
          font-size: 9.5px;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
        .footer-social-icons {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }
        .footer-social-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--sc) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--sc) 40%, transparent);
          color: var(--sc);
          transition: all 0.2s;
        }
        .footer-social-btn:hover {
          background: var(--sc);
          color: #FFFFFF;
          transform: translateY(-2px);
        }
        .footer-social-btn:focus-visible,
        .footer-messenger-pill:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 3px;
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--gold) 20%, transparent);
        }

        .footer-social-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .footer-messenger-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--sc) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--sc) 40%, transparent);
          color: var(--sc);
          text-decoration: none;
          font-size: 10.5px;
          font-weight: 900;
          transition: all 0.2s;
        }
        .footer-messenger-pill:hover {
          background: var(--sc);
          color: #FFFFFF;
          transform: translateY(-2px);
        }

        .footer-bottom {
          border-top: 1px solid var(--border);
          padding: 14px 0;
        }
        .footer-bottom-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 11px;
          color: var(--text-soft);
        }
        .footer-bottom-text {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .footer-bottom-it {
          color: var(--gold);
          font-weight: 900;
        }
        .footer-bottom-sep {
          opacity: 0.4;
        }
        .footer-bottom-email {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-soft);
          text-decoration: none;
          font-family: monospace;
          font-weight: 700;
          font-size: 11px;
          direction: ltr;
          transition: color 0.15s;
        }
        .footer-bottom-email:hover {
          color: var(--gold);
        }
        .footer-bottom-email svg {
          color: var(--gold);
        }

        @media (max-width: 640px) {
          .footer-bottom-inner {
            justify-content: center;
            text-align: center;
          }
          .footer-bottom-text {
            justify-content: center;
          }
          .fc-inline {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
          .footer-contact-col {
            gap: 8px;
          }
          .footer-contact-col .fc-row {
            padding: 9px 10px;
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--bg-soft);
            gap: 10px;
          }
          .fc-sep { display: none; }
        }
      `}</style>
    </footer>
  );
}