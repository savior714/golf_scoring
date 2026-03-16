# 🗺️ Project Blueprint: 구장 데이터 로딩 Race Condition 수정

> 생성 일시: 2026-03-16 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

`CourseSelector`에서 "구장 데이터를 불러오지 못했습니다" 에러가 노출되는 버그를 수정한다.

**근본 원인**: `isLoadingMaster`가 `state.isManualLoading`만 참조하므로, React Query의
`golf_clubs` 쿼리가 진행 중임에도 `loadMasterAndSession`이 먼저 완료되면
`isManualLoading=false` + `clubs=[]` 상태가 되어 에러 화면이 노출된다.

```
Timeline:
  [0ms]  isManualLoading=true → 스피너 표시 ✓
  [~20ms] loadMasterAndSession → RESET_SESSION → isManualLoading=false
  [~150ms] React Query golf_clubs 응답 도착 (clubs 채워짐)
  [20ms~150ms] ← 이 구간에 clubs=[] + isManualLoading=false → 에러 노출 ❌
```

**SSOT**: `docs/CRITICAL_LOGIC.md` 정렬 불필요 (UI 로딩 상태 버그)

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료되어야 한다.**

### 📦 Task List

- [ ] **Task 1: `useGolfRecord.ts` 읽기 — `useQuery` 반환값 확인**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/hooks/useGolfRecord.ts`
  - **Goal**: `isLoading` 반환값이 destructuring되는지 확인 (line 24)
  - **Dependency**: None

- [ ] **Task 2: `useGolfRecord.ts` 수정 — `isClubsLoading` 반영**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/hooks/useGolfRecord.ts`
  - **Goal**: `isLoadingMaster`에 React Query의 `isLoading` 상태를 OR 조건으로 합산
  - **Pseudocode**:
    ```ts
    // Before (line 24):
    const { data: clubs = [] } = useQuery({ ... });
    // After:
    const { data: clubs = [], isLoading: isClubsLoading } = useQuery({ ... });

    // Before (memoizedState, line ~211):
    isLoadingMaster: state.isManualLoading,
    // After:
    isLoadingMaster: state.isManualLoading || isClubsLoading,
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: TypeScript 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | tail -20`
  - **Goal**: 타입 에러 없음 확인
  - **Dependency**: Task 2

---

## ⚠️ 기술적 제약 및 규칙

- **변경 범위**: `useGolfRecord.ts` 단 1개 파일, 2줄 수정 (최소 침습)
- **isVerified 필터**: `club.isVerified === true` strict 조건은 유지 (의도된 설계)
- **React Query staleTime**: 1시간 캐시 정책 유지 — `isLoading`은 최초 fetch 시에만 `true`

## ✅ Definition of Done

1. [ ] 앱 최초 진입 시 구장 목록이 정상 표시됨
2. [ ] 로딩 중 스피너가 표시되고 에러 화면이 노출되지 않음
3. [ ] TypeScript 에러 0건
