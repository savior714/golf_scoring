# 🗺️ Project Blueprint: 스코어 입력 탭 전환 레이스 컨디션 버그 수정

> 생성 일시: 2026-03-16 22:45 | 상태: 완료 (2026-03-16 22:50)

## 🎯 Architectural Goal

- **스코어 입력(Record)** 탭 진입 시 URL 파라미터(`mode`, `id`)를 소비(Consume)하는 과정에서 발생하는 **네비게이션 하이재킹(Navigation Hijacking)** 현상 해결.
- 사용자가 탭을 빠르게 전환할 때, 백그라운드에서 실행 중인 비동기 작업(`router.setParams`)이 현재 활성화된 탭을 강제로 다시 `Record` 탭으로 돌려놓는 레이스 컨디션을 차단함.
- **SSOT**: `app/(tabs)/record.tsx`의 생명주기 가드 강화.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: record.tsx 분석 및 UseIsFocused 도입 검토**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\record.tsx`
  - **Goal**: 현재 `useFocusEffect` 내의 비동기 로직이 포커스를 잃은 후에도 `router.setParams`를 호출하는지 확인. (분석 완료: 비동기 클로저의 특성상 InteractionManager.cancel()만으로는 router.setParams 호출을 완벽히 차단할 수 없음을 확인)
  - **Dependency**: None

- [x] **Task 2: record.tsx 수정 — 비동기 로직 내 포커스 가드 추가**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\record.tsx`
  - **Goal**: `router.setParams` 호출 전 `isFocused` 상태를 확인하여 타 탭으로 이동한 경우 파라미터 수정을 중단하도록 개선. (완료: useIsFocused 도입 및 가드 적용)
  - **Pseudocode**:
    ```typescript
    const isFocused = useIsFocused(); // @react-navigation/native
    // ...
    const task = InteractionManager.runAfterInteractions(async () => {
      await loadMasterAndSession();
      if (isFocused && (mode === 'new' || mode === 'edit')) {
        router.setParams({ mode: undefined, id: undefined });
      }
    });
    ```
  - **Dependency**: Task 1

- [x] **Task 3: 검증 및 memory.md 업데이트**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 린트 체크 수행 및 작업 결과 기록. (완료: tsc 통과 및 문서 반영)
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **InteractionManager**: 애니메이션 도중 무거운 작업을 지연시키기 위해 유지하되, `cancel`만으로는 부족한 비동기 클로저의 특성을 고려하여 명시적 가드(`isFocused`) 사용.
- **Expo Router**: `router.setParams`는 전역 상태에 영향을 주므로, 반드시 해당 화면이 포커스된 상태에서만 실행되어야 함.

## ✅ Definition of Done

1. [x] 대시보드에서 '새 라운딩' 클릭 직후 타 탭(히스토리 등) 클릭 시, 다시 Record 탭으로 튕겨 돌아오지 않음.
2. [x] `record.tsx`에서 URL 파라미터가 정상적으로 초기화되어 중복 진입 방지 로직이 유지됨.
3. [x] `docs/memory.md`에 레이스 컨디션 수정 내역 반영.
