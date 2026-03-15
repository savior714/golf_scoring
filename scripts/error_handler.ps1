# 🛠️ Error Handler Utility for Golf Scoring App
# 생성일: 2026-03-13 | 목적: 로컬 개발 환경의 에러 로깅 및 분석 자동화

function Invoke-ErrorLogged {
    <#
    .SYNOPSIS
        명령어를 실행하고 에러 발생 시 error_analysis.jsonl 파일에 기록합니다.
    
    .PARAMETER ScriptBlock
        실행할 명령어 뭉치입니다. { ... } 형태로 전달합니다.
    
    .PARAMETER CommandName
        로그에 남길 명령어의 이름 또는 별칭입니다.
    #>
    param (
        [Parameter(Mandatory=$true)]
        [scriptblock]$ScriptBlock,

        [Parameter(Mandatory=$true)]
        [string]$CommandName
    )

    try {
        # 명령어 실행
        & $ScriptBlock
    } catch {
        # 에러 객체 생성
        $logEntry = [PSCustomObject]@{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            command   = $CommandName
            error     = $_.Exception.Message
            stack     = $_.ScriptStackTrace
        }
        
        # JSONL 형식으로 프로젝트 루트에 로깅
        # $PSScriptRoot는 scripts 폴더를 가리키므로 부모 폴더에 저장
        $logPath = Join-Path $PSScriptRoot "..\error_analysis.jsonl"
        $logEntry | ConvertTo-Json -Compress | Out-File -FilePath $logPath -Append -Encoding utf8
        
        # 상위 프로세스로 에러 전파 (Rethrow)
        throw $_
    }
}

# Alias 등록 (사용자 요청 명칭 유지)
Set-Alias -Name "exec-log" -Value "Invoke-ErrorLogged" -Scope Global
