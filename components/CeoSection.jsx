"use client";
import { motion } from "framer-motion";
import { Quote, User, Award, BadgeCheck, FlaskConical } from "lucide-react";
import MediaImage from "./MediaImage";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  const candidates = [obj[locale], obj.en, obj.fa];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = candidates[i];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

export default function CeoSection({ ceo, locale, certificates, labels }) {
  if (!ceo || !ceo.name) return null;

  const name = pick(ceo.name, locale);
  const role = pick(ceo.role, locale);
  const bio = pick(ceo.bio, locale);
  const message = pick(ceo.message, locale);
  const resume = ceo.resume || {};
  const resumeItems = Array.isArray(resume.items) ? resume.items : [];

  const L = labels;

  const activeCerts = (certificates || []).filter(function(c) { return c.active !== false; });

  return (
    <section className="container-x py-14 sm:py-20">
      <span className="chip">{L.badge}</span>

      {/* Two-column CEO section */}
      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 mt-5 items-start">
        {/* LEFT: Photo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 min-w-0"
        >
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden w-full"
            style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
            {ceo.photo ? (
              <MediaImage src={ceo.photo} alt={name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center"
                style={{ background: "linear-gradient(135deg, var(--bg-soft), var(--bg-card))" }}>
                <User size={80} style={{ color: "var(--text-muted)" }} />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-5"
              style={{ background: "linear-gradient(to top, rgba(15, 17, 20, 0.9), transparent)" }}>
              <div className="font-black text-lg text-white">{name}</div>
              <div className="text-sm text-silver-300 mt-0.5">{role}</div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Bio + Message */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-3 space-y-5 min-w-0"
        >
          <div className="card-glass p-6 sm:p-8">
            <h3 className="font-black text-lg sm:text-xl mb-4" style={{ color: "var(--gold)" }}>
              {L.bioTitle}
            </h3>
            <p className="leading-8 text-sm sm:text-base" style={{ color: "var(--text-soft)" }}>
              {bio}
            </p>
          </div>

          {resumeItems.length > 0 && (
            <div className="card-glass p-6 sm:p-8">
              <h3 className="font-black text-lg sm:text-xl mb-5" style={{ color: "var(--gold)" }}>
                {pick(resume.title, locale) || L.resumeTitle}
              </h3>
              <dl className="grid sm:grid-cols-2 gap-3">
                {resumeItems.map(function(item, index) {
                  return (
                    <div
                      key={index}
                      className="rounded-xl border p-4"
                      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
                    >
                      <dt className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                        {pick(item.label, locale)}
                      </dt>
                      <dd className="mt-2 text-sm font-semibold leading-7" style={{ color: "var(--text)" }}>
                        {pick(item.value, locale)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {pick(resume.note, locale) && (
                <p className="mt-4 text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                  {pick(resume.note, locale)}
                </p>
              )}
            </div>
          )}

          {message && (
            <div className="relative card-glass p-6 sm:p-8 overflow-hidden">
              <Quote size={80} className="absolute top-4 start-4 opacity-10" style={{ color: "var(--gold)" }} />
              <h3 className="font-black text-lg sm:text-xl mb-4 relative z-10" style={{ color: "var(--gold)" }}>
                {L.msgTitle}
              </h3>
              <p className="leading-8 text-sm sm:text-base relative z-10 italic" style={{ color: "var(--text-soft)", whiteSpace: "pre-line" }}>
                «{message}»
              </p>
              <div className="mt-5 pt-5 relative z-10 flex items-center gap-3"
                style={{ borderTop: "1px solid var(--border)" }}>
                <div className="w-10 h-1 rounded-full" style={{ background: "var(--gold)" }} />
                <div>
                  <div className="font-black text-sm" style={{ color: "var(--text)" }}>{name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{role}</div>
                </div>
              </div>
            </div>
          )}

          {/* ★ دانش‌بنیان ویژه — زیر سخن مدیرعامل */}
          <div className="relative rounded-2xl p-6 overflow-hidden gold-panel">
            {/* Decorative corner */}
            <div style={{
              position: "absolute",
              top: -30,
              insetInlineStart: 0,
              width: 120,
              maxWidth: "100%",
              height: 120,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(224, 168, 26, 0.25), transparent 70%)",
              filter: "blur(20px)"
            }} />

            <div className="relative flex items-start gap-5">
              <div className="gold-panel-icon-box" style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                display: "grid",
                placeItems: "center",
                background: "var(--gold-grad)",
                color: "#1A1D21",
                flexShrink: 0
              }}>
                <FlaskConical size={36} strokeWidth={1.8} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <BadgeCheck size={18} className="gold-panel-icon" />
                  <div className="gold-panel-title" style={{
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: "0.01em"
                  }}>
                    {L.knowledge}
                  </div>
                </div>

                <div style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  borderRadius: 10,
                  background: "var(--gold-grad)",
                  color: "#1A1D21",
                  fontSize: 14,
                  fontWeight: 900,
                  marginBottom: 8,
                  letterSpacing: "0.03em"
                }}>
                  {L.knowledgeType}
                </div>

                <div className="gold-panel-text" style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  lineHeight: 1.6
                }}>
                  {L.knowledgeDesc}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ★ Certificates as picture frames — big, side by side */}
      {activeCerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
              <Award size={14} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text-soft)", letterSpacing: "0.05em" }}>
                {L.standards}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10, fontWeight: 600 }}>
              {L.standardsSub}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {activeCerts.slice(0, 8).map(function(c, i) {
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group relative"
                >
                  {/* Picture frame */}
                  <div style={{
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: 16,
                    padding: 12,
                    background: "linear-gradient(135deg, #F8F9FB, #EEF1F6)",
                    border: "3px solid var(--gold-bg)",
                    boxShadow: "0 8px 24px rgba(201, 149, 13, 0.15), inset 0 2px 6px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.3s",
                    overflow: "hidden"
                  }}>
                    {/* Inner white frame */}
                    <div style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 10,
                      background: "var(--bg-card)",
                      display: "grid",
                      placeItems: "center",
                      padding: 12,
                      boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.05)"
                    }}>
                      {c.image ? (
                        <a
                          href={c.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={pick(c.title, locale)}
                          title={pick(c.title, locale)}
                          style={{ display: "block", width: "100%", height: "100%" }}
                        >
                          <MediaImage
                            src={c.image}
                            alt={pick(c.title, locale)}
                            width={400}
                            height={300}
                            sizes="(max-width: 640px) 50vw, 160px"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
                            }}
                          />
                        </a>
                      ) : (
                        <div style={{ textAlign: "center", padding: "0 8px" }}>
                          <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            margin: "0 auto 10px",
                            display: "grid",
                            placeItems: "center",
                            background: "var(--gold-grad)",
                            color: "#1A1D21",
                            boxShadow: "0 6px 16px rgba(201, 149, 13, 0.3)"
                          }}>
                            <Award size={26} strokeWidth={2} />
                          </div>
                          <div style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: "var(--text)",
                            lineHeight: 1.3
                          }}>
                            {pick(c.title, locale)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ribbon corner */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      insetInlineEnd: 0,
                      width: 0,
                      height: 0,
                      borderStyle: "solid",
                      borderWidth: "0 42px 42px 0",
                      borderColor: "transparent " + "var(--gold-bg)" + " transparent transparent",
                      opacity: 0.9
                    }} />
                  </div>

                  {/* Issuer label below */}
                  <div style={{
                    textAlign: "center",
                    marginTop: 12,
                    padding: "0 6px"
                  }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "var(--text)",
                      lineHeight: 1.35,
                      marginBottom: 2
                    }}>
                      {pick(c.title, locale)}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontWeight: 600,
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
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </section>
  );
}
