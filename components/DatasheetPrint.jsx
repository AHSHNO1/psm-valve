"use client";
import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { SPEC_FIELDS } from "@/lib/spec-fields";

function pick(obj, locale) {
  if (!obj) return "";
  return obj[locale] || obj.en || obj.fa || "";
}

function pickArray(obj, locale) {
  if (!obj) return [];
  return obj[locale] || obj.en || obj.fa || [];
}

const TEXT = {
  fa: {
    print: "چاپ / ذخیره PDF",
    features: "ویژگی‌ها و مزایا",
    options: "آپشن‌ها",
    applications: "کاربردها",
    clients: "برخی از مشتریان ما",
    specs: "مشخصات فنی",
    date: "تاریخ",
    code: "کد محصول",
    address: "آدرس",
    postal: "کد پستی",
    phone: "تلفن",
    mobile: "همراه",
    fax: "فکس",
    email: "ایمیل",
    web: "وب‌سایت",
    datasheet: "دیتاشیت محصول"
  },
  en: {
    print: "Print / Save PDF",
    features: "Features & Benefits",
    options: "Options",
    applications: "Applications",
    clients: "Selected Customers",
    specs: "Technical Specifications",
    date: "Date",
    code: "Product code",
    address: "Address",
    postal: "Postal code",
    phone: "Tel",
    mobile: "Mobile",
    fax: "Fax",
    email: "Email",
    web: "Website",
    datasheet: "Product Datasheet"
  },
  ar: {
    print: "طباعة / حفظ PDF",
    features: "الميزات والفوائد",
    options: "الخيارات",
    applications: "التطبيقات",
    clients: "بعض عملائنا",
    specs: "المواصفات الفنية",
    date: "التاريخ",
    code: "رمز المنتج",
    address: "العنوان",
    postal: "الرمز البريدي",
    phone: "هاتف",
    mobile: "جوال",
    fax: "فاكس",
    email: "البريد الإلكتروني",
    web: "الموقع",
    datasheet: "صحيفة بيانات المنتج"
  },
  ru: {
    print: "Печать / PDF",
    features: "Особенности и преимущества",
    options: "Опции",
    applications: "Применение",
    clients: "Наши заказчики",
    specs: "Технические характеристики",
    date: "Дата",
    code: "Код продукта",
    address: "Адрес",
    postal: "Индекс",
    phone: "Тел",
    mobile: "Моб",
    fax: "Факс",
    email: "E-mail",
    web: "Сайт",
    datasheet: "Паспорт изделия"
  }
};

const DATE_LOCALES = { fa: "fa-IR", en: "en-GB", ar: "ar-EG", ru: "ru-RU" };

export default function DatasheetPrint({ product, locale, dict, company }) {
  const p = product;
  const t = TEXT[locale] || TEXT.en;
  const info = company || {};
  const name = pick(p.name, locale);
  const description = pick(p.description, locale) || pick(p.short, locale);
  const features = pickArray(p.features, locale);
  const options = pickArray(p.options, locale);
  const applications = pickArray(p.applications, locale);
  const clients = pickArray(p.clients, locale);
  const specs = Array.isArray(p.specifications)
    ? p.specifications.map((row) => ({ key: pick(row.label, locale), value: pick(row.value, locale) }))
    : SPEC_FIELDS.map((field) => ({
      key: pick(field.label, locale),
      value: pick(p.spec?.[field.id], locale)
    }));
  const visibleSpecs = specs.filter((row) => row.key && row.value);

  const companyName = pick(info.name, locale) || "پترو سازه میهن";
  const brand = info.brandEn || "PETRO SAZEH MIHAN CO.";
  const address = pick(info.address?.office, locale);
  const postalCode = info.address?.postalCode || "";
  const phoneOffice = info.phone?.office || "";
  const mobiles = Array.isArray(info.phone?.mobile) ? info.phone.mobile : [];
  const fax = info.fax?.office || "";
  const email = info.email?.primary || "";
  const emailAlt = info.email?.secondary || "";
  const website = String(info.social?.website || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const dateLocale = DATE_LOCALES[locale] || "en-GB";

  useEffect(() => {
    document.documentElement.setAttribute("dir", locale === "fa" || locale === "ar" ? "rtl" : "ltr");
  }, [locale]);

  return (
    <div className="min-h-screen datasheet-root" style={{ background: "#F5F6F8", color: "#1A1D21" }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1 className="font-bold text-sm sm:text-base">{t.datasheet} — {name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
            >
              <Printer size={16} /> {t.print}
            </button>
            <button
              onClick={() => window.close()}
              className="p-2 rounded-lg border hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* A4 content */}
      <div className="max-w-4xl mx-auto p-6 sm:p-10 print:p-0">
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl grid place-items-center font-black text-lg"
                style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
              >
                PSM
              </div>
              <div>
                <div className="font-black text-lg">{companyName}</div>
                <div className="text-xs font-bold tracking-widest" style={{ color: "#B8860B" }}>
                  {brand}
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>{t.date}: {new Date().toLocaleDateString(dateLocale)}</div>
              <div className="mt-1">{t.code}: {p.series}</div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <div
              className="inline-block px-3 py-1 rounded-md text-xs font-black mb-3"
              style={{ background: "rgba(212, 160, 23, 0.15)", color: "#B8860B" }}
            >
              {p.series}
            </div>
            <h2 className="text-3xl font-black mb-3">{name}</h2>
            <p className="text-gray-600 leading-7 whitespace-pre-line">{description}</p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>
                {t.features}
              </h3>
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                      style={{ background: "#C9950D" }}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {options.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>{t.options}</h3>
              <ul className="space-y-2">
                {options.map((option, index) => <li key={index} className="text-sm">• {option}</li>)}
              </ul>
            </div>
          )}

          {applications.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>{t.applications}</h3>
              <ul className="space-y-2">
                {applications.map((application, index) => <li key={index} className="text-sm">• {application}</li>)}
              </ul>
            </div>
          )}

          {clients.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>{t.clients}</h3>
              <ul className="space-y-2">
                {clients.map((client, index) => <li key={index} className="text-sm">• {client}</li>)}
              </ul>
            </div>
          )}

          {/* Specs table */}
          {visibleSpecs.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>
                {t.specs}
              </h3>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {visibleSpecs.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#F9FAFB" : "transparent" }}>
                      <td className="py-2.5 px-3 font-semibold text-gray-600 w-2/5 border-b border-gray-100">
                        {s.key}
                      </td>
                      <td className="py-2.5 px-3 font-bold border-b border-gray-100">
                        {s.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer — complete company contact */}
          <div className="border-t pt-6 mt-8 text-xs text-gray-600">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="font-black text-gray-800 mb-2">{companyName}</div>
                <div className="leading-6">
                  <span className="font-bold">{t.address}: </span>
                  {address}
                </div>
                {postalCode && (
                  <div className="leading-6">
                    <span className="font-bold">{t.postal}: </span>
                    <span dir="ltr">{postalCode}</span>
                  </div>
                )}
              </div>
              <div className="sm:text-left leading-6">
                {phoneOffice && (
                  <div>
                    <span className="font-bold">{t.phone}: </span>
                    <span dir="ltr">{phoneOffice}</span>
                  </div>
                )}
                {mobiles.length > 0 && (
                  <div>
                    <span className="font-bold">{t.mobile}: </span>
                    <span dir="ltr">{mobiles.join(" · ")}</span>
                  </div>
                )}
                {fax && (
                  <div>
                    <span className="font-bold">{t.fax}: </span>
                    <span dir="ltr">{fax}</span>
                  </div>
                )}
                {email && (
                  <div>
                    <span className="font-bold">{t.email}: </span>
                    <span dir="ltr">{email}</span>
                    {emailAlt ? <span dir="ltr"> · {emailAlt}</span> : null}
                  </div>
                )}
                {website && (
                  <div>
                    <span className="font-bold">{t.web}: </span>
                    <span dir="ltr">{website}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white !important; }
          .datasheet-root { background: #FFFFFF !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
