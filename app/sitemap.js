import { getProducts } from "@/lib/product-store";
import { getArticles } from "@/lib/articles";
import { getAllServices } from "@/lib/service-store";
import { getNews } from "@/lib/news";
import { localizedDateIso } from "@/lib/jalali";
import { locales } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// SITEMAP — همهٔ مسیرهای عمومی در چهار زبان
// ============================================================

const BASE = "https://www.psmvalve.com";

function alternateLanguages(path) {
  const languages = {};
  locales.forEach(function (locale) {
    languages[locale] = BASE + "/" + locale + path;
  });
  languages["x-default"] = BASE + "/" + locales[0] + path;
  return languages;
}

const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/sizing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/why-us", priority: 0.7, changeFrequency: "monthly" },
  { path: "/process", priority: 0.7, changeFrequency: "monthly" },
  { path: "/projects", priority: 0.7, changeFrequency: "monthly" },
  { path: "/articles", priority: 0.7, changeFrequency: "weekly" },
  { path: "/media", priority: 0.6, changeFrequency: "weekly" },
  { path: "/news", priority: 0.6, changeFrequency: "weekly" },
  { path: "/partners", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/standards", priority: 0.5, changeFrequency: "yearly" },
  { path: "/units", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" }
];

export default function sitemap() {
  const entries = [];
  const now = new Date();
  const products = getProducts();
  const articles = getArticles().filter((article) => article.active !== false);
  const services = getAllServices();
  const news = getNews();

  locales.forEach(function (locale) {
    STATIC_ROUTES.forEach(function (route) {
      entries.push({
        url: BASE + "/" + locale + route.path,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: alternateLanguages(route.path) }
      });
    });

    products.forEach(function (p) {
      entries.push({
        url: BASE + "/" + locale + "/products/" + p.slug,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: alternateLanguages("/products/" + p.slug) }
      });
    });

    services.forEach(function (s) {
      if (!s || !s.slug) return;
      entries.push({
        url: BASE + "/" + locale + "/services/" + s.slug,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: alternateLanguages("/services/" + s.slug) }
      });
    });

    articles.forEach(function (a) {
      const iso = localizedDateIso(a.date);
      entries.push({
        url: BASE + "/" + locale + "/articles/" + a.slug,
        lastModified: iso ? new Date(iso) : now,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: alternateLanguages("/articles/" + a.slug) }
      });
    });

    news.forEach(function (item) {
      if (!item || !item.slug) return;
      const iso = localizedDateIso(item.date);
      entries.push({
        url: BASE + "/" + locale + "/news/" + item.slug,
        lastModified: iso ? new Date(iso) : now,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: alternateLanguages("/news/" + item.slug) }
      });
    });
  });

  return entries;
}
