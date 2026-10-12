import { NextResponse } from "next/server";
import { getSession, getAdmin, updateAdmin } from "@/lib/auth";

export async function PATCH(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  const admin = getAdmin();

  if (admin.password !== currentPassword) {
    return NextResponse.json({ ok: false, error: "رمز فعلی اشتباه است" }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ ok: false, error: "رمز جدید باید حداقل ۶ کاراکتر باشد" }, { status: 400 });
  }

  updateAdmin({ password: newPassword });
  return NextResponse.json({ ok: true });
}
