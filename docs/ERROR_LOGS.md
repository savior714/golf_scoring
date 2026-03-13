# 📋 Error Analysis Logs Guide

이 문서는 프로젝트의 에러 모니터링 시스템과 `/debug` 워크플로우 연동 방법을 설명합니다.

## 🎯 목적

`dev.ps1` 또는 기타 자동화 스크립트 실행 중 발생하는 에러를 구조화된 데이터(JSONL)로 기록하여, AI 어시스턴트가 발생한 에러의 정확한 맥락을 즉시 파악하고 해결책을 제시할 수 있게 합니다.

## 📂 로그 파일: `error_analysis.jsonl`

프로젝트 루트에 생성되는 행 단위 JSON 파일입니다.

### 데이터 구조

```json
{
  "timestamp": "2026-03-13 10:15:22",
  "command": "Expo Web Server",
  "error": "Error: Cannot find module '...',
  "stack": "at ... (c:\\develop\\...:12:34)"
}
```

## 🛠️ 사용 방법

### 1. `/debug` 워크플로우 연동

에러가 발생했을 때 사용자가 `/debug` 명령을 입력하면, Antigravity 어시스턴트는 자동으로 `error_analysis.jsonl` 파일의 최신 항목을 읽습니다.

- **분석**: 에러 메시지와 스택 트레이스를 기반으로 원인을 추론합니다.
- **해결**: 관련 파일을 찾아 수정하거나, 복구 스크립트를 생성합니다.

### 2. 수동 명령어 로깅 (`exec-log`)

새로운 명령어를 로깅하고 싶다면 `dev.ps1`에서와 같이 `exec-log` 함수를 사용합니다.

```powershell
# 예시: tsc 빌드 에러 로깅
exec-log { npx tsc } "TypeScript Compile"
```

### 3. 수동 분석

로그 파일이 너무 커지면 다음과 같이 최신 5개의 에러만 확인할 수 있습니다.

```powershell
Get-Content -Path "error_analysis.jsonl" -Tail 5
```

## ⚠️ 주의 사항

- **인코딩**: 모든 로그는 `UTF-8`으로 기록됩니다.
- **보안**: 로그에는 환경 변수나 민감한 정보가 포함되지 않도록 주의하십시오. (현재는 명령어 이름, 메시지, 스택만 기록)
- **정리**: 로그 파일이 비대해지면 수동으로 삭제하거나 아카이빙할 수 있습니다. 시스템은 파일이 없으면 자동으로 새로 생성합니다.
