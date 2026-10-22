# ============================================================
# PSM VALVE — ایمیج تولید (Next.js 14 + better-sqlite3)
#
#   docker compose up -d --build        (یا: bash deploy/docker.sh)
#
# ⚠️ دو نکتهٔ مهم این پروژه در Docker:
#   ۱) دادهٔ سایت فایلمحور است → data/ و public/uploads/ باید volume پایدار
#      باشند (در docker-compose.yml تنظیم شدهاند).
#   ۲) میدلور روی Edge اجرا میشود و JWT_SECRET را «در زمان بیلد» درونریزی
#      میکند. پس اگر داخل ایمیج بیلد کنیم، راز داخل ایمیج جا میماند.
#      بنابراین بیلد در «اولین اجرای کانتینر» و با متغیرهای env انجام میشود
#      و خروجی بیلد در volume .next باقی میماند (deploy/docker-entrypoint.sh).
# ============================================================

# ---------- ۱) نصب وابستگیها (شامل devDependencies برای بیلد) ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# better-sqlite3 ممکن است به کامپایل بومی نیاز داشته باشد
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- ۲) ایمیج نهایی ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    PSM_DATA_DIR=/app/data
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# نسخهٔ اولیهٔ داده/آپلود برای seed اولین اجرا (بدون فایلهای خصوصی و دیتابیس)
RUN mkdir -p /app/.seed/data /app/.seed/uploads /app/data /app/public/uploads /app/logs \
 && cp -a data/. /app/.seed/data/ \
 && cp -a public/uploads/. /app/.seed/uploads/ \
 && rm -f /app/.seed/data/admin.json /app/.seed/data/users.json /app/.seed/data/messages.json \
 && rm -f /app/.seed/data/*.sqlite /app/.seed/data/*.sqlite-* /app/.seed/data/*.bak /app/.seed/data/*.backup-* \
 && rm -f /app/data/admin.json /app/data/users.json /app/data/messages.json \
 && rm -f /app/data/*.sqlite /app/data/*.sqlite-* /app/data/*.bak /app/data/*.backup-* \
 && find /app/.seed/data /app/data -name '*.backup*.json' -delete \
 && chmod +x /app/deploy/*.sh

EXPOSE 3000
VOLUME ["/app/data", "/app/public/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=600s --retries=3 \
  CMD curl -fsS -o /dev/null http://127.0.0.1:3000/fa || exit 1

CMD ["/bin/bash", "deploy/docker-entrypoint.sh"]