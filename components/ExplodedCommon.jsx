"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { Layers, Play, RotateCcw } from "lucide-react";
import { NeutralToneMapping, Plane, Vector3 } from "three";

export const SECTION_PLANE = new Plane(new Vector3(0, 0, -1), 0.02);

export const SECTION = {
  clippingPlanes: [SECTION_PLANE],
  clipShadows: true
};

export function SceneStage({ camera, fov = 36, target = [0, 0, 0], floorY = -1.7, onPointerMissed, children, brightness = 1 }) {
  const gain = brightness;
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: camera, fov }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1.06 * (1 + (gain - 1) * 0.4);
      }}
      onPointerMissed={onPointerMissed}
    >
      <ambientLight intensity={0.58 * gain} />
      <hemisphereLight args={["#f2f7fb", "#6b5a3a", 0.75 * gain]} />
      <directionalLight position={[4.5, 6, 4.5]} intensity={2.5 * gain} />
      <directionalLight position={[-4, 2, -3]} intensity={0.75 * gain} color="#bcd6e6" />
      <directionalLight position={[-2.5, 1.4, 6]} intensity={1.1 * gain} color="#dcebf3" />
      <pointLight position={[-3, 1, 4]} intensity={12} color="#F5C518" />
      <Environment resolution={64}>
        <Lightformer form="ring" intensity={2} position={[0, 4, -5]} scale={4} color="#ffffff" />
        <Lightformer intensity={1} position={[-6, 2, 1]} scale={3} color="#F5C518" />
        <Lightformer intensity={0.7} position={[6, 0, 2]} scale={4} color="#a7c8d8" />
        <Lightformer form="rect" intensity={1.2} position={[0, 2.5, 6]} scale={[7, 3.5, 1]} color="#ffffff" />
      </Environment>
      <ContactShadows
        position={[0, floorY, 0]}
        opacity={0.24}
        scale={8}
        blur={3}
        far={4}
        resolution={512}
        color="#090c0f"
      />
      {children}
      <OrbitControls
        target={target}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.9}
        minPolarAngle={0.55}
        maxPolarAngle={2.4}
      />
    </Canvas>
  );
}

export function BoltRing({ axis = "x", count = 8, radius = 0.4, at = 0, length = 0.28, nut = true, size = 0.024 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const first = Math.cos(angle) * radius;
        const second = Math.sin(angle) * radius;
        const position = axis === "x" ? [at, first, second] : [first, at, second];
        const rotation = axis === "x" ? [0, 0, Math.PI / 2] : [0, 0, 0];
        return (
          <group key={index} position={position} rotation={rotation}>
            <mesh>
              <cylinderGeometry args={[size, size, length, 8]} />
              <meshStandardMaterial color="#C7D1D8" metalness={0.9} roughness={0.24} />
            </mesh>
            {nut && [-1, 1].map((side) => (
              <mesh key={side} position={[0, side * (length / 2 + 0.026), 0]}>
                <cylinderGeometry args={[size * 1.9, size * 1.9, 0.052, 6]} />
                <meshStandardMaterial color="#D5DDE3" metalness={0.88} roughness={0.26} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}

export function PartLabel({ children }) {
  return (
    <Html center distanceFactor={10} zIndexRange={[30, 0]} className="pointer-events-none">
      <span className="pointer-events-none whitespace-nowrap rounded-lg border border-[#F5C518]/60 bg-[#15181C]/95 px-2.5 py-1 text-[11px] font-bold text-[#F5C518] shadow-xl">
        {children}
      </span>
    </Html>
  );
}

const PANEL_TEXT = {
  fa: {
    explode: "بازکردن قطعات",
    assemble: "مونتاژ",
    section: "نمای برش",
    explodeAmount: "میزان انفجار",
    selected: "قطعه",
    hint: "بکشید: چرخش · کلیک: انتخاب قطعه"
  },
  en: {
    explode: "Explode view",
    assemble: "Assemble",
    section: "Cutaway",
    explodeAmount: "Explosion",
    selected: "Part",
    hint: "Drag: rotate · Click: select part"
  },
  ar: {
    explode: "تفكيك الأجزاء",
    assemble: "تجميع",
    section: "مقطع",
    explodeAmount: "مقدار التفكيك",
    selected: "القطعة",
    hint: "اسحب: تدوير · انقر: تحديد جزء"
  },
  ru: {
    explode: "Разнести детали",
    assemble: "Собрать",
    section: "Разрез",
    explodeAmount: "Разнесение",
    selected: "Деталь",
    hint: "Перетаскивание: вращение · щелчок: выбор"
  }
};

export function ControlPanel({
  locale,
  explode,
  setExplode,
  section,
  setSection,
  drive,
  setDrive,
  driveLabel,
  driveText,
  selectedLabel
}) {
  const text = PANEL_TEXT[locale] || PANEL_TEXT.en;
  const expanded = explode > 0.5;
  const percent = Math.round(explode * 100);

  return (
    <div
      className="grid gap-2 border-t px-3 py-2.5 sm:px-4"
      style={{ borderColor: "var(--border)", background: "#121519" }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setExplode(expanded ? 0 : 1)}
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:border-[#F5C518] hover:text-[#F5C518]"
        >
          {expanded ? <RotateCcw size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
          {expanded ? text.assemble : text.explode}
        </button>
        {typeof setSection === "function" && (
          <button
            type="button"
            aria-pressed={section}
            onClick={() => setSection(!section)}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition"
            style={{
              borderColor: section ? "transparent" : "rgba(255,255,255,.2)",
              background: section ? "linear-gradient(135deg, #E0A81A, #B8850A)" : "transparent",
              color: section ? "#17191D" : "#FFFFFF"
            }}
          >
            <Layers size={13} aria-hidden="true" />
            {text.section}
          </button>
        )}
        <span className="ms-auto hidden max-w-[52%] truncate text-[10px] font-semibold text-white/55 sm:block">
          {selectedLabel ? text.selected + ": " + selectedLabel : text.hint}
        </span>
      </div>

      <label className="flex items-center gap-2 text-[10px] font-bold text-white/75">
        <span className="w-[74px] shrink-0 sm:w-24">{text.explodeAmount}</span>
        <input
          aria-label={text.explodeAmount}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={explode}
          onChange={(event) => setExplode(Number(event.target.value))}
          className="h-5 w-full accent-[#E0A81A]"
        />
        <span className="w-9 shrink-0 text-end tabular-nums">{percent}%</span>
      </label>

      {typeof drive === "number" && (
        <label className="flex items-center gap-2 text-[10px] font-bold text-white/75">
          <span className="w-[74px] shrink-0 sm:w-24">{driveLabel}</span>
          <input
            aria-label={driveLabel}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={drive}
            onChange={(event) => setDrive(Number(event.target.value))}
            className="h-5 w-full accent-[#E0A81A]"
          />
          <span className="w-9 shrink-0 text-end tabular-nums">{driveText || percent + "%"}</span>
        </label>
      )}
    </div>
  );
}
