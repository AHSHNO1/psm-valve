import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, updateAdmin, verifyAdminPassword } from "@/lib/auth";

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست JSON معتبر نیست" }, { status: 400 });
  }
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  if (!(await verifyAdminPassword(currentPassword))) {
    return NextResponse.json({ ok: false, error: "رمز فعلی اشتباه است" }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 12) {
    return NextResponse.json({ ok: false, error: "رمز جدید باید حداقل ۱۲ کاراکتر باشد" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  updateAdmin({ passwordHash });
  return NextResponse.json({ ok: true });
}
