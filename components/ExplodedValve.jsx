"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { DoubleSide, Vector2 } from "three";
import { useDictionary } from "./Providers";
import { BoltRing, ControlPanel, PartLabel, SECTION_PLANE, SceneStage } from "./ExplodedCommon";

const LABELS = {
  fa: ["بدنه", "فلنج انتهایی", "قفسه", "نشیمن‌گاه", "پلاگ", "ساقه", "کلاهک و پکینگ", "اکچویتور"],
  en: ["Body", "End flange", "Cage", "Seat", "Plug", "Stem", "Bonnet & packing", "Actuator"],
  ar: ["الجسم", "شفة التوصيل", "القفص", "المقعد", "السدادة", "الساق", "الغطاء والحشوة", "المشغل"],
  ru: ["Корпус", "Концевой фланец", "Клетка", "Седло", "Плунжер", "Шток", "Крышка и уплотнение", "Привод"]
};

const DRIVE_LABELS = {
  fa: "لیفت پلاگ",
  en: "Plug lift",
  ar: "رفع السدادة",
  ru: "Ход плунжера"
};

const PLUG_PROFILE = [
  [0.055, 0.44],
  [0.075, 0.38],
  [0.12, 0.31],
  [0.18, 0.23],
  [0.225, 0.14],
  [0.245, 0.055],
  [0.225, 0.005],
  [0.165, -0.035],
  [0.085, -0.06],
  [0.0, -0.062]
].map(([x, y]) => new Vector2(x, y));

const BONNET_PROFILE = [
  [0.36, 0.03],
  [0.33, 0.1],
  [0.27, 0.36],
  [0.235, 0.55],
  [0.215, 0.62]
].map(([x, y]) => new Vector2(x, y));

const ACTUATOR_DOME = [
  [0.46, 0],
  [0.47, 0.035],
  [0.455, 0.1],
  [0.42, 0.17],
  [0.36, 0.245],
  [0.27, 0.31],
  [0.15, 0.36],
  [0.06, 0.385]
].map(([x, y]) => new Vector2(x, y));

const PARTS = [
  { id: "body", labelIndex: 0, position: [0, 0, 0], offset: [0, 0, 0], labelY: 0.72 },
  { id: "flangeLeft", labelIndex: 1, position: [-1.42, -0.05, 0], offset: [-0.6, 0, 0], labelY: 0.5 },
  { id: "flangeRight", labelIndex: 1, position: [1.42, -0.05, 0], offset: [0.6, 0, 0], labelY: 0.5 },
  { id: "seat", labelIndex: 3, position: [0, -0.15, 0], offset: [0, -1.0, 0], labelY: 0.26 },
  { id: "cage", labelIndex: 2, position: [0, 0.05, 0], offset: [0, -0.55, 0], labelY: 0.5 },
  { id: "plug", labelIndex: 4, position: [0, 0.05, 0], offset: [0, -1.35, 0], labelY: 0.5 },
  { id: "stem", labelIndex: 5, position: [0, 0.55, 0], offset: [0, 0.3, 0], labelY: 1.05 },
  { id: "bonnet", labelIndex: 6, position: [0, 0.83, 0], offset: [0, 0.55, 0], labelY: 0.92 },
  { id: "actuator", labelIndex: 7, position: [0, 2.08, 0], offset: [0, 1.05, 0], labelY: 1.0 }
];

const PAINT = { color: "#52636D", metalness: 0.38, roughness: 0.52, envMapIntensity: 0.9 };
const PAINT_DARK = { color: "#3A454D", metalness: 0.48, roughness: 0.48, envMapIntensity: 0.85 };
const STEEL = { color: "#BEC9D1", metalness: 0.92, roughness: 0.24, envMapIntensity: 1 };
const CHROME = { color: "#DCE4EA", metalness: 1, roughness: 0.14, envMapIntensity: 1.1 };
const BRONZE = { color: "#907C55", metalness: 0.7, roughness: 0.4, envMapIntensity: 0.9 };
const GOLD = { color: "#D3A21A", metalness: 0.5, roughness: 0.33, envMapIntensity: 0.9 };
const DARK = { color: "#232A30", metalness: 0.55, roughness: 0.42, envMapIntensity: 0.8 };
const GASKET = { color: "#B7A170", metalness: 0.6, roughness: 0.4 };

function highlight(material, emphasized) {
  return emphasized
    ? { ...material, emissive: "#C99312", emissiveIntensity: 0.32 }
    : material;
}

function GlobePart({ item, index, explode, drive, section, labels, selected, onSelect }) {
  const group = useRef(null);
  const [hovered, setHovered] = useState(false);
  const emphasized = hovered || selected;

  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-7.5 * delta);
    const progress = Math.max(0, Math.min(1, (explode - index * 0.03) / (1 - index * 0.03)));
    const eased = progress * progress * (3 - 2 * progress);
    const lift = item.id === "plug" || item.id === "stem" ? drive * 0.18 : 0;
    const targetX = item.position[0] + item.offset[0] * eased;
    const targetY = item.position[1] + item.offset[1] * eased + lift;
    group.current.position.x += (targetX - group.current.position.x) * smoothing;
    group.current.position.y += (targetY - group.current.position.y) * smoothing;
    const targetScale = emphasized ? 1.035 : 1;
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
  });

  const clip = {
    clippingPlanes: section ? [SECTION_PLANE] : [],
    clipShadows: section
  };
  const paint = highlight(PAINT, emphasized);
  const paintDark = highlight(PAINT_DARK, emphasized);
  const steel = highlight(STEEL, emphasized);
  const chrome = highlight(CHROME, emphasized);
  const bronze = highlight(BRONZE, emphasized);
  const gold = highlight(GOLD, emphasized);
  const dark = highlight(DARK, emphasized);
  const inward = item.id === "flangeLeft" ? 1 : -1;

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
      {item.id === "body" && (
        <>
          <mesh scale={[0.82, 0.64, 0.6]}>
            <sphereGeometry args={[1, 48, 32]} />
            <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.8, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.27, 0.27, 1.0, 36]} />
                <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
              </mesh>
              <mesh position={[side * 0.48, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.295, 0.045, 10, 32]} />
                <meshStandardMaterial {...paintDark} {...clip} side={DoubleSide} />
              </mesh>
              <mesh position={[side * 0.66, 0.17, 0]} rotation={[0, 0, side * 0.5]}>
                <boxGeometry args={[0.24, 0.06, 0.2]} />
                <meshStandardMaterial {...paintDark} {...clip} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.37, 0.43, 0.3, 40]} />
            <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.73, 0]}>
            <cylinderGeometry args={[0.43, 0.43, 0.1, 40]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <cylinderGeometry args={[0.24, 0.3, 0.16, 32]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.3, 1, 1]}>
            <torusGeometry args={[0.58, 0.028, 8, 48]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
        </>
      )}

      {item.id.indexOf("flange") === 0 && (
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.18, 40]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <mesh position={[-inward * 0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.37, 0.37, 0.04, 40]} />
            <meshStandardMaterial {...steel} {...clip} />
          </mesh>
          <mesh position={[-inward * 0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.31, 0.028, 10, 40]} />
            <meshStandardMaterial {...GASKET} {...clip} />
          </mesh>
          <mesh position={[inward * 0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.31, 0.16, 36]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <BoltRing axis="x" count={8} radius={0.41} at={0} length={0.22} />
        </group>
      )}

      {item.id === "seat" && (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.065, 16, 44]} />
            <meshStandardMaterial {...bronze} {...clip} />
          </mesh>
          <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.022, 10, 40]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[0, -0.052, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.31, 0.018, 8, 40]} />
            <meshStandardMaterial {...dark} />
          </mesh>
        </group>
      )}

      {item.id === "cage" && (
        <group>
          {[-0.22, 0.31].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.265, 0.035, 10, 44]} />
              <meshStandardMaterial {...steel} />
            </mesh>
          ))}
          {Array.from({ length: 12 }).map((_, bar) => {
            const angle = (bar / 12) * Math.PI * 2;
            return (
              <mesh
                key={bar}
                position={[Math.cos(angle) * 0.255, 0.045, Math.sin(angle) * 0.255]}
                rotation={[0, -angle, 0]}
              >
                <boxGeometry args={[0.045, 0.46, 0.035]} />
                <meshStandardMaterial {...steel} />
              </mesh>
            );
          })}
          <mesh position={[0, -0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.33, 0.022, 8, 44]} />
            <meshStandardMaterial {...bronze} />
          </mesh>
        </group>
      )}

      {item.id === "plug" && (
        <group>
          <mesh>
            <latheGeometry args={[PLUG_PROFILE, 40]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0, 0.43, 0]}>
            <cylinderGeometry args={[0.055, 0.065, 0.14, 20]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[0, -0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.022, 10, 36]} />
            <meshStandardMaterial color="#D9C47D" metalness={0.55} roughness={0.32} />
          </mesh>
        </group>
      )}

      {item.id === "stem" && (
        <group>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.052, 0.06, 1.8, 24]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.16, 20]} />
            <meshStandardMaterial {...bronze} />
          </mesh>
          {[0.84, 0.87, 0.9].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.075, 0.016, 8, 24]} />
              <meshStandardMaterial color="#C9B78C" metalness={0.3} roughness={0.55} />
            </mesh>
          ))}
          <mesh position={[0, 1.02, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 20]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        </group>
      )}

      {item.id === "bonnet" && (
        <group>
          <mesh>
            <cylinderGeometry args={[0.42, 0.42, 0.1, 40]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <mesh position={[0, -0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.02, 8, 40]} />
            <meshStandardMaterial {...GASKET} />
          </mesh>
          <mesh>
            <latheGeometry args={[BONNET_PROFILE, 40]} />
            <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.23, 0.2, 0.09, 32]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.17, 0.6, 0]}>
              <mesh>
                <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
                <meshStandardMaterial color="#C7D1D8" metalness={0.9} roughness={0.24} />
              </mesh>
              <mesh position={[0, 0.09, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.04, 6]} />
                <meshStandardMaterial color="#D5DDE3" metalness={0.88} roughness={0.26} />
              </mesh>
            </group>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[0, 0.93, side * 0.21]}>
              <boxGeometry args={[0.14, 0.62, 0.085]} />
              <meshStandardMaterial {...paintDark} />
            </mesh>
          ))}
          <mesh position={[0, 1.24, 0]}>
            <boxGeometry args={[0.52, 0.1, 0.38]} />
            <meshStandardMaterial {...paintDark} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.07, 24]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <BoltRing axis="y" count={8} radius={0.34} at={0.01} length={0.2} />
        </group>
      )}

      {item.id === "actuator" && (
        <group>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.06, 40]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.16, 20]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.34, 0.4, 0.18, 40]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[0, 0.245, 0]}>
            <cylinderGeometry args={[0.46, 0.4, 0.12, 40]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.46, 0.032, 10, 48]} />
            <meshStandardMaterial color="#151A1E" metalness={0.6} roughness={0.38} />
          </mesh>
          <BoltRing axis="y" count={12} radius={0.42} at={0.3} length={0.07} size={0.019} />
          <mesh position={[0, 0.3, 0]}>
            <latheGeometry args={[ACTUATOR_DOME, 40]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh position={[0, 0.71, 0]}>
            <cylinderGeometry args={[0.09, 0.11, 0.14, 24]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.27, 0.028, 10, 40]} />
            <meshStandardMaterial color="#1C2227" metalness={0.5} roughness={0.42} />
          </mesh>
          {[0, 1, 2].map((spoke) => (
            <mesh key={spoke} position={[Math.cos((spoke / 3) * Math.PI * 2) * 0.135, 0.8, Math.sin((spoke / 3) * Math.PI * 2) * 0.135]} rotation={[0, -(spoke / 3) * Math.PI * 2, 0]}>
              <boxGeometry args={[0.27, 0.025, 0.03]} />
              <meshStandardMaterial color="#1C2227" metalness={0.5} roughness={0.42} />
            </mesh>
          ))}
          <mesh position={[0, 0.82, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 20]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh position={[0.44, 0.5, 0.02]} rotation={[0, 0, -0.06]}>
            <boxGeometry args={[0.035, 0.34, 0.14]} />
            <meshStandardMaterial color="#E8EDF1" metalness={0.2} roughness={0.5} />
          </mesh>
          {[0, 1, 2, 3].map((tick) => (
            <mesh key={tick} position={[0.462, 0.38 + tick * 0.075, 0.02]}>
              <boxGeometry args={[0.012, 0.012, tick % 2 ? 0.05 : 0.09]} />
              <meshStandardMaterial color="#252C32" metalness={0.3} roughness={0.55} />
            </mesh>
          ))}
        </group>
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
  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-7 * delta);
    const seatRaw = Math.max(0, Math.min(1, (explode - 0.09) / 0.91));
    const seatEased = seatRaw * seatRaw * (3 - 2 * seatRaw);
    const actuatorRaw = Math.max(0, Math.min(1, (explode - 0.24) / 0.76));
    const actuatorEased = actuatorRaw * actuatorRaw * (3 - 2 * actuatorRaw);
    const height = 3.365 + 1.05 * actuatorEased + seatEased;
    const center = 1.2175 + 0.525 * actuatorEased - 0.5 * seatEased;
    const targetScale = Math.min(1.06, 3.9 / height);
    const targetY = 0.45 - targetScale * center;
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
    group.current.position.y += (targetY - group.current.position.y) * smoothing;
  });
  return (
    <group ref={group} position={[0, -0.725, 0]} scale={1.036}>
      {children}
    </group>
  );
}

function GlobeModel({ explode, drive, section, labels, selectedId, onSelect }) {
  return (
    <>
      {PARTS.map((part, index) => (
        <GlobePart
          key={part.id}
          item={part}
          index={index}
          explode={explode}
          drive={drive}
          section={section}
          labels={labels}
          selected={selectedId === part.id}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function ExplodedValve() {
  const { locale } = useDictionary();
  const labels = LABELS[locale] || LABELS.en;
  const [explode, setExplode] = useState(0.4);
  const [section, setSection] = useState(true);
  const [drive, setDrive] = useState(0.35);
  const [selectedId, setSelectedId] = useState(null);
  const selected = PARTS.find((part) => part.id === selectedId);

  return (
    <div>
      <div className="relative h-[440px] sm:h-[520px]">
        <SceneStage
          camera={[4.0, 2.4, 5.6]}
          fov={38}
          target={[0, 0.45, 0]}
          floorY={-1.85}
          onPointerMissed={() => setSelectedId(null)}
        >
          <FramedModel explode={explode}>
            <GlobeModel
              explode={explode}
              drive={drive}
              section={section}
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
        section={section}
        setSection={setSection}
        drive={drive}
        setDrive={setDrive}
        driveLabel={DRIVE_LABELS[locale] || DRIVE_LABELS.en}
        selectedLabel={selected ? labels[selected.labelIndex] : null}
      />
    </div>
  );
}
