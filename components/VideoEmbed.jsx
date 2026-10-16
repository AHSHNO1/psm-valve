"use client";
import { useState } from "react";
import { Play } from "lucide-react";

function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function getAparatId(url) {
  if (!url) return null;
  const m = url.match(/aparat\.com\/(?:video\/video\/embed\/videohash\/|v\/)([\w-]+)/);
  return m ? m[1] : null;
}

export default function VideoEmbed({ url, title, poster, aspect = "16/9" }) {
  const [playing, setPlaying] = useState(false);

  if (!url) {
    return (
      <div
        className="w-full rounded-2xl grid place-items-center overflow-hidden"
        style={{ aspectRatio: aspect, background: "var(--bg-soft)", border: "1px solid var(--border)" }}
      >
        <div className="text-center px-6">
          <div
            className="w-16 h-16 rounded-full mx-auto grid place-items-center mb-3"
            style={{ background: "var(--glow)", color: "var(--gold)" }}
          >
            <Play size={24} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            ویدئو به‌زودی اضافه می‌شود
          </p>
        </div>
      </div>
    );
  }

  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const aparatId = getAparatId(url);

  if (!playing && poster) {
    return (
      <button
        onClick={() => setPlaying(true)}
        className="relative w-full rounded-2xl overflow-hidden group"
        style={{ aspectRatio: aspect, background: "var(--bg-soft)", border: "1px solid var(--border)" }}
      >
        <img src={poster} alt={title || "Video"} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
        <div
          className="absolute inset-0 grid place-items-center"
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full grid place-items-center shadow-2xl group-hover:scale-110 transition"
            style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
          >
            <Play size={28} fill="currentColor" />
          </div>
        </div>
      </button>
    );
  }

  if (aparatId) {
    const src = url.includes("/video/video/embed/")
      ? url
      : `https://www.aparat.com/video/video/embed/videohash/${aparatId}/vt/frame?muted=true`;

    return (
      <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: aspect }}>
        <iframe
          src={src}
          title={title || "Video"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (ytId) {
    return (
      <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: aspect }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: aspect }}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          title={title || "Video"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <video
      controls
      autoPlay
      className="w-full rounded-2xl"
      style={{ aspectRatio: aspect, background: "#000" }}
    >
      <source src={url} />
    </video>
  );
}
