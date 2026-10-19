<#
.SYNOPSIS
    نصب و راهاندازی خودکار PSM VALVE روی سرور از ویندوز (SSH).

.DESCRIPTION
    این اسکریپت:
     ۱) فایل deploy/install.sh را روی سرور کپی میکند
     ۲) آن را با دسترسی root اجرا میکند (نصب Node/PM2/Nginx/SSL/بکاپ و ...)
     ۳) در صورت نیاز، داده و آپلودهای محلی را با deploy/push-assets.ps1 منتقل میکند

    نیازمند OpenSSH Client ویندوز (ssh/scp) و ورود با کلید SSH.

.EXAMPLE
    .\deploy\install-remote.ps1 -Server 1.2.3.4 -Domain psmvalve.com -Email admin@psmvalve.com

.EXAMPLE
    # سرور با کاربر sudo (بدون ورود root):
    .\deploy\install-remote.ps1 -Server 1.2.3.4 -SshUser psm -Sudo -Domain psmvalve.com

.EXAMPLE
    # بدون انتقال داده/آپلود و بدون SSL:
    .\deploy\install-remote.ps1 -Server 1.2.3.4 -Domain psmvalve.com -NoSsl -SkipAssets
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Server,
    [string]$SshUser = "root",
    [Parameter(Mandatory = $true)][string]$Domain,
    [string]$Email = "",
    [string]$Repo = "https://github.com/AHSHNO1/psm-valve.git",
    [string]$Branch = "main",
    [string]$AppDir = "/var/www/psm-valve",
    [string]$AppUser = "psm",
    [int]$Port = 3000,
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "",
    [switch]$Sudo,
    [switch]$NoSsl,
    [switch]$NoFirewall,
    [switch]$SkipBuild,
    [switch]$SkipAssets,
    [switch]$IncludePrivateData
)

$ErrorActionPreference = "Stop"

foreach ($tool in @("ssh", "scp")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "$tool پیدا نشد. قابلیت OpenSSH Client ویندوز را نصب کن (Settings → Optional features)."
    }
}

$root = Split-Path -Parent $PSScriptRoot
$installScript = Join-Path $PSScriptRoot "install.sh"
if (-not (Test-Path $installScript)) { throw "deploy/install.sh پیدا نشد." }

$Domain = $Domain -replace "^www\.", ""
$target = "$SshUser@$Server"
$remoteScript = "/tmp/psm-install.sh"

function ConvertTo-ShellArg([string]$value) {
    if ($null -eq $value) { return "''" }
    return "'" + $value.Replace("'", "'\''") + "'"
}

$remoteArgs = @("--domain", (ConvertTo-ShellArg $Domain), "--repo", (ConvertTo-ShellArg $Repo), "--branch", (ConvertTo-ShellArg $Branch), "--app-dir", (ConvertTo-ShellArg $AppDir), "--app-user", (ConvertTo-ShellArg $AppUser), "--admin-user", (ConvertTo-ShellArg $AdminUser), "--port", $Port)
if ($Email) { $remoteArgs += @("--email", (ConvertTo-ShellArg $Email)) }
if ($AdminPassword) { $remoteArgs += @("--admin-password", (ConvertTo-ShellArg $AdminPassword)) }
if ($NoSsl) { $remoteArgs += "--no-ssl" }
if ($NoFirewall) { $remoteArgs += "--no-firewall" }
if ($SkipBuild) { $remoteArgs += "--skip-build" }

$prefix = if ($Sudo) { "sudo " } else { "" }
$remoteCommand = "$prefix`bash $remoteScript " + ($remoteArgs -join " ")

Write-Host "→ انتقال deploy/install.sh به سرور ..." -ForegroundColor Cyan
& scp $installScript "${target}:${remoteScript}"
if ($LASTEXITCODE -ne 0) { throw "انتقال install.sh ناموفق بود." }

if ($AdminPassword) {
    Write-Host "⚠ رمز مدیر روی خط فرمان سرور ارسال میشود؛ بعد از نصب از پنل عوضش کنید." -ForegroundColor Yellow
}

Write-Host "→ اجرای نصب خودکار روی سرور (چند دقیقه طول میکشد) ..." -ForegroundColor Cyan
& ssh $target $remoteCommand
if ($LASTEXITCODE -ne 0) { throw "نصب روی سرور ناموفق بود (کد $LASTEXITCODE)." }

if (-not $SkipAssets) {
    Write-Host "→ انتقال دادهٔ سایت و داراییهای آپلودشده ..." -ForegroundColor Cyan
    $pushArgs = @{ Server = $Server; User = $SshUser; RemotePath = $AppDir }
    if ($IncludePrivateData) { $pushArgs["IncludePrivateData"] = $true }
    & (Join-Path $PSScriptRoot "push-assets.ps1") @pushArgs

    Write-Host "→ اصلاح مالکیت فایلها به کاربر $AppUser ..." -ForegroundColor Cyan
    & ssh $target "$prefix`chown -R ${AppUser}:${AppUser} $AppDir"
    & ssh $target "$prefix`su - $AppUser -c 'export PATH=`$PATH:/usr/bin; cd $AppDir && pm2 reload ecosystem.config.js --update-env'"
}

Write-Host ""
Write-Host "✅ انتشار انجام شد." -ForegroundColor Green
Write-Host "   سایت:  https://www.$Domain/fa"
Write-Host "   پنل:   https://www.$Domain/admin"
Write-Host "   کاربر: $AdminUser"
Write-Host "   بهروزرسانی بعدی: ssh $target  سپس  su - $AppUser -c 'bash $AppDir/deploy/update.sh'"
Write-Host "   اگر رمز تصادفی ساخته شد، در خلاصهٔ بالا و در /root/psm-initial-admin-password.txt است." -ForegroundColor DarkGray