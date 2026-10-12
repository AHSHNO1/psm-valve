"use client";
import { useState } from "react";
import { Save, Loader2, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";

export default function ProductsEditor({ initial }) {
  const [json, setJson] = useState(JSON.stringify(initial, null, 2));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const validateAndSave = async () => {
    setMsg({ type: "", text: "" });
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setMsg({ type: "error", text: "JSON نامعتبر: " + e.message });
      return;
    }
    if (!Array.isArray(parsed)) {
      setMsg({ type: "error", text: "باید یک آرایه باشد" });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: parsed })
    });
    const data = await res.json();
    if (data.ok) setMsg({ type: "success", text: "محصولات ذخیره شد. برای اعمال، سرور را دوباره اجرا کنید." });
    else setMsg({ type: "error", text: data.error || "خطا" });
    setBusy(false);
  };

  const reset = () => {
    if (!confirm("تغییرات لغو شود؟")) return;
    setJson(JSON.stringify(initial, null, 2));
  };

  return (
    <div>
      {msg.text && (
        <div
          className="flex items-center gap-2 text-sm p-3 rounded-xl mb-4"
          style={{
            background: msg.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: msg.type === "success" ? "1px solid #A7F3D0" : "1px solid #FECACA",
            color: msg.type === "success" ? "#065F46" : "#991B1B"
          }}
        >
          {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={validateAndSave}
          disabled={busy}
          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C9950D, #F5C518)", color: "#1A1D21" }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          ذخیره تغییرات
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
          style={{ background: "#F1F3F5", border: "1px solid rgba(26, 29, 33, 0.15)" }}
        >
          <RotateCcw size={14} /> بازنشانی
        </button>
      </div>

      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={30}
        spellCheck={false}
        dir="ltr"
        className="w-full px-4 py-3 rounded-2xl font-mono text-xs leading-6 focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
        style={{ background: "#1F2124", color: "#E5E7EB", border: "1px solid rgba(192, 192, 192, 0.15)" }}
      />
    </div>
  );
}
