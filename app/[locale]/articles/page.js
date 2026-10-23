import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { getDictionary } from "@/lib/getDictionary";
import { buildMetadata } from "@/lib/seo";
import { pageSeo } from "@/lib/seo-copy";

export const dynamic = "force-dynamic";

function pick(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.fa || "";
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const seo = pageSeo(locale, "articles");
  return buildMetadata({
    locale,
    path: "/articles",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords
  });
}

export default async function ArticlesPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const articles = getArticles().filter((article) => article.active !== false);

  return (
    <section className="container-x py-16">
      <span className="chip">{dict.articles.library}</span>
      <h1 className="section-title mt-4 mb-14">
        <span className="heading-grad">{dict.articles.pageTitle1}</span>{" "}
        <span className="heading-gold">{dict.articles.pageTitle2}</span>
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/${locale}/articles/${a.slug}`}
            className="card-glass p-6 hover:border-gold-500/40 transition-all group"
          >
            <div className="text-xs text-[var(--gold)] font-bold">{pick(a.category, locale)}</div>
            <h2 className="mt-3 font-bold text-lg leading-7 text-[var(--text)] group-hover:text-[var(--gold)] transition">
              {pick(a.title, locale)}
            </h2>
            <p className="mt-3 text-sm text-[var(--text-soft)] leading-6">{pick(a.excerpt, locale)}</p>
            <div className="mt-5 flex justify-between text-xs text-[var(--text-muted)]">
              <span>{pick(a.date, locale)}</span>
              <span>
                {a.readMinutes
                  ? `${new Intl.NumberFormat(locale).format(a.readMinutes)} ${dict.articles.readTime}`
                  : a.readTime}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
