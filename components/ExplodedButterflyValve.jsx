"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { useDictionary } from "./Providers";

const LABELS = {
  fa: ["بدنه ویفری", "دیسک", "لاینر / نشیمن‌گاه", "ساقه", "یاتاقان", "اکچویتور"],
  en: ["Wafer body", "Disc", "Liner / seat", "Stem", "Bearing", "Actuator"],
  ar: ["جسم ويفر", "القرص", "البطانة / المقعد", "الساق", "المحمل", "المشغل"],
  ru: ["Корпус wafer", "Диск", "Вкладыш / седло", "Шток", "Подшипник", "Привод"]
};

const PARTS = [
  { id: "body", position: [0, 0, 0], offset: [0, 0, 0] },
  { id: "disc", position: [0, 0, 0], offset: [0, 0.62, 0] },
  { id: "seat", position: [0, 0, 0], offset: [0, -0.56, 0] },
  { id: "stem", position: [0, 0.62, 0], offset: [0, 1.2, 0] },
  { id: "bearing", position: [0, 0.9, 0], offset: [0, 1.62, 0] },
  { id: "actuator", position: [0, 1.34, 0], offset: [0, 2.02, 0] }
];

function ButterflyPart({ item, index, explode, labels, openAngle }) {
  const group = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const emphasized = hovered || selected;

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-9 * delta);
    const progress = Math.max(0, Math.min(1, (explode - index * 0.055) / (1 - index * 0.055)));
    const easedProgress = progress * progress * (3 - 2 * progress);
    const separation = item.offset[1] * easedProgress;
    group.current.position.y += (item.position[1] + separation - group.current.position.y) * smoothing;
    const targetScale = emphasized ? 1.065 : 1;
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
    if (item.id === "disc") {
      const targetRotation = openAngle * (Math.PI / 2);
      group.current.rotation.y += (targetRotation - group.current.rotation.y) * smoothing;
    }
  });

  const baseColor = emphasized ? "#FFE071" : index === 1 ? "#AEBBC5" : index === 2 ? "#D5B54B" : "#697781";
  const bodyMaterial = {
    color: emphasized ? "#FFE071" : "#6E7D87",
    metalness: 0.72,
    roughness: 0.31,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  };
  const metalMaterial = { color: baseColor, metalness: 0.78, roughness: 0.27 };

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
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.92, 0.16, 18, 48]} />
            <meshStandardMaterial {...bodyMaterial} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.7, 0.7, 0.18, 40]} />
              <meshStandardMaterial {...bodyMaterial} />
            </mesh>
          ))}
          {Array.from({ length: 8 }).map((_, bolt) => {
            const angle = (bolt / 8) * Math.PI * 2;
            return (
              <mesh key={bolt} position={[0, Math.cos(angle) * 0.82, Math.sin(angle) * 0.82]}>
                <cylinderGeometry args={[0.035, 0.035, 0.1, 8]} />
                <meshStandardMaterial color="#D7DEE3" metalness={0.86} roughness={0.24} />
              </mesh>
            );
          })}
        </>
      )}
      {item.id === "disc" && (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.76, 0.76, 0.16, 48]} />
            <meshStandardMaterial {...metalMaterial} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.28, 24]} />
            <meshStandardMaterial color="#D3AA35" metalness={0.76} roughness={0.27} />
          </mesh>
          <mesh position={[0, -0.72, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.28, 24]} />
            <meshStandardMaterial color="#D3AA35" metalness={0.76} roughness={0.27} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.14, 1.5, 0.14]} />
            <meshStandardMaterial color="#515E67" metalness={0.8} roughness={0.25} />
          </mesh>
        </>
      )}
      {item.id === "seat" && (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.79, 0.075, 14, 48]} />
            <meshStandardMaterial color="#D8C78E" metalness={0.28} roughness={0.42} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.66, 0.035, 12, 48]} />
            <meshStandardMaterial color="#687B83" metalness={0.55} roughness={0.34} />
          </mesh>
        </>
      )}
      {item.id === "stem" && (
        <>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 1.05, 24]} />
            <meshStandardMaterial {...metalMaterial} />
          </mesh>
          <mesh position={[0, -0.48, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
            <meshStandardMaterial color="#D4AD3E" metalness={0.78} roughness={0.26} />
          </mesh>
        </>
      )}
      {item.id === "bearing" && (
        <>
          <mesh>
            <torusGeometry args={[0.2, 0.055, 14, 32]} />
            <meshStandardMaterial {...metalMaterial} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.18, 24]} />
            <meshStandardMaterial color="#D9DEE2" metalness={0.9} roughness={0.2} />
          </mesh>
        </>
      )}
      {item.id === "actuator" && (
        <>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.42, 0.18, 32]} />
            <meshStandardMaterial color="#B88D20" metalness={0.66} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[0.72, 0.52, 0.62]} />
            <meshStandardMaterial color="#D2A21C" metalness={0.52} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0.64, 0]}>
            <boxGeometry args={[0.78, 0.08, 0.68]} />
            <meshStandardMaterial color="#303A42" metalness={0.54} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[0.12, 0.11, 0.12]} />
            <meshStandardMaterial color="#D6DEE3" metalness={0.86} roughness={0.22} />
          </mesh>
        </>
      )}
      {emphasized && (
        <Html center distanceFactor={8}>
          <span className="whitespace-nowrap rounded-lg bg-[#F5C518] px-3 py-1.5 text-xs font-bold text-[#15181C] shadow-lg">
            {labels[index]}
          </span>
        </Html>
      )}
    </group>
  );
}

function ButterflyModel({ explode, openAngle, locale }) {
  const labels = LABELS[locale] || LABELS.en;
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} />
      <pointLight position={[-3, 2, -3]} intensity={26} color="#F5C518" />
      {PARTS.map((item, index) => (
        <ButterflyPart
          key={item.id}
          item={item}
          index={index}
          explode={explode}
          openAngle={openAngle}
          labels={labels}
        />
      ))}
    </>
  );
}

export default function ExplodedButterflyValve() {
  const { locale } = useDictionary();
  const labels = LABELS[locale] || LABELS.en;
  const [explode, setExplode] = useState(0.66);
  const [openAngle, setOpenAngle] = useState(0);
  const isExploded = explode > 0.5;
  const actionLabel = isExploded
    ? ({ fa: "مونتاژ", en: "Assemble", ar: "تجميع", ru: "Собрать" }[locale] || "Assemble")
    : ({ fa: "بازکردن کامل", en: "Explode view", ar: "تفكيك كامل", ru: "Разнести детали" }[locale] || "Explode view");

  return (
    <div className="relative h-[390px] sm:h-[450px]">
      <Canvas camera={{ position: [3.8, 3, 6.4], fov: 40 }} dpr={[1, 1.5]}>
        <group position={[0, -0.18, 0]} scale={0.92}>
          <ButterflyModel explode={explode} openAngle={openAngle} locale={locale} />
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
      <div className="absolute inset-x-3 bottom-3 grid gap-2 rounded-xl border p-2.5 backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:p-3"
        style={{ background: "rgba(15,17,20,.78)", borderColor: "rgba(255,255,255,.16)" }}>
        <button
          type="button"
          onClick={() => setExplode(isExploded ? 0 : 1)}
          className="absolute -top-11 end-0 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#171A1E]/90 px-3 py-2 text-[10px] font-bold text-white transition hover:border-[#F5C518] hover:text-[#F5C518]"
          aria-label={actionLabel}
        >
          {isExploded ? <RotateCcw size={13} /> : <Play size={13} />}
          {actionLabel}
        </button>
        <label className="flex items-center gap-3 text-[10px] font-bold text-white/75">
          <span className="w-24 shrink-0">{locale === "fa" ? "بازشدن قطعات" : locale === "ar" ? "تفكيك الأجزاء" : locale === "ru" ? "Разнесение деталей" : "Exploded view"}</span>
          <input
            aria-label={locale === "fa" ? "بازشدن قطعات" : locale === "ar" ? "تفكيك الأجزاء" : locale === "ru" ? "Разнесение деталей" : "Exploded view"}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explode}
            onChange={(event) => setExplode(Number(event.target.value))}
            className="w-full accent-[#E0A81A]"
          />
        </label>
        <label className="flex items-center gap-3 text-[10px] font-bold text-white/75">
          <span className="w-24 shrink-0">{locale === "fa" ? "زاویه دیسک" : locale === "ar" ? "زاوية القرص" : locale === "ru" ? "Угол диска" : "Disc angle"}</span>
          <input
            aria-label={locale === "fa" ? "زاویه دیسک" : locale === "ar" ? "زاوية القرص" : locale === "ru" ? "Угол диска" : "Disc angle"}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={openAngle}
            onChange={(event) => setOpenAngle(Number(event.target.value))}
            className="w-full accent-[#E0A81A]"
          />
        </label>
      </div>
    </div>
  );
}
