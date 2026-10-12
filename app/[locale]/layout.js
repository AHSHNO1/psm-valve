import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import Providers from "@/components/Providers";
import BottomPopup from "@/components/BottomPopup";
import BackToTop from "@/components/BackToTop";
import { locales, isValidLocale, localeDirs } from "@/lib/i18n";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = params;
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    messages = (await import("@/messages/fa.json")).default;
  }
  return {
    metadataBase: new URL("https://psmvalve.com"),
    title: {
      default: messages.common.company + " | " + messages.hero.title2,
      template: "%s | " + messages.common.company
    },
    description: messages.hero.desc,
    openGraph: {
      type: "website",
      locale: locale,
      siteName: messages.common.company,
      title: messages.common.company,
      description: messages.hero.desc
    },
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

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('light');}})();`
          }}
        />
      </head>
      <body className="antialiased" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Providers locale={locale} dict={dict}>
          <SmoothScroll>
            <Navbar />
            <main className="pt-20">{children}</main>
            <Footer />
            <BottomPopup />
            <BackToTop />
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
