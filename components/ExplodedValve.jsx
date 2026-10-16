"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import { Vector2 } from "three";
import { Play, RotateCcw } from "lucide-react";
import { useDictionary } from "./Providers";

const LABELS = {
  fa: ["بدنه", "فلنج انتهایی", "قفسه", "نشیمن‌گاه", "پلاگ", "ساقه", "کلاهک و پکینگ", "اکچویتور"],
  en: ["Body", "End flange", "Cage", "Seat", "Plug", "Stem", "Bonnet & packing", "Actuator"],
  ar: ["الجسم", "شفة التوصيل", "القفص", "المقعد", "السدادة", "الساق", "الغطاء والحشوة", "المشغل"],
  ru: ["Корпус", "Концевой фланец", "Клетка", "Седло", "Плунжер", "Шток", "Крышка и уплотнение", "Привод"]
};

const PLUG_PROFILE = [
  new Vector2(0.11, -0.35),
  new Vector2(0.19, -0.27),
  new Vector2(0.27, -0.08),
  new Vector2(0.29, 0.02),
  new Vector2(0.22, 0.12),
  new Vector2(0.12, 0.25)
];

const PARTS = [
  { id: "body", position: [0, 0, 0], offset: [0, 0, 0] },
  { id: "flangeLeft", labelIndex: 1, position: [-1.23, -0.06, 0], offset: [-0.85, 0, 0] },
  { id: "flangeRight", labelIndex: 1, position: [1.23, -0.06, 0], offset: [0.85, 0, 0] },
  { id: "cage", position: [0, 0, 0], offset: [0, -0.62, 0] },
  { id: "seat", position: [0, 0, 0], offset: [0, -1.12, 0] },
  { id: "plug", position: [0, 0, 0], offset: [0, -1.5, 0] },
  { id: "stem", position: [0, 0.38, 0], offset: [0, 0.36, 0] },
  { id: "bonnet", position: [0, 0.7, 0], offset: [0, 0.86, 0] },
  { id: "actuator", position: [0, 1.45, 0], offset: [0, 1.42, 0] }
];

function PartLabel({ children }) {
  return (
    <Html center distanceFactor={8}>
      <span className="whitespace-nowrap rounded-lg bg-[#F5C518] px-3 py-1.5 text-xs font-bold text-[#15181C] shadow-lg">
        {children}
      </span>
    </Html>
  );
}

function ValvePart({ item, index, explode, labels }) {
  const group = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const emphasized = hovered || selected;

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-7.5 * delta);
    const progress = Math.max(0, Math.min(1, (explode - index * 0.035) / (1 - index * 0.035)));
    const eased = progress * progress * (3 - 2 * progress);
    group.current.position.x += (item.position[0] + item.offset[0] * eased - group.current.position.x) * smoothing;
    group.current.position.y += (item.position[1] + item.offset[1] * eased - group.current.position.y) * smoothing;
    const targetScale = emphasized ? 1.055 : 1;
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
  });

  const metal = {
    color: emphasized ? "#FFE071" : item.id === "actuator" ? "#D5A51E" : "#87949E",
    metalness: 0.72,
    roughness: 0.3
  };
  const bodyMaterial = {
    color: emphasized ? "#D5B64C" : "#74828D",
    metalness: 0.72,
    roughness: 0.34,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  };

  return (
    <group
      ref={group}
      position={item.position}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => { event.stopPropagation(); setSelected((value) => !value); }}
    >
      {item.id === "body" && (
        <>
          <mesh scale={[0.85, 0.84, 0.68]} castShadow>
            <sphereGeometry args={[0.83, 40, 32]} />
            <meshStandardMaterial {...bodyMaterial} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.68, -0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.31, 0.31, 1.1, 32]} />
                <meshStandardMaterial {...bodyMaterial} />
              </mesh>
              <mesh position={[0, side * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.31, 0.045, 12, 32]} />
                <meshStandardMaterial color="#D4A92F" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.56, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.48, 0.28, 32]} />
            <meshStandardMaterial {...bodyMaterial} />
          </mesh>
          <mesh position={[0, -0.57, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.33, 0.22, 32]} />
            <meshStandardMaterial {...bodyMaterial} />
          </mesh>
        </>
      )}

      {item.id.indexOf("flange") === 0 && (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.51, 0.51, 0.22, 40]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh
            position={[0, item.id === "flangeLeft" ? -0.13 : 0.13, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.35, 0.045, 12, 40]} />
            <meshStandardMaterial color="#C7D0D7" metalness={0.82} roughness={0.24} />
          </mesh>
          {Array.from({ length: 8 }).map((_, bolt) => {
            const angle = (bolt / 8) * Math.PI * 2;
            return (
              <mesh key={bolt} position={[Math.cos(angle) * 0.41, 0, Math.sin(angle) * 0.41]}>
                <cylinderGeometry args={[0.035, 0.035, 0.24, 8]} />
                <meshStandardMaterial color="#DDE3E7" metalness={0.85} roughness={0.22} />
              </mesh>
            );
          })}
        </group>
      )}

      {item.id === "cage" && (
        <>
          {[0, 0.42].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <torusGeometry args={[0.3, 0.045, 12, 40]} />
              <meshStandardMaterial color="#C7A242" metalness={0.74} roughness={0.29} />
            </mesh>
          ))}
          {Array.from({ length: 12 }).map((_, bar) => {
            const angle = (bar / 12) * Math.PI * 2;
            return (
              <mesh key={bar} position={[Math.cos(angle) * 0.3, 0.21, Math.sin(angle) * 0.3]}>
                <cylinderGeometry args={[0.022, 0.022, 0.42, 8]} />
                <meshStandardMaterial color="#A9B5BE" metalness={0.68} roughness={0.32} />
              </mesh>
            );
          })}
        </>
      )}

      {item.id === "seat" && (
        <>
          <mesh>
            <torusGeometry args={[0.28, 0.07, 16, 40]} />
            <meshStandardMaterial color="#D4BF83" metalness={0.28} roughness={0.4} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.2, 0.025, 12, 40]} />
            <meshStandardMaterial color="#53616B" metalness={0.52} roughness={0.35} />
          </mesh>
        </>
      )}

      {item.id === "plug" && (
        <>
          <mesh position={[0, 0.05, 0]} castShadow>
            <latheGeometry args={[PLUG_PROFILE, 32]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[0, -0.01, 0]}>
            <torusGeometry args={[0.265, 0.025, 10, 32]} />
            <meshStandardMaterial color="#D9C47D" metalness={0.4} roughness={0.34} />
          </mesh>
        </>
      )}

      {item.id === "stem" && (
        <>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 1.12, 24]} />
            <meshStandardMaterial color="#D8E0E6" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.14, 24]} />
            <meshStandardMaterial color="#C6A03A" metalness={0.72} roughness={0.28} />
          </mesh>
          {Array.from({ length: 5 }).map((_, ring) => (
            <mesh key={ring} position={[0, 0.1 + ring * 0.055, 0]}>
              <torusGeometry args={[0.085, 0.012, 8, 20]} />
              <meshStandardMaterial color="#E0B94F" metalness={0.72} roughness={0.28} />
            </mesh>
          ))}
        </>
      )}

      {item.id === "bonnet" && (
        <>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.48, 0.54, 0.16, 36]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.38, 0.38, 32]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[0, 0.47, 0]}>
            <torusGeometry args={[0.29, 0.05, 12, 32]} />
            <meshStandardMaterial color="#D0A52E" metalness={0.72} roughness={0.3} />
          </mesh>
          {Array.from({ length: 8 }).map((_, bolt) => {
            const angle = (bolt / 8) * Math.PI * 2;
            return (
              <mesh key={bolt} position={[Math.cos(angle) * 0.42, 0.03, Math.sin(angle) * 0.42]}>
                <cylinderGeometry args={[0.035, 0.035, 0.12, 8]} />
                <meshStandardMaterial color="#DEE4E8" metalness={0.84} roughness={0.22} />
              </mesh>
            );
          })}
        </>
      )}

      {item.id === "actuator" && (
        <>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.16, 32]} />
            <meshStandardMaterial color="#303941" metalness={0.56} roughness={0.36} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 0.42, 32]} />
            <meshStandardMaterial color="#D1A01A" metalness={0.56} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0.54, 0]}>
            <cylinderGeometry args={[0.37, 0.32, 0.12, 32]} />
            <meshStandardMaterial color="#303941" metalness={0.56} roughness={0.36} />
          </mesh>
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.18, 20]} />
            <meshStandardMaterial color="#D7DEE3" metalness={0.88} roughness={0.2} />
          </mesh>
        </>
      )}

      {emphasized && <PartLabel>{labels[item.labelIndex === undefined ? index : item.labelIndex]}</PartLabel>}
    </group>
  );
}

function GlobeValveModel({ explode, locale }) {
  const labels = LABELS[locale] || LABELS.en;

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={2} />
      <pointLight position={[-3, 2, -4]} intensity={24} color="#F5C518" />
      {PARTS.map((part, index) => (
        <ValvePart key={part.id} item={part} index={index} explode={explode} labels={labels} />
      ))}
    </>
  );
}

export default function ExplodedValve() {
  const { locale } = useDictionary();
  const labels = LABELS[locale] || LABELS.en;
  const [explode, setExplode] = useState(0.28);
  const expanded = explode > 0.5;
  const actionLabel = expanded
    ? ({ fa: "مونتاژ", en: "Assemble", ar: "تجميع", ru: "Собрать" }[locale] || "Assemble")
    : ({ fa: "بازکردن قطعات", en: "Explode view", ar: "تفكيك الأجزاء", ru: "Разнести детали" }[locale] || "Explode view");

  return (
    <div className="relative h-[390px] sm:h-[450px]">
      <Canvas camera={{ position: [4.6, 3.2, 7.2], fov: 40 }} dpr={[1, 1.5]}>
        <group position={[0, -0.45, 0]} scale={0.78}>
          <GlobeValveModel explode={explode} locale={locale} />
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
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl border p-2.5 backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:gap-3 sm:p-3"
        style={{ background: "rgba(15,17,20,.82)", borderColor: "rgba(255,255,255,.16)" }}>
        <button
          type="button"
          onClick={() => setExplode(expanded ? 0 : 1)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:border-[#F5C518] hover:text-[#F5C518]"
          aria-label={actionLabel}
        >
          {expanded ? <RotateCcw size={13} /> : <Play size={13} />}
          {actionLabel}
        </button>
        <span className="hidden text-[10px] font-bold text-white/75 sm:inline">{labels[0]}</span>
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
