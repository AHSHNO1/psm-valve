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

export default function DatasheetPrint({ product, locale, dict }) {
  const p = product;
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

  useEffect(() => {
    document.documentElement.setAttribute("dir", locale === "fa" || locale === "ar" ? "rtl" : "ltr");
  }, [locale]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F6F8", color: "#1A1D21" }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1 className="font-bold text-sm sm:text-base">Datasheet — {name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
            >
              <Printer size={16} /> چاپ / ذخیره PDF
            </button>
            <button
              onClick={() => window.close()}
              className="p-2 rounded-lg border hover:bg-gray-100"
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
                <div className="font-black text-lg">پترو سازه میهن</div>
                <div className="text-xs font-bold tracking-widest" style={{ color: "#B8860B" }}>
                  PSM VALVE
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>تاریخ: {new Date().toLocaleDateString("fa-IR")}</div>
              <div className="mt-1">کد: {p.series}</div>
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
                ویژگی‌ها و مزایا
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
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>آپشن‌ها</h3>
              <ul className="space-y-2">
                {options.map((option, index) => <li key={index} className="text-sm">• {option}</li>)}
              </ul>
            </div>
          )}

          {applications.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>کاربردها</h3>
              <ul className="space-y-2">
                {applications.map((application, index) => <li key={index} className="text-sm">• {application}</li>)}
              </ul>
            </div>
          )}

          {clients.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>برخی از مشتریان ما</h3>
              <ul className="space-y-2">
                {clients.map((client, index) => <li key={index} className="text-sm">• {client}</li>)}
              </ul>
            </div>
          )}

          {/* Specs table */}
          {visibleSpecs.length > 0 && (
            <div className="mb-8">
              <h3 className="font-black text-lg mb-3 pb-2 border-b" style={{ color: "#B8860B" }}>
                مشخصات فنی
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

          {/* Footer */}
          <div className="border-t pt-6 mt-8 text-xs text-gray-500 flex justify-between flex-wrap gap-3">
            <div>
              <div className="font-bold text-gray-700 mb-1">پترو سازه میهن</div>
              <div>اراک، شهرک صنعتی، خیابان صنعت، پلاک ۱۲</div>
            </div>
            <div className="text-left">
              <div>۰۸۶-۳۳۰۰۰۰۰۰</div>
              <div>info@psmvalve.com</div>
              <div>www.psmvalve.com</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
