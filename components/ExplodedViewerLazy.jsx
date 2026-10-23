"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ExplodedViewer = dynamic(() => import("./ExplodedViewer"), {
  ssr: false,
  loading: () => <Placeholder />
});

function Placeholder() {
  return <div className="h-[440px] sm:h-[520px]" aria-hidden="true" />;
}

export default function ExplodedViewerLazy({ locale }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{near ? <ExplodedViewer locale={locale} /> : <Placeholder />}</div>;
}
