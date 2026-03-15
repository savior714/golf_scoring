# 🗺️ Project Blueprint: 히스토리 네비게이션 세션 동기화 수정

> 생성 일시: 2026-03-16 00:45 | 상태: 완료 (Completed)

## 🎯 Architectural Goal

- **목표**: 히스토리 탭에서 서로 다른 라운드 기록을 연달아 "수정" 진입했을 때, `RecordScreen`이 항상 최신 선택된 세션 데이터를 로드하도록 보장함.
- **핵심 문제**: `consumedModeRef`가 `'edit'` 상태를 기억하고 있어, 다른 라운드로 진입하더라도 새 로딩 프로세스가 실행되지 않음.
- **해결 방안**: 
  1. `history.tsx`에서 네비게이션 시 고유 `id`를 파라미터로 전달.
  2. `record.tsx`의 `useFocusEffect` 클린업 시 `consumedModeRef`를 명확히 초기화.
  3. `useLocalSearchParams`에서 `id` 변화를 감지하여 로딩 트리거 보강.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `app/(tabs)/history.tsx` 수정 — 네비게이션 파라미터 보강**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\history.tsx`
  - **Goal**: 기록 상세 진입 시 `id` (roundId)를 파라미터에 명시적으로 추가.
  - **Pseudocode**:
    ```typescript
    router.push({ 
      pathname: '/(tabs)/record', 
      params: { source: 'history', mode: 'edit', id: roundId } 
    });
    ```

- [x] **Task 2: `app/(tabs)/record.tsx` 수정 — 파라미터 소비 및 수명 주기 관리**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\record.tsx`
  - **Goal**: `id` 파라미터 수신 추가 및 `useFocusEffect` 클린업 시 `consumedModeRef` 초기화 로직 구현.
  - **Pseudocode**:
    ```typescript
    const { mode, id } = useLocalSearchParams<{ mode?: string; id?: string }>();
    // ...
    useEffect(() => {
      // id 변화를 포함하여 Guard 강화
      if (mode && mode === consumedModeRef.current && prevIdRef.current === id) return;
      // ...
      return () => {
        consumedModeRef.current = undefined; // 탭 전환 시 소비 상태 초기화
      };
    }, [mode, id]);
    ```

- [x] **Task 3: 린트 체크 및 SSOT 반영**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 변경 사항의 타입 무결성 검증 및 `memory.md` 업데이트.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **InteractionManager**: 브라우징 경험 유지를 위해 무거운 로딩은 반드시 애니메이션 종료 후 실행.
- **Ref-based Guard**: 불필요한 재렌더링 방지를 위해 `consumedModeRef` 패턴은 유지하되, 리셋 시점을 정밀하게 제어.

## ✅ Definition of Done

1. [x] 서로 다른 2개 이상의 기록을 History에서 번갈아 클릭했을 때 각각 올바른 구장 정보가 로드됨.
2. [x] `npx tsc --noEmit` 결과 오류 0.
3. [x] `memory.md`에 최종 해결 내역 기록.
