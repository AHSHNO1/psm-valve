"use client";
import { useState } from "react";
import {
  Mail, MailOpen, Trash2, CheckCircle2, X, Send, Loader2,
  Inbox, Clock
} from "lucide-react";

export default function MessagesManager({ initial }) {
  const [messages, setMessages] = useState(initial || []);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [replyText, setReplyText] = useState("");

  const refresh = async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (data.ok) setMessages(data.messages);
  };

  const markRead = async (id, read) => {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read })
    });
    refresh();
  };

  const markReplied = async (id) => {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, replied: true, read: true })
    });
    refresh();
  };

  const remove = async (id) => {
    if (!confirm("این پیام حذف شود؟")) return;
    await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
    setSelected(null);
    refresh();
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setBusy(true);
    const subject = "پاسخ پترو سازه میهن";
    const body = `سلام ${selected.name},\n\n${replyText}\n\nبا احترام\nپترو سازه میهن`;
    window.location.href = `mailto:${selected.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await markReplied(selected.id);
    setReplyText("");
    setBusy(false);
  };

  const openMessage = (m) => {
    setSelected(m);
    if (!m.read) markRead(m.id, true);
  };

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.read;
    if (filter === "replied") return m.replied;
    return true;
  });

  const counts = {
    all: messages.length,
    unread: messages.filter((m) => !m.read).length,
    replied: messages.filter((m) => m.replied).length
  };

  return (
    <div className="space-y-6">
      {/* Filter tiles */}
      <div className="metro-grid" style={{ gridAutoRows: "minmax(80px, auto)" }}>
        <button
          onClick={() => setFilter("all")}
          className={`metro-tile metro-tile-s metro-in ${filter === "all" ? "metro-blue" : "metro-tile-outline"}`}
        >
          <Inbox size={24} strokeWidth={1.5} />
          <div>
            <div className="text-2xl metro-tile-value">{counts.all}</div>
            <div className="text-[10px] metro-tile-label">همه</div>
          </div>
        </button>

        <button
          onClick={() => setFilter("unread")}
          className={`metro-tile metro-tile-s metro-in ${filter === "unread" ? "metro-red" : "metro-tile-outline"}`}
        >
          <Mail size={24} strokeWidth={1.5} />
          <div>
            <div className="text-2xl metro-tile-value">{counts.unread}</div>
            <div className="text-[10px] metro-tile-label">خوانده‌نشده</div>
          </div>
        </button>

        <button
          onClick={() => setFilter("replied")}
          className={`metro-tile metro-tile-s metro-in ${filter === "replied" ? "metro-green" : "metro-tile-outline"}`}
        >
          <CheckCircle2 size={24} strokeWidth={1.5} />
          <div>
            <div className="text-2xl metro-tile-value">{counts.replied}</div>
            <div className="text-[10px] metro-tile-label">پاسخ داده</div>
          </div>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="metro-card p-16 text-center metro-in">
          <div
            className="w-20 h-20 rounded-xl mx-auto grid place-items-center mb-4"
            style={{ background: "rgba(0, 120, 212, 0.12)" }}
          >
            <Inbox size={36} style={{ color: "#0078D4" }} />
          </div>
          <p className="font-black text-lg mb-2" style={{ color: "var(--m-text)" }}>پیامی موجود نیست</p>
          <p className="text-sm" style={{ color: "var(--m-text-muted)" }}>
            پیام‌های جدید در اینجا نمایش داده می‌شوند
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m, i) => (
            <button
              key={m.id}
              onClick={() => openMessage(m)}
              className="text-right rounded-lg p-5 transition-all hover:-translate-y-1 metro-in"
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--m-border)",
                borderRight: m.read ? "1px solid var(--m-border)" : "4px solid #F7630C",
                boxShadow: "0 2px 8px rgba(20, 22, 27, 0.06)",
                animationDelay: (i * 40) + "ms"
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-md grid place-items-center shrink-0"
                  style={{
                    background: m.read ? "#F1F3F5" : "linear-gradient(135deg, #FF7A1F, #D14A00)",
                    color: m.read ? "var(--m-text-muted)" : "#FFFFFF"
                  }}
                >
                  {m.read ? <MailOpen size={18} /> : <Mail size={18} />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!m.read && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black" style={{ background: "#E81123", color: "#FFFFFF" }}>
                      جدید
                    </span>
                  )}
                  {m.replied && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-black" style={{ background: "#107C10", color: "#FFFFFF" }}>
                      پاسخ داده
                    </span>
                  )}
                </div>
              </div>

              <div className="font-black text-sm mb-1 truncate" style={{ color: "var(--m-text)" }}>{m.name}</div>
              <div className="text-[11px] truncate mb-3" style={{ color: "var(--m-text-muted)" }} dir="ltr">
                {m.email}
              </div>

              <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--m-text-soft)" }}>
                {m.message}
              </p>

              <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--m-text-muted)" }}>
                <Clock size={10} /> {new Date(m.createdAt).toLocaleDateString("fa-IR")}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div
            className="fixed top-0 right-0 h-full w-full max-w-lg z-50 overflow-y-auto metro-in"
            style={{ background: "#FFFFFF", boxShadow: "-20px 0 60px rgba(0, 0, 0, 0.2)" }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="min-w-0">
                  <div className="font-black text-lg mb-1" style={{ color: "var(--m-text)" }}>{selected.name}</div>
                  <div className="text-xs truncate" style={{ color: "var(--m-text-muted)" }} dir="ltr">
                    {selected.email}
                  </div>
                  {selected.phone && (
                    <div className="text-xs mt-0.5" style={{ color: "var(--m-text-muted)" }} dir="ltr">
                      {selected.phone}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-md grid place-items-center hover:bg-black/5 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div
                className="rounded-lg p-5 mb-6 text-sm leading-8 whitespace-pre-wrap"
                style={{ background: "#F5F6F8", color: "var(--m-text)", border: "1px solid var(--m-border)" }}
              >
                {selected.message}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black mb-2 block" style={{ color: "var(--m-text-soft)" }}>
                    پاسخ سریع
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                    placeholder="متن پاسخ..."
                    className="metro-input resize-none"
                  />
                </div>

                <button onClick={sendReply} disabled={busy || !replyText.trim()} className="metro-btn metro-btn-gold w-full">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  ارسال پاسخ ایمیلی
                </button>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => markReplied(selected.id)}
                    className="metro-btn"
                    style={{ background: "rgba(16, 124, 16, 0.12)", color: "#0A5F0A", border: "1px solid #107C10" }}
                  >
                    <CheckCircle2 size={14} /> علامت پاسخ
                  </button>
                  <button
                    onClick={() => remove(selected.id)}
                    className="metro-btn"
                    style={{ background: "rgba(232, 17, 35, 0.1)", color: "#C40E1C", border: "1px solid #E81123" }}
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
