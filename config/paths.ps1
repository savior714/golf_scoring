# ⚙️ Project Global Path Configuration
# Encoding: UTF-8 with BOM

# ROOT_PATH 정의 (이 파일 위치 기준 상위 디렉토리)
$script:ROOT_PATH = Resolve-Path (Join-Path $PSScriptRoot "..") | Select-Object -ExpandProperty Path

# 핵심 경로 상수 정의 (Global Scope)
$global:HOME_PATH = $script:ROOT_PATH
$global:CONFIG_PATH = Join-Path $global:HOME_PATH "config"
$global:SCRIPTS_PATH = Join-Path $global:HOME_PATH "scripts"
$global:DOCS_PATH = Join-Path $global:HOME_PATH "docs"
$global:SRC_PATH = Join-Path $global:HOME_PATH "src"
$global:LOGS_PATH = Join-Path $global:HOME_PATH "logs"
$global:PLANS_PATH = Join-Path $global:DOCS_PATH "plans"

# UTF-8 출력 강제 및 초기 프로그레스 바 비활성화
$OutputEncoding = [System.Text.Encoding]::UTF8
$ProgressPreference = 'SilentlyContinue'

Write-Output "✅ Global paths initialized from config/paths.ps1"
