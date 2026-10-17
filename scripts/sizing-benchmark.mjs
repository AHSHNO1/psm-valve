// Benchmark: current sizing functions vs reference equations (IEC/Fisher form).
// Run: node scripts/sizing-benchmark.mjs
import { calcLiquidCv, calcGasCv, calcSteamCv } from "../lib/sizing-advanced.js";

const CASES = [
  {
    id: "liquid-water",
    label: "Water 100 m3/h, P1 10 -> P2 8 bar abs",
    current: calcLiquidCv({ Q: 100, Gf: 1, P1: 10, P2: 8, Pv: 0.0234, Pc: 220.6, FL: 0.9 }),
    // Reference: Kv = Q*sqrt(Gf/dP); Cv = 1.156*Kv
    expected: (() => {
      const dP = Math.min(2, 0.81 * (10 - 0.96 * 0.0234));
      const kv = 100 * Math.sqrt(1 / dP);
      return kv * 1.156;
    })()
  },
  {
    id: "gas-air",
    label: "Air 100 Nm3/h, P1 10 -> P2 9 bar abs, 20 C",
    current: calcGasCv({ Q: 100, Gg: 1, T: 20, P1: 10, P2: 9, Z: 1, k: 1.4, xT: 0.7 }),
    // Reference: Cv = Q / (416.3 * P1 * Y) * sqrt(Gg*T*Z/x)
    expected: (() => {
      const x = 0.1, Fk = 1, xT = 0.7;
      const Y = 1 - Math.min(x, Fk * xT) / (3 * Fk * xT);
      return (100 / (416.3 * 10 * Y)) * Math.sqrt((1 * 293.15 * 1) / x);
    })()
  },
  {
    id: "steam-sat",
    label: "Saturated steam 1000 kg/h, P1 10 -> P2 9 bar abs",
    current: calcSteamCv({ W: 1000, P1: 10, P2: 9, T: 180 }),
    // Reference (SI form of W = 13.8*Cv*sqrt(dP*(P1+P2))), with Y correction
    expected: (() => {
      const Y = 0.95;
      return 1000 / (13.8 * Y * Math.sqrt(1 * 19));
    })()
  }
];

console.log("case".padEnd(14), "engine Cv".padStart(11), "reference Cv".padStart(13), "ratio".padStart(8));
for (const c of CASES) {
  const cur = c.current.Cv;
  const exp = c.expected;
  console.log(
    c.id.padEnd(14),
    String(cur).padStart(11),
    exp.toFixed(2).padStart(13),
    (cur / exp).toFixed(2).padStart(8)
  );
  console.log("   " + c.label);
  console.log("   selected size:", c.current.size?.size, "| opening:", Math.round((cur / c.current.size.cv) * 100) + "%");
}
