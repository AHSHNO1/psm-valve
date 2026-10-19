#!/usr/bin/env node
/**
 * Responsive audit via Chrome DevTools Protocol.
 *
 *   node scripts/responsive-audit.mjs [baseUrl]
 *
 * Requires Chrome running with --remote-debugging-port=9222.
 * Reports horizontal overflow and the elements that cause it.
 */
const CDP = "http://127.0.0.1:9222";
const BASE = process.argv[2] || "http://127.0.0.1:3000";

const PAGES = [
  ["home", "/fa"],
  ["sizing", "/fa/sizing"],
  ["products", "/fa/products"],
  ["product", "/fa/products/spherical-globe-51000"],
  ["contact", "/fa/contact"],
  ["services", "/fa/services"],
  ["about", "/fa/about"]
];

const WIDTHS = [390, 768, 1440];

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let id = 0;
    ws.addEventListener("open", () => resolve({ send, close: () => ws.close() }));
    ws.addEventListener("error", reject);
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    });
    function send(method, params = {}) {
      const msgId = ++id;
      return new Promise((res) => {
        pending.set(msgId, res);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXPRESSION = `(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (getComputedStyle(el).position === "fixed") continue;
    const overflowRight = r.right > vw + 1;
    const overflowLeft = r.left < -1;
    if (overflowRight || overflowLeft) {
      bad.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || "").slice(0, 80),
        w: Math.round(r.width),
        left: Math.round(r.left),
        right: Math.round(r.right),
        text: (el.textContent || "").trim().slice(0, 40)
      });
    }
  }
  bad.sort((a, b) => b.w - a.w);
  return JSON.stringify({ vw, sw, overflow: bad.length, bad: bad.slice(0, 6) });
})()`;

async function audit(url, width) {
  const created = await fetch(`${CDP}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  const target = await created.json();
  const client = await connect(target.webSocketDebuggerUrl);

  await client.send("Runtime.enable");
  await client.send("Page.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768
  });
  await client.send("Page.navigate", { url });
  await sleep(2500);
  const result = await client.send("Runtime.evaluate", {
    expression: EXPRESSION,
    returnByValue: true
  });

  client.close();
  await fetch(`${CDP}/json/close/${target.id}`).catch(() => {});

  const raw = result?.result?.result?.value;
  try {
    return JSON.parse(raw);
  } catch {
    return { error: result?.result?.exceptionDetails || result?.result };
  }
}

const findings = [];
for (const width of WIDTHS) {
  for (const [name, path] of PAGES) {
    const result = await audit(`${BASE}${path}`, width);
    findings.push({ width, name, ...result });
    const flag = result.overflow > 0 ? `OVERFLOW ${result.overflow}` : "ok";
    console.log(`${String(width).padEnd(5)} ${name.padEnd(10)} ${flag}  (scrollWidth ${result.sw}/${result.vw})`);
    if (result.overflow > 0) {
      for (const item of result.bad.slice(0, 3)) {
        console.log(`      ${item.tag}.${item.cls} w=${item.w} right=${item.right} "${item.text}"`);
      }
    }
  }
}

const problems = findings.filter((f) => f.overflow > 0);
console.log(`\n${problems.length} صفحه/عرض دارای سرریز افقی`);
process.exitCode = problems.length > 0 ? 1 : 0;
