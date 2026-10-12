"use client";
import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target, duration = 600) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const start = prevRef.current;
    const end = target;
    if (start === end) return;
    const startTime = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(start + (end - start) * eased);
      setValue(cur);
      if (t < 1) frame = requestAnimationFrame(tick);
      else prevRef.current = end;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export default function LiveTileNumber({ value, className = "", bump = true }) {
  const animated = useAnimatedNumber(value);
  const [bumping, setBumping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      if (bump) {
        setBumping(true);
        const t = setTimeout(() => setBumping(false), 650);
        return () => clearTimeout(t);
      }
    }
  }, [value, bump]);

  return <span className={className + (bumping ? " live-bump" : "")}>{animated}</span>;
}
