"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { useDictionary } from "./Providers";

function ValvePart({ position, color, offset, explode, name }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!ref.current) return;
    const targetY = position[1] + offset[1] * explode;
    const targetX = position[0] + offset[0] * explode;
    const targetZ = position[2] + offset[2] * explode;
    ref.current.position.x += (targetX - ref.current.position.x) * 0.08;
    ref.current.position.y += (targetY - ref.current.position.y) * 0.08;
    ref.current.position.z += (targetZ - ref.current.position.z) * 0.08;
    ref.current.rotation.y += 0.002;
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh castShadow>
        <cylinderGeometry args={[1, 1, 0.4, 48]} />
        <meshStandardMaterial
          color={hovered ? "#FFD700" : color}
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
      {hovered && (
        <Html center distanceFactor={8}>
          <div className="px-3 py-1 rounded-lg bg-gold-500 text-[#0F1114] text-xs font-bold whitespace-nowrap">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

function ValveModel({ explode, partNames }) {
  const parts = [
    { name: partNames[0], color: "#C0C0C0", position: [0, 0, 0], offset: [0, 0, 0] },
    { name: partNames[1], color: "#E5E7EB", position: [0, 0, 0], offset: [0, 1.4, 0] },
    { name: partNames[2], color: "#9CA3AF", position: [0, 0, 0], offset: [0, -1.4, 0] },
    { name: partNames[3], color: "#F5C518", position: [0, 0, 0], offset: [0, 0, 1.6] },
    { name: partNames[4], color: "#D4A017", position: [0, 0, 0], offset: [0, 0, -1.8] }
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, -3, -5]} intensity={0.5} color="#FFD700" />
      {parts.map((p, i) => (
        <ValvePart key={i} {...p} explode={explode} />
      ))}
      <Environment files="/hdri/empty_warehouse_01_1k.hdr" />
    </>
  );
}

export default function ExplodedValve() {
  const { t } = useDictionary();
  const containerRef = useRef(null);
  const [explode, setExplode] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const tt = Math.max(0, Math.min(1, (v - 0.15) / 0.7));
      const eased = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
      setExplode(eased * 1.6);
    });
    return () => unsub();
  }, [scrollYProgress]);

  const partNames = ["Body", "Ball", "Seat", "Stem", "Actuator"];

  return (
    <section ref={containerRef} className="relative min-h-[180vh] py-24">
      <div className="sticky top-20 container-x">
        <div className="grid lg:grid-cols-2 gap-10 items-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <span className="chip">{t.exploded.badge}</span>
            <h2 className="section-title mt-5">
              <span className="heading-grad">{t.exploded.title1}</span>{" "}
              <span className="heading-gold">{t.exploded.title2}</span>
            </h2>
            <p className="mt-5 leading-8" style={{ color: "var(--text-soft)" }}>
              {t.exploded.desc}
            </p>

            <div className="mt-8 space-y-3">
              {[t.exploded.f1, t.exploded.f2, t.exploded.f3, t.exploded.f4].map((item, i) => (
                <div key={i} className="flex items-center gap-3" style={{ color: "var(--text)" }}>
                  <span className="w-2 h-2 rounded-full bg-gold-500" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="order-1 lg:order-2 h-[520px] rounded-3xl card-glass overflow-hidden relative">
            <Canvas camera={{ position: [4, 3, 6], fov: 45 }} shadows>
              <ValveModel explode={explode} partNames={partNames} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
            <div className="absolute bottom-4 right-4 text-xs px-3 py-1.5 rounded-lg backdrop-blur"
              style={{ color: "var(--text-soft)", backgroundColor: "var(--card-bg)" }}>
              {t.exploded.hint}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
