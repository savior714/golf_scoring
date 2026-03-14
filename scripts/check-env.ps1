# scripts/check-env.ps1
$script:ErrorActionPreference = 'Stop'

Try
{
    # 1. Global Config 로드
    $ConfigPath = Join-Path $PSScriptRoot "..\config\paths.ps1"
    If (Test-Path $ConfigPath) {
        . $ConfigPath
    } Else {
        Write-Error "paths.ps1 not found"; Exit 1
    }

    Write-Output "`n[System Integrity Check]"
    
    # 2. 필수 파일 검증
    $Files = @("AI_GUIDELINES.md", "CLAUDE.md", "docs/memory.md")
    ForEach ($f in $Files) {
        $p = Join-Path $global:HOME_PATH $f
        If (Test-Path $p) {
            Write-Output "  [OK] Found $f"
        } Else {
            Write-Warning "  [MISSING] $f"
        }
    }

    # 3. 인코딩 검증
    Write-Output "`n[Encoding Verification]"
    $PsFiles = Get-ChildItem -Path $global:HOME_PATH -Recurse -Filter "*.ps1" -Exclude "node_modules", ".git"
    ForEach ($ps in $PsFiles) {
        $bytes = [System.IO.File]::ReadAllBytes($ps.FullName)
        $isBOM = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
        If (-not $isBOM) {
            Write-Warning "  [WARN] Not UTF-8 BOM: $($ps.Name)"
        }
    }

    Write-Output "`n✨ Integrity Check Complete.`n"
}
Catch
{
    Write-Error "❌ Error: $($_.Exception.Message)"
}
