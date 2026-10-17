"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function ProductGallery({ images = [], name, noImage }) {
  const availableImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = availableImages[activeIndex] || availableImages[0];

  if (!activeImage) {
    return (
      <div
        className="grid min-h-[320px] place-items-center rounded-3xl sm:min-h-[460px]"
        style={{ border: "1px solid var(--border)", background: "var(--bg-soft)" }}
      >
        <div className="flex flex-col items-center gap-3 py-16" style={{ color: "var(--text-soft)" }}>
          <ImageOff size={40} />
          <span className="text-sm">{noImage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="grid min-h-[320px] place-items-center overflow-hidden rounded-3xl bg-white sm:min-h-[460px]"
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <img
          src={activeImage}
          alt={name}
          className="max-h-[560px] w-full object-contain p-5 sm:p-8"
        />
      </div>
      {availableImages.length > 1 && (
        <div className="flex flex-wrap gap-3" role="group" aria-label={name}>
          {availableImages.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${name} — ${index + 1}`}
              aria-pressed={activeIndex === index}
              className="h-20 w-24 overflow-hidden rounded-xl transition sm:h-24 sm:w-28"
              style={{
                border: `2px solid ${activeIndex === index ? "var(--gold)" : "var(--border)"}`,
                background: "var(--bg-card)",
                boxShadow: activeIndex === index ? "0 4px 16px var(--glow)" : "var(--shadow-sm)"
              }}
            >
              <img src={image} alt="" className="h-full w-full object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
