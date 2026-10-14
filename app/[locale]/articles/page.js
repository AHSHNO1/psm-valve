import Link from "next/link";
import { articles } from "@/lib/articles";
import { getDictionary } from "@/lib/getDictionary";

function pick(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.fa || "";
}

export default async function ArticlesPage({ params }) {
  const { locale } = params;
  const dict = await getDictionary(locale);

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
            <div className="text-xs text-gold-500 font-bold">{pick(a.category, locale)}</div>
            <h2 className="mt-3 font-bold text-lg leading-7 text-silver-100 group-hover:text-gold-500 transition">
              {pick(a.title, locale)}
            </h2>
            <p className="mt-3 text-sm text-silver-400 leading-6">{pick(a.excerpt, locale)}</p>
            <div className="mt-5 flex justify-between text-xs text-silver-500">
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
