import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const CHALLENGE_LIFETIME_MS = 10 * 60 * 1000;
const usedChallenges = new Map();

function getChallengeSecret() {
  const secret = process.env.CONTACT_CHALLENGE_SECRET || process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("A contact challenge secret of at least 32 bytes is required");
  }
  return secret;
}

function digest(value) {
  return createHmac("sha256", getChallengeSecret()).update(value).digest();
}

function question(nonce) {
  const bytes = digest("question:" + nonce);
  const a = (bytes[0] % 20) + 1;
  const b = (bytes[1] % 20) + 1;
  const operation = ["+", "-", "×"][bytes[2] % 3];
  const answer = operation === "+"
    ? a + b
    : operation === "-"
      ? a - b
      : a * b;
  return { a, b, operation, answer };
}

export function createContactChallenge() {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + CHALLENGE_LIFETIME_MS;
  const signature = digest(nonce + ":" + expiresAt).toString("hex");
  const { a, b, operation } = question(nonce);
  return {
    token: nonce + "." + expiresAt + "." + signature,
    a,
    b,
    op: operation
  };
}

export function verifyContactChallenge(token, submittedAnswer) {
  if (typeof token !== "string" || token.length > 200) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [nonce, expiryText, signature] = parts;
  if (!/^[a-f0-9]{32}$/.test(nonce) || !/^\d{13}$/.test(expiryText) || !/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const expiresAt = Number(expiryText);
  const now = Date.now();
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + CHALLENGE_LIFETIME_MS) {
    return false;
  }
  for (const [usedNonce, usedExpiry] of usedChallenges) {
    if (usedExpiry <= now) usedChallenges.delete(usedNonce);
  }
  if (usedChallenges.has(nonce)) return false;

  const expectedSignature = digest(nonce + ":" + expiresAt);
  const actualSignature = Buffer.from(signature, "hex");
  if (!timingSafeEqual(expectedSignature, actualSignature)) return false;

  const answer = Number(submittedAnswer);
  if (!Number.isInteger(answer) || answer !== question(nonce).answer) return false;
  usedChallenges.set(nonce, expiresAt);
  return true;
}
