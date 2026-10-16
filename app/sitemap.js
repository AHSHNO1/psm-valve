import { products } from "@/lib/products";
import { getArticles } from "@/lib/articles";
import { getServices } from "@/lib/content";
import { locales } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// ============================================================
// SITEMAP — همهٔ مسیرهای عمومی در چهار زبان
// ============================================================

const BASE = "https://psmvalve.com";

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
  const articles = getArticles().filter((article) => article.active !== false);
  const services = getServices() || [];

  locales.forEach(function (locale) {
    STATIC_ROUTES.forEach(function (route) {
      entries.push({
        url: BASE + "/" + locale + route.path,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority
      });
    });

    products.forEach(function (p) {
      entries.push({
        url: BASE + "/" + locale + "/products/" + p.slug,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7
      });
    });

    services.forEach(function (s) {
      if (!s || !s.slug) return;
      entries.push({
        url: BASE + "/" + locale + "/services/" + s.slug,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    });

    articles.forEach(function (a) {
      entries.push({
        url: BASE + "/" + locale + "/articles/" + a.slug,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    });
  });

  return entries;
}
