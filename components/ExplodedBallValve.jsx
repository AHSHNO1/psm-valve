"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { useDictionary } from "./Providers";

const LABELS = {
  fa: ["بدنه", "توپ", "نشیمن‌گاه", "ساقه", "فلنج"],
  en: ["Body", "Ball", "Seat", "Stem", "End flange"],
  ar: ["الجسم", "الكرة", "المقعد", "الساق", "شفة التوصيل"],
  ru: ["Корпус", "Шар", "Седло", "Шток", "Фланец"]
};

const PARTS = [
  { id: "body", position: [0, 0, 0], offset: [0, 0, 0] },
  { id: "ball", position: [0, 0, 0], offset: [0, 1.1, 0] },
  { id: "seat", position: [0, 0, 0], offset: [0, -0.9, 0] },
  { id: "stem", position: [0, 0.6, 0], offset: [0, 1.2, 0] },
  { id: "flangeLeft", labelIndex: 4, position: [-1.7, 0, 0], offset: [-0.8, 0, 0] },
  { id: "flangeRight", labelIndex: 4, position: [1.7, 0, 0], offset: [0.8, 0, 0] }
];

function BallValvePart({ item, index, explode, labels }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const emphasized = hovered || selected;

  useFrame((_, delta) => {
    if (!ref.current) return;
    const smoothing = 1 - Math.exp(-8 * delta);
    const stage = Math.max(0, Math.min(1, (explode - index * 0.055) / (1 - index * 0.055)));
    const easedStage = stage * stage * (3 - 2 * stage);
    const amount = easedStage * item.offset[1];
    const x = item.position[0] + easedStage * item.offset[0];
    const y = item.position[1] + amount;
    ref.current.position.x += (x - ref.current.position.x) * smoothing;
    ref.current.position.y += (y - ref.current.position.y) * smoothing;
    const targetScale = emphasized ? 1.06 : 1;
    ref.current.scale.x += (targetScale - ref.current.scale.x) * smoothing;
    ref.current.scale.y += (targetScale - ref.current.scale.y) * smoothing;
    ref.current.scale.z += (targetScale - ref.current.scale.z) * smoothing;
  });

  const baseColor = index === 1 ? "#C4CDD5" : index === 2 ? "#D7B24B" : "#84919D";
  const material = {
    color: emphasized ? "#FFD34E" : baseColor,
    metalness: 0.78,
    roughness: 0.28,
    transparent: item.id === "body",
    opacity: item.id === "body" ? 0.38 : 1,
    depthWrite: item.id !== "body"
  };

  return (
    <group
      ref={ref}
      position={item.position}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => { event.stopPropagation(); setSelected((value) => !value); }}
    >
      {item.id === "body" && (
        <>
          <mesh castShadow scale={[1.05, 0.88, 0.78]}>
            <sphereGeometry args={[0.86, 32, 24]} />
            <meshStandardMaterial {...material} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.43, 0.43, 1.15, 32]} />
                <meshStandardMaterial {...material} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.4, 0.34, 32]} />
            <meshStandardMaterial {...material} />
          </mesh>
        </>
      )}
      {item.id === "ball" && (
        <>
          <mesh castShadow>
            <sphereGeometry args={[0.61, 40, 32]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0.59, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.255, 0.035, 12, 32]} />
            <meshStandardMaterial color="#D5DCE2" metalness={0.82} roughness={0.22} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 1.45, 32]} />
            <meshStandardMaterial color="#27313A" metalness={0.25} roughness={0.55} />
          </mesh>
        </>
      )}
      {item.id === "seat" && (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.56, 0.1, 16, 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.41, 0.045, 12, 40]} />
            <meshStandardMaterial color="#E6D9AC" metalness={0.25} roughness={0.45} />
          </mesh>
        </>
      )}
      {item.id === "stem" && (
        <>
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.13, 0.85, 24]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.12, 24]} />
            <meshStandardMaterial color="#596673" metalness={0.7} roughness={0.3} />
          </mesh>
        </>
      )}
      {item.id.indexOf("flange") === 0 && (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.62, 0.62, 0.22, 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[item.id === "flangeLeft" ? -0.14 : 0.14, 0, 0]}>
            <torusGeometry args={[0.45, 0.055, 12, 40]} />
            <meshStandardMaterial color="#C4CDD5" metalness={0.82} roughness={0.26} />
          </mesh>
          {Array.from({ length: 8 }).map((_, bolt) => {
            const angle = (bolt / 8) * Math.PI * 2;
            return (
              <mesh key={bolt} position={[0, Math.cos(angle) * 0.49, Math.sin(angle) * 0.49]}>
                <cylinderGeometry args={[0.045, 0.045, 0.12, 8]} />
                <meshStandardMaterial color="#E2E7EB" metalness={0.86} roughness={0.22} />
              </mesh>
            );
          })}
        </>
      )}
      {emphasized && (
        <Html center distanceFactor={8}>
          <span className="whitespace-nowrap rounded-lg bg-[#F5C518] px-3 py-1.5 text-xs font-bold text-[#15181C] shadow-lg">
            {labels[item.labelIndex === undefined ? index : item.labelIndex]}
          </span>
        </Html>
      )}
    </group>
  );
}

function BallValveModel({ explode, locale }) {
  const labels = LABELS[locale] || LABELS.en;
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 7, 5]} intensity={2} />
      <pointLight position={[-4, 2, -3]} intensity={35} color="#F5C518" />
      {PARTS.map((part, index) => (
        <BallValvePart key={part.id} item={part} index={index} explode={explode} labels={labels} />
      ))}
    </>
  );
}

export default function ExplodedBallValve() {
  const { locale } = useDictionary();
  const [explode, setExplode] = useState(0.75);
  const labels = LABELS[locale] || LABELS.en;
  const expanded = explode > 0.5;
  const actionLabel = expanded
    ? ({ fa: "مونتاژ", en: "Assemble", ar: "تجميع", ru: "Собрать" }[locale] || "Assemble")
    : ({ fa: "بازکردن کامل", en: "Explode view", ar: "تفكيك كامل", ru: "Разнести детали" }[locale] || "Explode view");

  return (
    <div className="relative h-[440px] sm:h-[520px]">
      <Canvas camera={{ position: [4.5, 3.2, 7], fov: 40 }} dpr={[1, 1.5]}>
        <group position={[0, -0.25, 0]} scale={1}>
          <BallValveModel explode={explode} locale={locale} />
        </group>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          autoRotate={false}
          minPolarAngle={0.65}
          maxPolarAngle={2.35}
        />
      </Canvas>
      <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl border px-3 py-2 backdrop-blur-md"
        style={{ background: "rgba(15,17,20,.72)", borderColor: "rgba(255,255,255,.16)" }}>
        <button
          type="button"
          onClick={() => setExplode(expanded ? 0 : 1)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:border-[#F5C518] hover:text-[#F5C518]"
          aria-label={actionLabel}
        >
          {expanded ? <RotateCcw size={13} /> : <Play size={13} />}
          {actionLabel}
        </button>
        <span className="text-[10px] font-bold text-white/75">{labels[0]}</span>
        <input
          aria-label={locale === "fa" ? "میزان بازشدن قطعات" : locale === "ar" ? "مقدار تفكيك الأجزاء" : locale === "ru" ? "Степень разнесения деталей" : "Exploded view amount"}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={explode}
          onChange={(event) => setExplode(Number(event.target.value))}
          className="w-full accent-[#E0A81A]"
        />
      </div>
    </div>
  );
}
