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

  if (typeof currentPassword !== "string" || currentPassword.length > 200) {
    return NextResponse.json({ ok: false, error: "رمز فعلی معتبر نیست" }, { status: 400 });
  }

  let currentPasswordIsValid;
  try {
    currentPasswordIsValid = await verifyAdminPassword(currentPassword);
  } catch (error) {
    console.error("Failed to verify administrator password:", error);
    return NextResponse.json({ ok: false, error: "بررسی رمز انجام نشد؛ دوباره تلاش کنید" }, { status: 500 });
  }
  if (!currentPasswordIsValid) {
    return NextResponse.json({ ok: false, error: "رمز فعلی اشتباه است" }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 12 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return NextResponse.json({ ok: false, error: "رمز جدید باید حداقل ۱۲ کاراکتر و حداکثر ۷۲ بایت باشد" }, { status: 400 });
  }

  let newPasswordMatchesCurrent;
  try {
    newPasswordMatchesCurrent = await verifyAdminPassword(newPassword);
  } catch (error) {
    console.error("Failed to compare administrator passwords:", error);
    return NextResponse.json({ ok: false, error: "بررسی رمز انجام نشد؛ دوباره تلاش کنید" }, { status: 500 });
  }
  if (newPasswordMatchesCurrent) {
    return NextResponse.json({ ok: false, error: "رمز جدید باید با رمز فعلی متفاوت باشد" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    updateAdmin({ passwordHash });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update administrator password:", error);
    return NextResponse.json({ ok: false, error: "تغییر رمز ذخیره نشد؛ دوباره تلاش کنید" }, { status: 500 });
  }
}
