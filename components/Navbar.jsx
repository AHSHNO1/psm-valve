"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useId } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import LocaleSwitcher from "./LocaleSwitcher";
import SearchButton from "./SearchButton";
import { useDictionary } from "./Providers";
import { categories } from "@/lib/categories";

function pickName(obj, locale) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.fa || "";
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(function() {
    function check() { setIsDesktop(window.innerWidth >= 1280); }
    check();
    window.addEventListener("resize", check);
    return function() { window.removeEventListener("resize", check); };
  }, []);
  return isDesktop;
}

export default function Navbar({ logo }) {
  const { locale, t } = useDictionary();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const closeTimer = useRef(null);

  useEffect(function() {
    function onScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return function() { window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(function() {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(function() {
    function onKey(e) {
      if (e.key === "Escape") { setOpenMenu(null); setMobileOpen(false); }
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, []);

  function openWithDelay(key) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  }
  function closeWithDelay() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(function() { setOpenMenu(null); }, 120);
  }

  const L = {
    fa: {
      home: "خانه", about: "درباره ما", sizing: "سایزینگ", products: "محصولات",
      services: "خدمات", partners: "همراهان", media: "مدیا", contact: "تماس با ما",
      mediaNews: "اخبار", mediaArticles: "مقالات و آموزش", mediaVideos: "ویدئوها",
      mediaCatalogs: "کاتالوگ‌ها", mediaImages: "تصاویر",
      aboutPage: "معرفی شرکت", aboutUnits: "واحدها", aboutProcess: "فرآیند کار",
      aboutWhy: "چرا ما", aboutProjects: "پروژه‌های موفق", aboutFaq: "سوالات متداول",
      aboutCertificates: "گواهینامه‌ها", aboutContact: "تماس با ما",
      allProducts: "همه محصولات", consult: "دریافت مشاوره",
      menu: "باز کردن منو", closeMenu: "بستن منو"
    },
    en: {
      home: "Home", about: "About", sizing: "Sizing", products: "Products",
      services: "Services", partners: "Partners", media: "Media", contact: "Contact",
      mediaNews: "News", mediaArticles: "Articles", mediaVideos: "Videos",
      mediaCatalogs: "Catalogs", mediaImages: "Images",
      aboutPage: "About Us", aboutUnits: "Units", aboutProcess: "Process",
      aboutWhy: "Why Us", aboutProjects: "Projects", aboutFaq: "FAQ",
      aboutCertificates: "Certificates", aboutContact: "Contact",
      allProducts: "All Products", consult: "Get Consultation",
      menu: "Open menu", closeMenu: "Close menu"
    },
    ar: {
      home: "الرئيسية", about: "من نحن", sizing: "تحديد الحجم", products: "المنتجات",
      services: "الخدمات", partners: "الشركاء", media: "الوسائط", contact: "اتصل بنا",
      mediaNews: "الأخبار", mediaArticles: "المقالات", mediaVideos: "الفيديوهات",
      mediaCatalogs: "الكتالوجات", mediaImages: "الصور",
      aboutPage: "عن الشركة", aboutUnits: "الوحدات", aboutProcess: "عملية العمل",
      aboutWhy: "لماذا نحن", aboutProjects: "المشاريع", aboutFaq: "الأسئلة الشائعة",
      aboutCertificates: "الشهادات", aboutContact: "اتصل بنا",
      allProducts: "جميع المنتجات", consult: "احصل على استشارة",
      menu: "فتح القائمة", closeMenu: "إغلاق القائمة"
    },
    ru: {
      home: "Главная", about: "О нас", sizing: "Подбор", products: "Продукты",
      services: "Услуги", partners: "Партнеры", media: "Медиа", contact: "Контакты",
      mediaNews: "Новости", mediaArticles: "Статьи", mediaVideos: "Видео",
      mediaCatalogs: "Каталоги", mediaImages: "Изображения",
      aboutPage: "О компании", aboutUnits: "Отделы", aboutProcess: "Процесс",
      aboutWhy: "Почему мы", aboutProjects: "Проекты", aboutFaq: "FAQ",
      aboutCertificates: "Сертификаты", aboutContact: "Контакты",
      allProducts: "Все продукты", consult: "Получить консультацию",
      menu: "Открыть меню", closeMenu: "Закрыть меню"
    }
  }[locale] || {};

  const aboutSubmenu = [
    { href: "/" + locale + "/about", label: L.aboutPage },
    { href: "/" + locale + "/units", label: L.aboutUnits },
    { href: "/" + locale + "/process", label: L.aboutProcess },
    { href: "/" + locale + "/why-us", label: L.aboutWhy },
    { href: "/" + locale + "/projects", label: L.aboutProjects },
    { href: "/" + locale + "/faq", label: L.aboutFaq },
    { href: "/" + locale + "/partners", label: L.partners }
  ];

  const mediaSubmenu = [
    { href: "/" + locale + "/media?tab=news", label: L.mediaNews },
    { href: "/" + locale + "/media?tab=articles", label: L.mediaArticles },
    { href: "/" + locale + "/media?tab=videos", label: L.mediaVideos },
    { href: "/" + locale + "/media?tab=catalogs", label: L.mediaCatalogs },
    { href: "/" + locale + "/media?tab=gallery", label: L.mediaImages }
  ];

  function isActive(href) {
    const clean = href.split("?")[0];
    if (clean === "/" + locale) return pathname === clean;
    return pathname.startsWith(clean);
  }

  const aboutActive = [
    "/about", "/units", "/process", "/why-us", "/projects", "/faq", "/partners"
  ].some(function(p) { return pathname === "/" + locale + p; });

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.08)" : "none"
      }}
    >
      <nav className="container-x flex items-center justify-between h-16 lg:h-20 gap-2">
        <Link href={"/" + locale} className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl grid place-items-center shadow-md shrink-0 overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid var(--border)" }}>
            {logo && (
              <img
                src={logo}
                alt=""
                className="w-full h-full object-contain p-0.5"
                onError={function(e) {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = "grid";
                  }
                }}
              />
            )}
            <span
              className="text-[#1A1D21] font-black text-sm lg:text-base"
              style={{ display: logo ? "none" : "grid" }}
            >
              PSM
            </span>
          </div>
          <div className="hidden md:block leading-tight">
            <div className="font-black text-xs lg:text-sm whitespace-nowrap" style={{ color: "var(--text)" }}>
              {t.common.company}
            </div>
            <div className="text-[9px] lg:text-[10px] font-bold tracking-widest whitespace-nowrap" style={{ color: "var(--gold)" }}>
              {t.common.tagline}
            </div>
          </div>
        </Link>

        {isDesktop && (
          <ul className="flex items-center gap-0 flex-1 justify-center">
            <li>
              <Link href={"/" + locale}
                className="px-2.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition"
                style={{
                  color: isActive("/" + locale) ? "var(--gold)" : "var(--text-soft)",
                  background: isActive("/" + locale) ? "var(--glow)" : "transparent"
                }}>
                {L.home}
              </Link>
            </li>

            {/* ABOUT with submenu */}
            <li className="relative" onMouseEnter={function() { openWithDelay("about"); }} onMouseLeave={closeWithDelay}>
              <Link href={"/" + locale + "/about"}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition"
                style={{
                  color: aboutActive ? "var(--gold)" : "var(--text-soft)",
                  background: aboutActive ? "var(--glow)" : "transparent"
                }}>
                {L.about}
                <ChevronDown size={12} className="opacity-60 transition-transform"
                  style={{ transform: openMenu === "about" ? "rotate(180deg)" : "rotate(0)" }} />
              </Link>

              <AnimatePresence>
                {openMenu === "about" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1 w-52 rounded-xl overflow-hidden"
                    style={{
                      insetInlineStart: 0,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                      zIndex: 60
                    }}>
                    {aboutSubmenu.map(function(sub) {
                      return (
                        <Link key={sub.href} href={sub.href}
                          className="block px-4 py-3 text-sm font-semibold transition hover:bg-[var(--bg-soft)]"
                          style={{ color: "var(--text-soft)" }}>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>

            <li>
              <Link href={"/" + locale + "/sizing"}
                className="px-2.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition"
                style={{
                  color: isActive("/" + locale + "/sizing") ? "var(--gold)" : "var(--text-soft)",
                  background: isActive("/" + locale + "/sizing") ? "var(--glow)" : "transparent"
                }}>
                {L.sizing}
              </Link>
            </li>

            {/* PRODUCTS with mega menu */}
            <li className="relative" onMouseEnter={function() { openWithDelay("products"); }} onMouseLeave={closeWithDelay}>
              <Link href={"/" + locale + "/products"}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition"
                style={{
                  color: isActive("/" + locale + "/products") ? "var(--gold)" : "var(--text-soft)",
                  background: isActive("/" + locale + "/products") ? "var(--glow)" : "transparent"
                }}>
                {L.products}
                <ChevronDown size={12} className="opacity-60 transition-transform"
                  style={{ transform: openMenu === "products" ? "rotate(180deg)" : "rotate(0)" }} />
              </Link>
            </li>

            <li>
              <Link href={"/" + locale + "/services"}
                className="px-2.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition"
                style={{
                  color: isActive("/" + locale + "/services") ? "var(--gold)" : "var(--text-soft)",
                  background: isActive("/" + locale + "/services") ? "var(--glow)" : "transparent"
                }}>
                {L.services}
              </Link>
            </li>

            {/* MEDIA dropdown */}
            <li className="relative" onMouseEnter={function() { openWithDelay("media"); }} onMouseLeave={closeWithDelay}>
              <Link href={"/" + locale + "/media"}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition"
                style={{
                  color: (isActive("/" + locale + "/media") || isActive("/" + locale + "/news") || isActive("/" + locale + "/articles")) ? "var(--gold)" : "var(--text-soft)",
                  background: (isActive("/" + locale + "/media") || isActive("/" + locale + "/news") || isActive("/" + locale + "/articles")) ? "var(--glow)" : "transparent"
                }}>
                {L.media}
                <ChevronDown size={12} className="opacity-60 transition-transform"
                  style={{ transform: openMenu === "media" ? "rotate(180deg)" : "rotate(0)" }} />
              </Link>

              <AnimatePresence>
                {openMenu === "media" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1 w-52 rounded-xl overflow-hidden"
                    style={{
                      insetInlineStart: 0,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                      zIndex: 60
                    }}>
                    {mediaSubmenu.map(function(sub) {
                      return (
                        <Link key={sub.href} href={sub.href}
                          className="block px-4 py-3 text-sm font-semibold transition hover:bg-[var(--bg-soft)]"
                          style={{ color: "var(--text-soft)" }}>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>

            <li>
              <Link href={"/" + locale + "/contact"}
                className="px-2.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition"
                style={{
                  color: isActive("/" + locale + "/contact") ? "var(--gold)" : "var(--text-soft)",
                  background: isActive("/" + locale + "/contact") ? "var(--glow)" : "transparent"
                }}>
                {L.contact}
              </Link>
            </li>
          </ul>
        )}

        {isDesktop && (
          <div className="flex items-center gap-1.5 shrink-0">
            <SearchButton />
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        )}

        {!isDesktop && (
          <div className="flex items-center gap-1.5">
            <SearchButton />
            <ThemeToggle />
            <LocaleSwitcher />
            <button
              type="button"
              onClick={function() { setMobileOpen(!mobileOpen); }}
              aria-label={mobileOpen ? L.closeMenu : L.menu}
              aria-expanded={mobileOpen}
              aria-controls={mobileOpen ? "mobile-navigation" : undefined}
              className="w-10 h-10 rounded-lg border grid place-items-center"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}
      </nav>

      {/* Products Mega Menu */}
      <AnimatePresence>
        {isDesktop && openMenu === "products" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            onMouseEnter={function() { openWithDelay("products"); }}
            onMouseLeave={closeWithDelay}
            className="absolute inset-x-0"
            style={{
              top: "100%",
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              zIndex: 55
            }}>
            <div className="container-x py-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg" style={{ color: "var(--text)" }}>{L.allProducts}</h3>
                <Link href={"/" + locale + "/products"} className="text-sm font-bold" style={{ color: "var(--gold)" }}>
                  {L.allProducts} →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                {categories.map(function(cat) {
                  return (
                    <div key={cat.id}>
                      <Link href={"/" + locale + "/products#" + cat.id}
                        className="font-black text-sm block mb-3 pb-2 transition"
                        style={{ color: "var(--gold)", borderBottom: "1px solid var(--border)" }}>
                        {pickName(cat.name, locale)}
                      </Link>
                      <ul className="space-y-1">
                        {cat.products.map(function(p) {
                          return (
                            <li key={p.slug}>
                              <Link href={"/" + locale + "/products/" + p.slug}
                                className="block text-xs py-1 transition hover:text-gold-500"
                                style={{ color: "var(--text-soft)" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>{p.series}</span>{" "}
                                {pickName(p.name, locale)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {!isDesktop && mobileOpen && (
          <motion.div
            id="mobile-navigation"
            aria-label={L.menu}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="container-x py-4 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <MobileLink href={"/" + locale} label={L.home} active={isActive("/" + locale)} onClick={function() { setMobileOpen(false); }} />

              <MobileAccordion label={L.about}>
                {aboutSubmenu.map(function(sub) {
                  return (
                    <Link key={sub.href} href={sub.href} onClick={function() { setMobileOpen(false); }}
                      className="block px-4 py-2 text-xs rounded-lg"
                      style={{ color: "var(--text-soft)" }}>
                      {sub.label}
                    </Link>
                  );
                })}
              </MobileAccordion>

              <MobileLink href={"/" + locale + "/sizing"} label={L.sizing} active={isActive("/" + locale + "/sizing")} onClick={function() { setMobileOpen(false); }} />

              <MobileAccordion label={L.products}>
                <MobileLink href={"/" + locale + "/products"} label={L.allProducts} active={false} onClick={function() { setMobileOpen(false); }} small />
                {categories.map(function(cat) {
                  return (
                    <details key={cat.id} className="mt-1">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-bold rounded-lg list-none"
                        style={{ color: "var(--gold)" }}>
                        {pickName(cat.name, locale)}
                      </summary>
                      <ul className="pl-4 mt-0.5 space-y-0.5">
                        {cat.products.map(function(p) {
                          return (
                            <li key={p.slug}>
                              <Link href={"/" + locale + "/products/" + p.slug}
                                onClick={function() { setMobileOpen(false); }}
                                className="block py-1.5 text-xs"
                                style={{ color: "var(--text-soft)" }}>
                                {pickName(p.name, locale)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  );
                })}
              </MobileAccordion>

              <MobileLink href={"/" + locale + "/services"} label={L.services} active={isActive("/" + locale + "/services")} onClick={function() { setMobileOpen(false); }} />

              <MobileAccordion label={L.media}>
                {mediaSubmenu.map(function(sub) {
                  return (
                    <Link key={sub.href} href={sub.href} onClick={function() { setMobileOpen(false); }}
                      className="block px-4 py-2 text-xs rounded-lg"
                      style={{ color: "var(--text-soft)" }}>
                      {sub.label}
                    </Link>
                  );
                })}
              </MobileAccordion>

              <MobileLink href={"/" + locale + "/contact"} label={L.contact} active={isActive("/" + locale + "/contact")} onClick={function() { setMobileOpen(false); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileLink(props) {
  return (
    <Link href={props.href} onClick={props.onClick}
      className={"block rounded-lg font-semibold " + (props.small ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm")}
      aria-current={props.active ? "page" : undefined}
      style={{
        color: props.active ? "var(--gold)" : "var(--text)",
        background: props.active ? "var(--glow)" : "transparent"
      }}>
      {props.label}
    </Link>
  );
}

function MobileAccordion(props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        onClick={function() { setOpen(!open); }}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold text-sm"
        style={{ color: "var(--text)" }}>
        <span>{props.label}</span>
        <ChevronDown size={14} className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={props.label}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="mt-1 ml-3">{props.children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
