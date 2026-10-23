// هوک سراسری Next (instrumentation): هر خطای مدیریت‌نشدهٔ سمت سرور
// با نرخ‌محدود به ایمیل مدیر هشدار داده می‌شود.
// خطاهای redirect و notFound توسط خود Next مدیریت می‌شوند و به اینجا نمی‌رسند.
// ایمپورت پویا تا ماژول‌های node-only (nodemailer) وارد باندل edge نشوند.

export async function register() {}

export async function onRequestError(error, request, context) {
  try {
    const { notifyAdminError } = await import("./lib/error-alert.js");
    const routerKind = context?.routerKind || "unknown";
    const routePath = context?.routePath || "";
    await notifyAdminError(`server:${routerKind}`, error, {
      route: routePath,
      detail: context?.routeType ? `نوع مسیر: ${context.routeType}` : ""
    });
  } catch {
    // هشدار نباید خودش خطای ثانویه بسازد.
  }
}
