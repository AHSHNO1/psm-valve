import "../globals.css";
import "../fonts.css";
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
import { COMPANY, getCompanyInfo } from "@/lib/company-info";
import { getProducts } from "@/lib/product-store";
import { getSiteChrome } from "@/lib/site-chrome";
import { getDictionary } from "@/lib/getDictionary";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const messages = await getDictionary(locale);

  const safeLocale = isValidLocale(locale) ? locale : defaultLocale;
  const meta = META[safeLocale];
  const branding = getBranding();
  const title = messages.common.company + " | " + messages.hero.title2;
  const description =
    messages.hero && messages.hero.desc
      ? messages.hero.desc
      : messages.common.company + " — " + meta.suffix;

  return {
    metadataBase: new URL("https://www.psmvalve.com"),
    title: {
      default: title,
      template: "%s | " + messages.common.company
    },
    description: description,
    keywords: meta.keywords,
    applicationName: messages.common.tagline,
    authors: [{ name: COMPANY.brandEn, url: "https://www.psmvalve.com" }],
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
      url: "https://www.psmvalve.com/" + safeLocale,
      images: [{ url: "/og/og-default.jpg", width: 1200, height: 630, alt: messages.common.company }]
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ["/og/og-default.jpg"]
    },
    icons: {
      icon: branding.favicon || "/logo/logo-icon.png",
      apple: branding.favicon || "/logo/logo-icon.png"
    },
    formatDetection: { telephone: true, email: true, address: true },
    robots: { index: true, follow: true }
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  const dir = localeDirs[locale] || "rtl";
  const branding = getBranding();
  const company = getCompanyInfo();
  const products = getProducts();
  const siteChrome = getSiteChrome();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.add(t==='dark'?'dark':'light');}catch(e){document.documentElement.classList.add('light');}})();`
          }}
        />
      </head>
      <body className="antialiased">
        <Providers locale={locale} dict={dict}>
          <SkipLink />
          <ScrollProgress />
          <SmoothScroll>
            <Navbar logo={branding.logo} logoIcon={branding.logoIcon} products={products} chrome={siteChrome} />
            <main id="main-content" tabIndex={-1} className={(siteChrome.header.layout === "compact" ? "pt-16" : "pt-20") + " outline-none"}>
              {children}
            </main>
            <Footer logo={branding.logo} company={company} socialLinks={branding.socialLinks} chrome={siteChrome} />
            <BottomPopup />
            <BackToTop />
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
