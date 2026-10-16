"use client";

import { useState } from "react";
import { Building2, Search } from "lucide-react";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

const labels = {
  fa: {
    search: "جستجو در نام همراهان",
    placeholder: "نام شرکت را وارد کنید...",
    count: "نمایش {shown} از {total} همراه",
    empty: "موردی با این نام پیدا نشد."
  },
  en: {
    search: "Search partners",
    placeholder: "Enter a company name...",
    count: "Showing {shown} of {total} partners",
    empty: "No matching companies found."
  },
  ar: {
    search: "البحث في أسماء الشركاء",
    placeholder: "أدخل اسم الشركة...",
    count: "عرض {shown} من أصل {total} شريكاً",
    empty: "لم يتم العثور على شركات مطابقة."
  },
  ru: {
    search: "Поиск партнеров",
    placeholder: "Введите название компании...",
    count: "Показано {shown} из {total}",
    empty: "Совпадений не найдено."
  }
};

export default function PartnersDirectory({ partners, locale }) {
  const [query, setQuery] = useState("");
  const t = labels[locale] || labels.en;
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filtered = partners.filter(function(partner) {
    return Object.values(partner.name || {}).some(function(name) {
      return String(name).toLocaleLowerCase(locale).includes(normalizedQuery);
    });
  });
  const number = new Intl.NumberFormat(locale).format;
  const count = t.count
    .replace("{shown}", number(filtered.length))
    .replace("{total}", number(partners.length));

  return (
    <>
      <div className="max-w-xl mx-auto mb-8">
        <label className="sr-only" htmlFor="partners-search">{t.search}</label>
        <div className="relative">
          <Search
            size={18}
            aria-hidden="true"
            className="absolute top-1/2 -translate-y-1/2"
            style={{ insetInlineStart: 16, color: "var(--text-muted)" }}
          />
          <input
            id="partners-search"
            type="search"
            value={query}
            onChange={function(event) { setQuery(event.target.value); }}
            placeholder={t.placeholder}
            className="w-full rounded-xl py-3 ps-11 pe-4 text-sm outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text)"
            }}
          />
        </div>
        <p className="mt-3 text-center text-xs" aria-live="polite" style={{ color: "var(--text-muted)" }}>
          {count}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="card-glass p-10 text-center">
          <p style={{ color: "var(--text-muted)" }}>{t.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map(function(partner) {
            const name = pick(partner.name, locale);
            const card = (
              <div className="card-glass h-full min-h-36 p-5 grid place-items-center transition hover:-translate-y-1 hover:border-gold-500/50">
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    className="max-w-full max-h-24 object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Building2 size={34} aria-hidden="true" style={{ color: "var(--gold)", margin: "0 auto 10px" }} />
                    <div className="text-xs font-bold" style={{ color: "var(--text-soft)" }}>{name}</div>
                  </div>
                )}
              </div>
            );

            return partner.url && partner.url !== "#" ? (
              <a key={partner.id} href={partner.url} target="_blank" rel="noopener noreferrer" aria-label={name}>
                {card}
              </a>
            ) : (
              <div key={partner.id}>{card}</div>
            );
          })}
        </div>
      )}
    </>
  );
}
