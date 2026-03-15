# 🗺️ Project Blueprint: Global Refactoring & Quality Improvement

> 생성 일시: 2026-03-15 07:45 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **글로벌 룰 1.4 준수**: 300라인을 초과하는 `ScoreCardModal.tsx`(319라인)를 분리하여 모듈화 수준 향상.
- **관심사 분리 (SoC)**: UI 컴포넌트에서 스타일 정의를 별도 파일로 추출하여 가독성 및 유지보수성 확보.
- **SSOT 정렬**: `CRITICAL_LOGIC.md`에 정의된 DDD 에러 스키마가 모든 레이어에서 일관되게 사용되는지 전수 검사 및 보완.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `ScoreCardModal.tsx` 읽기 및 종속성 분석**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\ScoreCardModal.tsx`
  - **Goal**: 스타일 및 하위 컴포넌트 추출 대상 식별.
  - **Dependency**: None

- [x] **Task 2: `ScoreCardModal.styles.ts` 생성 및 스타일 이전**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\styles\ScoreCardModal.styles.ts`
  - **Goal**: `ScoreCardModal.tsx`의 153~318라인 스타일 정의를 독립 모듈로 분리.
  - **Pseudocode**: 
    ```typescript
    import { StyleSheet } from 'react-native';
    export const styles = StyleSheet.create({ ... });
    ```
  - **Dependency**: Task 1

- [x] **Task 3: `ScoreCardModal.tsx` 리팩토링 - 컴포넌트 추출**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\ScoreCardModal.tsx`
  - **Goal**: `ScoreCardLegend`와 `ScoreCardHeader`를 함수형 컴포넌트로 분리하여 메인 컴포넌트 경량화 (목표: < 150라인).
  - **Dependency**: Task 2

- [x] **Task 4: `app\admin_users.tsx` 및 `app\admin_requests.tsx` 스타일 분리**
  - **Tool**: `Edit`
  - **Target**: `app\admin_users.tsx`, `app\admin_requests.tsx`
  - **Goal**: 200라인 초과 파일들에 대해 인라인 스타일 및 StyleSheet를 `.styles.ts`로 추출하여 일관성 유지.
  - **Dependency**: None

- [x] **Task 5: Repository 에러 핸들링 전수 검사**
  - **Tool**: `Read` & `Edit`
  - **Target**: `src/modules/golf/repository/*.repository.ts`
  - **Goal**: 모든 I/O 로직이 `GolfDomainError` 규격을 사용하는지 확인하고 미비점 보완.
  - **Dependency**: None

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Rule 1.4**: 파일이 300라인을 초과하면 즉시 분리한다.
- **Rule 4.1**: 3-Layer Architecture(Definition, Repository, Service)를 준수한다.
- **Rule 5.1**: 예외 처리는 반드시 `Try-Catch` 구조와 도메인 에러 스키마를 사용한다.

## ✅ Definition of Done

1. [x] `ScoreCardModal.tsx`의 라인 수가 150라인 이하로 감소함.
2. [x] 모든 신규 생성/수정 파일에 대해 `npx tsc --noEmit` 검증 통과.
3. [x] `memory.md`에 리팩토링 결과 반영 완료.
