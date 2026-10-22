"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Building2, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import MediaImage from "./MediaImage";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default function CredibilityCombined({ certificates, partners, content, locale }) {
  const reduceMotion = useReducedMotion();
  const isRtl = locale === "fa" || locale === "ar";
  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const activeCerts = (certificates || []).filter(function(c) { return c.active !== false; });
  const activePartners = (partners || []).filter(function(p) { return p.active !== false; });

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [autoPlay, setAutoPlay] = useState(true);
  const hoverRef = useRef(false);
  const [partnerPage, setPartnerPage] = useState(0);
  const [partnersPerPage, setPartnersPerPage] = useState(6);
  const partnersAutoPlay = !reduceMotion;
  const partnersHoverRef = useRef(false);

  // Responsive items per page
  useEffect(function() {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setItemsPerPage(2);
      else if (w < 1024) setItemsPerPage(3);
      else setItemsPerPage(4);
      if (w < 640) setPartnersPerPage(2);
      else if (w < 1024) setPartnersPerPage(4);
      else setPartnersPerPage(6);
    }
    update();
    window.addEventListener("resize", update);
    return function() { window.removeEventListener("resize", update); };
  }, []);

  const totalPages = Math.max(1, Math.ceil(activeCerts.length / itemsPerPage));
  const partnerTotalPages = Math.max(1, Math.ceil(activePartners.length / partnersPerPage));

  // Auto-play
  useEffect(function() {
    if (!autoPlay || reduceMotion || totalPages <= 1) return;
    const t = setInterval(function() {
      if (hoverRef.current) return;
      setPage(function(p) { return (p + 1) % totalPages; });
    }, 4500);
    return function() { clearInterval(t); };
  }, [autoPlay, reduceMotion, totalPages]);

  useEffect(function() {
    if (!partnersAutoPlay || partnerTotalPages <= 1) return;
    const timer = setInterval(function() {
      if (partnersHoverRef.current) return;
      setPartnerPage(function(current) { return (current + 1) % partnerTotalPages; });
    }, 4000);
    return function() { clearInterval(timer); };
  }, [partnersAutoPlay, partnerTotalPages]);

  // Reset page when itemsPerPage changes
  useEffect(function() {
    if (page >= totalPages) setPage(0);
  }, [itemsPerPage, totalPages, page]);

  useEffect(function() {
    if (partnerPage >= partnerTotalPages) setPartnerPage(0);
  }, [partnerPage, partnerTotalPages]);

  function goNext() {
    setPage(function(p) { return (p + 1) % totalPages; });
  }
  function goPrev() {
    setPage(function(p) { return (p - 1 + totalPages) % totalPages; });
  }

  const L = {
    fa: {
      badge: "اسناد و مجوزها",
      certsTitle: "گواهینامه‌ها و مدارک منتشرشده",
      partnersTitle: "شرکای تجاری و همراهان",
      sub: "اعتبار و تاریخ هر سند را از توضیحات زیر آن بررسی کنید",
      empty: "به‌زودی گواهینامه‌ها اضافه می‌شود",
      previous: "شرکای قبلی",
      next: "شرکای بعدی",
      slide: "نمایش گروه شرکا",
      previousCertificate: "گواهی‌های قبلی",
      nextCertificate: "گواهی‌های بعدی",
      certificateSlide: "نمایش گروه گواهی‌ها"
    },
    en: {
      badge: "Certificates & Permits",
      certsTitle: "Published Certificates & Documents",
      partnersTitle: "Business Partners",
      sub: "Check each document's description below for its stated validity",
      empty: "Certificates coming soon",
      previous: "Previous partners",
      next: "Next partners",
      slide: "Show partner group",
      previousCertificate: "Previous certificates",
      nextCertificate: "Next certificates",
      certificateSlide: "Show certificate group"
    },
    ar: {
      badge: "الشهادات والتصاريح",
      certsTitle: "الشهادات والوثائق المنشورة",
      partnersTitle: "الشركاء التجاريون",
      sub: "راجع وصف كل وثيقة أدناه لمعرفة مدة صلاحيتها المذكورة",
      empty: "الشهادات قريباً",
      previous: "الشركاء السابقون",
      next: "الشركاء التاليون",
      slide: "عرض مجموعة الشركاء",
      previousCertificate: "الشهادات السابقة",
      nextCertificate: "الشهادات التالية",
      certificateSlide: "عرض مجموعة الشهادات"
    },
    ru: {
      badge: "Сертификаты и разрешения",
      certsTitle: "Опубликованные сертификаты и документы",
      partnersTitle: "Деловые партнеры",
      sub: "Указанный срок действия каждого документа смотрите ниже",
      empty: "Сертификаты скоро",
      previous: "Предыдущие партнеры",
      next: "Следующие партнеры",
      slide: "Показать группу партнеров",
      previousCertificate: "Предыдущие сертификаты",
      nextCertificate: "Следующие сертификаты",
      certificateSlide: "Показать группу сертификатов"
    }
  }[locale] || {};

  const startIdx = page * itemsPerPage;
  const visibleCerts = activeCerts.slice(startIdx, startIdx + itemsPerPage);
  const visiblePartners = activePartners.slice(
    partnerPage * partnersPerPage,
    (partnerPage + 1) * partnersPerPage
  );

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="text-center mb-10">
        <span className="chip">
          <Award size={12} /> {L.badge}
        </span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">{L.certsTitle}</span>
        </h2>
        <p className="mt-3 text-sm" style={{ color: "var(--text-soft)" }}>
          {L.sub}
        </p>
      </div>

      {/* Certificate slider */}
      {activeCerts.length > 0 ? (
        <div
          role="region"
          aria-label={L.certsTitle}
          style={{ position: "relative" }}
          onMouseEnter={function() { hoverRef.current = true; }}
          onMouseLeave={function() { hoverRef.current = false; }}
          onFocusCapture={function() { hoverRef.current = true; }}
          onBlurCapture={function(event) {
            if (!event.currentTarget.contains(event.relatedTarget)) hoverRef.current = false;
          }}
        >
          {/* Slider track */}
          <div style={{ overflow: "hidden", padding: "10px 4px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(" + itemsPerPage + ", minmax(0, 1fr))",
                gap: 16,
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              {visibleCerts.map(function(c, i) {
                return (
                  <motion.div
                    key={c.id + "-" + page}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    style={{ textAlign: "center" }}
                  >
                    <div style={{
                      position: "relative",
                      aspectRatio: "1",
                      borderRadius: 14,
                      padding: 10,
                      background: "linear-gradient(135deg, #F8F9FB, #EEF1F6)",
                      border: "2.5px solid #E0A81A",
                      boxShadow: "0 6px 20px rgba(201, 149, 13, 0.12), inset 0 2px 6px rgba(0,0,0,0.04)",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: "100%", height: "100%",
                        borderRadius: 8,
                        background: "var(--bg-card)",
                        display: "grid",
                        placeItems: "center",
                        padding: 8,
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)"
                      }}>
                        {c.image ? (
                          <MediaImage src={c.image} alt={pick(c.title, locale)}
                            width={400} height={300} sizes="200px"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <div style={{ textAlign: "center", padding: "0 6px" }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 12,
                              margin: "0 auto 8px",
                              display: "grid", placeItems: "center",
                              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
                              color: "#FFFFFF"
                            }}>
                              <Award size={20} />
                            </div>
                            <div style={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: "var(--text)",
                              lineHeight: 1.3
                            }}>
                              {pick(c.title, locale)}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{
                        position: "absolute",
                        top: 0, insetInlineEnd: 0,
                        width: 0, height: 0,
                        borderStyle: "solid",
                        borderWidth: "0 32px 32px 0",
                        borderColor: "transparent #E0A81A transparent transparent",
                        opacity: 0.9
                      }} />
                    </div>
                    <div style={{
                      fontSize: 10.5,
                      color: "var(--text-muted)",
                      fontWeight: 700,
                      marginTop: 8,
                      lineHeight: 1.4
                    }}>
                      {pick(c.issuer, locale)}
                    </div>
                    {pick(c.validity, locale) && (
                      <div style={{
                        fontSize: 9,
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                        marginTop: 5
                      }}>
                        {pick(c.validity, locale)}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Navigation arrows */}
          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label={L.previousCertificate}
                style={{
                  position: "absolute",
                  top: "40%",
                  insetInlineStart: -8,
                  width: 44, height: 44,
                  borderRadius: "50%",
                  display: "grid", placeItems: "center",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 20px rgba(20, 22, 27, 0.12)",
                  cursor: "pointer",
                  color: "var(--gold)",
                  transition: "all 0.15s",
                  zIndex: 2
                }}
                onMouseEnter={function(e) {
                  e.currentTarget.style.background = "linear-gradient(135deg, #E0A81A, #B8850A)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={function(e) {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.color = "var(--gold)";
                }}
              >
                <PreviousIcon size={22} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={L.nextCertificate}
                style={{
                  position: "absolute",
                  top: "40%",
                  insetInlineEnd: -8,
                  width: 44, height: 44,
                  borderRadius: "50%",
                  display: "grid", placeItems: "center",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 20px rgba(20, 22, 27, 0.12)",
                  cursor: "pointer",
                  color: "var(--gold)",
                  transition: "all 0.15s",
                  zIndex: 2
                }}
                onMouseEnter={function(e) {
                  e.currentTarget.style.background = "linear-gradient(135deg, #E0A81A, #B8850A)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={function(e) {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.color = "var(--gold)";
                }}
              >
                <NextIcon size={22} />
              </button>
            </>
          )}

          {/* Dots */}
          {totalPages > 1 && (
            <div className="credibility-dots">
              {Array.from({ length: totalPages }).map(function(_, i) {
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={function() { setPage(i); }}
                    aria-label={L.certificateSlide + " " + (i + 1)}
                    aria-current={page === i ? "true" : undefined}
                    className={"credibility-dot" + (page === i ? " is-active" : "")}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{L.empty}</p>
        </div>
      )}

      {/* Knowledge badge */}
      <div style={{
        padding: "16px 20px",
        borderRadius: 18,
        background: "linear-gradient(135deg, #FFF9E6, #FEF3C7)",
        border: "2px solid #E0A81A",
        marginTop: 40,
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        boxShadow: "0 8px 24px rgba(201, 149, 13, 0.15)"
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14,
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg, #E0A81A, #B8850A)",
          color: "#FFFFFF",
          flexShrink: 0,
          boxShadow: "0 8px 20px rgba(201, 149, 13, 0.35)"
        }}>
          <BadgeCheck size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 900,
            color: "#8A6508",
            marginBottom: 3,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap"
          }}>
            {locale === "fa" ? "شرکت دانش‌بنیان" : "Knowledge-Based Company"}
            <span style={{
              padding: "2px 10px",
              borderRadius: 6,
              background: "linear-gradient(135deg, #E0A81A, #B8850A)",
              color: "#FFFFFF",
              fontSize: 11
            }}>
              {locale === "fa" ? "تولیدی نوع یک" : "Type I"}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#8A6508", fontWeight: 600 }}>
            {locale === "fa"
              ? "تأیید شده توسط معاونت علمی و فناوری ریاست جمهوری"
              : "Approved by Vice Presidency for Science & Technology"}
          </div>
        </div>
      </div>

      {/* Partners */}
      {activePartners.length > 0 && (
        <>
          <div className="text-center mt-12 mb-6">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Building2 size={16} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text-soft)" }}>
                {L.partnersTitle}
              </span>
            </div>
          </div>
          <div
            style={{ position: "relative" }}
            onMouseEnter={function() { partnersHoverRef.current = true; }}
            onMouseLeave={function() { partnersHoverRef.current = false; }}
            onFocusCapture={function() { partnersHoverRef.current = true; }}
            onBlurCapture={function(event) {
              if (!event.currentTarget.contains(event.relatedTarget)) partnersHoverRef.current = false;
            }}
          >
            <div style={{ overflow: "hidden", padding: "8px 4px" }}>
              <motion.div
                key={partnerPage}
                initial={{ opacity: 0, x: locale === "fa" || locale === "ar" ? -18 : 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(" + partnersPerPage + ", minmax(0, 1fr))",
                  gap: 14
                }}
              >
                {visiblePartners.map(function(p) {
                  const card = (
                    <div
                      className="card-glass"
                      style={{
                        minHeight: 112,
                        borderRadius: 16,
                        display: "grid",
                        placeItems: "center",
                        padding: "18px 14px",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
                      }}
                    >
                      {p.logo ? (
                        <MediaImage
                          src={p.logo}
                          alt={pick(p.name, locale)}
                          width={300}
                          height={152}
                          sizes="150px"
                          style={{ width: "100%", maxWidth: 150, height: 76, objectFit: "contain" }}
                        />
                      ) : (
                        <div style={{ textAlign: "center" }}>
                          <Building2 size={28} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                          <div style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "var(--text-soft)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {pick(p.name, locale)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                  return p.url && p.url !== "#" ? (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      {card}
                    </a>
                  ) : <div key={p.id}>{card}</div>;
                })}
              </motion.div>
            </div>

            {partnerTotalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={function() {
                    setPartnerPage(function(current) {
                      return (current - 1 + partnerTotalPages) % partnerTotalPages;
                    });
                  }}
                  aria-label={L.previous}
                  style={{
                    position: "absolute",
                    top: "50%",
                    insetInlineStart: -10,
                    transform: "translateY(-50%)",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                    cursor: "pointer",
                    color: "var(--gold)",
                    zIndex: 2
                  }}
                >
                  <PreviousIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={function() {
                    setPartnerPage(function(current) {
                      return (current + 1) % partnerTotalPages;
                    });
                  }}
                  aria-label={L.next}
                  style={{
                    position: "absolute",
                    top: "50%",
                    insetInlineEnd: -10,
                    transform: "translateY(-50%)",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                    cursor: "pointer",
                    color: "var(--gold)",
                    zIndex: 2
                  }}
                >
                  <NextIcon size={20} />
                </button>
                <div className="credibility-dots">
                  {Array.from({ length: partnerTotalPages }).map(function(_, index) {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={function() { setPartnerPage(index); }}
                        aria-label={L.slide + " " + (index + 1)}
                        aria-current={partnerPage === index ? "true" : undefined}
                        className={"credibility-dot" + (partnerPage === index ? " is-active" : "")}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
