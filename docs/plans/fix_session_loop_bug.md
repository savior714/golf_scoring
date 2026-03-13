# 🗺️ Project Blueprint: 라운딩 시작 후 세션 초기화 버그 수정

> 생성 일시: 2026-03-13 20:30 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **네비게이션 루프 차단**: `mode=new` 파라미터로 진입 시 세션이 강제 초기화된 후, 라운딩이 시작되어 세션이 생성되었음에도 불구하고 URL 파라미터가 남아있어 다시 초기화되는 현상을 수정합니다.
- **파라미터 소비 (Param Consumption)**: `mode=new` 명령을 수행한 직후 해당 파라미터를 URL에서 제거하여 일회성 명령으로 처리되도록 보장합니다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: `app/(tabs)/record.tsx` 수정 — 파라미터 클린업 로직 추가**
  - **Tool**: `Replace`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\record.tsx`
  - **Goal**: `useFocusEffect` 내에서 `loadMasterAndSession` 호출 후 `mode === 'new'`인 경우 파라미터를 비워줍니다.

  - **Pseudocode**:

    ```tsx
    const task = InteractionManager.runAfterInteractions(async () => {
      await loadMasterAndSession();
      if (mode === 'new') {
        router.setParams({ mode: undefined });
      }
    });
    ```

  - **Dependency**: None

- [ ] **Task 2: `src/modules/golf/hooks/useRoundActions.ts` 확인 — `isMounted` 가드 확인**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\hooks\useRoundActions.ts`
  - **Goal**: 세션 초기화(`INIT_SESSION`) 시 `isMounted` 체크가 유효한지 재확인.
  - **Dependency**: None

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Interaction Stability**: `router.setParams` 호출은 `InteractionManager` 내부에서 처리하여 UI 끊김을 최소화합니다.
- **Guard Maintenance**: 기존의 `activeSession && mode !== 'new'` 가드는 유지하되 파라미터 자체가 비워짐으로써 자연스럽게 가드가 작동하도록 유도합니다.

## ✅ Definition of Done

1. [ ] 대시보드에서 '새 라운딩' 클릭 후 구장/코스 선택.
2. [ ] '라운딩 시작' 클릭 시 기록 화면으로 정상 진입하며 튕기지 않음.
3. [ ] 기록 화면 진입 후 URL 파라미터에서 `mode=new`가 사라짐을 확인.
4. [ ] `memory.md` 업데이트.
