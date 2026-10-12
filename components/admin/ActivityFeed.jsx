"use client";
import Link from "next/link";
import { Mail, Package, Image as ImageIcon, FileText, Film, Clock, ArrowLeft } from "lucide-react";

const ICON_MAP = {
  message: Mail,
  product: Package,
  media: ImageIcon,
  catalog: FileText,
  video: Film
};

const COLOR_MAP = {
  message: "#F7630C",
  product: "#E0A81A",
  media: "#107C10",
  catalog: "#4F6BED",
  video: "#8764B8"
};

const LABEL_MAP = {
  message: "پیام جدید",
  product: "محصول",
  media: "تصویر آپلود شد",
  catalog: "کاتالوگ آپلود شد",
  video: "ویدئو آپلود شد"
};

export default function ActivityFeed({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="metro-card p-12 text-center metro-in">
        <div
          className="w-16 h-16 rounded-xl mx-auto grid place-items-center mb-3"
          style={{ background: "rgba(0, 120, 212, 0.10)" }}
        >
          <Clock size={28} style={{ color: "#0078D4" }} />
        </div>
        <p className="text-sm font-black mb-1" style={{ color: "var(--m-text)" }}>
          فعالیتی ثبت نشده
        </p>
        <p className="text-xs" style={{ color: "var(--m-text-muted)" }}>
          آخرین رویدادهای سایت اینجا نمایش داده می‌شوند
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {items.slice(0, 8).map((item, i) => {
        const Icon = ICON_MAP[item.type] || Mail;
        const color = COLOR_MAP[item.type] || "#0078D4";
        return (
          <Link
            key={item.id}
            href={item.href || "/admin"}
            className="flex items-center gap-4 p-3.5 rounded-lg transition metro-in hover:shadow-md hover:-translate-y-0.5"
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--m-border)",
              animationDelay: (i * 50) + "ms"
            }}
          >
            <div
              className="w-10 h-10 rounded-md grid place-items-center shrink-0"
              style={{ background: color + "18", color }}
            >
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: color + "20", color }}>
                  {LABEL_MAP[item.type] || "رویداد"}
                </span>
                <span className="font-black text-sm truncate" style={{ color: "var(--m-text)" }}>
                  {item.title}
                </span>
              </div>
              <div className="text-xs truncate mt-0.5" style={{ color: "var(--m-text-soft)" }}>
                {item.description}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] whitespace-nowrap shrink-0" style={{ color: "var(--m-text-muted)" }}>
              <Clock size={10} /> {item.time}
            </div>
            <ArrowLeft size={14} style={{ color: "var(--m-text-muted)" }} className="shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
