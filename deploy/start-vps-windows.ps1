#Requires -Version 5.1
<#
.SYNOPSIS
    راه‌اندازی یک‌دستوری PSM VALVE روی Windows Server.

.DESCRIPTION
    کد را از پوشهٔ محلی، فایل ZIP یا GitHub می‌آورد، Node.js را در صورت نیاز
    نصب می‌کند، وابستگی‌ها را نصب و پروژه را بیلد می‌کند، رمز مدیر را تنظیم
    می‌کند و اپلیکیشن را به‌صورت Scheduled Task در شروع ویندوز بالا می‌آورد.
    در صورت امکان Caddy را برای HTTP/HTTPS خودکار نصب می‌کند.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -Domain psmvalve.com -Email admin@psmvalve.com

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -Domain 203.0.113.10

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -SourceDir C:\psm-valve -Domain 203.0.113.10
#>
[CmdletBinding()]
param(
    [string]$Domain = "",
    [string]$Email = "",
    [string]$AppDir = "C:\PSMValve",
    [int]$Port = 3000,
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "",
    [string]$AdminPasswordFile = "",
    [string]$SourceDir = "",
    [string]$ZipPath = "",
    [string]$Repo = "https://github.com/AHSHNO1/psm-valve.git",
    [string]$Branch = "main",
    [int]$NodeMajor = 20,
    [switch]$NoHttps,
    [switch]$NoFirewall,
    [switch]$SkipBuild,
    [switch]$ForceEnv,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
try { $OutputEncoding = [Text.Encoding]::UTF8 } catch { }
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch { }

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$script:Utf8Bom = New-Object System.Text.UTF8Encoding($true)
$script:Step = 0
$TotalSteps = 11
$script:Warnings = @()
$script:GeneratedPassword = ""
$script:PasswordKind = "none"
$script:UseProxy = $false
$script:HttpsActive = $false
$script:NodeExe = ""
$script:NpmCmd = ""
$script:CaddyExe = ""
$script:AppTask = "PSM-VALVE"
$script:ProxyTask = "PSM-VALVE-Proxy"

function Show-Help {
    Write-Host @"
PSM VALVE — راه‌اندازی یک‌دستوری روی Windows Server

  powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 [گزینه‌ها]

اگر دامنه ندهید، IP عمومی سرور تشخیص داده می‌شود و سایت روی HTTP بالا می‌آید.

گزینه‌ها:
  -Domain <domain|ip>          دامنه یا IP سرور (پیش‌فرض: تشخیص خودکار IP)
  -Email <email>               ایمیل برای گواهی Let's Encrypt
  -AppDir <path>               مسیر نصب (پیش‌فرض: C:\PSMValve)
  -Port <number>               پورت داخلی اپلیکیشن (پیش‌فرض: 3000)
  -AdminUser <name>            نام کاربری پنل مدیریت (پیش‌فرض: admin)
  -AdminPassword <pass>        رمز پنل (پیش‌فرض: تصادفی و ذخیره در ProgramData)
  -AdminPasswordFile <path>    خواندن رمز از فایل (امن‌تر از خط فرمان)
  -SourceDir <path>            نصب از کد موجود در این مسیر
  -ZipPath <path>              نصب از فایل ZIP پروژه
  -Repo <url>                  دریافت کد از مخزن (پیش‌فرض: مخزن پروژه)
  -Branch <name>               شاخهٔ انتشار (پیش‌فرض: main)
  -NodeMajor <number>          نسخهٔ اصلی Node.js (پیش‌فرض: 20)
  -NoHttps                     فقط HTTP (بدون گواهی)
  -NoFirewall                  بدون تغییر قواعد فایروال
  -SkipBuild                   پرش از بیلد (اگر .next آماده است)
  -ForceEnv                    بازنویسی .env.production با اسرار جدید
  -Help                        همین راهنما

مثال‌ها:
  powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -Domain psmvalve.com -Email admin@psmvalve.com
  powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -Domain 203.0.113.10
  powershell -ExecutionPolicy Bypass -File .\deploy\start-vps-windows.ps1 -SourceDir C:\psm-valve -Domain 203.0.113.10 -NoHttps

پس از نصب:
  powershell -ExecutionPolicy Bypass -File "C:\ProgramData\PSMValve\manage.ps1" -Action status
"@
}

function Write-Info([string]$Message) { Write-Host "    $Message" }
function Write-Ok([string]$Message) { Write-Host "    [OK] $Message" -ForegroundColor Green }
function Write-Note([string]$Message) { Write-Host "    -> $Message" -ForegroundColor DarkGray }
function Write-Warn([string]$Message) {
    Write-Host "    [!] $Message" -ForegroundColor Yellow
    $script:Warnings += $Message
}
function Write-Step([string]$Message) {
    $script:Step++
    Write-Host ""
    Write-Host "==> [$($script:Step)/$TotalSteps] $Message" -ForegroundColor Cyan
}

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal -ArgumentList $identity
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-IP([string]$Value) {
    if ($Value -notmatch '^(\d{1,3}\.){3}\d{1,3}$') { return $false }
    foreach ($part in $Value.Split('.')) {
        if ([int]$part -gt 255) { return $false }
    }
    return $true
}

function Get-PublicIP {
    $urls = @("https://api.ipify.org", "https://ifconfig.me/ip", "https://icanhazip.com")
    foreach ($url in $urls) {
        try {
            $ip = (Invoke-RestMethod -Uri $url -TimeoutSec 8 -ErrorAction Stop).ToString().Trim()
            if (Test-IP $ip) { return $ip }
        } catch { }
    }
    try {
        $candidate = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
            Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.PrefixOrigin -ne "WellKnown" } |
            Select-Object -First 1
        if ($candidate -and (Test-IP $candidate.IPAddress)) { return $candidate.IPAddress }
    } catch { }
    return $null
}

function New-RandomPassword([int]$Length = 20) {
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".ToCharArray()
    $bytes = New-Object byte[] $Length
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $builder = New-Object System.Text.StringBuilder
    foreach ($byte in $bytes) { [void]$builder.Append($chars[$byte % $chars.Length]) }
    return $builder.ToString()
}

function New-Secret([int]$ByteCount = 48) {
    $bytes = New-Object byte[] $ByteCount
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes)
}

function Write-TextFile([string]$Path, [string]$Text, [switch]$Bom) {
    $parent = Split-Path -Parent $Path
    if ($parent -and -not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    if ($Bom) { [IO.File]::WriteAllText($Path, $Text, $script:Utf8Bom) }
    else { [IO.File]::WriteAllText($Path, $Text, $script:Utf8NoBom) }
}

function ConvertTo-PsLiteral([string]$Value) {
    return "'" + $Value.Replace("'", "''") + "'"
}

function Set-PrivateAcl([string]$Path, [switch]$Directory) {
    try {
        $system = New-Object Security.Principal.SecurityIdentifier("S-1-5-18")
        $admins = New-Object Security.Principal.SecurityIdentifier("S-1-5-32-544")
        if ($Directory) {
            $acl = New-Object System.Security.AccessControl.DirectorySecurity
            $acl.SetAccessRuleProtection($true, $false)
            $inheritance = [System.Security.AccessControl.InheritanceFlags]"ContainerInherit, ObjectInherit"
            $propagation = [System.Security.AccessControl.PropagationFlags]::None
            $rules = @(
                (New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList @($system, [System.Security.AccessControl.FileSystemRights]::FullControl, $inheritance, $propagation, [System.Security.AccessControl.AccessControlType]::Allow)),
                (New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList @($admins, [System.Security.AccessControl.FileSystemRights]::FullControl, $inheritance, $propagation, [System.Security.AccessControl.AccessControlType]::Allow))
            )
            foreach ($rule in $rules) { $acl.AddAccessRule($rule) }
            Set-Acl -Path $Path -AclObject $acl
        } else {
            $acl = New-Object System.Security.AccessControl.FileSecurity
            $acl.SetAccessRuleProtection($true, $false)
            $rules = @(
                (New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList @($system, [System.Security.AccessControl.FileSystemRights]::FullControl, [System.Security.AccessControl.AccessControlType]::Allow)),
                (New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList @($admins, [System.Security.AccessControl.FileSystemRights]::FullControl, [System.Security.AccessControl.AccessControlType]::Allow))
            )
            foreach ($rule in $rules) { $acl.AddAccessRule($rule) }
            Set-Acl -Path $Path -AclObject $acl
        }
    } catch {
        Write-Warn "محدودکردن دسترسی «$Path» انجام نشد: $($_.Exception.Message)"
    }
}

function Invoke-Download([string]$Url, [string]$Destination) {
    try {
        Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $Destination -TimeoutSec 300 -ErrorAction Stop
        return $true
    } catch {
        if (Test-Path $Destination) { Remove-Item -LiteralPath $Destination -Force -ErrorAction SilentlyContinue }
        return $false
    }
}

function Test-PortInUse([int]$PortNumber) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $PortNumber -State Listen -ErrorAction Stop
        return [bool]$connections
    } catch {
        try {
            $found = netstat -ano | Select-String -Pattern (":$PortNumber\s+.*LISTENING")
            return [bool]$found
        } catch { return $false }
    }
}

function Test-Tcp([string]$ComputerName, [int]$PortNumber) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($ComputerName, $PortNumber, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(2000)) { return $false }
        $client.EndConnect($async)
        return $true
    } catch { return $false } finally { $client.Close() }
}

function Wait-Http([string]$Url, [int]$Attempts = 45, [int]$DelaySeconds = 2) {
    for ($index = 0; $index -lt $Attempts; $index++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Seconds $DelaySeconds
    }
    return $false
}

function Test-HttpsLocal([string]$HostName) {
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) {
        $task = Get-ScheduledTask -TaskName $script:ProxyTask -ErrorAction SilentlyContinue
        return ((Test-Tcp "127.0.0.1" 443) -and $task -and ($task.State -eq "Running"))
    }
    $resolve = "${HostName}:443:127.0.0.1"
    $code = & $curl.Source -k -s -o NUL -w "%{http_code}" --max-time 8 --resolve $resolve "https://$HostName/fa"
    return ($code -eq "200")
}

function Get-LogTail([string]$Directory, [string]$Filter, [int]$Lines = 25) {
    try {
        $file = Get-ChildItem -Path $Directory -Filter $Filter -File -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $file) { return "(log not found)" }
        return ((Get-Content -LiteralPath $file.FullName -Tail $Lines -ErrorAction Stop) -join [Environment]::NewLine)
    } catch {
        return "(could not read log in $Directory)"
    }
}

function Stop-PsmProcesses {
    foreach ($taskName in @($script:AppTask, $script:ProxyTask)) {
        try { Stop-ScheduledTask -TaskName $taskName -ErrorAction Stop } catch { }
    }

    $wrappers = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessId -ne $PID -and $_.CommandLine -and (
            ($script:RunAppPath -and $_.CommandLine.IndexOf($script:RunAppPath, [StringComparison]::OrdinalIgnoreCase) -ge 0) -or
            ($script:RunCaddyPath -and $_.CommandLine.IndexOf($script:RunCaddyPath, [StringComparison]::OrdinalIgnoreCase) -ge 0)
        )
    }
    foreach ($process in $wrappers) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }

    $appMatch = $script:AppDir.TrimEnd('\') + '\'
    $dataMatch = $script:DataRoot.TrimEnd('\') + '\'
    $children = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -and (
            ($_.Name -eq "node.exe" -and $_.CommandLine.IndexOf($appMatch, [StringComparison]::OrdinalIgnoreCase) -ge 0) -or
            ($_.Name -eq "caddy.exe" -and $_.CommandLine.IndexOf($dataMatch, [StringComparison]::OrdinalIgnoreCase) -ge 0)
        )
    }
    foreach ($process in $children) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }

    if ($wrappers -or $children) { Start-Sleep -Seconds 2 }
}

function Install-NodeIfNeeded {
    $candidates = @()
    $command = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($command) { $candidates += $command.Source }
    $machineNode = Join-Path $env:ProgramFiles "nodejs\node.exe"
    if (Test-Path $machineNode) { $candidates += $machineNode }
    $candidates = $candidates | Select-Object -Unique

    $best = $null
    $bestMajor = -1
    foreach ($candidate in $candidates) {
        try {
            $version = (& $candidate -v 2>$null | Select-Object -First 1)
            if (-not $version) { continue }
            $major = [int]($version.TrimStart('v').Split('.')[0])
            if ($major -gt $bestMajor) { $best = $candidate; $bestMajor = $major }
        } catch { }
    }

    if ($bestMajor -ge $NodeMajor) {
        $script:NodeExe = $best
        Write-Ok "Node.js موجود است: $(& $script:NodeExe -v) ($script:NodeExe)"
    } else {
        Write-Info "نصب Node.js $NodeMajor LTS از nodejs.org ..."
        $arch = "x64"
        if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { $arch = "arm64" }
        $index = $null
        try { $index = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -TimeoutSec 60 -ErrorAction Stop } catch { }
        if (-not $index) { throw "دریافت فهرست نسخه‌های Node.js ناموفق بود. اتصال اینترنت سرور را بررسی کنید." }
        $entry = $index | Where-Object { $_.version -like "v$NodeMajor.*" } | Select-Object -First 1
        if (-not $entry) { throw "نسخهٔ Node.js v$NodeMajor در nodejs.org پیدا نشد." }
        if ($entry.files -notcontains "win-$arch-msi") {
            throw "نسخهٔ MSI ویندوز $arch برای Node.js $($entry.version) موجود نیست."
        }
        $msiName = "node-$($entry.version)-$arch.msi"
        $msiUrl = "https://nodejs.org/dist/$($entry.version)/$msiName"
        $msiPath = Join-Path $script:TempRoot $msiName
        if (-not (Invoke-Download $msiUrl $msiPath)) { throw "دانلود Node.js از $msiUrl ناموفق بود." }
        Unblock-File -LiteralPath $msiPath -ErrorAction SilentlyContinue
        $msiLog = Join-Path $script:DataRoot "node-install.log"
        $msiArgs = @("/i", "`"$msiPath`"", "/qn", "/norestart", "/L*v", "`"$msiLog`"")
        $installer = Start-Process -FilePath "$env:SystemRoot\System32\msiexec.exe" -ArgumentList $msiArgs -Wait -PassThru
        if ($null -ne $installer.ExitCode -and $installer.ExitCode -notin @(0, 1638, 1641, 3010)) {
            throw "نصب Node.js ناموفق بود (کد $($installer.ExitCode)). جزئیات: $msiLog"
        }
        $env:Path = $machineNode.Substring(0, $machineNode.Length - "node.exe".Length) + ";" +
            [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [Environment]::GetEnvironmentVariable("Path", "User")
        if (-not (Test-Path $machineNode)) { throw "پس از نصب، node.exe در $machineNode پیدا نشد." }
        $script:NodeExe = $machineNode
        Write-Ok "Node.js نصب شد: $(& $script:NodeExe -v)"
    }

    $nodeDirectory = Split-Path -Parent $script:NodeExe
    if (-not ($env:Path.Split(';') -contains $nodeDirectory)) {
        $env:Path = "$nodeDirectory;$env:Path"
    }
    $npm = Join-Path $nodeDirectory "npm.cmd"
    if (-not (Test-Path $npm)) {
        $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if (-not $npmCommand) { throw "npm.cmd پیدا نشد. نصب Node.js را بررسی کنید." }
        $npm = $npmCommand.Source
    }
    $script:NpmCmd = $npm
}

function Copy-Project([string]$From, [string]$To, [bool]$Existing) {
    $fromFull = [IO.Path]::GetFullPath($From)
    $toFull = [IO.Path]::GetFullPath($To)
    if ($fromFull.Length -gt 3) { $fromFull = $fromFull.TrimEnd('\') }
    if ($toFull.Length -gt 3) { $toFull = $toFull.TrimEnd('\') }

    if ($fromFull.Equals($toFull, [StringComparison]::OrdinalIgnoreCase)) {
        Write-Ok "منبع و مسیر نصب یکی هستند — کپی لازم نیست"
        return
    }
    if ($toFull.StartsWith($fromFull + "\", [StringComparison]::OrdinalIgnoreCase)) {
        throw "مسیر نصب نمی‌تواند داخل پوشهٔ منبع باشد: $toFull"
    }
    if ($fromFull.StartsWith($toFull + "\", [StringComparison]::OrdinalIgnoreCase)) {
        throw "پوشهٔ منبع نمی‌تواند داخل مسیر نصب باشد: $fromFull"
    }
    if (-not (Test-Path $toFull)) { New-Item -ItemType Directory -Force -Path $toFull | Out-Null }

    $robocopyArgs = @($fromFull, $toFull, "/MIR", "/R:1", "/W:1", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/XD", ".git", "node_modules", ".next", "logs")
    if ($Existing) {
        $robocopyArgs += @("data", "uploads", "/XF", ".env", ".env.*", ".app-port")
        Write-Info "همگام‌سازی کد (داده، آپلود و env سرور حفظ می‌شوند) ..."
    } else {
        $robocopyArgs += @("/XF", ".env", ".env.*", ".app-port", "admin.json", "admin.json.backup-*", "users.json", "messages.json", "psm-valve.sqlite*", "*.tmp")
        Write-Info "انتقال کد (دادهٔ خصوصی و رمزهای محلی منتقل نمی‌شوند) ..."
    }

    & robocopy @robocopyArgs | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "کپی کد با robocopy ناموفق بود (کد $LASTEXITCODE)." }
    Write-Ok "کد در $toFull آماده است"
}

function Ensure-Caddy {
    if (Test-Path $script:CaddyExe) {
        try {
            & $script:CaddyExe version *> $null
            if ($LASTEXITCODE -eq 0) { return $true }
        } catch { }
    }

    $arch = "amd64"
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { $arch = "arm64" }
    $zip = Join-Path $script:TempRoot "caddy.zip"
    $downloaded = $false

    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/caddyserver/caddy/releases/latest" `
            -Headers @{ "User-Agent" = "psm-valve-installer" } -TimeoutSec 30 -ErrorAction Stop
        $asset = $release.assets | Where-Object { $_.name -like "*windows_$arch.zip" } | Select-Object -First 1
        if ($asset) { $downloaded = Invoke-Download $asset.browser_download_url $zip }
    } catch { }

    if (-not $downloaded) {
        $downloaded = Invoke-Download "https://caddyserver.com/api/download?os=windows&arch=$arch" $zip
    }
    if (-not $downloaded) {
        Write-Warn "دریافت Caddy ناموفق بود — سایت بدون پروکسی روی پورت $Port اجرا می‌شود."
        return $false
    }

    try {
        $extract = Join-Path $script:TempRoot "caddy"
        if (Test-Path $extract) { Remove-Item -LiteralPath $extract -Recurse -Force -ErrorAction SilentlyContinue }
        Expand-Archive -Path $zip -DestinationPath $extract -Force
        $exe = Get-ChildItem -Path $extract -Filter "caddy.exe" -Recurse -File | Select-Object -First 1
        if (-not $exe) { throw "caddy.exe در آرشیو پیدا نشد." }
        Copy-Item -LiteralPath $exe.FullName -Destination $script:CaddyExe -Force
        Unblock-File -LiteralPath $script:CaddyExe -ErrorAction SilentlyContinue
        & $script:CaddyExe version *> $null
        if ($LASTEXITCODE -ne 0) { throw "caddy.exe اجرا نشد." }
        Write-Ok "Caddy آماده است: $(& $script:CaddyExe version)"
        return $true
    } catch {
        Write-Warn "آماده‌سازی Caddy ناموفق بود: $($_.Exception.Message)"
        return $false
    }
}

function Set-PsmFirewall([bool]$Proxy, [bool]$Https) {
    if ($NoFirewall) {
        Write-Warn "فایروال تغییر نکرد (-NoFirewall). پورت‌های لازم را دستی باز کنید."
        return
    }
    try {
        Get-NetFirewallRule -Group "PSM VALVE" -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
        if ($Proxy) {
            New-NetFirewallRule -DisplayName "PSM VALVE HTTP" -Group "PSM VALVE" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -Profile Any | Out-Null
            if ($Https) {
                New-NetFirewallRule -DisplayName "PSM VALVE HTTPS" -Group "PSM VALVE" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 -Profile Any | Out-Null
            }
            Write-Ok "فایروال: پورت 80$(if ($Https) { ' و 443' }) باز شد"
        } else {
            New-NetFirewallRule -DisplayName "PSM VALVE App" -Group "PSM VALVE" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Any | Out-Null
            Write-Ok "فایروال: پورت $Port باز شد"
        }
    } catch {
        Write-Warn "تنظیم فایروال ویندوز ناموفق بود: $($_.Exception.Message)"
    }
}

function Register-PsmTask([string]$Name, [string]$ScriptPath, [string]$WorkDirectory, [string]$Description) {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $ScriptPath) `
        -WorkingDirectory $WorkDirectory
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
        -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName $Name -Action $action -Trigger $trigger -Settings $settings `
        -Principal $principal -Description $Description -Force | Out-Null
}

function Write-Caddyfile([bool]$Https) {
    $dataPath = $script:CaddyData.Replace('\', '/')
    $lines = @("{", "    admin off")
    if ($Https) {
        if ($Email) { $lines += "    email $Email" }
        $lines += "    storage file_system `"$dataPath`""
        $lines += "}"
        $lines += ""
        $lines += "$Domain, www.$Domain {"
    } else {
        $lines += "    auto_https off"
        $lines += "    storage file_system `"$dataPath`""
        $lines += "}"
        $lines += ""
        $lines += ":80 {"
    }
    $lines += "    encode zstd gzip"
    $lines += "    reverse_proxy 127.0.0.1:$Port"
    $lines += "}"
    Write-TextFile $script:CaddyfilePath (($lines -join "`r`n") + "`r`n")
}

function Start-ProxyRuntime {
    Stop-ProxyRuntime
    Start-ScheduledTask -TaskName $script:ProxyTask
}

function Stop-ProxyRuntime {
    try { Stop-ScheduledTask -TaskName $script:ProxyTask -ErrorAction Stop } catch { }
    $dataMatch = $script:DataRoot.TrimEnd('\') + '\'
    $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -and (
            ($_.Name -eq "caddy.exe" -and $_.CommandLine.IndexOf($dataMatch, [StringComparison]::OrdinalIgnoreCase) -ge 0) -or
            ($_.Name -eq "powershell.exe" -and $_.ProcessId -ne $PID -and $_.CommandLine.IndexOf($script:RunCaddyPath, [StringComparison]::OrdinalIgnoreCase) -ge 0)
        )
    }
    foreach ($process in $processes) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

trap {
    Write-Host ""
    Write-Host "[X] نصب ناموفق بود: $($_.Exception.Message)" -ForegroundColor Red
    if ($script:LogDir -and (Test-Path $script:LogDir)) {
        $tail = Get-LogTail $script:LogDir "app-*.log" 20
        if ($tail -and $tail -ne "(log not found)") {
            Write-Host "  آخرین خطوط لاگ برنامه:" -ForegroundColor Yellow
            Write-Host $tail
        }
    }
    exit 1
}

if ($Help) { Show-Help; exit 0 }

if ([string]::IsNullOrWhiteSpace($AppDir)) { throw "مسیر نصب (-AppDir) خالی است." }
$AppDir = [IO.Path]::GetFullPath($AppDir)
if ($AppDir.Length -gt 3) { $AppDir = $AppDir.TrimEnd('\') }
if ($SourceDir) { $SourceDir = [IO.Path]::GetFullPath($SourceDir) }
if ($ZipPath) { $ZipPath = [IO.Path]::GetFullPath($ZipPath) }
if ($AdminPasswordFile) { $AdminPasswordFile = [IO.Path]::GetFullPath($AdminPasswordFile) }

if (-not (Test-Admin)) {
    if (-not $PSCommandPath) {
        throw "برای نصب دسترسی Administrator لازم است. PowerShell را Run as Administrator باز کنید و اسکریپت را دوباره اجرا کنید."
    }
    $scriptPath = [IO.Path]::GetFullPath($PSCommandPath)
    $values = [ordered]@{
        Domain = $Domain
        Email = $Email
        AppDir = $AppDir
        Port = $Port
        AdminUser = $AdminUser
        AdminPassword = $AdminPassword
        AdminPasswordFile = $AdminPasswordFile
        SourceDir = $SourceDir
        ZipPath = $ZipPath
        Repo = $Repo
        Branch = $Branch
        NodeMajor = $NodeMajor
    }
    $parts = @("& '" + $scriptPath.Replace("'", "''") + "'")
    foreach ($key in $values.Keys) {
        $value = ([string]$values[$key]).Replace("'", "''")
        $parts += ("-$key '{0}'" -f $value)
    }
    foreach ($switchName in @("NoHttps", "NoFirewall", "SkipBuild", "ForceEnv")) {
        if ([bool](Get-Variable -Name $switchName -ValueOnly)) { $parts += "-$switchName" }
    }
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes(($parts -join " ")))
    Write-Host "درخواست دسترسی Administrator ..." -ForegroundColor Cyan
    $elevated = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile -ExecutionPolicy Bypass -EncodedCommand $encoded" `
        -Verb RunAs -PassThru -Wait
    if ($null -ne $elevated.ExitCode) { exit $elevated.ExitCode }
    exit 0
}

$script:DataRoot = Join-Path ([Environment]::GetFolderPath("CommonApplicationData")) "PSMValve"
$script:AppDir = $AppDir
$script:LogDir = Join-Path $AppDir "logs"
$script:CaddyLogDir = Join-Path $script:DataRoot "logs"
$script:TempRoot = Join-Path $script:DataRoot "tmp"
$script:CaddyExe = Join-Path $script:DataRoot "caddy.exe"
$script:CaddyfilePath = Join-Path $script:DataRoot "Caddyfile"
$script:CaddyData = Join-Path $script:DataRoot "caddy-data"
$script:RunAppPath = Join-Path $script:DataRoot "run-app.ps1"
$script:RunCaddyPath = Join-Path $script:DataRoot "run-caddy.ps1"

if ($script:DataRoot.Equals($AppDir, [StringComparison]::OrdinalIgnoreCase) -or
    $script:DataRoot.StartsWith($AppDir + "\", [StringComparison]::OrdinalIgnoreCase)) {
    throw "مسیر نصب (-AppDir) نمی‌تواند شامل $script:DataRoot باشد. مسیر دیگری بدهید."
}
if ($AppDir -match '^[A-Za-z]:$') { throw "نصب در ریشهٔ درایو مجاز نیست: $AppDir" }

if ($AdminUser -notmatch '^[A-Za-z0-9._@-]{1,64}$') {
    throw "نام کاربری مدیر نامعتبر است: $AdminUser"
}
if ($Port -lt 1 -or $Port -gt 65535) { throw "پورت خارج از بازهٔ مجاز (1-65535): $Port" }
if ($SourceDir -and $ZipPath) { throw "هم‌زمان -SourceDir و -ZipPath ندهید." }
if ($AdminPassword -and $AdminPasswordFile) { throw "هم‌زمان -AdminPassword و -AdminPasswordFile ندهید." }
if ($NodeMajor -lt 20) { throw "Node.js باید دست‌کم نسخهٔ 20 باشد." }

$Domain = $Domain.Trim()
$Domain = $Domain -replace '^https?://', ''
$Domain = $Domain.TrimEnd('/')
$Domain = $Domain -replace '^www\.', ''
if ([string]::IsNullOrWhiteSpace($Domain)) {
    $Domain = Get-PublicIP
    if (-not $Domain) {
        throw "IP عمومی سرور تشخیص داده نشد. با -Domain <domain|ip> دستی بدهید."
    }
    Write-Ok "دامنه داده نشد — IP عمومی تشخیص داده شد: $Domain"
}
$IsIp = Test-IP $Domain
if (-not $IsIp -and $Domain -notmatch '^[A-Za-z0-9.-]+$') {
    throw "دامنهٔ نامعتبر: $Domain"
}

$WantHttps = (-not $NoHttps) -and (-not $IsIp)
if ($IsIp -and -not $NoHttps) {
    Write-Warn "دامنه یک IP است؛ HTTPS غیرفعال شد. برای گواهی، یک دامنه به این IP وصل کنید."
}
if ($WantHttps -and -not $Email) { $Email = "admin@$Domain" }
if ($WantHttps -and $Email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
    Write-Warn "ایمیل نامعتبر است؛ Caddy بدون ایمیل ادامه می‌دهد."
    $Email = ""
}

New-Item -ItemType Directory -Force -Path $script:DataRoot | Out-Null
Set-PrivateAcl -Path $script:DataRoot -Directory
New-Item -ItemType Directory -Force -Path $script:CaddyLogDir | Out-Null
if (Test-Path $script:TempRoot) {
    try { Remove-Item -LiteralPath $script:TempRoot -Recurse -Force -ErrorAction Stop } catch { }
}
New-Item -ItemType Directory -Force -Path $script:TempRoot | Out-Null

Write-Step "بررسی پیش‌نیازها و توقف نسخهٔ قبلی"
if (-not (Get-Command Register-ScheduledTask -ErrorAction SilentlyContinue)) {
    throw "ماژول ScheduledTasks در دسترس نیست. این اسکریپت برای Windows Server 2012 R2 به بعد نوشته شده است."
}
if (-not (Get-Command robocopy.exe -ErrorAction SilentlyContinue)) { throw "robocopy.exe پیدا نشد." }
if (-not (Get-Command Expand-Archive -ErrorAction SilentlyContinue)) { throw "Expand-Archive پیدا نشد." }
Write-Ok "ویندوز $([Environment]::OSVersion.Version) · PowerShell $($PSVersionTable.PSVersion) · Administrator"

Stop-PsmProcesses
for ($index = 0; $index -lt 15 -and (Test-PortInUse $Port); $index++) { Start-Sleep -Seconds 1 }
if (Test-PortInUse $Port) {
    $owner = "unknown"
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen | Select-Object -First 1
        if ($connection) { $owner = (Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue).ProcessName }
    } catch { }
    throw "پورت $Port توسط برنامهٔ دیگری ($owner) اشغال است. آن را متوقف کنید یا -Port بدهید."
}
Write-Ok "پورت $Port آزاد است"

Write-Step "دریافت کد پروژه"
$existingInstall = Test-Path (Join-Path $AppDir "package.json")
$sourcePath = ""
$sourceKind = ""

if ($SourceDir) {
    if (-not (Test-Path (Join-Path $SourceDir "package.json"))) {
        throw "package.json در منبع پیدا نشد: $SourceDir"
    }
    $sourcePath = $SourceDir
    $sourceKind = "local"
} elseif ($ZipPath) {
    if (-not (Test-Path $ZipPath)) { throw "فایل ZIP پیدا نشد: $ZipPath" }
    Write-Info "باز کردن $ZipPath ..."
    $extract = Join-Path $script:TempRoot "zip"
    Expand-Archive -Path $ZipPath -DestinationPath $extract -Force
    $root = Get-ChildItem -Path $extract -Directory | Where-Object { Test-Path (Join-Path $_.FullName "package.json") } | Select-Object -First 1
    if (-not $root -and (Test-Path (Join-Path $extract "package.json"))) {
        $sourcePath = $extract
    } elseif ($root) {
        $sourcePath = $root.FullName
    } else {
        throw "package.json در فایل ZIP پیدا نشد."
    }
    $sourceKind = "zip"
} else {
    $candidates = @()
    if ($PSScriptRoot) {
        $candidates += (Split-Path -Parent $PSScriptRoot)
        $candidates += $PSScriptRoot
    }
    foreach ($candidate in $candidates) {
        if ($candidate -and
            (Test-Path (Join-Path $candidate "package.json")) -and
            (Test-Path (Join-Path $candidate "next.config.mjs")) -and
            (Test-Path (Join-Path $candidate "deploy"))) {
            $sourcePath = $candidate
            $sourceKind = "local"
            break
        }
    }
}

if (-not $sourcePath) {
    if (-not $Repo) { throw "منبع کد مشخص نیست. -SourceDir یا -ZipPath یا -Repo بدهید." }
    Write-Info "دانلود کد از $Repo (شاخهٔ $Branch) ..."
    $githubZip = $false
    if ($Repo -match '^https://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$') {
        $owner = $Matches[1]
        $repository = $Matches[2] -replace '\.git$', ''
        $zipUrl = "https://github.com/$owner/$repository/archive/refs/heads/$Branch.zip"
        $zipFile = Join-Path $script:TempRoot "source.zip"
        $githubZip = Invoke-Download $zipUrl $zipFile
        if ($githubZip) {
            $extract = Join-Path $script:TempRoot "github"
            Expand-Archive -Path $zipFile -DestinationPath $extract -Force
            $root = Get-ChildItem -Path $extract -Directory | Where-Object { Test-Path (Join-Path $_.FullName "package.json") } | Select-Object -First 1
            if ($root) {
                $sourcePath = $root.FullName
                $sourceKind = "github"
            } else {
                $githubZip = $false
            }
        }
    }
    if (-not $githubZip) {
        $git = Get-Command git.exe -ErrorAction SilentlyContinue
        if (-not $git) {
            throw "دریافت کد ناموفق بود (مخزن خصوصی یا شاخهٔ نامعتبر). پروژه را روی سرور کپی کنید و با -SourceDir اجرا کنید، یا -ZipPath بدهید."
        }
        $clone = Join-Path $script:TempRoot "git"
        & $git.Source clone --depth 1 --branch $Branch $Repo $clone
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path (Join-Path $clone "package.json"))) {
            throw "git clone ناموفق بود. پروژه را روی سرور کپی کنید و با -SourceDir اجرا کنید."
        }
        $sourcePath = $clone
        $sourceKind = "git"
    }
    Write-Ok "کد دریافت شد ($sourceKind)"
}

if (-not $existingInstall) {
    if ((Test-Path $AppDir) -and (Get-ChildItem -LiteralPath $AppDir -Force -ErrorAction SilentlyContinue | Select-Object -First 1)) {
        throw "پوشهٔ $AppDir خالی نیست و نصب قبلی ندارد. آن را خالی کنید یا -AppDir دیگری بدهید."
    }
}

Copy-Project -From $sourcePath -To $AppDir -Existing $existingInstall

foreach ($directory in @($script:LogDir, (Join-Path $AppDir "data"), (Join-Path $AppDir "public\uploads"))) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
}
Set-PrivateAcl -Path (Join-Path $AppDir "data") -Directory
Write-TextFile (Join-Path $AppDir ".app-port") "$Port"
Write-Ok "مسیر داده: $(Join-Path $AppDir 'data') · آپلودها: $(Join-Path $AppDir 'public\uploads')"

Write-Step "نصب Node.js $NodeMajor"
Install-NodeIfNeeded

Write-Step "نصب وابستگی‌ها (npm ci)"
Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
Push-Location -LiteralPath $AppDir
try {
    & $script:NpmCmd ci --no-audit --no-fund --include=dev
    $npmExit = $LASTEXITCODE
} finally {
    Pop-Location
}
if ($npmExit -ne 0) {
    throw "npm ci ناموفق بود. اگر بهتر-sqlite3 باینری آماده نداشت، Visual Studio Build Tools 2022 (Desktop development with C++) را نصب و دوباره اجرا کنید."
}
Write-Ok "node_modules آماده است"

Write-Step "ساخت .env.production"
$envFile = Join-Path $AppDir ".env.production"
$envCreated = $false
if ((Test-Path $envFile) -and -not $ForceEnv) {
    Write-Ok ".env.production از قبل وجود دارد — دست‌نخورده ماند"
} else {
    if (Test-Path $envFile) { Write-Warn "بازنویسی .env.production با اسرار جدید (-ForceEnv)" }
    $jwtSecret = New-Secret 48
    $challengeSecret = New-Secret 32
    $envLines = @(
        "# PSM VALVE — متغیرهای محیطی تولید",
        "# ساخته‌شده توسط deploy/start-vps-windows.ps1 — در گیت ردیابی نمی‌شود.",
        "NODE_ENV=production",
        "",
        "# ---------- امنیت (اجباری) ----------",
        "JWT_SECRET=$jwtSecret",
        "ADMIN_USERNAME=$AdminUser",
        "ADMIN_PASSWORD=",
        "ADMIN_PASSWORD_HASH=",
        "ADMIN_ALLOW_INSECURE_DEV_CREDENTIALS=",
        "CONTACT_CHALLENGE_SECRET=$challengeSecret",
        "",
        "# ---------- اعلان ایمیلی فرم تماس (اختیاری) ----------",
        "SMTP_HOST=smtp.gmail.com",
        "SMTP_PORT=465",
        "SMTP_SECURE=true",
        "SMTP_USER=psmvalve@gmail.com",
        "SMTP_PASS=",
        "CONTACT_TO=psmvalve@gmail.com"
    )
    Write-TextFile $envFile (($envLines -join "`r`n") + "`r`n")
    $envCreated = $true
    Write-Ok "اسرار تصادفی ساخته شد"
}
Set-PrivateAcl -Path $envFile
$envText = [IO.File]::ReadAllText($envFile)
if ($envText -notmatch '(?m)^JWT_SECRET=[^\r\n]{32,}') {
    throw "JWT_SECRET در .env.production معتبر نیست. با -ForceEnv اجرا کنید تا بازنویسی شود."
}
Write-Ok "متغیرهای محیطی آماده‌اند (دسترسی محدود به SYSTEM و Administrators)"

Write-Step "تنظیم رمز پنل مدیریت"
$adminFile = Join-Path $AppDir "data\admin.json"
$effectiveAdminUser = $AdminUser
if (Test-Path $adminFile) {
    try {
        $adminData = Get-Content -LiteralPath $adminFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($adminData.username) { $effectiveAdminUser = [string]$adminData.username }
    } catch {
        throw "data/admin.json خراب است. آن را اصلاح کنید یا با scripts/rotate-admin-password.mjs رمز را بازنشانی کنید."
    }
    if ($effectiveAdminUser -ne $AdminUser) {
        Write-Warn "نام کاربری از data/admin.json خوانده شد: «$effectiveAdminUser» — برای تغییر، از scripts/rotate-admin-password.mjs --username استفاده کنید."
    }
    if ($AdminPassword -or $AdminPasswordFile) {
        Write-Warn "رمز مدیر از قبل تنظیم شده؛ -AdminPassword/-AdminPasswordFile نادیده گرفته شد (برای تغییر، scripts/rotate-admin-password.mjs)."
    }
    $script:PasswordKind = "existing"
    Write-Ok "رمز مدیر از قبل تنظیم شده است (کاربر: $effectiveAdminUser)"
} else {
    $newPassword = ""
    if ($AdminPasswordFile) {
        if (-not (Test-Path $AdminPasswordFile)) { throw "فایل رمز پیدا نشد: $AdminPasswordFile" }
        $newPassword = (Get-Content -LiteralPath $AdminPasswordFile -TotalCount 1 -Encoding UTF8)
        if ($null -eq $newPassword) { $newPassword = "" }
        $script:PasswordKind = "provided-file"
    } elseif ($AdminPassword) {
        $newPassword = $AdminPassword
        $script:PasswordKind = "provided"
        Write-Warn "رمز روی خط فرمان ممکن است در تاریخچه/لاگ دیده شود؛ -AdminPasswordFile امن‌تر است."
    } else {
        $newPassword = New-RandomPassword 20
        $script:PasswordKind = "generated"
        $script:GeneratedPassword = $newPassword
    }
    if ($newPassword.Length -lt 12) { throw "رمز مدیر باید دست‌کم 12 کاراکتر باشد." }

    $tempPasswordFile = Join-Path $script:DataRoot (".admin-pass-" + [guid]::NewGuid().ToString("N") + ".tmp")
    Write-TextFile $tempPasswordFile $newPassword
    Set-PrivateAcl -Path $tempPasswordFile
    Push-Location -LiteralPath $AppDir
    try {
        & $script:NodeExe "scripts\rotate-admin-password.mjs" --password-file $tempPasswordFile --username $AdminUser
        $rotateExit = $LASTEXITCODE
    } finally {
        Pop-Location
        Remove-Item -LiteralPath $tempPasswordFile -Force -ErrorAction SilentlyContinue
    }
    if ($rotateExit -ne 0) { throw "ذخیرهٔ رمز مدیر ناموفق بود." }
    Set-PrivateAcl -Path $adminFile
    Write-Ok "رمز مدیر ذخیره شد (هش bcrypt) برای کاربر «$AdminUser»"

    if ($script:GeneratedPassword) {
        $passwordFile = Join-Path $script:DataRoot "initial-admin-password.txt"
        Write-TextFile $passwordFile $script:GeneratedPassword
        Set-PrivateAcl -Path $passwordFile
        Write-Ok "رمز اولیه در $passwordFile ذخیره شد (دسترسی محدود)"
    }
}

Write-Step "بیلد نسخهٔ تولید"
$buildId = Join-Path $AppDir ".next\BUILD_ID"
if ($SkipBuild) {
    if (-not (Test-Path $buildId)) { throw "بیلد (.next\BUILD_ID) موجود نیست؛ -SkipBuild را بردارید." }
    Write-Warn "بیلد رد شد (-SkipBuild)."
    if ($envCreated -or $ForceEnv) {
        Write-Warn "متغیرهای محیطی تازه ساخته شدند؛ بدون بیلد دوباره، JWT_SECRET در middleware به‌روز نمی‌شود."
    }
} else {
    Write-Info "این گام چند دقیقه طول می‌کشد ..."
    $env:NODE_ENV = "production"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    $env:NODE_OPTIONS = "--max-old-space-size=2048"
    Push-Location -LiteralPath $AppDir
    try {
        & $script:NpmCmd run build
        $buildExit = $LASTEXITCODE
    } finally {
        Pop-Location
        Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
        Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
    }
    if ($buildExit -ne 0) { throw "بیلد ناموفق بود (کد $buildExit)." }
    if (-not (Test-Path $buildId)) { throw "پس از بیلد، .next\BUILD_ID پیدا نشد." }
    Write-Ok "بیلد کامل شد: $(Join-Path $AppDir '.next')"
}

Push-Location -LiteralPath $AppDir
try {
    & $script:NodeExe "scripts\preflight.mjs"
    $preflightExit = $LASTEXITCODE
} finally {
    Pop-Location
}
if ($preflightExit -ne 0) { Write-Warn "preflight خطا داد؛ خروجی بالا را بررسی کنید." }
else { Write-Ok "preflight بدون خطای جدی بود" }

Write-Step "آماده‌سازی پروکسی و فایروال"
if (Test-PortInUse 80) {
    $owner = "unknown"
    try {
        $connection = Get-NetTCPConnection -LocalPort 80 -State Listen | Select-Object -First 1
        if ($connection) { $owner = (Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue).ProcessName }
    } catch { }
    Write-Warn "پورت 80 توسط $owner اشغال است (احتمالاً IIS). پروکسی غیرفعال شد؛ سایت مستقیم روی پورت $Port سرو می‌شود."
} else {
    if ($WantHttps -and (Test-PortInUse 443)) {
        Write-Warn "پورت 443 اشغال است؛ HTTPS غیرفعال شد."
        $WantHttps = $false
    }
    if (Ensure-Caddy) { $script:UseProxy = $true }
}
Set-PsmFirewall -Proxy $script:UseProxy -Https $WantHttps
if (-not $script:UseProxy) {
    try {
        Stop-ProxyRuntime
        Unregister-ScheduledTask -TaskName $script:ProxyTask -Confirm:$false -ErrorAction SilentlyContinue
    } catch { }
}

Write-Step "ثبت و اجرای سرویس اپلیکیشن"
$nextBin = Join-Path $AppDir "node_modules\next\dist\bin\next"
$runAppLines = @(
    '$ErrorActionPreference = "Stop"',
    '$env:NODE_ENV = "production"',
    '$env:NEXT_TELEMETRY_DISABLED = "1"',
    ('$env:PORT = "{0}"' -f $Port),
    ('$env:Path = {0} + ";" + $env:Path' -f (ConvertTo-PsLiteral (Split-Path -Parent $script:NodeExe))),
    ('Set-Location -LiteralPath {0}' -f (ConvertTo-PsLiteral $AppDir)),
    'while ($true) {',
    ('    $log = Join-Path {0} ("app-" + (Get-Date -Format "yyyyMMdd") + ".log")' -f (ConvertTo-PsLiteral $script:LogDir)),
    ('    & {0} {1} start -p "{2}" *>> $log' -f (ConvertTo-PsLiteral $script:NodeExe), (ConvertTo-PsLiteral $nextBin), $Port),
    '    Start-Sleep -Seconds 5',
    '}'
)
$runApp = ($runAppLines -join "`r`n")
Write-TextFile $script:RunAppPath $runApp

Register-PsmTask -Name $script:AppTask -ScriptPath $script:RunAppPath -WorkDirectory $AppDir -Description "PSM VALVE web application"
Start-ScheduledTask -TaskName $script:AppTask
if (-not (Wait-Http "http://127.0.0.1:$Port/fa" -Attempts 60 -DelaySeconds 2)) {
    $taskInfo = Get-ScheduledTaskInfo -TaskName $script:AppTask -ErrorAction SilentlyContinue
    if ($taskInfo) { Write-Warn "وضعیت تسک: $($taskInfo.LastTaskResult)" }
    Write-Host (Get-LogTail $script:LogDir "app-*.log" 30) -ForegroundColor DarkYellow
    throw "اپلیکیشن روی http://127.0.0.1:$Port/fa پاسخ نداد. لاگ بالا را بررسی کنید."
}
Write-Ok "اپلیکیشن سالم است: http://127.0.0.1:$Port/fa"

Write-Step "راه‌اندازی وب‌سرور (Caddy)"
if (-not $script:UseProxy) {
    Write-Warn "پروکسی استفاده نشد؛ آدرس عمومی شامل پورت $Port است."
} else {
    if (-not (Test-Path $script:CaddyData)) { New-Item -ItemType Directory -Force -Path $script:CaddyData | Out-Null }
    Set-PrivateAcl -Path $script:CaddyData -Directory
    Write-Caddyfile -Https $WantHttps

    $runCaddyLines = @(
        '$ErrorActionPreference = "Stop"',
        ('Set-Location -LiteralPath {0}' -f (ConvertTo-PsLiteral $script:DataRoot)),
        'while ($true) {',
        ('    $log = Join-Path {0} ("caddy-" + (Get-Date -Format "yyyyMMdd") + ".log")' -f (ConvertTo-PsLiteral $script:CaddyLogDir)),
        ('    & {0} run --config {1} --adapter caddyfile *>> $log' -f (ConvertTo-PsLiteral $script:CaddyExe), (ConvertTo-PsLiteral $script:CaddyfilePath)),
        '    Start-Sleep -Seconds 10',
        '}'
    )
    $runCaddy = ($runCaddyLines -join "`r`n")
    Write-TextFile $script:RunCaddyPath $runCaddy

    Register-PsmTask -Name $script:ProxyTask -ScriptPath $script:RunCaddyPath -WorkDirectory $script:DataRoot -Description "PSM VALVE reverse proxy"
    Start-ScheduledTask -TaskName $script:ProxyTask

    if ($WantHttps) {
        $httpsReady = $false
        for ($index = 0; $index -lt 60; $index++) {
            if (Test-HttpsLocal $Domain) { $httpsReady = $true; break }
            Start-Sleep -Seconds 2
        }
        if ($httpsReady) {
            $script:HttpsActive = $true
            Write-Ok "HTTPS فعال است: https://$Domain"
        } else {
            Write-Warn "صدور گواهی HTTPS ناموفق بود (DNS یا پورت 80/443 را بررسی کنید). تلاش برای HTTP ..."
            Write-Caddyfile -Https $false
            Set-PsmFirewall -Proxy $true -Https $false
            Start-ProxyRuntime
            if (Wait-Http "http://127.0.0.1/fa" -Attempts 15 -DelaySeconds 2) {
                Write-Warn "موقتاً HTTP فعال است: http://$Domain — بعد از تنظیم DNS دوباره اجرا کنید."
            } else {
                Write-Warn "Caddy هم پاسخ نداد؛ سایت مستقیم روی پورت $Port ادامه می‌یابد."
                Stop-ProxyRuntime
                try { Unregister-ScheduledTask -TaskName $script:ProxyTask -Confirm:$false -ErrorAction SilentlyContinue } catch { }
                $script:UseProxy = $false
                $script:HttpsActive = $false
                Set-PsmFirewall -Proxy $false -Https $false
            }
        }
    } else {
        if (Wait-Http "http://127.0.0.1/fa" -Attempts 20 -DelaySeconds 2) {
            Write-Ok "HTTP proxy فعال است: http://$Domain"
        } else {
            Write-Warn "Caddy پاسخ نداد؛ سایت مستقیم روی پورت $Port ادامه می‌یابد."
            Stop-ProxyRuntime
            try { Unregister-ScheduledTask -TaskName $script:ProxyTask -Confirm:$false -ErrorAction SilentlyContinue } catch { }
            $script:UseProxy = $false
            Set-PsmFirewall -Proxy $false -Https $false
        }
    }
}

Write-Step "خلاصهٔ نصب"
if ($script:UseProxy) {
    if ($script:HttpsActive) { $publicUrl = "https://$Domain" }
    else { $publicUrl = "http://$Domain" }
} else {
    $publicUrl = "http://${Domain}:$Port"
}

$managePath = Join-Path $script:DataRoot "manage.ps1"
$manageLines = @(
    'param([ValidateSet("status","start","stop","restart","logs")][string]$Action = "status")',
    '$ErrorActionPreference = "SilentlyContinue"',
    '$AppDir = __APP__',
    '$DataRoot = __DATA__',
    '$Port = __PORT__',
    '$AppTask = "PSM-VALVE"',
    '$ProxyTask = "PSM-VALVE-Proxy"',
    '$PublicUrl = __URL__',
    'function Stop-PsmApp {',
    '    Stop-ScheduledTask -TaskName $AppTask',
    '    Stop-ScheduledTask -TaskName $ProxyTask',
    '    $appMatch = $AppDir.TrimEnd("\") + "\"',
    '    $dataMatch = $DataRoot.TrimEnd("\") + "\"',
    '    Get-CimInstance Win32_Process -Filter "Name=''powershell.exe''" | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -and $_.CommandLine.IndexOf($dataMatch, [StringComparison]::OrdinalIgnoreCase) -ge 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }',
    '    Get-CimInstance Win32_Process -Filter "Name=''node.exe''" | Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($appMatch, [StringComparison]::OrdinalIgnoreCase) -ge 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }',
    '    Get-CimInstance Win32_Process -Filter "Name=''caddy.exe''" | Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($dataMatch, [StringComparison]::OrdinalIgnoreCase) -ge 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }',
    '}',
    'function Start-PsmApp {',
    '    Start-ScheduledTask -TaskName $AppTask',
    '    if (Get-ScheduledTask -TaskName $ProxyTask) { Start-ScheduledTask -TaskName $ProxyTask }',
    '}',
    'switch ($Action) {',
    '    "status" {',
    '        Write-Host "PSM VALVE" -ForegroundColor Cyan',
    '        Write-Host "  آدرس سایت : $PublicUrl"',
    '        Write-Host "  پنل مدیریت: $PublicUrl/admin"',
    '        $appTask = Get-ScheduledTask -TaskName $AppTask',
    '        Write-Host "  تسک اپ    : $(if ($appTask) { $appTask.State } else { ''نصب نشده'' })"',
    '        $proxyTask = Get-ScheduledTask -TaskName $ProxyTask',
    '        Write-Host "  تسک پروکسی: $(if ($proxyTask) { $proxyTask.State } else { ''نصب نشده'' })"',
    '        try {',
    '            $r = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/fa" -TimeoutSec 5',
    '            if ($r.StatusCode -eq 200) { Write-Host "  سلامت اپ  : OK" -ForegroundColor Green }',
    '            else { Write-Host "  سلامت اپ  : DOWN (کد $($r.StatusCode))" -ForegroundColor Red }',
    '        } catch { Write-Host "  سلامت اپ  : DOWN" -ForegroundColor Red }',
    '    }',
    '    "start" { Start-PsmApp; Write-Host "سرویس‌ها شروع شدند." }',
    '    "stop" { Stop-PsmApp; Write-Host "سرویس‌ها متوقف شدند." }',
    '    "restart" { Stop-PsmApp; Start-Sleep -Seconds 2; Start-PsmApp; Write-Host "سرویس‌ها دوباره شروع شدند." }',
    '    "logs" {',
    '        $log = Get-ChildItem -Path (Join-Path $AppDir "logs") -Filter "app-*.log" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1',
    '        if ($log) { Write-Host $log.FullName -ForegroundColor Cyan; Get-Content -LiteralPath $log.FullName -Tail 100 }',
    '        else { Write-Host "لاگی پیدا نشد." }',
    '    }',
    '}'
)
$manage = ($manageLines -join "`r`n")
$manage = $manage.Replace("__APP__", (ConvertTo-PsLiteral $AppDir))
$manage = $manage.Replace("__DATA__", (ConvertTo-PsLiteral $script:DataRoot))
$manage = $manage.Replace("__PORT__", [string]$Port)
$manage = $manage.Replace("__URL__", (ConvertTo-PsLiteral $publicUrl))
Write-TextFile $managePath $manage -Bom

$summary = @()
$summary += "PSM VALVE — نصب کامل شد"
$summary += "تاریخ: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$summary += ""
$summary += "آدرس سایت : $publicUrl"
$summary += "پنل مدیریت: $publicUrl/admin"
$summary += "کاربر پنل : $effectiveAdminUser"
if ($script:PasswordKind -eq "generated") {
    $summary += "رمز پنل   : در $script:DataRoot\initial-admin-password.txt (دسترسی محدود)"
} elseif ($script:PasswordKind -eq "existing") {
    $summary += "رمز پنل   : از قبل تنظیم‌شده (data/admin.json) — تغییر نکرد"
} else {
    $summary += "رمز پنل   : همان رمز داده‌شده"
}
$summary += ""
$summary += "مسیر پروژه: $AppDir"
$summary += "لاگ‌ها    : $script:LogDir\app-*.log"
if ($script:UseProxy) { $summary += "لاگ Caddy : $script:CaddyLogDir\caddy-*.log" }
$summary += "مدیریت    : powershell -ExecutionPolicy Bypass -File `"$managePath`" -Action status"
$summary += "به‌روزرسانی: همین اسکریپت را دوباره اجرا کنید (داده، آپلود و env حفظ می‌شوند)"
if ($script:Warnings.Count -gt 0) {
    $summary += ""
    $summary += "هشدارها:"
    foreach ($warning in $script:Warnings) { $summary += " - $warning" }
}
Write-TextFile (Join-Path $script:DataRoot "last-install.txt") ($summary -join "`r`n") -Bom

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  PSM VALVE — نصب کامل شد" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  آدرس سایت :  $publicUrl"
Write-Host "  پنل مدیریت:  $publicUrl/admin"
Write-Host "  کاربر پنل :  $effectiveAdminUser"
if ($script:PasswordKind -eq "generated") {
    Write-Host "  رمز پنل   :  $script:GeneratedPassword" -ForegroundColor Yellow
    Write-Host "               (در $script:DataRoot\initial-admin-password.txt هم ذخیره شد)"
    Write-Host "               بعد از اولین ورود از بخش «امنیت» پنل تغییرش دهید."
} elseif ($script:PasswordKind -eq "existing") {
    Write-Host "  رمز پنل   :  از قبل تنظیم‌شده (data/admin.json) — بدون تغییر"
} else {
    Write-Host "  رمز پنل   :  همان رمز داده‌شده"
}
Write-Host ""
Write-Host "  مسیر پروژه:  $AppDir"
Write-Host "  لاگ‌ها    :  $script:LogDir\app-*.log"
Write-Host "  تسک‌ها    :  $script:AppTask$(if ($script:UseProxy) { ' · ' + $script:ProxyTask })"
Write-Host "  مدیریت    :  powershell -ExecutionPolicy Bypass -File `"$managePath`" -Action status"
Write-Host "  خلاصه     :  $script:DataRoot\last-install.txt"
Write-Host ""
if ($script:Warnings.Count -gt 0) {
    Write-Host "  هشدارها:" -ForegroundColor Yellow
    foreach ($warning in $script:Warnings) { Write-Host "   - $warning" -ForegroundColor Yellow }
    Write-Host ""
}
if ($script:HttpsActive) {
    Write-Host "  HTTPS فعال است. تمدید گواهی خودکار انجام می‌شود." -ForegroundColor Green
} elseif ($WantHttps) {
    Write-Host "  HTTPS فعال نشد؛ بعد از تنظیم DNS دوباره اجرا کنید." -ForegroundColor Yellow
}
Write-Host "============================================================" -ForegroundColor Cyan

try { Remove-Item -LiteralPath $script:TempRoot -Recurse -Force -ErrorAction SilentlyContinue } catch { }
