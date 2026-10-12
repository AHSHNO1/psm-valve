"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { useDictionary } from "./Providers";

function BallPart({ position, offset, explode, name, geometry, color }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(function() {
    if (!ref.current) return;
    const tX = position[0] + offset[0] * explode;
    const tY = position[1] + offset[1] * explode;
    const tZ = position[2] + offset[2] * explode;
    ref.current.position.x += (tX - ref.current.position.x) * 0.08;
    ref.current.position.y += (tY - ref.current.position.y) * 0.08;
    ref.current.position.z += (tZ - ref.current.position.z) * 0.08;
    ref.current.rotation.y += 0.002;
  });

  const geo = (function() {
    if (geometry === "sphere") return <sphereGeometry args={[0.7, 48, 48]} />;
    if (geometry === "cylinder") return <cylinderGeometry args={[0.28, 0.28, 0.9, 32]} />;
    if (geometry === "torus") return <torusGeometry args={[0.75, 0.14, 24, 48]} />;
    if (geometry === "cone") return <coneGeometry args={[0.35, 0.6, 32]} />;
    if (geometry === "box") return <boxGeometry args={[1.6, 1.6, 0.7]} />;
    return <boxGeometry args={[0.6, 0.6, 0.6]} />;
  })();

  return (
    <group ref={ref} position={position}
      onPointerOver={function() { setHovered(true); }}
      onPointerOut={function() { setHovered(false); }}>
      <mesh castShadow>
        {geo}
        <meshStandardMaterial
          color={hovered ? "#FFD700" : color}
          metalness={0.9}
          roughness={0.22}
        />
      </mesh>
      {hovered && (
        <Html center distanceFactor={8}>
          <div style={{
            padding: "5px 10px",
            borderRadius: 8,
            background: "#F5C518",
            color: "#1A1D21",
            fontSize: 11,
            fontWeight: 900,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}>
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

function BallModel({ explode, partNames }) {
  const parts = [
    { name: partNames[0], color: "#C0C0C0", position: [0, 0, 0], offset: [0, 0, 0], geometry: "box" },
    { name: partNames[1], color: "#E5E7EB", position: [0, 0, 0], offset: [1.6, 0, 0], geometry: "sphere" },
    { name: partNames[2], color: "#9CA3AF", position: [0, 0, 0], offset: [-1.6, 0, 0], geometry: "torus" },
    { name: partNames[3], color: "#F5C518", position: [0, 0.8, 0], offset: [0, 1.5, 0], geometry: "cylinder" },
    { name: partNames[4], color: "#D4A017", position: [0, -0.8, 0], offset: [0, -1.5, 0], geometry: "cylinder" }
  ];
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, -3, -5]} intensity={0.5} color="#FFD700" />
      {parts.map(function(p, i) {
        return <BallPart key={i} {...p} explode={explode} />;
      })}
      <Environment preset="warehouse" />
    </>
  );
}

export default function ExplodedBallValve({ standalone }) {
  const { locale } = useDictionary();
  const ref = useRef(null);
  const [explode, setExplode] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  useEffect(function() {
    const unsub = scrollYProgress.on("change", function(v) {
      const t = Math.max(0, Math.min(1, (v - 0.15) / 0.7));
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setExplode(eased * 1.6);
    });
    return function() { unsub(); };
  }, [scrollYProgress]);

  const partNames = ["Body", "Ball", "Seat", "Stem Top", "Stem Bot"];

  const labels = {
    fa: {
      badge: "نمای انفجاری تعاملی",
      title1: "شیر توپی",
      title2: "کنترلی",
      desc: "با اسکرول، قطعات شیر از هم باز می‌شوند. روی هر قطعه نشانگر ببرید تا نام آن نمایش داده شود.",
      hint: "کشیدن برای چرخش · اسکرول برای انفجار",
      f1: "بدنه فولاد آلیاژی با پوشش HVOF",
      f2: "توپی سنگ‌زنی شده با دقت بالا",
      f3: "نشیمن‌گاه PEEK / Metal Seat",
      f4: "شفت ضد بیرون‌زدگی"
    },
    en: {
      badge: "Interactive Exploded View",
      title1: "Ball Control",
      title2: "Valve",
      desc: "Scroll to see the valve parts separate. Hover over each part to see its name.",
      hint: "Drag to rotate · Scroll to explode",
      f1: "Alloy steel body with HVOF coating",
      f2: "High-precision ground ball",
      f3: "PEEK / Metal Seat",
      f4: "Anti-blowout stem"
    },
    ar: {
      badge: "عرض انفجاري تفاعلي",
      title1: "صمام كروي",
      title2: "تحكم",
      desc: "قم بالتمرير لرؤية الأجزاء تنفصل.",
      hint: "اسحب للتدوير · مرر للتفجير",
      f1: "جسم من الفولاذ السبائكي مع طلاء HVOF",
      f2: "كرة مطحونة عالية الدقة",
      f3: "مقعد PEEK / معدني",
      f4: "عمود مضاد للانفجار"
    },
    ru: {
      badge: "Интерактивный разнесенный вид",
      title1: "Шаровой",
      title2: "регулирующий клапан",
      desc: "Прокрутите, чтобы увидеть разъединение частей.",
      hint: "Перетащите для вращения · Прокрутите",
      f1: "Корпус из легированной стали с покрытием HVOF",
      f2: "Высокоточный шлифованный шар",
      f3: "Седло PEEK / металлическое",
      f4: "Шток с защитой от выброса"
    }
  };
  const L = labels[locale] || labels.en;

  const inner = (
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
          <BallModel explode={explode} partNames={partNames} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
        </Canvas>
        <div className="absolute bottom-4 right-4 text-xs px-3 py-1.5 rounded-lg"
          style={{ color: "var(--text-soft)", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {L.hint}
        </div>
      </div>
    </div>
  );

  if (standalone) {
    return (
      <section ref={ref} className="relative py-8">
        <div className="container-x">{inner}</div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative min-h-[160vh] py-20">
      <div className="sticky top-24 container-x">
        {inner}
      </div>
    </section>
  );
}
