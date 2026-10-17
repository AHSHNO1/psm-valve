// ============================================================
// WEB APP MANIFEST — نصب سایت به‌صورت اپلیکیشن (PWA)
// آیکون‌ها: public/icons (با scripts/generate-icons.py ساخته می‌شوند)
// ============================================================

export default function manifest() {
  return {
    id: "/",
    name: "پترو سازه میهن — PSM Valve",
    short_name: "PSM Valve",
    description: "طراحی و تولید شیرهای کنترلی صنعتی، پوشش‌دهی HVOF و خدمات کالیبراسیون",
    start_url: "/fa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#0F1114",
    theme_color: "#D4A017",
    dir: "rtl",
    lang: "fa",
    categories: ["business", "industrial", "engineering"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      {
        name: "محصولات",
        short_name: "محصولات",
        url: "/fa/products",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }]
      },
      {
        name: "سایزینگ شیر",
        short_name: "سایزینگ",
        url: "/fa/sizing",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }]
      },
      {
        name: "تماس با ما",
        short_name: "تماس",
        url: "/fa/contact",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }]
      }
    ]
  };
}
