import { NextResponse } from "next/server";
import { getSession, getAdmin } from "@/lib/auth";
import { createAuthor, getAuthors, updateAuthor } from "@/lib/users";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const authors = getAuthors().map(({ id, name, username, active, createdAt }) => ({
    id,
    name,
    username,
    active: active !== false,
    createdAt
  }));
  return NextResponse.json({ ok: true, authors });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "اطلاعات حساب معتبر نیست" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ ok: false, error: "نام باید بین ۲ تا ۱۰۰ نویسه باشد" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return NextResponse.json({ ok: false, error: "نام کاربری باید ۳ تا ۴۰ نویسهٔ مجاز داشته باشد" }, { status: 400 });
  }
  if (password.length < 12 || password.length > 200) {
    return NextResponse.json({ ok: false, error: "رمز عبور باید دست‌کم ۱۲ نویسه باشد" }, { status: 400 });
  }
  const admin = getAdmin();
  if (username.toLowerCase() === admin.username.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "این نام کاربری رزرو شده است" }, { status: 409 });
  }

  const author = await createAuthor({ name, username, password });
  if (!author) {
    return NextResponse.json({ ok: false, error: "این نام کاربری قبلاً ثبت شده است" }, { status: 409 });
  }
  return NextResponse.json({
    ok: true,
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
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "اطلاعات وضعیت نویسنده معتبر نیست" }, { status: 400 });
  }
  if (typeof body.id !== "string" || typeof body.active !== "boolean") {
    return NextResponse.json({ ok: false, error: "اطلاعات وضعیت نویسنده معتبر نیست" }, { status: 400 });
  }
  const updated = updateAuthor(body.id, { active: body.active });
  if (!updated) return NextResponse.json({ ok: false, error: "نویسنده یافت نشد" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
