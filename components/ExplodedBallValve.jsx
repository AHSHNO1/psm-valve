"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { DoubleSide, Vector2 } from "three";
import { useDictionary } from "./Providers";
import { BoltRing, ControlPanel, PartLabel, SECTION_PLANE, SceneStage } from "./ExplodedCommon";

const LABELS = {
  fa: ["بدنه", "توپ", "نشیمن‌گاه", "ساقه", "فلنج", "اهرم"],
  en: ["Body", "Ball", "Seat", "Stem", "End flange", "Lever"],
  ar: ["الجسم", "الكرة", "المقعد", "الساق", "شفة التوصيل", "الذراع"],
  ru: ["Корпус", "Шар", "Седло", "Шток", "Фланец", "Рычаг"]
};

const DRIVE_LABELS = {
  fa: "زاویه توپ",
  en: "Ball angle",
  ar: "زاوية الكرة",
  ru: "Угол шара"
};

const SEAT_PROFILE = [
  [0.26, -0.06],
  [0.34, -0.06],
  [0.38, -0.03],
  [0.38, 0.045],
  [0.34, 0.075],
  [0.26, 0.075],
  [0.26, -0.06]
].map(([x, y]) => new Vector2(x, y));

const BALL_RADIUS = 0.55;
const PORT_RADIUS = 0.24;
const PORT_ARC = Math.acos(PORT_RADIUS / BALL_RADIUS);
const PORT_HALF = Math.sqrt(BALL_RADIUS ** 2 - PORT_RADIUS ** 2);
const BALL_PROFILE = Array.from({ length: 41 }, (_, step) => {
  const angle = -PORT_ARC + (step / 40) * PORT_ARC * 2;
  return new Vector2(Math.cos(angle) * BALL_RADIUS, Math.sin(angle) * BALL_RADIUS);
});

const PARTS = [
  { id: "body", labelIndex: 0, position: [0, 0, 0], offset: [0, 0, 0], labelY: 0.78 },
  { id: "seatLeft", labelIndex: 2, position: [-0.44, 0, 0], offset: [-0.7, -0.45, 0], labelY: 0.28 },
  { id: "seatRight", labelIndex: 2, position: [0.44, 0, 0], offset: [0.7, -0.45, 0], labelY: 0.28 },
  { id: "ball", labelIndex: 1, position: [0, 0, 0], offset: [0, 0.95, 0], labelY: 0.7 },
  { id: "stem", labelIndex: 3, position: [0, 0.55, 0], offset: [0, 1.4, 0], labelY: 0.42 },
  { id: "lever", labelIndex: 5, position: [0, 1.06, 0], offset: [0, 1.78, 0], labelY: 0.24 },
  { id: "flangeLeft", labelIndex: 4, position: [-1.42, -0.05, 0], offset: [-0.7, 0, 0], labelY: 0.52 },
  { id: "flangeRight", labelIndex: 4, position: [1.42, -0.05, 0], offset: [0.7, 0, 0], labelY: 0.52 }
];

const PAINT = { color: "#71838E", metalness: 0.38, roughness: 0.52, envMapIntensity: 1.05 };
const PAINT_DARK = { color: "#56646E", metalness: 0.48, roughness: 0.48, envMapIntensity: 1 };
const STEEL = { color: "#C6D0D8", metalness: 0.92, roughness: 0.22, envMapIntensity: 1.1 };
const CHROME = { color: "#E0E7EC", metalness: 1, roughness: 0.12, envMapIntensity: 1.2 };
const BRONZE = { color: "#9A8560", metalness: 0.7, roughness: 0.4, envMapIntensity: 0.95 };
const DARK = { color: "#37424A", metalness: 0.55, roughness: 0.42, envMapIntensity: 0.9 };
const GASKET = { color: "#B7A170", metalness: 0.6, roughness: 0.4 };
const PTFE = { color: "#E9E4D4", metalness: 0.15, roughness: 0.5 };

function highlight(material, emphasized) {
  return emphasized
    ? { ...material, emissive: "#C99312", emissiveIntensity: 0.32 }
    : material;
}

function BallPart({ item, index, explode, drive, section, labels, selected, onSelect }) {
  const group = useRef(null);
  const [hovered, setHovered] = useState(false);
  const emphasized = hovered || selected;

  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const smoothing = 1 - Math.exp(-8 * delta);
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

  const clip = {
    clippingPlanes: section ? [SECTION_PLANE] : [],
    clipShadows: section
  };
  const paint = highlight(PAINT, emphasized);
  const paintDark = highlight(PAINT_DARK, emphasized);
  const steel = highlight(STEEL, emphasized);
  const chrome = highlight(CHROME, emphasized);
  const bronze = highlight(BRONZE, emphasized);
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
          <mesh scale={[0.95, 0.82, 0.78]}>
            <sphereGeometry args={[0.86, 48, 32]} />
            <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.85, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.27, 0.27, 0.95, 36]} />
                <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
              </mesh>
              <mesh position={[side * 0.62, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.3, 0.045, 10, 36]} />
                <meshStandardMaterial {...paintDark} {...clip} side={DoubleSide} />
              </mesh>
              <mesh position={[side * 0.52, 0.2, 0]} rotation={[0, 0, side * 0.55]}>
                <boxGeometry args={[0.26, 0.055, 0.19]} />
                <meshStandardMaterial {...paintDark} {...clip} />
              </mesh>
              <mesh position={[side * 0.52, -0.32, 0]} rotation={[0, 0, -side * 0.5]}>
                <boxGeometry args={[0.26, 0.055, 0.19]} />
                <meshStandardMaterial {...paintDark} {...clip} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.24, 0.3, 0.28, 32]} />
            <meshStandardMaterial {...paint} {...clip} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.08, 32]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <BoltRing axis="y" count={4} radius={0.22} at={0.72} length={0.1} size={0.018} />
          <mesh position={[0, -0.58, 0]}>
            <cylinderGeometry args={[0.17, 0.2, 0.16, 24]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <mesh position={[0.72, 0.24, 0]}>
            <boxGeometry args={[0.22, 0.075, 0.1]} />
            <meshStandardMaterial color="#D3A21A" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0.9, 0.24, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.075, 0.16, 3]} />
            <meshStandardMaterial color="#D3A21A" metalness={0.5} roughness={0.35} />
          </mesh>
        </>
      )}

      {item.id === "ball" && (
        <group rotation={[0, (1 - drive) * Math.PI / 2, 0]}>
          <group rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <latheGeometry args={[BALL_PROFILE, 48]} />
              <meshStandardMaterial {...steel} side={DoubleSide} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[PORT_RADIUS, PORT_RADIUS, PORT_HALF * 2, 40, 1, true]} />
              <meshStandardMaterial color="#222A30" metalness={0.55} roughness={0.45} side={DoubleSide} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[PORT_RADIUS * 0.9, PORT_RADIUS * 0.9, PORT_HALF * 2 + 0.02, 40, 1, true]} />
              <meshStandardMaterial color="#39444C" metalness={0.75} roughness={0.32} side={DoubleSide} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[0, side * PORT_HALF, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[PORT_RADIUS, 0.014, 10, 44]} />
                <meshStandardMaterial {...chrome} />
              </mesh>
            ))}
          </group>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.1, 24]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 20]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </group>
      )}

      {item.id.indexOf("seat") === 0 && (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <latheGeometry args={[SEAT_PROFILE, 40]} />
            <meshStandardMaterial {...bronze} />
          </mesh>
          <mesh position={[0, 0.078, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.028, 12, 40]} />
            <meshStandardMaterial {...PTFE} />
          </mesh>
          <mesh position={[0, -0.068, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.33, 0.016, 8, 40]} />
            <meshStandardMaterial color="#5C675F" metalness={0.3} roughness={0.6} />
          </mesh>
        </group>
      )}

      {item.id === "stem" && (
        <group>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.065, 0.075, 0.78, 24]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.17, 0.16, 0.24, 28]} />
            <meshStandardMaterial {...paintDark} />
          </mesh>
          {[0.12, 0.16, 0.2].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.09, 0.019, 8, 24]} />
              <meshStandardMaterial color="#C9B78C" metalness={0.3} roughness={0.55} />
            </mesh>
          ))}
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.06, 24]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <BoltRing axis="y" count={2} radius={0.105} at={0.32} length={0.12} size={0.015} />
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </group>
      )}

      {item.id === "lever" && (
        <group rotation={[0, (1 - drive) * Math.PI / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.13, 0.1, 24]} />
            <meshStandardMaterial {...dark} />
          </mesh>
          <mesh position={[0.32, 0, 0]}>
            <boxGeometry args={[0.56, 0.075, 0.115]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[0.61, 0, 0]}>
            <boxGeometry args={[0.18, 0.105, 0.145]} />
            <meshStandardMaterial color="#1B2126" metalness={0.25} roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.06, 16]} />
            <meshStandardMaterial color="#D3A21A" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
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
            <meshStandardMaterial {...GASKET} />
          </mesh>
          <mesh position={[inward * 0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.31, 0.16, 36]} />
            <meshStandardMaterial {...paintDark} {...clip} />
          </mesh>
          <BoltRing axis="x" count={8} radius={0.41} at={0} length={0.22} />
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
    const leverRaw = Math.max(0, Math.min(1, (explode - 0.2) / 0.8));
    const leverEased = leverRaw * leverRaw * (3 - 2 * leverRaw);
    const seatRaw = Math.max(0, Math.min(1, (explode - 0.04) / 0.96));
    const seatEased = seatRaw * seatRaw * (3 - 2 * seatRaw);
    const height = 1.6 + 1.78 * leverEased + 0.45 * seatEased;
    const center = 0.34 + 0.89 * leverEased - 0.225 * seatEased;
    const targetScale = Math.min(1.35, (2.75 + 0.65 * leverEased) / height);
    const targetY = 0.55 - targetScale * center;
    group.current.scale.x += (targetScale - group.current.scale.x) * smoothing;
    group.current.scale.y += (targetScale - group.current.scale.y) * smoothing;
    group.current.scale.z += (targetScale - group.current.scale.z) * smoothing;
    group.current.position.y += (targetY - group.current.position.y) * smoothing;
  });
  return (
    <group ref={group} position={[0, -0.08, 0]} scale={1.3}>
      {children}
    </group>
  );
}

function BallModel({ explode, drive, section, labels, selectedId, onSelect }) {
  return (
    <>
      {PARTS.map((part, index) => (
        <BallPart
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

export default function ExplodedBallValve() {
  const { locale } = useDictionary();
  const labels = LABELS[locale] || LABELS.en;
  const [explode, setExplode] = useState(0.45);
  const [section, setSection] = useState(true);
  const [drive, setDrive] = useState(0.35);
  const [selectedId, setSelectedId] = useState(null);
  const selected = PARTS.find((part) => part.id === selectedId);

  return (
    <div>
      <div className="relative h-[440px] sm:h-[520px]">
        <SceneStage
          camera={[3.4, 2.4, 5.6]}
          fov={38}
          target={[0, 0.6, 0]}
          floorY={-1.5}
          brightness={1.3}
          onPointerMissed={() => setSelectedId(null)}
        >
          <FramedModel explode={explode}>
            <BallModel
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
