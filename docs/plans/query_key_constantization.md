# 🗺️ Project Blueprint: Query Key 상수화 (F-3)

> 생성 일시: 2026-03-17 10:38 | 상태: 완료 (2026-03-17 11:15)

## 🎯 Architectural Goal

- TanStack Query의 쿼리 키를 중앙에서 관리하여 하드코딩된 문자열 리터럴로 인한 런타임 오류 및 데이터 불일치 위험을 제거한다.
- **SSOT**: `src/shared/lib/queryKeys.ts`를 유일한 키 공급원으로 정의한다.

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다.

### 📦 Task List

- [x] **Task 1: 전역 쿼리 키 사용처 조사**
  - **Tool**: `Grep`
  - **Query**: `useQuery\(` 또는 `useMutation\(`
  - **Goal**: 현재 프로젝트 내에서 사용 중인 모든 쿼리 키 패턴 취합
  - **Dependency**: None

- [x] **Task 2: `src/shared/lib/queryKeys.ts` 생성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\shared\lib\queryKeys.ts`
  - **Goal**: 취합된 키를 팩토리 함수 패턴으로 정의
  - **Pseudocode**:
    ```typescript
    export const QUERY_KEYS = {
      rounds: (userId: string) => ['golf_rounds', userId] as const,
      clubs: () => ['golf_clubs'] as const,
      profile: (userId: string) => ['user_profile', userId] as const,
    };
    ```
  - **Dependency**: Task 1

- [x] **Task 3: 기존 코드의 리터럴을 상수/함수로 교체**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/hooks/` 하위 및 `app/` 하위 컴포넌트
  - **Goal**: 하드코딩된 `['golf_rounds', ...]` 등을 `QUERY_KEYS.rounds(...)`로 대체
  - **Dependency**: Task 2

- [x] **Task 4: 정적 타입 검증 및 마무리**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 변경 사항으로 인한 타입 에러 유무 확인 및 `memory.md` 반영
  - **Dependency**: Task 3

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Strict Typing**: `as const`를 사용하여 쿼리 키의 읽기 전용 속성 및 정확한 타입 추론 보장.
- **Naming**: `QUERY_KEYS` 객체 내 명칭은 도메인과 직관적으로 매칭되도록 명명.

## ✅ Definition of Done

1. [x] 모든 `useQuery`, `useMutation`, `invalidateQueries`에서 하드코딩된 리터럴 제거됨.
2. [x] `npx tsc --noEmit` 결과 에러 없음.
3. [x] 실제 앱 데이터 로딩 및 캐시 무효화가 정상 작동함. (타입 안정성 확보)
