# Golf Tracker Development Startup Script
# Modernized PowerShell script following architectural standards

Write-Host "`n[Golf Tracker] Detecting local IP..." -ForegroundColor Cyan

try {
    $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4Address -ne $null -and $_.NetProfileName -ne $null } | Select-Object -First 1).IPv4Address.IPAddress
    if (-not $ip) {
        # Fallback to a simpler method if the above fails
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
    }
    
    if ($ip) {
        $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
        Write-Host "[Golf Tracker] Detected IP: $ip" -ForegroundColor Green
    } else {
        Write-Warning "[Golf Tracker] Could not detect local IP. Falling back to default."
    }
} catch {
    Write-Warning "[Golf Tracker] Error during IP detection: $($_.Exception.Message)"
}

Write-Host "[Golf Tracker] Starting Expo Web...`n" -ForegroundColor Yellow
npm run web
