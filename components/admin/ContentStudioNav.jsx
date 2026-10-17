"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileText, Images, Layers3, Languages, Layout, Package, Palette, PanelsTopLeft } from "lucide-react";

const LINKS = [
  { href: "/admin/content", label: "مرکز محتوا", icon: Layers3, exact: true },
  { href: "/admin/content/text", label: "متن‌ها و تصاویر سایت", icon: FileText },
  { href: "/admin/site-chrome", label: "طراحی هدر و فوتر", icon: Layout },
  { href: "/admin/slider", label: "اسلایدر صفحه اصلی", icon: PanelsTopLeft },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/media", label: "گالری و رسانه", icon: Images },
  { href: "/admin/translations", label: "متن‌های همه صفحات", icon: Languages },
  { href: "/admin/company", label: "اطلاعات تماس", icon: Building2 },
  { href: "/admin/branding", label: "لوگو و شبکه‌های اجتماعی", icon: Palette }
];

export default function ContentStudioNav() {
  const pathname = usePathname();

  return (
    <nav className="studio-nav" aria-label="بخش‌های مدیریت محتوا">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={"studio-nav-link" + (active ? " studio-nav-link-active" : "")}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
