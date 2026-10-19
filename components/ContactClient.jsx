"use client";
import React, { useState } from "react";
import ContactForm from "./ContactForm";

export default function ContactClient({ dict, locale, company, branding, content, career }) {
  const isFa = locale === "fa";

  // ===== بخش فرصت همکاری: متن از دیکشنری ترجمه و امکان بازنویسی از پنل مدیریت =====
  const careerInfo = (dict.contact && dict.contact.career) || {};
  const careerTitle = (career && career.careerTitle) || careerInfo.title || "";
  const careerSubtitle = (career && career.careerSubtitle) || careerInfo.subtitle || "";
  const careerRoles = resolveCareerRoles(career && career.careerRoles, careerInfo.roles);
  const careerOffers = Array.isArray(careerInfo.offers) ? careerInfo.offers : [];
  const careerMailto = function(roleTitle) {
    const base = careerInfo.emailSubject || careerTitle || "";
    const subject = roleTitle ? base + " - " + roleTitle : base;
    return "mailto:" + emailPrimary + "?subject=" + encodeURIComponent(subject);
  };

  const phoneOffice = company.phone.office;
  const phoneFactory = company.phone.factory;
  const mobile = company.phone.mobile;
  const fax = company.fax.office;
  const emailPrimary = company.email.primary;
  const emailSecondary = company.email.secondary;
  const addressOffice = company.address.office[locale] || company.address.office.en;
  const addressFactory = company.address.factory[locale] || company.address.factory.en;
  const factoryCoordinates = company.address.factoryCoordinates;
  const mapQuery = factoryCoordinates.latitude + "," + factoryCoordinates.longitude;
  const mapEmbedUrl = "https://maps.google.com/maps?q=" + encodeURIComponent(mapQuery) +
    "&z=17&output=embed&hl=" + encodeURIComponent(locale);
  const mapLinkUrl = "https://www.google.com/maps?q=" + encodeURIComponent(mapQuery);
  const officeMapLinkUrl = "https://www.google.com/maps?q=" + encodeURIComponent(addressOffice);
  const postalCode = company.address.postalCode;
  const messengers = company.messengers;
  const L = dict.contact;
  const guide = L.guide;

  // ===== Rows for info card =====
  const rows = [];

  // Office address
  rows.push({
    icon: "map",
    label: L.office,
    value: addressOffice,
    subvalue: L.postalLabel + ": " + postalCode,
    link: officeMapLinkUrl,
    color: "#107C10"
  });

  // Factory address (if different from office)
  if (addressFactory && addressFactory !== addressOffice) {
    rows.push({
      icon: "factory",
      label: L.factory,
      value: addressFactory,
      subvalue: L.postalLabel + ": " + postalCode,
      link: mapLinkUrl,
      color: "#0891B2"
    });
  }

  // Office phone
  rows.push({
    icon: "phone",
    label: L.phoneLabel,
    value: phoneOffice,
    link: "tel:" + phoneOffice.replace(/\s/g, ""),
    color: "#0078D4"
  });

  // Factory phone (if different)
  if (phoneFactory && phoneFactory !== phoneOffice) {
    rows.push({
      icon: "phone",
      label: L.phoneLabel + " (" + L.factory + ")",
      value: phoneFactory,
      link: "tel:" + phoneFactory.replace(/\s/g, ""),
      color: "#0078D4"
    });
  }

  // Mobile numbers
  mobile.forEach(function(m, i) {
    rows.push({
      icon: "mobile",
      label: L.mobileLabel + (mobile.length > 1 ? " " + (i + 1) : ""),
      value: m,
      link: "tel:" + m.replace(/\s/g, ""),
      color: "#107C10"
    });
  });

  // Fax
  rows.push({
    icon: "fax",
    label: L.faxLabel,
    value: fax,
    color: "#8764B8"
  });

  // Emails
  rows.push({
    icon: "mail",
    label: L.emailLabel,
    value: emailPrimary,
    link: "mailto:" + emailPrimary,
    color: "#C9950D"
  });
  if (emailSecondary) {
    rows.push({
      icon: "mail",
      label: L.emailLabel + " (Gmail)",
      value: emailSecondary,
      link: "mailto:" + emailSecondary,
      color: "#C9950D"
    });
  }

  // ===== Social links (real) =====
  const socialLinks = [
    {
      name: "Instagram",
      url: branding.socialLinks?.instagram || company.social.instagram,
      handle: company.social.instagramHandle,
      color: "#E4405F",
      svg: "instagram"
    },
    {
      name: "WhatsApp",
      url: branding.socialLinks?.whatsapp || company.social.whatsapp,
      handle: company.phone.mobile[1] || company.phone.mobile[0] || "",
      color: "#25D366",
      svg: "whatsapp"
    },
    {
      name: "Aparat",
      url: branding.socialLinks?.aparat || company.social.aparat,
      handle: "@petrosazehmihan",
      color: "#ED145B",
      svg: "aparat"
    }
  ];

  const iranianSocial = [
    {
      name: isFa ? "بله" : "Bale",
      url: branding.socialLinks?.bale || "https://ble.ir/psm_commercial",
      handle: messengers.bale,
      color: "#00A650",
      svg: "bale"
    },
    {
      name: isFa ? "روبیکا" : "Rubika",
      url: branding.socialLinks?.rubika || "https://rubika.ir/Psm_commercial",
      handle: messengers.rubika,
      color: "#7B2CBF",
      svg: "rubika"
    },
    {
      name: isFa ? "ایتا" : "Eitaa",
      url: branding.socialLinks?.eitaa || "https://eitaa.com/Psm_commercial",
      handle: messengers.eita,
      color: "#F5A623",
      svg: "eitaa"
    }
  ];

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* ============ Hero ============ */}
      <section style={{
        background: "linear-gradient(135deg, var(--bg) 0%, var(--bg-soft) 55%, var(--bg-card) 100%)",
        padding: "60px 0 80px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div className="grid-pattern" style={{ position: "absolute", inset: 0, opacity: 0.07 }} />
        <div style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245, 197, 24, 0.18), transparent 70%)",
          filter: "blur(60px)"
        }} />

        <div className="container-x" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center max-w-3xl mx-auto">
            <span className="chip" style={{
              background: "var(--bg-card)",
              borderColor: "rgba(245, 197, 24, 0.4)",
              color: "var(--gold)"
            }}>
              {L.badge}
            </span>
            <h1 className="section-title mt-4" style={{ color: "var(--text)" }}>
              <span className="heading-gold">{L.title1} {L.title2}</span>
            </h1>
            <p className="mt-5 text-base leading-8 max-w-2xl mx-auto"
              style={{ color: "var(--text-soft)" }}>
              {L.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ============ Main content ============ */}
      <section className="container-x py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <div id="contact-form" className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                padding: "24px 28px",
                borderBottom: "1px solid var(--border)",
                background: "linear-gradient(135deg, rgba(201, 149, 13, 0.06), transparent)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    display: "grid",
                    placeItems: "center",
                    background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                    color: "#FFFFFF"
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>
                      {L.formTitle}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {L.formSubtitle}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 28 }}>
                <ContactForm />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-2">
            <div className="card-glass overflow-hidden">
              <div className="relative h-48 sm:h-56">
                <img
                  src={content.contactGuide.photo}
                  alt={guide.imageAlt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
                <div className="absolute inset-x-5 bottom-4 text-white">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">PSM VALVE</span>
                  <h2 className="mt-1 text-xl font-black leading-relaxed">{guide.title}</h2>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-sm leading-7 text-soft">{guide.description}</p>

                <h3 className="mt-6 text-sm font-black" style={{ color: "var(--text)" }}>
                  {guide.expertiseTitle}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {guide.expertise.map(function(item) {
                    return (
                      <span
                        key={item}
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                        style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-soft)" }}
                      >
                        {item}
                      </span>
                    );
                  })}
                </div>

                <h3 className="mt-6 text-sm font-black" style={{ color: "var(--text)" }}>
                  {guide.stepsTitle}
                </h3>
                <ol className="mt-3 space-y-3">
                  {guide.steps.map(function(step, index) {
                    return (
                      <li key={step[0]} className="flex items-start gap-3">
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black"
                          style={{ background: "var(--glow)", color: "var(--gold)" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs leading-6" style={{ color: "var(--text-soft)" }}>
                          <strong className="block font-black" style={{ color: "var(--text)" }}>{step[0]}</strong>
                          {step[1]}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <a href="#contact-form" className="btn-gold mt-6 w-full">
                  {guide.action}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ============ Careers / فرصت همکاری ============ */}
      <section className="container-x py-16 sm:py-20" id="careers">
        <div className="card-glass mx-auto max-w-4xl p-6 sm:p-9">
          <div className="text-center">
            <span className="chip">{careerInfo.badge}</span>
            <h2 className="mt-3 text-xl font-black sm:text-2xl md:text-3xl" style={{ color: "var(--text)" }}>
              <span className="heading-gold">{careerTitle}</span>
            </h2>
            {careerSubtitle ? (
              <p className="mx-auto mt-3 max-w-2xl text-xs leading-7 sm:text-sm" style={{ color: "var(--text-soft)" }}>{careerSubtitle}</p>
            ) : null}
          </div>

          {careerRoles.length > 0 ? (
            <div className="mt-7 border-t pt-6" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xs font-black" style={{ color: "var(--text-muted)" }}>{careerInfo.rolesTitle}</h3>
              <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {careerRoles.map(function(role, index) {
                  const showEn = role.en && role.en.toLowerCase() !== role.title.toLowerCase();
                  return (
                    <li key={role.title + index} className="flex items-start gap-2.5">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--gold)" }} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold" style={{ color: "var(--text)" }}>
                          {role.title}
                          {showEn ? (
                            <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)", marginInlineStart: 8 }} dir="ltr">{role.en}</span>
                          ) : null}
                        </div>
                        {role.desc ? (
                          <div className="mt-0.5 text-[11px] leading-6" style={{ color: "var(--text-muted)" }}>{role.desc}</div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {careerOffers.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {careerInfo.offersTitle ? (
                <span className="text-[11px] font-black" style={{ color: "var(--text)" }}>{careerInfo.offersTitle}</span>
              ) : null}
              {careerOffers.map(function(item) {
                return (
                  <span key={item} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--text-soft)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E0A81A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </span>
                );
              })}
            </div>
          ) : null}

          <div className="mt-7 flex flex-col gap-4 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
            <div className="min-w-0">
              <div className="text-xs font-black" style={{ color: "var(--text)" }}>{careerInfo.applyTitle}</div>
              {careerInfo.applyDesc ? (
                <div className="mt-1 text-[11px] leading-6" style={{ color: "var(--text-muted)" }}>{careerInfo.applyDesc}</div>
              ) : null}
              <div className="mt-1.5 truncate text-[11px] font-bold" style={{ color: "var(--gold)" }} dir="ltr">{emailPrimary}</div>
            </div>
            <a href={careerMailto("")} className="btn-gold shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {careerInfo.applyCta}
            </a>
          </div>
        </div>
      </section>

      {/* ============ Map ============ */}
      <section className="container-x pb-16">
        <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #107C10, #0A5F0A)",
                color: "#FFFFFF"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>
                  {L.mapTitle}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                  {addressFactory}
                </div>
              </div>
            </div>
            <a href={mapLinkUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
              {L.mapSubtitle}
            </a>
          </div>

          <div style={{ height: 420 }}>
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="PSM Valve Location"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// ICONS
// ============================================================
function InfoIcon({ name }) {
  const icons = {
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
    mobile: <><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>,
    fax: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
    map: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
    factory: <><path d="M2 20h20" /><path d="M4 20V8l6 4V8l6 4V8l4 3v9" /><path d="M9 14v6" /><path d="M15 14v6" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.phone}
    </svg>
  );
}

// موقعیت‌های شغلی: از پنل مدیریت (هر خط: فارسی | انگلیسی | توضیح) یا از دیکشنری ترجمه
function resolveCareerRoles(overrideText, dictRoles) {
  const fromAdmin = String(overrideText || "")
    .split(/\r?\n/)
    .map(function(line) { return line.split("|").map(function(part) { return part.trim(); }); })
    .filter(function(parts) { return parts[0]; })
    .map(function(parts) { return { title: parts[0], en: parts[1] || "", desc: parts[2] || "" }; });
  if (fromAdmin.length) return fromAdmin;
  if (!Array.isArray(dictRoles)) return [];
  return dictRoles.map(function(row) {
    if (Array.isArray(row)) return { title: row[0] || "", en: row[1] || "", desc: row[2] || "" };
    return { title: String(row || ""), en: "", desc: "" };
  }).filter(function(role) { return role.title; });
}

function SocialIcon({ name, url, color, svg, handle }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={name + (handle ? " — " + handle : "")}
        onMouseEnter={function() { setHovered(true); }}
        onMouseLeave={function() { setHovered(false); }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: hovered ? color : color + "15",
          border: "1px solid " + color + "40",
          color: hovered ? "#FFFFFF" : color,
          textDecoration: "none",
          transition: "all 0.18s",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 20px " + color + "50" : "none"
        }}
      >
        <SocialSVG name={svg} />
      </a>
    </div>
  );
}

function IranianSocial({ name, url, color, svg }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={function() { setHovered(true); }}
      onMouseLeave={function() { setHovered(false); }}
      style={{
        height: 38,
        padding: "0 12px",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: hovered ? color : color + "15",
        border: "1px solid " + color + "40",
        color: hovered ? "#FFFFFF" : color,
        textDecoration: "none",
        transition: "all 0.18s",
        fontSize: 11.5,
        fontWeight: 900,
        fontFamily: "inherit",
        transform: hovered ? "translateY(-2px)" : "translateY(0)"
      }}
    >
      <SocialSVG name={svg} size={13} />
      {name}
    </a>
  );
}

function SocialSVG({ name, size }) {
  const s = size || 18;
  const icons = {
    instagram: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>,
    whatsapp: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor" stroke="none" />,
    aparat: <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><path d="M10 8.5v7l6-3.5-6-3.5z" fill="#FFFFFF" stroke="none" /></>,
    telegram: <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="currentColor" stroke="none" />,
    linkedin: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor" stroke="none" />,
    youtube: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor" stroke="none" />,
    bale: <><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></>,
    rubika: <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.18L18 8v8l-6 3.82L6 16V8l6-3.82zM12 6l-4 2.5v7l4 2.5 4-2.5v-7L12 6z" fill="currentColor" stroke="none" />,
    eitaa: <><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm3.5 6.5l-4 4c-.2.2-.5.2-.7 0l-2-2c-.2-.2-.2-.5 0-.7s.5-.2.7 0l1.65 1.65 3.65-3.65c.2-.2.5-.2.7 0s.2.5 0 .7z" /></>
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.instagram}
    </svg>
  );
}