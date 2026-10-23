"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { DoubleSide } from "three";
import { useDictionary } from "./Providers";
import { BoltRing, ControlPanel, PartLabel, SceneStage, useEntranceExplode } from "./ExplodedCommon";

const LABELS = {
  fa: ["پایه", "محور اول", "شانه", "بازوی اصلی", "آرنج", "مچ", "تورچ HVOF"],
  en: ["Base", "Axis 1", "Shoulder", "Upper arm", "Elbow", "Wrist", "HVOF torch"],
  ar: ["القاعدة", "المحور الأول", "الكتف", "الذراع العلوي", "المرفق", "المعصم", "شعلة HVOF"],
  ru: ["Основание", "Ось 1", "Плечо", "Верхняя рука", "Локоть", "Запястье", "Горелка HVOF"]
};

const DRIVE_LABELS = {
  fa: "شعله HVOF",
  en: "HVOF plume",
  ar: "لهب HVOF",
  ru: "Пламя HVOF"
};

const PARTS = [
  { id: "base", labelIndex: 0, position: [0, -0.58, 0], offset: [0, 0, 0], labelY: 0.72 },
  { id: "axis", labelIndex: 1, position: [0, -0.2, 0], offset: [0, 0.46, 0], labelY: 0.52 },
  { id: "shoulder", labelIndex: 2, position: [0.12, 0.25, 0], offset: [-0.18, 0.78, 0], labelY: 0.7 },
  { id: "upperArm", labelIndex: 3, position: [0.55, 0.48, 0], offset: [0.34, 0.74, 0], labelY: 0.55 },
  { id: "elbow", labelIndex: 4, position: [1.04, 0.68, 0], offset: [0.94, 0.34, 0], labelY: 0.5 },
  { id: "wrist", labelIndex: 5, position: [1.48, 0.52, 0], offset: [1.04, -0.36, 0], labelY: 0.5 },
  { id: "torch", labelIndex: 6, position: [1.82, 0.12, 0], offset: [1.16, -0.76, 0], labelY: 0.55 }
];

const ORANGE = { color: "#E4A900", metalness: 0.5, roughness: 0.34, envMapIntensity: 0.95 };
const ORANGE_LIGHT = { color: "#F3BF28", metalness: 0.45, roughness: 0.4, envMapIntensity: 0.9 };
const GRAPHITE = { color: "#343A40", metalness: 0.55, roughness: 0.42, envMapIntensity: 0.85 };
const GRAPHITE_DARK = { color: "#23282D", metalness: 0.6, roughness: 0.4, envMapIntensity: 0.8 };
const STEEL = { color: "#C2CCD4", metalness: 0.92, roughness: 0.24, envMapIntensity: 1.05 };
const CHROME = { color: "#DEE6EC", metalness: 1, roughness: 0.14, envMapIntensity: 1.15 };
const COPPER = { color: "#B7752F", metalness: 0.85, roughness: 0.3, envMapIntensity: 1 };
const GOLD = { color: "#D1A52D", metalness: 0.76, roughness: 0.28, envMapIntensity: 0.95 };
const HOSE = { color: "#1D2328", metalness: 0.1, roughness: 0.82 };

function highlight(material, emphasized) {
  return emphasized
    ? { ...material, emissive: "#C99312", emissiveIntensity: 0.32 }
    : material;
}

function RobotPart({ item, index, explode, plume, labels, selected, onSelect }) {
  const group = useRef(null);
  const [hovered, setHovered] = useState(false);
  const emphasized = hovered || selected;

  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-7.5 * delta);
    const stage = Math.max(0, Math.min(1, (explode - index * 0.04) / (1 - index * 0.04)));
    const eased = stage * stage * (3 - 2 * stage);
    const targetX = item.position[0] + item.offset[0] * eased;
    const targetY = item.position[1] + item.offset[1] * eased;
    group.current.position.x += (targetX - group.current.position.x) * smoothing;
    group.current.position.y += (targetY - group.current.position.y) * smoothing;
    const targetScale = emphasized ? 1.035 : 1;
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
  });

  const orange = highlight(ORANGE, emphasized);
  const orangeLight = highlight(ORANGE_LIGHT, emphasized);
  const graphite = highlight(GRAPHITE, emphasized);
  const graphiteDark = highlight(GRAPHITE_DARK, emphasized);
  const steel = highlight(STEEL, emphasized);
  const chrome = highlight(CHROME, emphasized);
  const copper = highlight(COPPER, emphasized);
  const gold = highlight(GOLD, emphasized);
  const hose = highlight(HOSE, emphasized);

  return (
    <group
      ref={group}
      position={item.position}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(selected ? null : item.id);
      }}
    >
      {item.id === "base" && (
        <>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.72, 0.78, 0.08, 40]} />
            <meshStandardMaterial {...graphiteDark} />
          </mesh>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.62, 0.7, 0.34, 40]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
          <mesh position={[0, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.48, 0.12, 40]} />
            <meshStandardMaterial {...graphiteDark} />
          </mesh>
          <mesh position={[0, 0.405, 0]}>
            <cylinderGeometry args={[0.27, 0.27, 0.02, 32]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <BoltRing axis="y" count={8} radius={0.54} at={0.32} length={0.08} size={0.028} nut={false} />
          <mesh position={[0.62, 0.1, 0.18]}>
            <boxGeometry args={[0.16, 0.2, 0.24]} />
            <meshStandardMaterial {...graphiteDark} />
          </mesh>
          <mesh position={[0.72, 0.1, 0.18]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.1, 14]} />
            <meshStandardMaterial {...copper} />
          </mesh>
        </>
      )}

      {item.id === "axis" && (
        <>
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.38, 0.5, 36]} />
            <meshStandardMaterial {...orange} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <torusGeometry args={[0.31, 0.065, 12, 36]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <torusGeometry args={[0.34, 0.045, 10, 36]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
          <BoltRing axis="y" count={6} radius={0.285} at={0.3} length={0.06} size={0.017} nut={false} />
        </>
      )}

      {item.id === "shoulder" && (
        <>
          <mesh castShadow scale={[0.55, 0.58, 0.48]}>
            <sphereGeometry args={[0.58, 32, 24]} />
            <meshStandardMaterial {...orange} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.68, 28]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
          <mesh position={[0, 0, 0.36]}>
            <torusGeometry args={[0.25, 0.045, 12, 32]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh position={[0, 0, -0.36]}>
            <torusGeometry args={[0.23, 0.04, 10, 32]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </>
      )}

      {item.id === "upperArm" && (
        <>
          <mesh rotation={[0, 0, -0.22]} castShadow>
            <boxGeometry args={[1.12, 0.34, 0.42]} />
            <meshStandardMaterial {...orange} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, -0.22]}>
            <boxGeometry args={[0.82, 0.08, 0.44]} />
            <meshStandardMaterial {...orangeLight} />
          </mesh>
          <mesh position={[-0.05, 0.11, 0.235]} rotation={[0, 0, Math.PI / 2 - 0.22]}>
            <cylinderGeometry args={[0.036, 0.036, 0.84, 12]} />
            <meshStandardMaterial {...hose} />
          </mesh>
          <mesh position={[0.36, -0.09, 0]} rotation={[0, 0, -0.22]}>
            <boxGeometry args={[0.26, 0.16, 0.44]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
        </>
      )}

      {item.id === "elbow" && (
        <>
          <mesh castShadow>
            <sphereGeometry args={[0.31, 32, 24]} />
            <meshStandardMaterial {...orange} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.57, 28]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
          <mesh position={[0, 0, 0.29]}>
            <torusGeometry args={[0.18, 0.04, 10, 28]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh position={[0, 0, -0.29]}>
            <torusGeometry args={[0.17, 0.038, 10, 28]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </>
      )}

      {item.id === "wrist" && (
        <>
          <mesh rotation={[0, 0, 0.3]} castShadow>
            <boxGeometry args={[0.76, 0.27, 0.31]} />
            <meshStandardMaterial {...orange} />
          </mesh>
          <mesh position={[0.31, -0.08, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.28, 24]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
          <mesh position={[0.31, 0.09, 0]}>
            <torusGeometry args={[0.15, 0.03, 10, 26]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[-0.28, 0.12, 0]} rotation={[0, 0, Math.PI / 2 - 0.3]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 10]} />
            <meshStandardMaterial {...hose} />
          </mesh>
        </>
      )}

      {item.id === "torch" && (
        <>
          <mesh rotation={[0, 0, -0.18]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.72, 28]} />
            <meshStandardMaterial {...graphite} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[0, 0, -0.18]}>
            <cylinderGeometry args={[0.12, 0.15, 0.16, 24]} />
            <meshStandardMaterial {...copper} />
          </mesh>
          <mesh position={[0.04, -0.39, 0]} rotation={[0, 0, -0.18]}>
            <coneGeometry args={[0.12, 0.34, 24]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0.04, -0.55, 0]} rotation={[0, 0, -0.18]}>
            <cylinderGeometry args={[0.075, 0.09, 0.06, 20]} />
            <meshStandardMaterial {...copper} />
          </mesh>
          <mesh position={[0.2, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.055, 0.055, 0.38, 14]} />
            <meshStandardMaterial {...hose} />
          </mesh>
          {plume > 0.02 && (
            <group position={[0.04, -0.58, 0]} rotation={[0, 0, -0.18]}>
              <mesh position={[0, -0.24, 0]} scale={[0.42 + 0.28 * plume, 0.35 + 0.65 * plume, 0.42 + 0.28 * plume]}>
                <coneGeometry args={[0.15, 0.72, 22, 1, true]} />
                <meshBasicMaterial
                  color="#F59E0B"
                  transparent
                  opacity={0.28 + 0.26 * plume}
                  depthWrite={false}
                  side={DoubleSide}
                />
              </mesh>
              <mesh position={[0, -0.18, 0]} scale={[0.3 + 0.16 * plume, 0.25 + 0.45 * plume, 0.3 + 0.16 * plume]}>
                <coneGeometry args={[0.1, 0.62, 18, 1, true]} />
                <meshBasicMaterial
                  color="#FFF0B8"
                  transparent
                  opacity={0.45 + 0.3 * plume}
                  depthWrite={false}
                  side={DoubleSide}
                />
              </mesh>
              <pointLight position={[0, -0.25, 0]} intensity={plume * 2.6} distance={2.2} color="#FFB137" />
            </group>
          )}
        </>
      )}

      {emphasized && (
        <group position={[0, item.labelY === undefined ? 0.4 : item.labelY, 0]}>
          <PartLabel>{labels[item.labelIndex === undefined ? index : item.labelIndex]}</PartLabel>
        </group>
      )}
    </group>
  );
}

function FramedModel({ explode, children }) {
  const group = useRef(null);
  const startX = 0.32 - 1.5 * 0.72;
  const startY = 0.1 - 1.5 * 0.06;

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-7 * delta);
    const eased = explode * explode * (3 - 2 * explode);
    const targetScale = 1.5 - 0.32 * eased;
    const centerX = 0.72 + 0.56 * eased;
    const targetX = 0.32 - targetScale * centerX;
    const targetY = 0.1 - targetScale * 0.06;
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
    group.current.position.x += (targetX - group.current.position.x) * smoothing;
    group.current.position.y += (targetY - group.current.position.y) * smoothing;
  });

  return (
    <group ref={group} position={[startX, startY, 0]} scale={1.5}>
      {children}
    </group>
  );
}

function HvofRobot({ explode, plume, labels, selectedId, onSelect }) {
  return (
    <>
      {PARTS.map((part, index) => (
        <RobotPart
          key={part.id}
          item={part}
          index={index}
          explode={explode}
          plume={plume}
          labels={labels}
          selected={selectedId === part.id}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function ExplodedHvofRobot() {
  const { locale } = useDictionary();
  const labels = LABELS[locale] || LABELS.en;
  const [explode, setExplode] = useState(0);
  const stageRef = useEntranceExplode(0.35, setExplode);
  const [plume, setPlume] = useState(0.55);
  const [selectedId, setSelectedId] = useState(null);
  const selected = PARTS.find((part) => part.id === selectedId);

  return (
    <div>
      <div ref={stageRef} className="relative h-[440px] sm:h-[520px]">
        <SceneStage
          camera={[3.8, 2.3, 6.1]}
          fov={37}
          target={[0.32, 0.1, 0]}
          floorY={-1.4}
          onPointerMissed={() => setSelectedId(null)}
        >
          <FramedModel explode={explode}>
            <HvofRobot
              explode={explode}
              plume={plume}
              labels={labels}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </FramedModel>
        </SceneStage>
      </div>
      <ControlPanel
        locale={locale}
        explode={explode}
        setExplode={setExplode}
        drive={plume}
        setDrive={setPlume}
        driveLabel={DRIVE_LABELS[locale] || DRIVE_LABELS.en}
        driveText={Math.round(plume * 100) + "%"}
        selectedLabel={selected ? labels[selected.labelIndex] : null}
      />
    </div>
  );
}
