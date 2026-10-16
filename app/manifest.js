// ============================================================
// MANIFEST — PWA basics (اسم، آیکون، رنگ تم)
// نیازمند آیکونهای 192 و 512 در public/icons/
// ============================================================

export default function manifest() {
  return {
    name: "پترو سازه میهن — PSM Valve",
    short_name: "PSM Valve",
    description: "طراحی و تولید شیرهای کنترلی صنعتی، پوششدهی HVOF و خدمات کالیبراسیون",
    start_url: "/fa",
    display: "standalone",
    background_color: "#0F1114",
    theme_color: "#D4A017",
    dir: "rtl",
    lang: "fa",
    categories: ["business", "industrial", "engineering"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}