import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { readJSON, writeJSON } from "./db.js";
import { authenticateAuthor, isAuthorActive } from "./users.js";

const COOKIE_NAME = "admin_token";
const ALG = "HS256";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(request, options = {}) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;
  if (session.role === "admin") return session;
  if (options.allowAuthor && session.role === "author" && isAuthorActive(session.sub)) {
    return session;
  }
  return null;
}

export const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

/**
 * On a temporary HTTP-only install a Secure cookie is never sent back, so the
 * panel cannot log in. Derive Secure from the request scheme instead; the
 * reverse proxies in deploy/ overwrite X-Forwarded-Proto, so browsers cannot
 * spoof it on an HTTPS deployment.
 */
export function getCookieOptions(request) {
  let protocol = "";
  try {
    const forwarded = request?.headers?.get("x-forwarded-proto");
    if (forwarded) protocol = forwarded.split(",")[0].trim();
    else if (request?.nextUrl?.protocol) protocol = request.nextUrl.protocol;
    else if (request?.url) protocol = new URL(request.url).protocol;
  } catch {
    protocol = "";
  }
  const secure = protocol
    ? protocol.replace(":", "").toLowerCase() === "https"
    : process.env.NODE_ENV === "production";
  return { ...COOKIE_OPTIONS, secure };
}

export function getAdmin() {
  const stored = readJSON("admin.json", {});
  return {
    username: stored.username || process.env.ADMIN_USERNAME || "",
    passwordHash: stored.passwordHash || process.env.ADMIN_PASSWORD_HASH || ""
  };
}

export function updateAdmin(patch) {
  const current = getAdmin();
  const updated = { ...current, ...patch };
  writeJSON("admin.json", updated);
  return updated;
}

export async function verifyAdminPassword(password) {
  if (typeof password !== "string") return false;
  const admin = getAdmin();
  if (admin.passwordHash) {
    return bcrypt.compare(password, admin.passwordHash);
  }

  const configuredPassword = process.env.ADMIN_PASSWORD || "";
  const allowTemporaryDevelopmentCredentials =
    process.env.NODE_ENV === "development" &&
    process.env.ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS === "true" &&
    admin.username === "admin" &&
    configuredPassword === "admin";
  if (configuredPassword.length < 12 && !allowTemporaryDevelopmentCredentials) return false;
  const submitted = Buffer.from(String(password), "utf8");
  const expected = Buffer.from(configuredPassword, "utf8");
  return expected.length > 0 &&
    submitted.length === expected.length &&
    timingSafeEqual(submitted, expected);
}

export async function verifyCredentials(username, password) {
  const admin = getAdmin();
  if (
    admin.username &&
    username === admin.username &&
    (await verifyAdminPassword(password))
  ) {
    return { id: "admin", username: admin.username, role: "admin" };
  }
  return authenticateAuthor(username, password);
}
