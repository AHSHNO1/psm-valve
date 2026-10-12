export function calcLiquidCv({ Q, Gf, P1, P2, Pv }) {
  const dP = P1 - P2;
  if (dP <= 0) return { error: "فشار ورودی باید بیشتر از فشار خروجی باشد" };
  const dPmax = 0.5 * (P1 - (Pv || 0));
  const dPeff = Math.min(dP, dPmax);
  const Cv = Q * Math.sqrt(Gf / dPeff);
  const choked = dP > dPmax;
  const cavitationIndex = (P1 - Pv) / (P1 - P2);
  const cavitationRisk =
    cavitationIndex < 1.5 ? "high" : cavitationIndex < 2.5 ? "medium" : "low";
  return { Cv, choked, cavitationIndex, cavitationRisk };
}

export function calcGasCv({ Q, Gg, T, P1, P2, Z = 1 }) {
  const dP = P1 - P2;
  if (dP <= 0) return { error: "فشار ورودی باید بیشتر از فشار خروجی باشد" };
  const Fk = 1.0;
  const xT = 0.7;
  const x = dP / P1;
  const xEff = Math.min(x, Fk * xT);
  const Tk = T + 273.15;
  const Cv = (Q / 1360) * Math.sqrt((Gg * Tk * Z) / (P1 * xEff));
  const choked = x > Fk * xT;
  return { Cv, choked };
}

export function cvToSize(Cv) {
  const table = [
    { size: '0.5"', Cv: 4 },
    { size: '1"', Cv: 14 },
    { size: '1.5"', Cv: 30 },
    { size: '2"', Cv: 55 },
    { size: '3"', Cv: 110 },
    { size: '4"', Cv: 190 },
    { size: '6"', Cv: 410 },
    { size: '8"', Cv: 700 },
    { size: '10"', Cv: 1100 },
    { size: '12"', Cv: 1600 },
    { size: '16"', Cv: 2800 },
    { size: '20"', Cv: 4400 },
    { size: '24"', Cv: 6300 }
  ];
  return table.find((r) => r.Cv >= Cv) || table[table.length - 1];
}