"use client";
import dynamic from "next/dynamic";

const ExplodedValve = dynamic(
  () => import("./ExplodedValve"),
  {
    ssr: false,
    loading: () => (
      <section className="container-x py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="h-6 w-32 rounded-lg animate-pulse" style={{ background: "var(--bg-soft)" }} />
            <div className="h-12 w-3/4 rounded-lg mt-4 animate-pulse" style={{ background: "var(--bg-soft)" }} />
            <div className="h-4 w-full rounded-lg mt-4 animate-pulse" style={{ background: "var(--bg-soft)" }} />
          </div>
          <div
            className="h-[520px] rounded-3xl animate-pulse"
            style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}
          />
        </div>
      </section>
    )
  }
);

export default function ExplodedValveLoader() {
  return <ExplodedValve />;
}
