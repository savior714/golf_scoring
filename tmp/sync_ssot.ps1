$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$Data = Get-Content -Raw C:\develop\golf_scoring\tmp\ssot_data.json | ConvertFrom-Json

[System.IO.File]::WriteAllText('C:\develop\golf_scoring\README.md', $Data.readme.Trim() + "`n", $Utf8NoBom)
[System.IO.File]::WriteAllText('C:\develop\golf_scoring\docs\CRITICAL_LOGIC.md', $Data.critical.Trim() + "`n", $Utf8NoBom)
[System.IO.File]::WriteAllText('C:\develop\golf_scoring\docs\memory.md', $Data.memory.Trim() + "`n", $Utf8NoBom)
