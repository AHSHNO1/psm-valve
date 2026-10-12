"use client";
import { useState } from "react";
import { Icon } from "./AdminIcons";

export default function MessagesClient({ initial }) {
  const [messages, setMessages] = useState(initial || []);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  function notify(text, isError) {
    setMsg({ type: isError ? "error" : "success", text: text });
    setTimeout(function() { setMsg({ type: "", text: "" }); }, 3000);
  }

  async function refresh() {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (data.ok) setMessages(data.messages);
  }

  async function patch(id, body) {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ id: id }, body))
    });
    refresh();
  }

  async function remove(id) {
    if (!confirm("این پیام حذف شود؟")) return;
    await fetch("/api/messages?id=" + id, { method: "DELETE" });
    setSelected(null);
    refresh();
    notify("پیام حذف شد");
  }

  function open(m) {
    setSelected(m);
    if (!m.read) patch(m.id, { read: true });
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setBusy(true);
    const subject = "پاسخ پترو سازه میهن";
    const body = "سلام " + selected.name + ",\n\n" + replyText + "\n\nبا احترام\nپترو سازه میهن";
    window.location.href = "mailto:" + selected.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    await patch(selected.id, { replied: true, read: true });
    setReplyText("");
    setBusy(false);
    notify("پاسخ ارسال شد");
  }

  const filtered = messages.filter(function(m) {
    if (filter === "unread") return !m.read;
    if (filter === "replied") return m.replied;
    return true;
  });

  const counts = {
    all: messages.length,
    unread: messages.filter(function(m) { return !m.read; }).length,
    replied: messages.filter(function(m) { return m.replied; }).length
  };

  return (
    <div>
      <div className="page-header anim-in">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
            <Icon name="mail" size={22} />
          </div>
          <div className="min-w-0">
            <div className="page-header-title">پیام‌ها</div>
            <div className="page-header-sub">{counts.all} پیام · {counts.unread} خوانده‌نشده</div>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={"msg anim-in " + (msg.type === "success" ? "msg-success" : "msg-error")}>
          <Icon name={msg.type === "success" ? "check" : "alert"} /> {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="tabs anim-in">
        <button onClick={function() { setFilter("all"); }} className={"tab" + (filter === "all" ? " tab-active" : "")}>
          همه <span className="tab-badge">{counts.all}</span>
        </button>
        <button onClick={function() { setFilter("unread"); }} className={"tab" + (filter === "unread" ? " tab-active" : "")}>
          خوانده‌نشده <span className="tab-badge">{counts.unread}</span>
        </button>
        <button onClick={function() { setFilter("replied"); }} className={"tab" + (filter === "replied" ? " tab-active" : "")}>
          پاسخ داده <span className="tab-badge">{counts.replied}</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty anim-in">
          <div className="empty-icon"><Icon name="mail" size={30} /></div>
          <div className="empty-title">پیامی موجود نیست</div>
          <div className="empty-desc">پیام‌های فرم تماس اینجا نمایش داده می‌شوند</div>
        </div>
      ) : (
        <div>
          {filtered.map(function(m, i) {
            return (
              <div key={m.id} className="row anim-in" style={{ animationDelay: (i * 25) + "ms", cursor: "pointer" }}
                onClick={function() { open(m); }}>
                <div className="row-thumb" style={{
                  background: m.read ? "#F4F5F7" : "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: m.read ? "#7A8290" : "#FFFFFF",
                  borderRadius: "50%"
                }}>
                  <Icon name="mail" size={18} />
                </div>

                <div className="row-body">
                  <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="row-title" style={{ margin: 0 }}>{m.name}</span>
                    {!m.read && <span className="chip chip-red">جدید</span>}
                    {m.replied && <span className="chip chip-green"><Icon name="check" /> پاسخ داده</span>}
                  </div>
                  <div className="row-meta">
                    <span dir="ltr">{m.email}</span>
                    <span>·</span>
                    <span>{(m.message || "").substring(0, 50)}</span>
                  </div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: "#7A8290", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {new Date(m.createdAt).toLocaleDateString("fa-IR")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <>
          <div style={{
            position: "fixed", inset: 0, background: "rgba(26, 29, 33, 0.4)",
            zIndex: 60
          }} onClick={function() { setSelected(null); }} />
          <div className="anim-in" style={{
            position: "fixed", top: 0, insetInlineEnd: 0,
            height: "100%", width: "100%", maxWidth: 480,
            background: "#FFFFFF",
            boxShadow: "-12px 0 40px rgba(26, 29, 33, 0.2)",
            zIndex: 70,
            overflowY: "auto"
          }}>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#1A1D21", marginBottom: 4 }}>
                    {selected.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#7A8290", fontWeight: 600 }} dir="ltr">
                    {selected.email}
                  </div>
                  {selected.phone && (
                    <div style={{ fontSize: 12, color: "#7A8290", fontWeight: 600, marginTop: 2 }} dir="ltr">
                      {selected.phone}
                    </div>
                  )}
                </div>
                <button onClick={function() { setSelected(null); }} className="act-btn">
                  <Icon name="x" />
                </button>
              </div>

              <div style={{
                background: "#F4F5F7",
                border: "1px solid #D1D5DB",
                borderRadius: 10,
                padding: 16,
                fontSize: 13,
                lineHeight: 1.8,
                color: "#1A1D21",
                whiteSpace: "pre-wrap",
                marginBottom: 18
              }}>
                {selected.message}
              </div>

              <label className="form-label">پاسخ سریع</label>
              <textarea rows={4} value={replyText}
                onChange={function(e) { setReplyText(e.target.value); }}
                className="form-input" style={{ marginBottom: 10 }} />

              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={sendReply} disabled={busy || !replyText.trim()}
                  className="btn-add" style={{ flex: 1, justifyContent: "center" }}>
                  <Icon name="mail" /> ارسال پاسخ ایمیلی
                </button>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={function() { patch(selected.id, { replied: true, read: true }); }}
                  className="act-btn act-btn-success" style={{ width: "auto", padding: "0 12px", gap: 5 }} title="علامت پاسخ داده">
                  <Icon name="check" />
                  <span style={{ fontSize: 11, fontWeight: 900 }}>پاسخ داده</span>
                </button>
                <button onClick={function() { remove(selected.id); }}
                  className="act-btn act-btn-delete" style={{ width: "auto", padding: "0 12px", gap: 5 }} title="حذف">
                  <Icon name="trash" />
                  <span style={{ fontSize: 11, fontWeight: 900 }}>حذف</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
