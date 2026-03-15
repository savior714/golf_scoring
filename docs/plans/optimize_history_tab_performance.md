# 🗺️ Project Blueprint: 히스토리 탭 및 라운드 전환 성능 최적화

> 생성 일시: 2026-03-15 17:35 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **목적**: 히스토리 탭에서 특정 라운드 선택 시 발생하는 렉(Lag)을 제거하고, 부드러운 화면 전환(Flicker-free)과 빠른 데이터 로딩 지원.
- **SSOT**: `app/(tabs)/history.tsx`, `app/(tabs)/record.tsx`, `src/modules/golf/repository/golf.club.query.repository.ts`

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `HistoryScreen` (History Tab) 최적화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\history.tsx`
  - **Goal**: 화면 진입 시의 `autoSync` 로직이 네비게이션 애니메이션과 겹치지 않도록 `InteractionManager` 적용.
  - **Pseudocode**:
    ```typescript
    useFocusEffect(useCallback(() => {
      const task = InteractionManager.runAfterInteractions(async () => {
        await roundRepository.pullRoundsFromSupabase();
        if (isMounted.current) refetchRounds();
      });
      return () => task.cancel();
    }, [refetchRounds]));
    ```

- [x] **Task 2: `ClubQueryRepository` 코스 데이터 캐싱 도입**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\repository\golf.club.query.repository.ts`
  - **Goal**: 동일 코스 정보를 반복 조회할 때 Supabase 호출을 생략하도록 인메모리 캐시 변수 추가.
  - **Pseudocode**:
    ```typescript
    const courseCache = new Map<string, ClubCourseInfo>();
    // getCourseWithHoles 내부에서 cache 확인 후 저장
    if (courseCache.has(courseId)) return courseCache.get(courseId);
    // ... fetch ...
    courseCache.set(courseId, result);
    ```

- [x] **Task 3: `HistoryItem` 렌더링 최적화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\history.tsx`
  - **Goal**: 리스트 렌더링 시 `calculateSummary`가 반복 실행되어 JS Thread를 점유하는 현상을 `useMemo` 등으로 완화 (또는 Item 컴포넌트 내부 최적화).
  - **Pseudocode**:
    ```typescript
    const summary = useMemo(() => golfService.calculateSummary(item.holes), [item.holes]);
    ```

- [x] **Task 4: `RecordScreen` 초기 로딩 프로세스 점검**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app/(tabs)/record.tsx`
  - **Goal**: `InteractionManager` 내부에서 실행되는 `loadMasterAndSession`이 불필요하게 잦은 상태 업데이트를 유발하는지 확인 후 상태 병합 처리.

- [x] **Task 5: 검증 및 린트 체크**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 변경 사항에 따른 타입 무결성 검증.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **InteractionManager**: 모든 무거운 비동기 작업은 네비게이션 애니메이션 종료 후 실행되도록 강제함.
- **Throttling**: `pullRoundsFromSupabase`는 이미 30분 쓰로틀링이 걸려 있으나, 호출 자체를 미루는 것이 UI 반응성 향상에 핵심.
- **Memory Management**: 인메모리 캐시는 세션 유지 동안만 사용하며, 메모리 부족 시 초기화 전략 불필요 (데이터 사이즈가 작음).

## ✅ Definition of Done

1. [x] 히스토리 탭 진입 및 라운드 전환 시 프레임 드랍이 육안으로 느껴지지 않음.
2. [x] 동일 코스에 대해 반복 진입 시 Supabase 네트워크 호출이 발생하지 않음(캐시 작동).
3. [x] `memory.md`에 최적화 내역 반영 완료.
