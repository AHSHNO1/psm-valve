import { SignJWT, jwtVerify } from "jose";
import { readJSON, writeJSON } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "psm-valve-secret-key-2025-change-in-prod"
);

const COOKIE_NAME = "admin_token";
const ALG = "HS256";

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

export function getAdmin() {
  return readJSON("admin.json", { username: "admin", password: "psm-admin-2025" });
}

export function updateAdmin(patch) {
  const current = getAdmin();
  const updated = { ...current, ...patch };
  writeJSON("admin.json", updated);
  return updated;
}

export function verifyCredentials(username, password) {
  const admin = getAdmin();
  return admin.username === username && admin.password === password;
}
