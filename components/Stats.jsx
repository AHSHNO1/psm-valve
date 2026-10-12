"use client";
import { motion } from "framer-motion";
import { Factory, Users, Award, Gauge } from "lucide-react";
import { useDictionary } from "./Providers";

export default function Stats() {
  const { t } = useDictionary();

  const stats = [
    { icon: Factory, value: "+15", label: t.stats.years },
    { icon: Users, value: "+200", label: t.stats.customers },
    { icon: Award, value: "+500", label: t.stats.projects },
    { icon: Gauge, value: "98%", label: t.stats.satisfaction }
  ];

  return (
    <section className="container-x py-10 sm:py-14">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card-glass p-4 sm:p-6 group"
          >
            <s.icon
              className="mb-3 group-hover:scale-110 transition-transform"
              size={26}
              style={{ color: "var(--gold)" }}
            />
            <div className="text-2xl sm:text-3xl font-black heading-grad">{s.value}</div>
            <div className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-soft)" }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
