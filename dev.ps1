# Golf Tracker Development Startup Script
# Modernized PowerShell script following architectural standards for Windows 11 Native

# 1. Force environment variables
$env:EXPO_NO_BROWSER = "1"
$env:BROWSER = "none"

# Define Cleanup Function
function Stop-Development {
    Write-Host "`n[Golf Tracker] Cleaning up development environment..." -ForegroundColor Yellow
    
    # 1. Targeted termination using a unique dummy flag (Guaranteed to find the exact process tree)
    $fingerprint = "golf_tracker_dev_app"
    $chromeProcs = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe' OR Name = 'msedge.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $chromeProcs) {
        if ($p.CommandLine -like "*$fingerprint*") {
            try {
                Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
                Write-Host "[Golf Tracker] Closed browser process: $($p.ProcessId)" -ForegroundColor Gray
            } catch {}
        }
    }
    
    # Stop any background jobs
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    
    Write-Host "[Golf Tracker] Done. See you soon!`n" -ForegroundColor Green
}

Write-Host "`n[Golf Tracker] Detecting local IP and preparing Chrome environment..." -ForegroundColor Cyan

try {
    $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4Address -ne $null -and $_.NetProfileName -ne $null } | Select-Object -First 1).IPv4Address.IPAddress
    if (-not $ip) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
    }
    
    if ($ip) {
        $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
        Write-Host "[Golf Tracker] Detected IP: $ip" -ForegroundColor Green
    }
} catch {
    Write-Warning "[Golf Tracker] IP detection fallback active."
}

# 2. Chrome Launch Logic (Using Main Profile, Tagged for Watchdog)
$fingerprint = "golf_tracker_dev_app"

# 2-A. Launch Watchdog (Handles sudden console 'X' closure)
$watchdogScript = @"
Wait-Process -Id $PID -ErrorAction SilentlyContinue;
`$procs = Get-CimInstance Win32_Process -Filter `"Name = 'chrome.exe' OR Name = 'msedge.exe'`" -ErrorAction SilentlyContinue;
foreach (`$p in `$procs) {
    if (`$p.CommandLine -like `"*$fingerprint*`") {
        Stop-Process -Id `$p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
"@
$encodedCmd = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($watchdogScript))
Start-Process "powershell.exe" -ArgumentList "-WindowStyle Hidden -ExecutionPolicy Bypass -NoProfile -EncodedCommand $encodedCmd" -WindowStyle Hidden

# 2-B. Launch Browser via Background Job
$browserJob = {
    param($flagPattern)
    Start-Sleep -Seconds 8
    $url = "http://localhost:8081"
    
    # App-mode window with Main Profile but injected with dummy flag for identification
    $argsList = @(
        "--app=$url",
        "--window-size=410,880",
        "--disable-session-crashed-bubble=$flagPattern"
    )
    
    Write-Host "[Golf Tracker] Launching Edge/Chrome using Main Profile (Tagged)..." -ForegroundColor Cyan
    try {
        Start-Process "chrome.exe" -ArgumentList $argsList -ErrorAction Stop
    } catch {
        Start-Process "msedge.exe" -ArgumentList $argsList
    }
}

# 3. Start the background job
Start-Job -ScriptBlock $browserJob -ArgumentList $fingerprint | Out-Null

# 4. Run Expo and ensure cleanup on exit
try {
    Write-Host "[Golf Tracker] Starting Expo Web. Press Ctrl+C to stop.`n" -ForegroundColor Yellow
    npx expo start --web
} finally {
    Stop-Development
}
