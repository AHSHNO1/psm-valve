import { getProjects, getContent } from "@/lib/content";
import { Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

function pick(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

export default async function ProjectsPage({ params }) {
  const { locale } = params;
  const projects = getProjects().filter(function(p) { return p.active !== false; });
  const content = getContent();
  const meta = content.projects || {};

  const labels = {
    fa: {
      badge: "پروژه‌های منتشرشده",
      title: "تجربه در میدان عمل",
      subtitle: "نمونه‌ای از پروژه‌ها و فعالیت‌های فنی پترو سازه میهن که در وب‌سایت شرکت معرفی شده‌اند.",
      count: "فعالیت فنی",
      imageMissing: "تصویر این پروژه را می‌توان از پنل مدیریت افزود.",
      empty: "پروژه‌ای برای نمایش وجود ندارد."
    },
    en: {
      badge: "Published projects",
      title: "Engineering in practice",
      subtitle: "A selection of Petro Sazeh Mihan projects and technical work published on the company website.",
      count: "technical works",
      imageMissing: "Add this project's photo from the admin panel.",
      empty: "There are no projects to display."
    },
    ar: {
      badge: "المشاريع المنشورة",
      title: "الهندسة في التطبيق",
      subtitle: "مجموعة مختارة من مشاريع وأعمال بترو سازه ميهان الفنية المنشورة على موقع الشركة.",
      count: "أعمال فنية",
      imageMissing: "يمكن إضافة صورة هذا المشروع من لوحة الإدارة.",
      empty: "لا توجد مشاريع للعرض."
    },
    ru: {
      badge: "Опубликованные проекты",
      title: "Инженерия на практике",
      subtitle: "Подборка проектов и технических работ Petro Sazeh Mihan, опубликованных на сайте компании.",
      count: "технических работ",
      imageMissing: "Фотографию проекта можно добавить в панели управления.",
      empty: "Нет проектов для отображения."
    }
  }[locale] || {
    badge: "Published projects",
    title: "Projects",
    subtitle: "Projects and technical work published on the company website.",
    count: "projects",
    empty: "There are no projects to display."
  };
  const title = pick(meta.title, locale) || labels.title;
  const subtitle = pick(meta.subtitle, locale) || labels.subtitle;

  return (
    <section className="container-x py-10 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="chip">{labels.badge}</span>
        <h1 className="section-title mt-3">
          <span className="heading-grad">{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
            {subtitle}
          </p>
        )}
        {projects.length > 0 && (
          <div className="mt-5 text-xs font-bold" style={{ color: "var(--gold)" }}>
            {new Intl.NumberFormat(locale).format(projects.length)} {labels.count}
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{labels.empty}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(function(p, i) {
            return (
              <div
                key={p.id}
                className="card-glass overflow-hidden hover:border-gold-500/40 transition flex flex-col"
                style={{ animationDelay: (i * 50) + "ms" }}
              >
                <div style={{
                  aspectRatio: "16/10",
                  background: p.image ? "var(--bg-soft)" : "linear-gradient(135deg, rgba(79, 107, 237, 0.1), rgba(59, 82, 196, 0.04))",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center"
                }}>
                  {p.image ? (
                    <img src={p.image} alt={pick(p.title, locale)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "grid", justifyItems: "center", gap: 8, color: "var(--text-muted)" }}>
                      <ImageIcon size={28} strokeWidth={1.5} />
                      <span style={{ fontSize: 11 }}>{labels.imageMissing}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    {pick(p.industry, locale) && (
                      <span className="chip" style={{
                        background: "rgba(79, 107, 237, 0.1)",
                        border: "1px solid rgba(79, 107, 237, 0.3)",
                        color: "#3B52C4"
                      }}>
                        {pick(p.industry, locale)}
                      </span>
                    )}
                    {p.year && (
                      <span className="chip" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                        {p.year}
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: "var(--text)",
                    lineHeight: 1.4,
                    marginBottom: 8
                  }}>
                    {pick(p.title, locale)}
                  </h3>

                  {pick(p.client, locale) && (
                    <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 800, marginBottom: 10 }}>
                      {pick(p.client, locale)}
                    </div>
                  )}

                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: "var(--text-soft)",
                    flex: 1
                  }}>
                    {pick(p.description, locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
