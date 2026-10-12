"use client";
import { Search, X } from "lucide-react";

export default function DashboardSearch({ value, onChange }) {
  return (
    <div className="relative">
      <Search
        size={20}
        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--m-text-muted)" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="جستجو در بخش‌ها... (محصولات، پیام‌ها، مدیا، تنظیمات)"
        className="w-full pr-12 pl-12 py-4 rounded-lg text-sm font-bold focus:outline-none focus:ring-4"
        style={{
          background: "#FFFFFF",
          border: "2px solid transparent",
          boxShadow: "0 4px 16px rgba(20, 22, 27, 0.06)",
          color: "var(--m-text)"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#E0A81A";
          e.target.style.boxShadow = "0 4px 20px rgba(201, 149, 13, 0.20)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "transparent";
          e.target.style.boxShadow = "0 4px 16px rgba(20, 22, 27, 0.06)";
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md grid place-items-center hover:bg-black/5"
          aria-label="Clear"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
