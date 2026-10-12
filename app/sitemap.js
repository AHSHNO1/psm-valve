import { products } from "@/lib/products";
import { articles } from "@/lib/articles";
import { locales } from "@/lib/i18n";

export default function sitemap() {
  const base = "https://psmvalve.com";
  const staticRoutes = ["", "/products", "/sizing", "/articles", "/media", "/about", "/contact", "/services", "/units", "/partners", "/news"];
  const entries = [];

  locales.forEach((locale) => {
    staticRoutes.forEach((r) => {
      entries.push({
        url: base + "/" + locale + r,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: r === "" ? 1 : 0.8
      });
    });
    products.forEach((p) => {
      entries.push({
        url: base + "/" + locale + "/products/" + p.slug,
        lastModified: new Date(),
        priority: 0.7
      });
    });
    articles.forEach((a) => {
      entries.push({
        url: base + "/" + locale + "/articles/" + a.slug,
        lastModified: new Date(),
        priority: 0.6
      });
    });
  });

  return entries;
}
