"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { useDictionary } from "./Providers";

function RobotPart({ position, color, offset, explode, name, geometry }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(function() {
    if (!ref.current) return;
    const targetY = position[1] + offset[1] * explode;
    const targetX = position[0] + offset[0] * explode;
    const targetZ = position[2] + offset[2] * explode;
    ref.current.position.x += (targetX - ref.current.position.x) * 0.08;
    ref.current.position.y += (targetY - ref.current.position.y) * 0.08;
    ref.current.position.z += (targetZ - ref.current.position.z) * 0.08;
    ref.current.rotation.y += 0.0015;
  });

  const geo = (function() {
    if (geometry === "box") return <boxGeometry args={[0.9, 0.5, 0.9]} />;
    if (geometry === "sphere") return <sphereGeometry args={[0.55, 32, 32]} />;
    if (geometry === "cone") return <coneGeometry args={[0.4, 0.8, 32]} />;
    if (geometry === "cylinder") return <cylinderGeometry args={[0.35, 0.35, 0.9, 32]} />;
    return <boxGeometry args={[0.8, 0.8, 0.8]} />;
  })();

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={function() { setHovered(true); }}
      onPointerOut={function() { setHovered(false); }}
    >
      <mesh castShadow>
        {geo}
        <meshStandardMaterial
          color={hovered ? "#FFD700" : color}
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
      {hovered && (
        <Html center distanceFactor={8}>
          <div className="px-3 py-1 rounded-lg text-silver-950 text-xs font-bold whitespace-nowrap"
            style={{ background: "#F5C518", color: "#1A1D21" }}>
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

function RobotModel({ explode, partNames }) {
  const parts = [
    { name: partNames[0], color: "#C0C0C0", position: [0, 0, 0], offset: [0, 0, 0], geometry: "box" },
    { name: partNames[1], color: "#E5E7EB", position: [0, 0.7, 0], offset: [0, 1.3, 0], geometry: "sphere" },
    { name: partNames[2], color: "#9CA3AF", position: [0.9, 0.5, 0], offset: [1.2, 0.4, 0], geometry: "cylinder" },
    { name: partNames[3], color: "#F5C518", position: [-0.9, 0.5, 0], offset: [-1.2, 0.4, 0], geometry: "cylinder" },
    { name: partNames[4], color: "#D4A017", position: [0, 1.4, 0], offset: [0, 1.2, 0], geometry: "cone" }
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, -3, -5]} intensity={0.5} color="#FFD700" />
      {parts.map(function(p, i) {
        return <RobotPart key={i} {...p} explode={explode} />;
      })}
      <Environment preset="warehouse" />
    </>
  );
}

export default function ExplodedHvofRobot() {
  const { t, locale } = useDictionary();
  const containerRef = useRef(null);
  const [explode, setExplode] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  useEffect(function() {
    const unsub = scrollYProgress.on("change", function(v) {
      const tt = Math.max(0, Math.min(1, (v - 0.15) / 0.7));
      const eased = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
      setExplode(eased * 1.6);
    });
    return function() { unsub(); };
  }, [scrollYProgress]);

  const partNames = ["Base", "Head", "Arm L", "Arm R", "Torch"];

  const labels = {
    fa: {
      badge: "تکنولوژی HVOF",
      title1: "ربات",
      title2: "پوشش‌دهی HVOF",
      desc: "با اسکرول، اجزای ربات از هم باز می‌شوند. این ربات برای اعمال پوشش کاربید تنگستن با کیفیت بالا روی سطوح صنعتی استفاده می‌شود.",
      hint: "کشیدن برای چرخش · اسکرول برای انفجار",
      f1: "دقت پاشش ±۰.۰۱ میلی‌متر",
      f2: "سرعت پاشش ذرات تا 800 m/s",
      f3: "کنترل دمای زیر 150°C",
      f4: "ضخامت پوشش 150 تا 500 میکرون"
    },
    en: {
      badge: "HVOF Technology",
      title1: "HVOF",
      title2: "Coating Robot",
      desc: "Scroll to see the robot parts separate. This robot applies high-quality tungsten carbide coating on industrial surfaces.",
      hint: "Drag to rotate · Scroll to explode",
      f1: "Spray precision ±0.01 mm",
      f2: "Particle velocity up to 800 m/s",
      f3: "Temperature control below 150°C",
      f4: "Coating thickness 150 to 500 microns"
    },
    ar: {
      badge: "تقنية HVOF",
      title1: "روبوت",
      title2: "طلاء HVOF",
      desc: "قم بالتمرير لرؤية أجزاء الروبوت تنفصل. يستخدم هذا الروبوت لتطبيق طلاء كربيد التنغستن.",
      hint: "اسحب للتدوير · مرر للتفجير",
      f1: "دقة الرش ±0.01 مم",
      f2: "سرعة الجسيمات حتى 800 م/ث",
      f3: "التحكم في درجة الحرارة أقل من 150 درجة",
      f4: "سمك الطلاء 150 إلى 500 ميكرون"
    },
    ru: {
      badge: "Технология HVOF",
      title1: "Робот",
      title2: "покрытия HVOF",
      desc: "Прокрутите, чтобы увидеть, как части робота разъединяются. Робот наносит карбид вольфрама на промышленные поверхности.",
      hint: "Перетащите для вращения · Прокрутите для разнесения",
      f1: "Точность распыления ±0,01 мм",
      f2: "Скорость частиц до 800 м/с",
      f3: "Контроль температуры ниже 150°C",
      f4: "Толщина покрытия 150-500 микрон"
    }
  };
  const L = labels[locale] || labels.en;

  return (
    <section ref={containerRef} className="relative min-h-[160vh] py-20">
      <div className="sticky top-24 container-x">
        <div className="grid lg:grid-cols-2 gap-10 items-center min-h-[75vh]">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <span className="chip">{L.badge}</span>
            <h2 className="section-title mt-5">
              <span className="heading-grad">{L.title1}</span>{" "}
              <span className="heading-gold">{L.title2}</span>
            </h2>
            <p className="mt-5 leading-8" style={{ color: "var(--text-soft)" }}>
              {L.desc}
            </p>

            <div className="mt-8 space-y-3">
              {[L.f1, L.f2, L.f3, L.f4].map(function(item, i) {
                return (
                  <div key={i} className="flex items-center gap-3" style={{ color: "var(--text)" }}>
                    <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="order-1 lg:order-2 h-[500px] rounded-3xl overflow-hidden relative"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <Canvas camera={{ position: [4, 3, 6], fov: 45 }} shadows>
              <RobotModel explode={explode} partNames={partNames} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
            <div className="absolute bottom-4 right-4 text-xs px-3 py-1.5 rounded-lg backdrop-blur"
              style={{ color: "var(--text-soft)", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {L.hint}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
