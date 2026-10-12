"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Award, Cog } from "lucide-react";
import { useDictionary } from "./Providers";

export default function Hero() {
  const { locale, t } = useDictionary();

  return (
    <section className="relative min-h-[80vh] sm:min-h-[78vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gold-500/10 blur-[140px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-silver-500/10 blur-[140px]" />

      <div className="container-x relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="chip">
            <ShieldCheck size={14} /> {t.hero.badge}
          </span>

          <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15]">
            <span className="heading-grad">{t.hero.title1}</span>
            <br />
            <span className="heading-gold">{t.hero.title2}</span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl" style={{ color: "var(--text-soft)" }}>
              {t.hero.title3}
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base md:text-lg leading-7 md:leading-8 max-w-xl" style={{ color: "var(--text-soft)" }}>
            {t.hero.desc}
          </p>

          <div className="mt-7 flex flex-wrap gap-3 sm:gap-4">
            <Link href={"/" + locale + "/products"} className="btn-gold text-sm">
              {t.hero.cta1} <ArrowLeft size={16} />
            </Link>
            <Link href={"/" + locale + "/sizing"} className="btn-outline text-sm">
              <Cog size={16} /> {t.hero.cta2}
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-4 sm:gap-6 text-xs sm:text-sm" style={{ color: "var(--text-soft)" }}>
            <div className="flex items-center gap-2">
              <Award size={16} style={{ color: "var(--gold)" }} />
              {t.hero.iso}
            </div>
            <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: "var(--gold)" }} />
              {t.hero.api}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative aspect-square rounded-3xl card-glass overflow-hidden max-w-md mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-silver-500/10 via-transparent to-gold-500/10" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative w-64 h-64 animate-float">
                <div className="absolute inset-0 rounded-full bg-gold-gradient opacity-20 blur-3xl" />
                <div className="relative w-full h-full rounded-full border-4 grid place-items-center backdrop-blur"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
                  <div className="w-44 h-44 rounded-full border-4 border-gold-500/50 grid place-items-center backdrop-blur"
                    style={{ backgroundColor: "var(--bg-card)" }}>
                    <div className="w-28 h-28 rounded-full bg-gold-gradient grid place-items-center shadow-2xl">
                      <Cog size={56} className="text-[#1A1D21] animate-spin-slow" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
