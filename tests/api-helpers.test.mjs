import test from "node:test";
import assert from "node:assert/strict";

const { json, err, readJson, isResponse, guard } = await import("../lib/api-helpers.js");

test("json returns an ok:true body and spreads data", async () => {
  const res = json({ faqs: [1, 2] }, { status: 201 });
  assert.equal(res.status, 201);
  assert.equal(res instanceof Response, true);
  const body = await res.json();
  assert.deepEqual(body, { ok: true, faqs: [1, 2] });
});

test("json with no data returns { ok: true }", async () => {
  const body = await json().json();
  assert.deepEqual(body, { ok: true });
});

test("err returns the consistent { ok:false, error } shape with status", async () => {
  const res = err("bad input", 400);
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { ok: false, error: "bad input" });
});

test("err can attach extra fields and init headers", async () => {
  const res = err("slow down", 429, { code: "rate_limited" }, { headers: { "Retry-After": "30" } });
  assert.equal(res.headers.get("retry-after"), "30");
  assert.deepEqual(await res.json(), { ok: false, error: "slow down", code: "rate_limited" });
});

test("isResponse distinguishes a Next response from parsed data", () => {
  assert.equal(isResponse(json()), true);
  assert.equal(isResponse(err("x", 500)), true);
  assert.equal(isResponse({ ok: true }), false);
  assert.equal(isResponse(null), false);
});

test("readJson returns the parsed body on valid JSON", async () => {
  const request = { json: async () => ({ hello: "world" }) };
  assert.deepEqual(await readJson(request), { hello: "world" });
});

test("readJson returns a 400 response on malformed JSON", async () => {
  const request = { json: async () => { throw new Error("nope"); } };
  const result = await readJson(request);
  assert.equal(isResponse(result), true);
  assert.equal(result.status, 400);
  assert.equal((await result.json()).ok, false);
});

test("guard returns a 401 response when there is no session cookie", async () => {
  const request = { cookies: { get: () => undefined } };
  const result = await guard(request);
  assert.equal(isResponse(result), true);
  assert.equal(result.status, 401);
});
