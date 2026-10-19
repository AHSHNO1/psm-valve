<#
.SYNOPSIS
    انتقال دادهٔ سایت و دارایی‌های آپلودشده از ویندوز به سرور (scp/ssh).

.DESCRIPTION
    این فایل‌ها در گیت نیستند (محتوای کاربرند): data/ و public/uploads/
    اگر سرور تازه است و این‌ها منتقل نشوند، تصاویر اسلایدر و کاتالوگ‌ها ۴۰۴ می‌شوند
    و دادهٔ محتوای سایت (تنظیمات، FAQ، محصولات، مقالات) خالی می‌ماند.

    ⚠️ به‌طور پیش‌فرض سه فایل خصوصی منتقل نمی‌شوند:
        data/admin.json    (هش رمز مدیر)
        data/users.json    (کاربران و نویسندگان)
        data/messages.json (پیام‌های تماس)
    اگر واقعاً می‌خواهید این‌ها هم منتقل شوند، از -IncludePrivateData استفاده کنید؛
    در این حالت ابتدا از دادهٔ سرور بکاپ گرفته می‌شود.

    نیازمند OpenSSH کلاینت ویندوز (پیش‌فرض در ویندوز ۱۰/۱۱) و ورود با کلید SSH.

.EXAMPLE
    .\deploy\push-assets.ps1 -Server 1.2.3.4 -User psm

.EXAMPLE
    # فقط دادهٔ سایت، بدون آپلودها
    .\deploy\push-assets.ps1 -Server 1.2.3.4 -User psm -SkipUploads

.EXAMPLE
    # انتقال کامل شامل فایل‌های خصوصی (با بکاپ خودکار روی سرور)
    .\deploy\push-assets.ps1 -Server 1.2.3.4 -User psm -IncludePrivateData
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Server,
    [string]$User = "psm",
    [string]$RemotePath = "/var/www/psm-valve",
    [switch]$SkipUploads,
    [switch]$IncludePrivateData
)

$ErrorActionPreference = "Stop"

$PrivateFiles = @("admin.json", "users.json", "messages.json")

foreach ($tool in @("ssh", "scp")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "$tool پیدا نشد. قابلیت OpenSSH Client ویندوز را نصب کن (Settings → Optional features)."
    }
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$target = "$User@$Server"

Write-Host "`u{2192} ساخت پوشه‌های مقصد روی سرور ..." -ForegroundColor Cyan
& ssh $target "mkdir -p '$RemotePath/data' '$RemotePath/public/uploads' '$RemotePath/logs'"

# بکاپ قبل از هر نوشتن روی دادهٔ سرور — تا overwrite بدون نسخهٔ قبلی نباشد.
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "`u{2192} بکاپ دادهٔ فعلی سرور (اگر وجود داشته باشد) ..." -ForegroundColor Cyan
& ssh $target "if [ -d '$RemotePath/data' ]; then mkdir -p '$RemotePath/backups' && tar -czf '$RemotePath/backups/data-before-push-$stamp.tar.gz' -C '$RemotePath' data 2>/dev/null && echo 'backup ok'; fi"

$files = Get-ChildItem -File (Join-Path $root "data") | Where-Object {
    if ($IncludePrivateData) { $true } else { $PrivateFiles -notcontains $_.Name }
}

if (-not $files) { throw "هیچ فایلی در data/ برای انتقال پیدا نشد." }

if (-not $IncludePrivateData) {
    Write-Host "`u{26A0} فایل‌های خصوصی منتقل نمی‌شوند: $($PrivateFiles -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host "`u{26A0} انتقال شامل فایل‌های خصوصی است؛ مقادیر سرور بازنویسی می‌شوند (بکاپ گرفته شد)." -ForegroundColor Yellow
}

Write-Host "`u{2192} انتقال $($files.Count) فایل از data/ ..." -ForegroundColor Cyan
foreach ($file in $files) {
    & scp $file.FullName "${target}:${RemotePath}/data/"
    if ($LASTEXITCODE -ne 0) { throw "انتقال $($file.Name) ناموفق بود." }
}

if (-not $SkipUploads) {
    Write-Host "`u{2192} انتقال public/uploads/ (تصاویر، ویدیو، کاتالوگ‌ها) — ممکن است طول بکشد ..." -ForegroundColor Cyan
    & scp -r .\public\uploads\* "${target}:${RemotePath}/public/uploads/"
    if ($LASTEXITCODE -ne 0) { throw "انتقال آپلودها ناموفق بود." }
}

Write-Host "`u{2192} تنظیم دسترسی فایل‌های خصوصی ..." -ForegroundColor Cyan
& ssh $target "chmod 600 '$RemotePath/data/admin.json' 2>/dev/null; chmod 600 '$RemotePath/data/users.json' 2>/dev/null; chmod -R u+rwX '$RemotePath/data' '$RemotePath/public/uploads'; ls -1 '$RemotePath/data' | head -20"

Write-Host "✅ انتقال انجام شد. سپس: pm2 reload psm-valve --update-env" -ForegroundColor Green
Write-Host "   بکاپ قبل از این انتقال: $RemotePath/backups/data-before-push-$stamp.tar.gz" -ForegroundColor DarkGray
