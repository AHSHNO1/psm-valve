"use client";
import { motion } from "framer-motion";
import { Film } from "lucide-react";
import VideoEmbed from "./VideoEmbed";
import { useDictionary } from "./Providers";

export default function IntroVideo({ videoUrl, poster }) {
  const { t, locale } = useDictionary();

  return (
    <section className="container-x py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="chip">
            <Film size={12} /> {t.media?.intro || "ویدئو معرفی شرکت"}
          </span>
          <h2 className="section-title mt-3">
            <span className="heading-grad">
              {locale === "fa" ? "پترو سازه میهن" : "Petro Sazeh Mihan"}
            </span>{" "}
            <span className="heading-gold">
              {locale === "fa" ? "در یک نگاه" : "at a glance"}
            </span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <VideoEmbed url={videoUrl} poster={poster} title="Company Intro" />
        </div>
      </motion.div>
    </section>
  );
}
