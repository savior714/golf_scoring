# 🗺️ Project Blueprint: 기록 탭 2~3초 후 풀 리렌더 제거

> 생성 일시: 2026-03-12 03:14 | 상태: **Task 1 완료 — 실기기 검증 대기**

## 🎯 Architectural Goal

라운딩 기록 중 다른 탭(리더보드)을 갔다가 기록 수정 탭으로 돌아올 때,
**1차 렌더(스피너) 이후 2~3초 후 화면 전체가 다시 한번 풀 리렌더되는 현상을 제거한다.**

이전에 해결한 "초기 CourseSelector Flicker(100~400ms)"와 다른 새로운 문제다:

- 이전 문제: 스피너 이전에 CourseSelector가 노출되는 문제 (isManualLoading 초기값 수정으로 해결)
- **이번 문제: 정상적으로 스코어 화면까지 도달했음에도, 2~3초 후 isLoadingMaster가 다시 true가 되어 스피너가 재출현하는 문제**

---

## 🔍 Root Cause: 3계층 invalidate 연쇄반응

### 렌더링 흐름 (현재 — 문제 있는 경로)

```text
[리더보드 탭 포커스]
  └─ useDashboardData.autoSync() 실행
       └─ pullRoundsFromSupabase (1~2초 소요)
            └─ invalidateQueries(['current_round_id'])  ← ★ 핵심 원인 A
            └─ invalidateQueries(['golf_rounds'])        ← ★ 핵심 원인 A

[기록 탭으로 이동]
  └─ useGolfRecord가 마운트된 상태에서 위 invalidate의 영향을 받음
       └─ useQuery(['current_round_id']) → isLoadingCurrentId = true
       └─ useQuery(['golf_rounds'])      → isLoadingRounds    = true
            └─ isLoadingMaster = isLoadingClubs || isLoadingCurrentId || isLoadingRounds = TRUE
                 └─ state.isManualLoading은 false이지만 isLoadingMaster가 true
                      └─ record.tsx: isLoadingMaster: isLoadingMaster || state.isManualLoading
                           └─ → 스피너 재출현 (풀 리렌더) ← 2~3초 후 리렌더의 정체
```

### 원인 요약표

| # | 원인 | 파일 | 설명 |
| --- | --- | --- | --- |
| **A** | `autoSync()`가 `['current_round_id']`, `['golf_rounds']`를 invalidate | `useDashboardData.ts:57` | 리더보드 탭에서 실행된 sync가 기록 탭의 React Query 상태를 흔들어 isLoadingMaster=true 유발 |
| **B** | `useGolfRecord`의 해당 쿼리에 `staleTime`이 없음 | `useGolfRecord.ts:151-158` | staleTime=0 기본값 → 포커스 복귀 시마다 자동 refetch → isLoading=true 순간 발생 |
| **C** | `isLoadingMaster` 계산식이 React Query isLoading과 직접 결합 | `useGolfRecord.ts:166` | activeSession이 있는 상태에서도 isLoadingMaster=true이면 스피너가 표시됨 |

---

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `useGolfRecord`의 데이터 쿼리에 `staleTime` 추가**
  - **Goal**: `['current_round_id']`, `['golf_rounds']`, `['golf_clubs']` 쿼리가 포커스 복귀나 invalidate 이후 즉시 isLoading=true를 발생시키지 않도록, 캐싱 전략을 `useDashboardData`와 일치시킨다.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts` — L149, L155, L161 ✅ **적용 완료**
  - **Implementation**:
    - [x] `useQuery(['golf_clubs'])` → `staleTime: Infinity` 추가 (클럽 마스터 데이터는 자주 바뀌지 않음)
    - [x] `useQuery(['current_round_id'])` → `staleTime: Infinity` 추가 (명시적 invalidate로만 변경)
    - [x] `useQuery(['golf_rounds'])` → `staleTime: Infinity` 추가 (명시적 invalidate로만 변경)
  - **Pseudocode**:

    ```typescript
    const { data: clubs = [], isLoading: isLoadingClubs } = useQuery({
      queryKey: ['golf_clubs'],
      queryFn: () => clubRepository.getAllClubsSummary(),
      staleTime: Infinity, // 추가: refetch-on-focus에 의한 isLoading=true 방지
    });

    const { isLoading: isLoadingCurrentId } = useQuery({
      queryKey: ['current_round_id'],
      queryFn: () => roundRepository.getCurrentRoundId(),
      staleTime: Infinity, // 추가: autoSync invalidate 이후 즉시 isLoading 전파 방지
    });

    const { isLoading: isLoadingRounds } = useQuery({
      queryKey: ['golf_rounds'],
      queryFn: () => roundRepository.getAllRounds(),
      staleTime: Infinity, // 추가: autoSync invalidate 이후 즉시 isLoading 전파 방지
    });
    ```

  - **Dependency**: None (독립 적용 가능)
  - **Verification**:
    - 리더보드 탭 → 기록 탭 이동 후 2~3초 동안 스피너가 재출현하지 않음
    - invalidateQueries 호출 이후에도 백그라운드에서 quietly refetch됨 (isLoading=true 없이)

---

- [ ] **Task 2: `isLoadingMaster`를 `state.isManualLoading`으로만 국한 (Optional)**
  - **Goal**: `activeSession`이 이미 복원된 상태에서는 `isLoadingMaster`가 잠시 true가 되어도 스피너가 절대 표시되지 않도록 렌더 분기를 강화한다.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts` — L582~592 return 블록
  - **Implementation**:
    - [ ] `isLoadingMaster: isLoadingMaster || state.isManualLoading` → `isLoadingMaster: state.isManualLoading`으로 변경
    - [ ] React Query isLoading을 UI 스피너 トリガー에서 분리
  - **Pseudocode**:

    ```typescript
    return {
      state: {
        ...state,
        clubs,
        // isLoadingMaster를 React Query isLoading에서 분리
        // → loadMasterAndSession의 명시적 SET_MANUAL_LOADING만으로 스피너 제어
        isLoadingMaster: state.isManualLoading,
        pendingSyncCount: syncQueueCount,
      },
      ...
    };
    ```

  - **Dependency**: Task 1 이후 잔재 문제가 있을 때 적용 (Task 1이 primary fix)
  - **Verification**:
    - autoSync로 인한 쿼리 invalidate 후에도 스코어 화면 유지됨
    - 앱 최초 진입 시에는 여전히 스피너가 표시됨 (`isManualLoading=true`)

---

- [ ] **Task 3: `autoSync`의 invalidate에 `refetchType: 'none'` 추가 (Optional)**
  - **Goal**: `autoSync`가 `['current_round_id']`를 invalidate할 때 기록 탭의 isLoading에 전파되지 않도록, 즉시 refetch를 억제한다.
  - **Context**: `src/modules/golf/hooks/useDashboardData.ts` — L57 `invalidateQueries`
  - **Implementation**:
    - [ ] `refetchType: 'none'` 옵션 추가 — stale 마킹만 하고 즉시 refetch 없음
  - **Pseudocode**:

    ```typescript
    queryClient.invalidateQueries({
      queryKey: ['current_round_id'],
      refetchType: 'none', // stale 마킹만 하고 즉시 refetch 없음 → isLoading 전파 방지
    });
    ```

  - **Dependency**: Task 1로 해결 시 불필요 (보완적 적용)
  - **Verification**: autoSync 후 기록 탭에서 isLoadingCurrentId가 true로 바뀌지 않음

---

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **최소 수정**: Task 1이 Primary Fix. Task 2/3은 Task 1 적용 후 잔재 현상 확인 후 결정.
- **staleTime 통일**: `useDashboardData`가 이미 `staleTime: Infinity`로 동일 쿼리를 운영 중. 대칭적 적용으로 사이드 이펙트 없음.
- **Invalidation Contract**: `staleTime: Infinity` 설정 후에도, 모든 쓰기 작업 완료 직후 반드시 `invalidateQueries` 호출이 있어야 UI 동기화 유지됨. 현재 코드는 이를 준수하고 있음.
- **Encoding**: UTF-8 no BOM 고정.
- **Refactoring 범위**: Task 외 리팩토링 금지.

---

## ✅ Definition of Done

1. [x] ~~리더보드 탭 → 기록 탭 이동 후 2~3초 구간에 스피너 재출현이 없음.~~ **(Task 1 완료 후 실기기 검증 대기)**
2. [ ] 기록 화면의 스코어 데이터(홀 번호, 점수)가 이동 전/후 동일하게 유지됨.
3. [ ] 앱 최초 진입 시 정상 스피너 표시 후 세션 복원 흐름은 유지됨.
4. [ ] 린트 에러 0개.
5. [ ] `memory.md` 변경 사항 반영 완료.
