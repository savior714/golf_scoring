# 🗺️ Project Blueprint: Vercel 배포 모듈 해석 오류 해결

> 생성 일시: 2026-03-17 12:30 | 상태: 완료 (Verified by TSC)

## 🎯 Architectural Goal

- **현상**: Vercel(Linux 환경) 빌드 중 `app/(tabs)/history.tsx`에서 `../../src/shared/lib/queryKeys`를 찾지 못하는 현상 해결.
- **문제 진단**: 괄호가 포함된 디렉토리 `(tabs)`에서의 복잡한 상대 경로 해석 오류 또는 환경별 경로 처리 차이.
- **해결 전략**: `tsconfig.json`의 `"@/*": ["./*"]` 별칭을 사용하여 모든 임포트 경로를 **프로젝트 루트 기준 절대 경로**로 통일.
- **SSOT**: `app/(tabs)/_layout.tsx`에서 이미 사용 중인 `@/` 컨벤션으로 전체 프로젝트 정렬.

## 🛠️ Step-by-Step Execution Plan

> 각 Task는 단 하나의 도구 호출로 완료하며, 단계별 승인을 대기합니다.

### 📦 Task List

- [x] **Task 1: `app/(tabs)/history.tsx`의 상대 경로 임포트 수정**
  - **Tool**: `Edit`
  - **Goal**: `../../src/`를 `@/src/`로 전체 치환.
- [x] **Task 2: `app/(tabs)/index.tsx`의 상대 경로 임포트 수정**
  - **Tool**: `Edit`
  - **Goal**: `history.tsx`와 상응하는 치환 작업 수행.
- [x] **Task 3: `app/(tabs)/record.tsx` 및 `notice.tsx` 임포트 수정**
  - **Tool**: `Edit`
  - **Goal**: 나머지 탭 페이지들의 경로 무결성 확보.
- [x] **Task 4: `src/modules/golf/hooks/` 내의 `queryKeys` 참조 수정**
  - **Tool**: `Edit`
  - **Goal**: 비즈니스 로직 계층의 임포트 경로 정규화.
- [x] **Task 5: 환경 무결성 검증 (Dry Run)**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 모든 변경 후 타입 에러 및 경로 오류 Zero 확인.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Alias Stickiness**: 신규 작성하는 모든 파일은 반드시 `@/` 별칭을 사용한다.
- **Case Sensitivity**: Vercel 빌드 성공을 위해 실제 파일 시스템의 대소문자와 임포트 경로의 일치 여부를 재검토한다.
- **Atomic Edit**: 한 파일씩 순차적으로 수정하여 부작용을 최소화한다.

## ✅ Definition of Done

1. [x] `app/(tabs)/history.tsx` 내의 모든 `../../src` 가 `@/src`로 변경됨.
2. [x] `app/(tabs)/index.tsx` 내의 모든 `../../src` 가 `@/src`로 변경됨.
3. [x] `npx tsc --noEmit` 실행 결과 에러 없음.
4. [x] `memory.md`에 결함 해결 내역 기록 완료.
