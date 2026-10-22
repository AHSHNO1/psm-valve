import { readJSON } from "./db";

const defaultNews = [
  {
    slug: "welcome",
    title: { fa: "به وب‌سایت جدید پترو سازه میهن خوش آمدید", en: "Welcome to the new PSM Valve website", ar: "مرحبًا بكم في موقع بترو سازه ميهن الجديد", ru: "Добро пожаловать на новый сайт PSM Valve" },
    excerpt: { fa: "نسخه جدید وب‌سایت با طراحی مدرن و امکانات تازه راه‌اندازی شد.", en: "New website launched with modern design and new features.", ar: "تم إطلاق الموقع الجديد بتصميم حديث وميزات جديدة.", ru: "Запущен новый сайт с современным дизайном." },
    content: { fa: "", en: "", ar: "", ru: "" },
    image: "",
    gallery: [],
    date: "1404/07/15",
    category: { fa: "اخبار شرکت", en: "Company News", ar: "أخبار الشركة", ru: "Новости компании" }
  }
];

export function getNews(slug) {
  const items = (readJSON("news.json", defaultNews) || defaultNews)
    .filter((item) => item.active !== false && item.status !== "pending");
  return slug ? items.find((item) => item.slug === slug) : items;
}

export const news = getNews();
