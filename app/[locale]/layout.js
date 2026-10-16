import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import Providers from "@/components/Providers";
import BottomPopup from "@/components/BottomPopup";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import SkipLink from "@/components/SkipLink";
import { locales, isValidLocale, localeDirs, defaultLocale } from "@/lib/i18n";
import { getBranding } from "@/lib/content";
import { COMPANY } from "@/lib/company-info";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const META = {
  fa: {
    suffix: "طراحی و تولید شیرهای کنترلی صنعتی",
    keywords: ["شیر کنترلی", "شیر توپی", "سایزینگ شیر", "PSM Valve", "پترو سازه میهن", "پوشش HVOF", "شیر صنعتی"]
  },
  en: {
    suffix: "Design & manufacturing of industrial control valves",
    keywords: ["control valve", "ball valve", "valve sizing", "PSM Valve", "Petro Sazeh Mihan", "HVOF coating", "industrial valves"]
  },
  ar: {
    suffix: "تصميم وتصنيع صمامات التحكم الصناعية",
    keywords: ["صمام تحكم", "صمام كروي", "حساب الصمام", "PSM Valve", "بترو سازه ميهان"]
  },
  ru: {
    suffix: "Проектирование и производство промышленных регулирующих клапанов",
    keywords: ["регулирующий клапан", "шаровой клапан", "подбор клапана", "PSM Valve", "Petro Sazeh Mihan"]
  }
};

export async function generateMetadata({ params }) {
  const { locale } = params;
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    messages = (await import("@/messages/fa.json")).default;
  }

  const safeLocale = isValidLocale(locale) ? locale : defaultLocale;
  const meta = META[safeLocale];
  const branding = getBranding();
  const title = messages.common.company + " | " + messages.hero.title2;
  const description =
    messages.hero && messages.hero.desc
      ? messages.hero.desc
      : messages.common.company + " — " + meta.suffix;

  return {
    metadataBase: new URL("https://psmvalve.com"),
    title: {
      default: title,
      template: "%s | " + messages.common.company
    },
    description: description,
    keywords: meta.keywords,
    applicationName: messages.common.tagline,
    authors: [{ name: COMPANY.brandEn, url: "https://psmvalve.com" }],
    creator: messages.common.company,
    publisher: messages.common.company,
    alternates: {
      canonical: "/" + safeLocale,
      languages: {
        fa: "/fa",
        en: "/en",
        ar: "/ar",
        ru: "/ru",
        "x-default": "/fa"
      }
    },
    openGraph: {
      type: "website",
      locale: safeLocale,
      siteName: messages.common.company,
      title: title,
      description: description,
      url: "https://psmvalve.com/" + safeLocale,
      images: [{ url: "/og/og-default.jpg", width: 1200, height: 630, alt: messages.common.company }]
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ["/og/og-default.jpg"]
    },
    icons: {
      icon: branding.favicon || "/icon.svg",
      apple: branding.favicon || "/icon.svg"
    },
    formatDetection: { telephone: true, email: true, address: true },
    robots: { index: true, follow: true }
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  let dict;
  try {
    dict = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    dict = (await import("@/messages/fa.json")).default;
  }

  const dir = localeDirs[locale] || "rtl";
  const branding = getBranding();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`
          }}
        />
      </head>
      <body className="antialiased" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Providers locale={locale} dict={dict}>
          <SkipLink />
          <ScrollProgress />
          <SmoothScroll>
            <Navbar logo={branding.logo} />
            <main id="main-content" tabIndex={-1} className="pt-20 outline-none">
              {children}
            </main>
            <Footer logo={branding.logo} />
            <BottomPopup />
            <BackToTop />
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
