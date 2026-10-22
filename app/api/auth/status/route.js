import { getAdmin } from "@/lib/auth";
import { guard, json, isResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// فقط boolean و دادهٔ غیرحساس برمی‌گرداند؛ هیچ مقدارِ متغیر محیطی یا hash فاش نمی‌شود.
export async function GET(request) {
  const session = await guard(request, { role: "admin" });
  if (isResponse(session)) return session;

  const jwtSecret = process.env.JWT_SECRET || "";
  const admin = getAdmin();
  const insecureDev =
    process.env.NODE_ENV === "development" &&
    process.env.ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS === "true";

  const nowSec = Math.floor(Date.now() / 1000);
  const issuedAt = typeof session.iat === "number" ? session.iat : null;
  const expiresAt = typeof session.exp === "number" ? session.exp : null;

  return json({
    status: {
      jwtSecretConfigured: Buffer.byteLength(jwtSecret, "utf8") >= 32,
      adminCredentialConfigured: Boolean(admin.passwordHash || process.env.ADMIN_PASSWORD),
      insecureDevCredentialsAllowed: insecureDev,
      cookieSecure: process.env.NODE_ENV === "production",
      middlewareGuardsAdmin: true,
      authorRoleRestricted: true,
      uploadGuarded: true,
      tokenIssuedAt: issuedAt ? new Date(issuedAt * 1000).toISOString() : null,
      tokenAgeDays: issuedAt ? Math.max(0, Math.round((nowSec - issuedAt) / 3600) / 24) : null,
      tokenExpiresInDays: expiresAt ? Math.max(0, Math.round((expiresAt - nowSec) / 3600) / 24) : null
    }
  });
}
