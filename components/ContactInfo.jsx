"use client";

export default function ContactInfo({ dict }) {
  const cards = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      t: dict.contact.address,
      v: dict.common.address
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      t: dict.contact.phone,
      v: dict.common.phone,
      link: "tel:" + dict.common.phone.replace(/\s|-/g, "")
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      t: dict.contact.email,
      v: dict.common.email,
      link: "mailto:" + dict.common.email
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      t: dict.contact.hours,
      v: dict.contact.hoursValue
    }
  ];

  return (
    <div className="space-y-4">
      {cards.map(function(c, i) {
        const content = (
          <div className="card-glass p-5 sm:p-6 flex gap-4 items-start transition-all hover:border-gold-500/40">
            <div className="p-3 rounded-xl shrink-0" style={{ background: "var(--glow)", color: "var(--gold)" }}>
              {c.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{c.t}</div>
              <div className="mt-1 font-semibold text-sm sm:text-base" style={{ color: "var(--text)" }}>{c.v}</div>
            </div>
          </div>
        );

        if (c.link) {
          return (
            <a key={i} href={c.link} style={{ textDecoration: "none", display: "block" }}>
              {content}
            </a>
          );
        }
        return <div key={i}>{content}</div>;
      })}
    </div>
  );
}
