# 🗺️ Project Blueprint: /debug 에러 체크 범위 및 핸들러 구축

> 생성 일시: 2026-03-13 09:45 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **/debug 워크플로우 활성화**: `/debug` 명령이 `error_analysis.jsonl` 파일을 통해 발생한 에러의 맥락(명령어, 시간, 에러 메시지)을 즉시 파악할 수 있는 환경을 조성한다.
- **SSOT**: `docs/memory.md`의 '향후 과제'에 명시된 에러 대응 전략의 실체화.
- **Stability**: `dev.ps1` 실행 중 발생하는 런타임 에러를 억제하지 않고, 로그에 기록한 후 원래 에러를 다시 던져(Throw) 개발자에게 알림과 동시에 기록을 남긴다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: scripts/error_handler.ps1 생성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\scripts\error_handler.ps1`
  - **Goal**: `exec-log` 함수 정의. (명령어 실행, Try-Catch를 통한 JSONL 로깅)
  - **Pseudocode**:
    ```powershell
    function exec-log($scriptBlock, $commandName) {
        try { &$scriptBlock } catch {
            $log = @{ timestamp=(Get-Date -Format "yyyy-MM-dd HH:mm:ss"); command=$commandName; error=$_.Exception.Message; stack=$_.ScriptStackTrace }
            $log | ConvertTo-Json -Compress | Out-File -FilePath "error_analysis.jsonl" -Append -Encoding utf8
            throw $_
        }
    }
    ```
  - **Dependency**: None

- [x] **Task 2: dev.ps1에 에러 핸들러 통합**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\dev.ps1`
  - **Goal**: `scripts/error_handler.ps1`을 Dot-Sourcing 하고, 주요 명령(Expo start 등)을 `exec-log`로 래핑.
  - **Status**: 완료 (2026-03-13)
  - **Pseudocode**:
    ```powershell
    . "$PSScriptRoot\scripts\error_handler.ps1"
    exec-log { npx expo start --web } "Expo Web Server"
    ```
  - **Dependency**: Task 1

- [x] **Task 3: docs/ERROR_LOGS.md 가이드 생성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\docs\ERROR_LOGS.md`
  - **Goal**: `/debug` 워크플로우가 이 로그를 어떻게 활용하는지, 수동 분석 방법은 무엇인지 명시.
  - **Status**: 완료 (2026-03-13)
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: `error_handler.ps1`은 UTF-8 no BOM.
- **Format**: 로그 파일 `error_analysis.jsonl`은 행 단위 JSON 형식 유지.
- **Environment**: Windows 11 PowerShell Native (Bypass policy 적용 가능 확인).

## ✅ Definition of Done

1. [x] `scripts/error_handler.ps1`이 물리적으로 존재함.
2. [x] `dev.ps1` 실행 시 에러 발생 시 `error_analysis.jsonl`에 로그가 남음을 확인.
3. [x] `/debug` 명령어 수행 시 해당 로그를 읽어 분석할 수 있는 기반 마련.
