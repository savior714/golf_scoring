# 🗺️ Project Blueprint: 라운딩 화면 진입 성능 최적화 (Performance Optimization)

> 생성 일시: 2026-03-12 00:20 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- "새 라운딩" 또는 "기록 수정" 진입 시 발생하는 **UI 버벅임(Stuttering) 및 렉(Lag)을 제거**하여 프리미엄급 사용자 경험(UX)을 제공합니다.
- 데이터 로딩 로직을 비차단(Non-blocking) 방식으로 전환하고, React Query의 캐싱 메커니즘을 극대화합니다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: 데이터 로딩 아키텍처 개선 (React Query 통합)**
  - **Goal**: `useGolfRecord`에서 명령형으로 처리하던 데이터 로딩을 선언적 `useQuery`로 전환하여 캐싱 및 동기화 효율 증대.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts`
  - **Implementation**:
    - [x] `dispatch({ type: 'SET_CLUBS', ... })` 형태의 수동 상태 관리를 `useQuery` 기반으로 교체.
    - [x] `loadMasterAndSession` 내의 순차적 `await` 호출을 `Promise.all`을 이용한 병렬 처리로 최적화.
    - [x] `clubs` 데이터 로딩 시점을 `RecordScreen` 렌더링 시점보다 앞당기기 위해 React Query 캐시 적극 활용.
  - **Pseudocode**:

    ```typescript
    const { data: clubs } = useQuery({ queryKey: ['golf_clubs'], queryFn: clubRepository.getAllClubsSummary });
    const { data: rounds } = useQuery({ queryKey: ['golf_rounds'], queryFn: roundRepository.getAllRounds });
    ```

  - **Dependency**: None
  - **Verification**: 클럽 목록과 라운딩 목록이 캐시를 통해 중복 페치 없이 즉시 반환되는지 확인.

- [x] **Task 2: 화면 진입 시 비차단(Non-blocking) 초기화**
  - **Goal**: 네비게이션 애니메이션과 데이터 로딩/상태 업데이트 충돌을 방지하여 부드러운 전환 보장.
  - **Context**: `app/(tabs)/record.tsx`, `src/modules/golf/hooks/useGolfRecord.ts`
  - **Implementation**:
    - [x] `InteractionManager.runAfterInteractions`를 적용하여 애니메이션 종료 후 무거운 로직(세션 복원 등) 실행.
    - [x] `isLoadingMaster` 상태 노출 시점을 정교하게 제어하여 레이아웃 시프트 최소화.
  - **Dependency**: Task 1
  - **Verification**: 네이티브 성능 모니터를 통해 화면 전환 시 Frame Drop(FPS 저하) 발생 여부 체크.

- [x] **Task 3: 전략적 사전 로딩 (Pre-fetching)**
  - **Goal**: 사용자가 버튼을 누르기 전에 필요한 데이터를 미리 준비함.
  - **Context**: `app/(tabs)/index.tsx`, `app/_layout.tsx`
  - **Implementation**:
    - [x] `RootLayout` 또는 Dashboard(`index.tsx`)에서 클럽 목록(`golf_clubs`)에 대해 `queryClient.prefetchQuery` 수행.
  - **Dependency**: Task 1
  - **Verification**: `RecordScreen` 진입 시 `isLoading` 상태 없이 데이터가 즉시 표시되는지 확인.

- [x] **Task 4: 컴포넌트 메모이제이션 및 렌더링 최적화**
  - **Goal**: 복잡한 입력 UI(ScoreAdjuster, Grid 등)가 전체 스크린 리렌더링에 휘둘리지 않도록 격리.
  - **Context**: `src/modules/golf/components/Record/` 하위 컴포넌트들
  - **Implementation**:
    - [x] `MissShotPatternGrid`, `HoleSelectorGrid` 등에 `React.memo` 적용.
    - [x] `useGolfRecord`의 반환 값(Actions)들이 참조 투명성(Referential Stability)을 갖도록 `useMemo` 재점검. (이미 완료)
  - **Dependency**: None
  - **Verification**: `Stroke` 증감 시 `HoleSelectorGrid` 등 무관한 컴포넌트가 재렌더링되지 않는지 Profiler로 확인.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM.
- **React Hook Stability**: `Stable Ref Pattern`을 사용하여 비동기 클로저 문제 원천 봉쇄.
- **No Side Effects**: 성능 최적화 과정에서 기존의 점수 계산 로직 및 Supabase 동기화 순서가 변경되지 않도록 주의.

## ✅ Definition of Done

1. [x] "새 라운딩" 버튼 클릭 후 `RecordScreen` 표시까지의 지연 시간 300ms 이내 달성 (캐시 활용).
2. [x] 화면 진입 애니메이션 도중 멈춤 현상(Jank) Elimination (InteractionManager 적용).
3. [x] 모든 린트 통과 및 `memory.md` 업데이트 완료.
