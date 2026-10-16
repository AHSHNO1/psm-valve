<#
.SYNOPSIS
    انتقال دادهٔ سایت و داراییهای آپلودشده از ویندوز به سرور (scp/ssh).

.DESCRIPTION
    این فایلها در گیت نیستند (محتوای کاربرند): data/ و public/uploads/
    اگر سرور تازه است و اینها منتقل نشوند، تصاویر اسلایدر و کاتالوگها ۴۰۴ میشوند
    و دادهٔ محتوای سایت (تنظیمات، FAQ، محصولات، مقالات) خالی میماند.

    نیازمند OpenSSH کلاینت ویندوز (پیشفرض در ویندوز ۱۰/۱۱) و ورود با کلید SSH.

.EXAMPLE
    .\deploy\push-assets.ps1 -Server 1.2.3.4 -User psm

.EXAMPLE
    # فقط دادهٔ سایت، بدون آپلودها
    .\deploy\push-assets.ps1 -Server 1.2.3.4 -User psm -SkipUploads
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Server,
    [string]$User = "psm",
    [string]$RemotePath = "/var/www/psm-valve",
    [switch]$SkipUploads
)

$ErrorActionPreference = "Stop"

foreach ($tool in @("ssh", "scp")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "$tool پیدا نشد. قابلیت OpenSSH Client ویندوز را نصب کن (Settings → Optional features)."
    }
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$target = "$User@$Server"

Write-Host "`u{2192} ساخت پوشههای مقصد روی سرور ..." -ForegroundColor Cyan
& ssh $target "mkdir -p '$RemotePath/data' '$RemotePath/public/uploads' '$RemotePath/logs'"

Write-Host "`u{2192} انتقال data/ (محتوا، تنظیمات، کاربران، پیامها) ..." -ForegroundColor Cyan
& scp -r .\data\* "${target}:${RemotePath}/data/"

if (-not $SkipUploads) {
    Write-Host "`u{2192} انتقال public/uploads/ (تصاویر، ویدیو، کاتالوگها) — ممکن است طول بکشد ..." -ForegroundColor Cyan
    & scp -r .\public\uploads\* "${target}:${RemotePath}/public/uploads/"
}

Write-Host "`u{2192} تنظیم دسترسی فایلهای خصوصی ..." -ForegroundColor Cyan
& ssh $target "chmod 600 '$RemotePath/data/admin.json' 2>/dev/null; chmod 600 '$RemotePath/data/users.json' 2>/dev/null; chmod -R u+rwX '$RemotePath/data' '$RemotePath/public/uploads'; ls -1 '$RemotePath/data' | head -20"

Write-Host "✅ انتقال انجام شد. سپس: pm2 reload psm-valve --update-env" -ForegroundColor Green