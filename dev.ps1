# Golf Tracker Development Startup Script
# Modernized PowerShell script following architectural standards for Windows 11 Native

# 1. Force environment variables
$env:EXPO_NO_BROWSER = "1"
$env:BROWSER = "none"

# Define Cleanup Function
function Stop-Development {
    Write-Host "`n[Golf Tracker] Cleaning up development environment..." -ForegroundColor Yellow
    
    # 1. Targeted termination using command line arguments (more reliable than Title)
    $port = "8081"
    $chromeProcs = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe' OR Name = 'msedge.exe'"
    foreach ($p in $chromeProcs) {
        if ($p.CommandLine -like "*localhost:$port*") {
            try {
                Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
                Write-Host "[Golf Tracker] Closed browser process: $($p.ProcessId)" -ForegroundColor Gray
            } catch {}
        }
    }

    # 2. Fallback: Cleanup by window title
    $processes = Get-Process | Where-Object { $_.MainWindowTitle -like "*localhost:8081*" }
    foreach ($p in $processes) {
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        } catch {}
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

# 2. Chrome Launch Logic (Using Existing User Profile)
$browserJob = {
    Start-Sleep -Seconds 8
    $url = "http://localhost:8081"
    
    # App-mode window
    $args = @(
        "--app=$url",
        "--window-size=410,880"
    )
    
    Write-Host "[Golf Tracker] Launching Chrome in App Mode (Shared Profile)..." -ForegroundColor Cyan
    try {
        Start-Process "chrome.exe" -ArgumentList $args -ErrorAction Stop
    } catch {
        Start-Process "msedge.exe" -ArgumentList @("--app=$url", "--window-size=410,880")
    }
}

# 3. Start the background job
Start-Job -ScriptBlock $browserJob | Out-Null

# 4. Run Expo and ensure cleanup on exit
try {
    Write-Host "[Golf Tracker] Starting Expo Web. Press Ctrl+C to stop.`n" -ForegroundColor Yellow
    npx expo start --web
} finally {
    Stop-Development
}
