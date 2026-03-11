$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$Files = @(
    'C:\develop\golf_scoring\README.md',
    'C:\develop\golf_scoring\docs\CRITICAL_LOGIC.md',
    'C:\develop\golf_scoring\docs\memory.md'
)

foreach ($File in $Files) {
    if (Test-Path $File) {
        # Read with UTF8 (handles BOM if present)
        $Content = [System.IO.File]::ReadAllText($File)
        # Write back as UTF-8 no BOM with proper Trim + \n
        [System.IO.File]::WriteAllText($File, $Content.Trim() + "`n", $Utf8NoBom)
    }
}
