$source = "c:\develop\golf_scoring\CLAUDE.md"
$projects = Get-ChildItem -Path c:\develop -Directory | Select-Object -ExpandProperty FullName

foreach ($project in $projects) {
    if (Test-Path $project) {
        Write-Host "Processing: $project" -ForegroundColor Cyan
        
        # 1. Source to Destination copy (unless it's the source itself)
        if ($project -ne "C:\develop\golf_scoring") {
            Copy-Item -Path $source -Destination (Join-Path $project "CLAUDE.md") -Force
        }
        
        # 2. Git operations
        Push-Location $project
        if (Test-Path ".git") {
            git add CLAUDE.md
            git commit -m "docs: sync universal architect instructions from CLAUDE.md" 2>$null
            git push origin main 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Successfully pushed: $project" -ForegroundColor Green
            } else {
                Write-Host "No changes to push or failed: $project" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Not a Git project: $project" -ForegroundColor Gray
        }
        Pop-Location
    }
}
Write-Host "Sync Completed." -ForegroundColor Green
