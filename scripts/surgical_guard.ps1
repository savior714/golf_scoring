function Out-Surgical {
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline = $true)]
        $InputObject,
        [int]$MaxChars = 3000
    )
    process {
        $rawOutput = $InputObject | Out-String
        if ($rawOutput.Length -gt $MaxChars) {
            $truncated = $rawOutput.Substring(0, $MaxChars)
            $remaining = $rawOutput.Length - $MaxChars
            
            Write-Host $truncated -NoNewline
            Write-Host "`n`n[SYSTEM WARNING: OUTPUT TRUNCATED]" -ForegroundColor Red
            Write-Host "--- 현재 출력량이 3,000자를 초과하여 강제 중단되었습니다. ---" -ForegroundColor Yellow
            Write-Host "남은 글자 수: $remaining 자"
            Write-Host "해결책: 전체를 보려 하지 말고 'Select-String'이나 'gc -Tail'로 에러 지점만 특정하십시오.`n" -ForegroundColor Cyan
            break # 스트림 중단
        } else {
            Write-Host $rawOutput -NoNewline
        }
    }
}
