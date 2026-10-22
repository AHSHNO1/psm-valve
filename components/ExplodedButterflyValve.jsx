"use client";

import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { DoubleSide, Vector2 } from "three";
import { useDictionary } from "./Providers";
import { BoltRing, ControlPanel, PartLabel, SECTION_PLANE, SceneStage } from "./ExplodedCommon";

const LABELS = {
  fa: ["بدنه ویفری", "دیسک", "لاینر / نشیمن‌گاه", "ساقه", "یاتاقان و گلند", "اکچویتور"],
  en: ["Wafer body", "Disc", "Liner / seat", "Stem", "Bearing & gland", "Actuator"],
  ar: ["جسم ويفر", "القرص", "البطانة / المقعد", "الساق", "المحمل والحشوة", "المشغل"],
  ru: ["Корпус wafer", "Диск", "Вкладыш / седло", "Шток", "Подшипник и сальник", "Привод"]
};

const DRIVE_LABELS = {
  fa: "زاویه دیسک",
  en: "Disc angle",
  ar: "زاوية القرص",
  ru: "Угол диска"
};

const BODY_PROFILE = [
  [0.77, -0.18],
  [0.9, -0.18],
  [0.95, -0.13],
  [0.95, 0.13],
  [0.9, 0.18],
  [0.77, 0.18],
  [0.77, -0.18]
].map(([x, y]) => new Vector2(x, y));

const LINER_PROFILE = [
  [0.7, -0.19],
  [0.78, -0.19],
  [0.8, -0.15],
  [0.8, 0.15],
  [0.78, 0.19],
  [0.7, 0.19],
  [0.7, -0.19]
].map(([x, y]) => new Vector2(x, y));

const PARTS = [
  { id: "body", labelIndex: 0, position: [0, 0, 0], offset: [0, 0, 0], labelY: 1.15 },
  { id: "disc", labelIndex: 1, position: [0, 0, 0], offset: [1.15, 0.15, 0], labelY: 1.0 },
  { id: "seat", labelIndex: 2, position: [0, 0, 0], offset: [-1.0, -0.15, 0], labelY: 0.98 },
  { id: "stem", labelIndex: 3, position: [0, 0.7, 0], offset: [0, 0.9, 0], labelY: 0.72 },
  { id: "bearing", labelIndex: 4, position: [0, 1.08, 0], offset: [0, 1.1, 0], labelY: 0.24 },
  { id: "actuator", labelIndex: 5, position: [0, 1.42, 0], offset: [0, 1.5, 0], labelY: 0.9 }
];

const PAINT = { color: "#71838E", metalness: 0.38, roughness: 0.52, envMapIntensity: 1.05 };
const PAINT_DARK = { color: "#56646E", metalness: 0.48, roughness: 0.48, envMapIntensity: 1 };
const STEEL = { color: "#C6D0D8", metalness: 0.93, roughness: 0.22, envMapIntensity: 1.1 };
const CHROME = { color: "#DFE7EC", metalness: 1, roughness: 0.13, envMapIntensity: 1.2 };
const GOLD = { color: "#D3A21A", metalness: 0.5, roughness: 0.33, envMapIntensity: 0.9 };
const DARK = { color: "#37424A", metalness: 0.55, roughness: 0.42, envMapIntensity: 0.9 };
const RUBBER = { color: "#252E33", metalness: 0.05, roughness: 0.84 };
const PTFE = { color: "#E7E1D0", metalness: 0.1, roughness: 0.5 };

function highlight(material, emphasized) {
  return emphasized
    ? { ...material, emissive: "#C99312", emissiveIntensity: 0.32 }
    : material;
}

function ButterflyPart({ item, index, explode, drive, section, labels, selected, onSelect }) {
  const group = useRef(null);
  const [hovered, setHovered] = useState(false);
  const emphasized = hovered || selected;

  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-8.5 * delta);
    const stage = Math.max(0, Math.min(1, (explode - index * 0.035) / (1 - index * 0.035)));
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

  const clip = {
    clippingPlanes: section ? [SECTION_PLANE] : [],
    clipShadows: section
  };
  const paint = highlight(PAINT, emphasized);
  const paintDark = highlight(PAINT_DARK, emphasized);
  const steel = highlight(STEEL, emphasized);
  const chrome = highlight(CHROME, emphasized);
  const gold = highlight(GOLD, emphasized);
  const dark = highlight(DARK, emphasized);
  const rubber = highlight(RUBBER, emphasized);

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
          <group rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <latheGeometry args={[BODY_PROFILE, 56]} />
              <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
            </mesh>
          </group>
          <BoltRing axis="x" count={8} radius={0.86} at={0} length={0.4} size={0.026} />
          <mesh position={[0, 0.94, 0]}>
            <cylinderGeometry args={[0.24, 0.28, 0.24, 32]} />
            <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 1.08, 0]}>
            <cylinderGeometry args={[0.33, 0.33, 0.09, 36]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <BoltRing axis="y" count={4} radius={0.24} at={1.08} length={0.1} size={0.017} />
          <mesh position={[0, -0.94, 0]}>
            <cylinderGeometry args={[0.19, 0.23, 0.16, 24]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <mesh position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.025, 8, 36]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
        </>
      )}

      {item.id === "disc" && (
        <group rotation={[0, drive * Math.PI / 2, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.72, 0.72, 0.085, 56]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.72, 0.032, 12, 56]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.046, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.55, 0.011, 8, 48]} />
                <meshStandardMaterial color="#6E7A82" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[side * 0.046, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.34, 0.008, 8, 44]} />
                <meshStandardMaterial color="#7C8890" metalness={0.75} roughness={0.34} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.73, 0]}>
            <cylinderGeometry args={[0.135, 0.135, 0.18, 24]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[0, -0.73, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.14, 20]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.075, 0.075, 1.34, 24]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 0.32, 28]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </group>
      )}

      {item.id === "seat" && (
        <group>
          <group rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <latheGeometry args={[LINER_PROFILE, 56]} />
              <meshStandardMaterial {...rubber} />
            </mesh>
          </group>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.191, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.705, 0.028, 10, 48]} />
                <meshStandardMaterial {...PTFE} />
              </mesh>
              <mesh position={[side * 0.187, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.745, 0.02, 8, 48]} />
                <meshStandardMaterial color="#12181B" metalness={0.1} roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {item.id === "stem" && (
        <group>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.075, 0.085, 2.35, 28]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.055, 0.44, 0.03]} />
            <meshStandardMaterial color="#8A98A2" metalness={0.9} roughness={0.25} />
          </mesh>
          {[0.27, 0.31, 0.35].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.1, 0.02, 8, 24]} />
              <meshStandardMaterial color="#C9B78C" metalness={0.3} roughness={0.55} />
            </mesh>
          ))}
          <mesh position={[0, -0.88, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </group>
      )}

      {item.id === "bearing" && (
        <group>
          <mesh>
            <cylinderGeometry args={[0.22, 0.25, 0.2, 32]} />
            <meshStandardMaterial {...paintDark} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.17, 0.19, 0.06, 28]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.115, 0.018, 8, 26]} />
            <meshStandardMaterial color="#C9B78C" metalness={0.3} roughness={0.55} />
          </mesh>
          <BoltRing axis="y" count={4} radius={0.16} at={0.02} length={0.2} size={0.014} />
        </group>
      )}

      {item.id === "actuator" && (
        <group>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.3, 0.34, 0.1, 32]} />
            <meshStandardMaterial {...paintDark} />
          </mesh>
          <RoundedBox args={[0.86, 0.46, 0.58]} radius={0.055} smoothness={4} position={[0, 0.31, 0]}>
            <meshStandardMaterial {...dark} />
          </RoundedBox>
          <RoundedBox args={[0.72, 0.1, 0.48]} radius={0.04} smoothness={3} position={[0, 0.55, 0]}>
            <meshStandardMaterial {...gold} />
          </RoundedBox>
          <mesh position={[0.34, 0.42, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 20]} />
            <meshStandardMaterial color="#E8EDF1" metalness={0.15} roughness={0.5} />
          </mesh>
          <mesh position={[0.34, 0.47, 0.3]}>
            <boxGeometry args={[0.012, 0.11, 0.03]} />
            <meshStandardMaterial color="#B3261E" metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.14, 20]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0, 0.74, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.03, 10, 40]} />
            <meshStandardMaterial color="#1C2227" metalness={0.5} roughness={0.42} />
          </mesh>
          {[0, 1, 2].map((spoke) => (
            <mesh
              key={spoke}
              position={[Math.cos((spoke / 3) * Math.PI * 2) * 0.15, 0.74, Math.sin((spoke / 3) * Math.PI * 2) * 0.15]}
              rotation={[0, -(spoke / 3) * Math.PI * 2, 0]}
            >
              <boxGeometry args={[0.3, 0.026, 0.034]} />
              <meshStandardMaterial color="#1C2227" metalness={0.5} roughness={0.42} />
            </mesh>
          ))}
          <mesh position={[0, 0.76, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.05, 20]} />
            <meshStandardMaterial {...gold} />
          </mesh>
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
    const raw = Math.max(0, Math.min(1, (explode - 0.175) / 0.825));
    const eased = raw * raw * (3 - 2 * raw);
    const targetScale = 4.2 / (3.23 + 1.5 * eased);
    const targetY = 0.55 - targetScale * (0.595 + 0.75 * eased);
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
    group.current.position.y += (targetY - group.current.position.y) * smoothing;
  });
  return (
    <group ref={group} position={[0, -0.224, 0]} scale={1.3}>
      {children}
    </group>
  );
}

function ButterflyModel({ explode, drive, section, labels, selectedId, onSelect }) {
  return (
    <>
      {PARTS.map((part, index) => (
        <ButterflyPart
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

export default function ExplodedButterflyValve() {
  const { locale } = useDictionary();
  const labels = LABELS[locale] || LABELS.en;
  const [explode, setExplode] = useState(0.35);
  const [section, setSection] = useState(false);
  const [drive, setDrive] = useState(0.55);
  const [selectedId, setSelectedId] = useState(null);
  const selected = PARTS.find((part) => part.id === selectedId);

  return (
    <div>
      <div className="relative h-[440px] sm:h-[520px]">
        <SceneStage
          camera={[4.5, 3.0, 6.7]}
          fov={40}
          target={[0, 0.55, 0]}
          floorY={-1.6}
          brightness={1.3}
          onPointerMissed={() => setSelectedId(null)}
        >
          <FramedModel explode={explode}>
            <ButterflyModel
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
        driveText={Math.round(drive * 90) + "°"}
        selectedLabel={selected ? labels[selected.labelIndex] : null}
      />
    </div>
  );
}
