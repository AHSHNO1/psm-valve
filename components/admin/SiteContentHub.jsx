"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  Images,
  Layers3,
  Languages,
  Package,
  Palette,
  PanelsTopLeft,
  Search
} from "lucide-react";
import ContentStudioNav from "./ContentStudioNav";

export default function SiteContentHub({ stats }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const sections = useMemo(() => [
    {
      href: "/admin/content/text",
      title: "متن‌ها و تصاویر بخش‌های سایت",
      description: "تیترها، توضیحات، دکمه‌ها و عکس‌های بخش‌های مختلف را در چهار زبان ویرایش کنید.",
      keywords: "متن تصویر عکس عنوان توضیحات ترجمه زبان صفحه اصلی مدیرعامل",
      count: `${stats.siteImages} تصویر قابل ویرایش`,
      icon: FileText,
      color: "#7354A6",
      action: "ویرایش متن و تصویر"
    },
    {
      href: "/admin/slider",
      title: "اسلایدر و بنرهای صفحه اصلی",
      description: "متن هر اسلاید، تصویر، لینک دکمه و ترتیب نمایش را یک‌جا مدیریت کنید.",
      keywords: "اسلایدر بنر صفحه اصلی تصویر عنوان زیرعنوان دکمه",
      count: `${stats.activeSlides} از ${stats.slides} اسلاید فعال`,
      icon: PanelsTopLeft,
      color: "#0078D4",
      action: "مدیریت اسلایدر"
    },
    {
      href: "/admin/products",
      title: "عنوان و تصاویر محصولات",
      description: "محصول را جستجو کنید و نام، توضیح کوتاه، تصویر و محتوای چندزبانه‌اش را تغییر دهید.",
      keywords: "محصول کاتالوگ تصویر عکس عنوان نام توضیحات",
      count: `${stats.products} محصول`,
      icon: Package,
      color: "#C9950D",
      action: "رفتن به محصولات"
    },
    {
      href: "/admin/media",
      title: "کتابخانه رسانه",
      description: "تصاویر گالری، ویدئوها و کاتالوگ‌های سایت را از یک بخش مدیریت کنید.",
      keywords: "رسانه مدیا گالری عکس تصویر ویدئو کاتالوگ فایل",
      count: `${stats.galleryImages} تصویر · ${stats.videos} ویدئو`,
      icon: Images,
      color: "#107C10",
      action: "باز کردن کتابخانه"
    },
    {
      href: "/admin/translations",
      title: "متن‌های همه صفحات و هدر و فوتر",
      description: "عنوان‌های منو، دکمه‌ها، متن صفحه تماس و همه نوشته‌های رابط سایت را در چهار زبان تغییر دهید.",
      keywords: "ترجمه متن زبان هدر فوتر منو صفحه تماس عنوان دکمه",
      count: "ویرایش در ۴ زبان",
      icon: Languages,
      color: "#3674C8",
      action: "ویرایش متن‌ها"
    },
    {
      href: "/admin/company",
      title: "اطلاعات شرکت و تماس",
      description: "آدرس، شماره تلفن، ایمیل، فکس و موقعیت کارخانه را یک‌بار ویرایش کنید تا در فوتر و صفحه تماس همگام بماند.",
      keywords: "شرکت تلفن همراه آدرس کارخانه تماس ایمیل فکس کدپستی",
      count: "منبع مشترک فوتر و تماس",
      icon: Building2,
      color: "#7354A6",
      action: "ویرایش اطلاعات تماس"
    },
    {
      href: "/admin/branding",
      title: "لوگو و شبکه‌های اجتماعی",
      description: "لوگوهای هدر و فوتر، رنگ‌های برند و لینک شبکه‌های اجتماعی را مدیریت کنید.",
      keywords: "لوگو برند رنگ شبکه اجتماعی هدر فوتر",
      count: "هویت برند سایت",
      icon: Palette,
      color: "#B4009E",
      action: "مدیریت هویت برند"
    }
  ], [stats]);
  const visibleSections = useMemo(
    () => sections.filter((section) =>
      !normalizedQuery ||
      `${section.title} ${section.description} ${section.keywords}`.toLocaleLowerCase().includes(normalizedQuery)
    ),
    [normalizedQuery, sections]
  );

  return (
    <div className="site-content-hub">
      <ContentStudioNav />

      <section className="studio-hero anim-in">
        <div className="studio-hero-copy">
          <span className="studio-eyebrow"><Layers3 size={14} /> فضای یکپارچه‌ی ویرایش سایت</span>
          <h1>محتوای سایت را از اینجا مدیریت کنید</h1>
          <p>
            برای تغییر تیتر، متن یا تصویر، بخش موردنظر را انتخاب کنید. تغییرها از همین پنل در سایت ذخیره می‌شوند.
          </p>
          <a href="/fa" target="_blank" rel="noreferrer" className="studio-preview-link">
            مشاهده سایت در صفحه جدید <ArrowLeft size={15} />
          </a>
        </div>
        <div className="studio-hero-mark" aria-hidden="true">
          <Layers3 size={46} strokeWidth={1.5} />
          <span>{stats.products + stats.slides + stats.siteImages}</span>
          <small>محتوای قابل مدیریت</small>
        </div>
      </section>

      <div className="studio-toolbar">
        <div>
          <h2>چه چیزی را می‌خواهید ویرایش کنید؟</h2>
          <p>یک بخش را انتخاب کنید یا برای پیدا کردن سریع‌تر جستجو کنید.</p>
        </div>
        <label className="studio-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثلاً عنوان محصول یا تصویر اسلایدر"
            aria-label="جستجو در بخش‌های مدیریت محتوا"
          />
        </label>
      </div>

      {visibleSections.length ? (
        <div className="studio-card-grid">
          {visibleSections.map(({ href, title, description, count, icon: Icon, color, action }) => (
            <Link href={href} className="studio-card" key={href}>
              <div className="studio-card-head">
                <span className="studio-card-icon" style={{ "--studio-card-color": color }}>
                  <Icon size={21} />
                </span>
                <span className="studio-card-count">{count}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="studio-card-action">{action}<ArrowLeft size={16} /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="studio-empty" role="status">
          <Search size={24} />
          <strong>بخشی با این عبارت پیدا نشد</strong>
          <span>نام بخش یا عبارت دیگری را جستجو کنید.</span>
        </div>
      )}

      <aside className="studio-tip">
        <span className="studio-tip-icon"><Package size={18} /></span>
        <div>
          <strong>ویرایش سریع محصول</strong>
          <p>در فهرست محصولات، محصول را جستجو و «ویرایش» را بزنید؛ فرم با نام و توضیح باز می‌شود و می‌توانید همان‌جا ذخیره کنید. برای تغییر تصویر، وارد مرحله اطلاعات پایه شوید.</p>
        </div>
      </aside>
    </div>
  );
}
