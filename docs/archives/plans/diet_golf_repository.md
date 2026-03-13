# 🗺️ Project Blueprint: diet_golf_repository

> 생성 일시: 2026-03-12 20:15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- `src/modules/golf/golf.repository.ts` 파일의 비대화(831라인)를 해결하기 위해 논리적 단위로 분리.
- **글로벌 룰 0 (300라인 제한)** 준수 및 코드 가독성/유지보수성 향상.
- **SSOT**: `docs/CRITICAL_LOGIC.md`의 골프 데이터 처리 규칙을 유지하며 물리적 구조만 최적화.

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다. 우선순위에 따라 원하는 항목을 선택하여 진행을 요청하세요.

### 📦 Task List

- [ ] **Task 1: golf.repository.ts 분석 및 분리 포인트 식별**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\golf.repository.ts`
  - **Goal**: 구장(Course), 스코어(Score), 멤버(Member) 등 논리적 그룹을 나누고 분리할 새 파일 명칭 확정.
  - **Dependency**: None

- [ ] **Task 2: 구장 관련 로직 분리 (repository/golf.course.repository.ts)**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\repository\golf.course.repository.ts`
  - **Goal**: `golf.repository.ts`에서 구장 조회, 추가, 수정 관련 메서드 이관.
  - **Pseudocode**:

    ```typescript
    export const golfCourseRepository = {
      getCourses: async () => { ... },
      saveCourse: async (course: GolfCourse) => { ... },
    }
    ```

  - **Dependency**: Task 1

- [ ] **Task 3: 스코어 관련 로직 분리 (repository/golf.score.repository.ts)**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\repository\golf.score.repository.ts`
  - **Goal**: 스코어 기록, 통계, 라운드 관리 로직 이관.
  - **Dependency**: Task 1

- [ ] **Task 4: golf.repository.ts 재구성 (Aggregator 패턴)**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\golf.repository.ts`
  - **Goal**: 기존 메서드들을 분리된 레포지토리로 위임(Delegation)하거나, 원본 파일의 라인수를 300 이하로 축소.
  - **Dependency**: Task 2, Task 3

- [ ] **Task 5: 린트 체크 및 통합 테스트**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 참조 관계 오류 확인 및 무결성 검증.
  - **Dependency**: Task 4

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Modularization**: `src/modules/golf/repository/` 디렉토리를 생성하여 하위 레포지토리를 관리.
- **Refactoring Scope**: 로직 자체의 수정은 최소화하고, 구조적 분리에 집중 (Surgical Changes).
- **Type Integrity**: `golf.types.ts`의 타입을 공통으로 사용하여 타입 일관성 유지.

## ✅ Definition of Done

1. [ ] `golf.repository.ts` 파일의 라인 수가 300라인 이하로 감소함.
2. [ ] 새로운 `golf.*.repository.ts` 파일들이 300라인 이하로 유지됨.
3. [ ] 전체 프로젝트 빌드 및 린트 결과 에러 Zero.
4. [ ] `memory.md`에 리팩토링 결과 기록 완료.
