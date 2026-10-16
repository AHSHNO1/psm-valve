"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { useDictionary } from "./Providers";

const LABELS = {
  fa: ["پایه", "محور اول", "شانه", "بازوی اصلی", "آرنج", "مچ", "تورچ HVOF"],
  en: ["Base", "Axis 1", "Shoulder", "Upper arm", "Elbow", "Wrist", "HVOF torch"],
  ar: ["القاعدة", "المحور الأول", "الكتف", "الذراع العلوي", "المرفق", "المعصم", "شعلة HVOF"],
  ru: ["Основание", "Ось 1", "Плечо", "Верхняя рука", "Локоть", "Запястье", "Горелка HVOF"]
};

const PARTS = [
  { id: "base", position: [0, -0.58, 0], offset: [0, 0, 0] },
  { id: "axis", position: [0, -0.2, 0], offset: [0, -0.28, 0] },
  { id: "shoulder", position: [0.12, 0.25, 0], offset: [-0.28, 0, 0] },
  { id: "upperArm", position: [0.55, 0.48, 0], offset: [0, 0.35, 0] },
  { id: "elbow", position: [1.04, 0.68, 0], offset: [0.28, 0, 0] },
  { id: "wrist", position: [1.48, 0.52, 0], offset: [0, -0.35, 0] },
  { id: "torch", position: [1.82, 0.12, 0], offset: [0.32, -0.1, 0] }
];

function RobotPart({ item, index, explode, labels }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const emphasized = hovered || selected;

  useFrame((_, delta) => {
    if (!ref.current) return;
    const smoothing = 1 - Math.exp(-8 * delta);
    const stage = Math.max(0, Math.min(1, (explode - index * 0.05) / (1 - index * 0.05)));
    const easedStage = stage * stage * (3 - 2 * stage);
    ref.current.position.x += (item.position[0] + item.offset[0] * easedStage - ref.current.position.x) * smoothing;
    ref.current.position.y += (item.position[1] + item.offset[1] * easedStage - ref.current.position.y) * smoothing;
    const targetScale = emphasized ? 1.07 : 1;
    ref.current.scale.x += (targetScale - ref.current.scale.x) * smoothing;
    ref.current.scale.y += (targetScale - ref.current.scale.y) * smoothing;
    ref.current.scale.z += (targetScale - ref.current.scale.z) * smoothing;
  });

  const color = emphasized ? "#FFE071" : index === 0 || index === 1 || index === 4 || index === 5 ? "#343A40" : "#E4A900";
  const material = { color, metalness: 0.58, roughness: 0.34 };

  return (
    <group
      ref={ref}
      position={item.position}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => { event.stopPropagation(); setSelected((value) => !value); }}
    >
      {item.id === "base" && (
        <>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.62, 0.7, 0.34, 32]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.48, 0.12, 32]} />
            <meshStandardMaterial color="#737B83" metalness={0.7} roughness={0.3} />
          </mesh>
          {Array.from({ length: 8 }).map((_, bolt) => {
            const angle = (bolt / 8) * Math.PI * 2;
            return (
              <mesh key={bolt} position={[Math.cos(angle) * 0.54, 0.32, Math.sin(angle) * 0.54]}>
                <cylinderGeometry args={[0.035, 0.035, 0.08, 6]} />
                <meshStandardMaterial color="#D8DEE3" metalness={0.84} roughness={0.22} />
              </mesh>
            );
          })}
        </>
      )}
      {item.id === "axis" && (
        <>
          <mesh castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.5, 32]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <torusGeometry args={[0.31, 0.065, 12, 32]} />
            <meshStandardMaterial color="#949CA3" metalness={0.72} roughness={0.3} />
          </mesh>
        </>
      )}
      {item.id === "shoulder" && (
        <>
          <mesh castShadow scale={[0.55, 0.58, 0.48]}>
            <sphereGeometry args={[0.58, 28, 20]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.68, 24]} />
            <meshStandardMaterial color="#626A72" metalness={0.68} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0, 0.36]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.25, 0.045, 12, 28]} />
            <meshStandardMaterial color="#D1A52D" metalness={0.76} roughness={0.28} />
          </mesh>
        </>
      )}
      {item.id === "upperArm" && (
        <>
          <mesh rotation={[0, 0, -0.22]} castShadow>
            <boxGeometry args={[1.12, 0.34, 0.42]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, -0.22]}>
            <boxGeometry args={[0.82, 0.08, 0.44]} />
            <meshStandardMaterial color="#F3BF28" metalness={0.45} roughness={0.4} />
          </mesh>
        </>
      )}
      {item.id === "elbow" && (
        <>
          <mesh castShadow>
            <sphereGeometry args={[0.31, 28, 20]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.57, 24]} />
            <meshStandardMaterial color="#69727A" metalness={0.72} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.29]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.18, 0.04, 10, 24]} />
            <meshStandardMaterial color="#D1A52D" metalness={0.76} roughness={0.28} />
          </mesh>
        </>
      )}
      {item.id === "wrist" && (
        <>
          <mesh rotation={[0, 0, 0.3]} castShadow>
            <boxGeometry args={[0.76, 0.27, 0.31]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0.31, -0.08, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.28, 24]} />
            <meshStandardMaterial color="#737B83" metalness={0.72} roughness={0.3} />
          </mesh>
        </>
      )}
      {item.id === "torch" && (
        <>
          <mesh rotation={[0, 0, -0.18]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.72, 24]} />
            <meshStandardMaterial color="#515A62" metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0.04, -0.39, 0]} rotation={[0, 0, -0.18]}>
            <coneGeometry args={[0.12, 0.34, 20]} />
            <meshStandardMaterial color="#D3D8DD" metalness={0.84} roughness={0.22} />
          </mesh>
          <mesh position={[0.2, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.055, 0.055, 0.38, 12]} />
            <meshStandardMaterial color="#22282D" metalness={0.4} roughness={0.45} />
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

function KukaRobot({ explode, locale }) {
  const labels = LABELS[locale] || LABELS.en;
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 7, 5]} intensity={2} />
      <pointLight position={[-4, 2, -3]} intensity={35} color="#F5C518" />
      {PARTS.map((item, index) => (
        <RobotPart key={item.id} item={item} index={index} explode={explode} labels={labels} />
      ))}
    </>
  );
}

export default function ExplodedHvofRobot() {
  const { locale } = useDictionary();
  const labels = LABELS[locale] || LABELS.en;
  const [explode, setExplode] = useState(0.3);
  const expanded = explode > 0.5;
  const actionLabel = expanded
    ? ({ fa: "مونتاژ", en: "Assemble", ar: "تجميع", ru: "Собрать" }[locale] || "Assemble")
    : ({ fa: "بازکردن کامل", en: "Explode view", ar: "تفكيك كامل", ru: "Разнести детали" }[locale] || "Explode view");

  return (
    <div className="relative h-[390px] sm:h-[450px]">
      <Canvas camera={{ position: [3.5, 2.8, 6.8], fov: 42 }} dpr={[1, 1.5]}>
        <group position={[-0.25, -0.12, 0]} scale={0.9}>
          <KukaRobot explode={explode} locale={locale} />
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
