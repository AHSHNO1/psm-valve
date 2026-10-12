"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const ExplodedValve = dynamic(() => import("./ExplodedValve"), {
  ssr: false,
  loading: function() {
    return <Loader text="در حال بارگذاری..." />;
  }
});

const ExplodedBallValve = dynamic(() => import("./ExplodedBallValve"), {
  ssr: false,
  loading: function() {
    return <Loader text="در حال بارگذاری..." />;
  }
});

const ExplodedHvofRobot = dynamic(() => import("./ExplodedHvofRobot"), {
  ssr: false,
  loading: function() {
    return <Loader text="در حال بارگذاری..." />;
  }
});

function Loader({ text }) {
  return (
    <div style={{
      height: 400,
      display: "grid",
      placeItems: "center",
      background: "var(--bg-soft)",
      borderRadius: 24,
      color: "var(--text-muted)",
      fontSize: 13,
      fontWeight: 700
    }}>
      {text}
    </div>
  );
}

export default function ExplodedViewer({ locale }) {
  const [tab, setTab] = useState("valve");

  const L = {
    fa: {
      badge: "نمای انفجاری تعاملی",
      title1: "تجهیزات",
      title2: "ما",
      subtitle: "روی هر بخش کلیک کنید و با اسکرول قطعات را از هم باز کنید",
      valve: "شیر کنترلی",
      ball: "شیر توپی",
      robot: "ربات HVOF"
    },
    en: {
      badge: "Interactive Exploded View",
      title1: "Our",
      title2: "Equipment",
      subtitle: "Click each section and scroll to see parts separate",
      valve: "Control Valve",
      ball: "Ball Valve",
      robot: "HVOF Robot"
    },
    ar: {
      badge: "عرض انفجاري تفاعلي",
      title1: "معداتنا",
      title2: "التفاعلية",
      subtitle: "انقر على كل قسم وقم بالتمرير",
      valve: "صمام تحكم",
      ball: "صمام كروي",
      robot: "روبوت HVOF"
    },
    ru: {
      badge: "Интерактивный разнесенный вид",
      title1: "Наше",
      title2: "оборудование",
      subtitle: "Нажмите и прокрутите для просмотра",
      valve: "Регулирующий клапан",
      ball: "Шаровой клапан",
      robot: "Робот HVOF"
    }
  }[locale] || {};

  return (
    <section className="container-x py-12 sm:py-16">
      <div className="text-center mb-8">
        <span className="chip">{L.badge}</span>
        <h2 className="section-title mt-3">
          <span className="heading-grad">{L.title1}</span>{" "}
          <span className="heading-gold">{L.title2}</span>
        </h2>
        <p className="mt-3 text-sm max-w-2xl mx-auto" style={{ color: "var(--text-soft)" }}>
          {L.subtitle}
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div style={{
          display: "inline-flex",
          gap: 4,
          padding: 5,
          borderRadius: 16,
          background: "var(--bg-soft)",
          border: "1px solid var(--border)",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          <TabButton active={tab === "valve"} onClick={function() { setTab("valve"); }} label={L.valve} icon="🔧" />
          <TabButton active={tab === "ball"} onClick={function() { setTab("ball"); }} label={L.ball} icon="⚪" />
          <TabButton active={tab === "robot"} onClick={function() { setTab("robot"); }} label={L.robot} icon="🤖" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {tab === "valve" && <ExplodedValve />}
          {tab === "ball" && <ExplodedBallValve standalone />}
          {tab === "robot" && <ExplodedHvofRobot />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 22px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 900,
        fontFamily: "inherit",
        cursor: "pointer",
        border: "none",
        background: active ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
        color: active ? "#FFFFFF" : "var(--text-soft)",
        boxShadow: active ? "0 6px 18px rgba(201, 149, 13, 0.35)" : "none",
        transition: "all 0.2s"
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}
