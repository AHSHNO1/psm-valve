import { getAdmin } from "@/lib/auth";
import { createAuthor, getAuthors, updateAuthor } from "@/lib/users";
import { guard, readJson, json, err, isResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await guard(request, { role: "admin" });
  if (isResponse(session)) return session;
  const authors = getAuthors().map(({ id, name, username, active, createdAt }) => ({
    id,
    name,
    username,
    active: active !== false,
    createdAt
  }));
  return json({ authors });
}

export async function POST(request) {
  const session = await guard(request, { role: "admin" });
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return err("اطلاعات حساب معتبر نیست", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100) {
    return err("نام باید بین ۲ تا ۱۰۰ نویسه باشد", 400);
  }
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return err("نام کاربری باید ۳ تا ۴۰ نویسهٔ مجاز داشته باشد", 400);
  }
  if (password.length < 12 || password.length > 200) {
    return err("رمز عبور باید دست‌کم ۱۲ نویسه باشد", 400);
  }
  const admin = getAdmin();
  if (username.toLowerCase() === admin.username.toLowerCase()) {
    return err("این نام کاربری رزرو شده است", 409);
  }

  const author = await createAuthor({ name, username, password });
  if (!author) {
    return err("این نام کاربری قبلاً ثبت شده است", 409);
  }
  return json({
    author: {
      id: author.id,
      name: author.name,
      username: author.username,
      active: author.active,
      createdAt: author.createdAt
    }
  }, { status: 201 });
}

export async function PATCH(request) {
  const session = await guard(request, { role: "admin" });
  if (isResponse(session)) return session;

  const body = await readJson(request);
  if (isResponse(body)) return body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return err("اطلاعات وضعیت نویسنده معتبر نیست", 400);
  }
  if (typeof body.id !== "string" || typeof body.active !== "boolean") {
    return err("اطلاعات وضعیت نویسنده معتبر نیست", 400);
  }
  const updated = updateAuthor(body.id, { active: body.active });
  if (!updated) return err("نویسنده یافت نشد", 404);
  return json();
}
