# 🗺️ Project Blueprint: Vercel 빌드 에러 해결 및 Git 동기화

> 생성 일시: 2026-03-13 11:15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **현상**: Vercel 배포 시 `@/src/modules/admin/components/AdminNavButtons` 모듈을 찾을 수 없는 에러로 빌드 실패.
- **원인**: 로컬에서 작업한 신규 컴포넌트 및 훅들이 Git에 `untracked` 상태로 남아 있어 리포지토리에 반영되지 않음.
- **해결**: 누락된 모든 `src` 및 `app` 폴더 내의 파일을 Git에 추가하고 커밋/푸시하여 환경 일관성 확보.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: 누락된 파일 전체 목록 확정**
  - **Tool**: `run_command`
  - **CommandLine**: `git ls-files --others --exclude-standard`
  - **Goal**: Git에 추적되지 않은 모든 파일을 나열하여 배포에 필요한 파일이 누락되지 않았는지 최종 확인.
  - **Result**: `src` 및 `app` 폴더 내 누락된 소스 코드 없음 확인 완료. (`AdminNavButtons.tsx` 등 필수 파일 모두 추적 중)

- [x] **Task 2: Git 스테이징 및 커밋**
  - **Tool**: `run_command`
  - **CommandLine**: `git add src app; git status`
  - **Goal**: `src`와 `app` 내의 누락된 파일들을 스테이징 영역에 추가.
  - **Result**: `src` 및 `app` 폴더 내 모든 신규/수정 파일이 이미 스테이징되어 있거나 커밋되어 있음을 확인 (추가 스테이징 항목 없음).

- [ ] **Task 3: Git 커밋 및 푸시**
  - **Tool**: `run_command`
  - **CommandLine**: `git commit -m "fix: add missing admin components and sync state for deployment"; git push origin main`
  - **Goal**: 변경 사항을 원격 리포지토리에 푸시하여 Vercel 자동 배포 트리거.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Git Sync**: 로컬과 원격의 상태를 완전히 동기화하여 "로컬에서는 되는데 배포는 안 됨" 문제 원천 차단.
- **Verification**: 커밋 전 `git status`를 통해 의도치 않은 파일(test data 등)이 포함되지 않는지 확인.

## ✅ Definition of Done

1. [ ] `git ls-files --others` 결과가 (무시할 파일 제외) 비어 있음.
2. [ ] 원격 리포지토리에 모든 필수 파일이 업로드됨.
3. [ ] Vercel 빌드가 정상적으로 시작/진행됨을 확인.
