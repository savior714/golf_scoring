# 🗺️ Project Blueprint: Memory Leak Prevention & Optimization

> 생성 일시: 2026-03-12 11:55 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **메모리 누수 방지**: useFocusEffect, useEffect 및 비동기 작업의 cleanup 로직을 강화하여 좀비 프로세스 및 마운트 해제 후 상태 업데이트 방지.
- **렌더링 최적화**: Stable Ref Pattern (User Rule 9) 및 Memoization을 체계적으로 적용하여 불필요한 리렌더링과 의존성 루프 제거.
- **데이터 효율성**: React Query staleTime 및 List Virtualization 최적화를 통해 네트워크 부하 감소 및 대용량 데이터 처리 속도 향상.

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다. 우선순위에 따라 원하는 항목을 선택하여 진행을 요청하세요.

### 📦 Task List

- [x] **Task 1: Hook & FocusEffect Cleanup Audit**
  - **Goal**: 마운트 해제 시 미완료된 비동기 작업 및 타이머 자동 취소.
  - **Status**: 완료 (`isMounted` guard 적용됨)
  - **Context**: `app/(tabs)/record.tsx`, `src/modules/golf/hooks/useGolfRecord.ts`, `app/admin_users.tsx`, `app/(tabs)/admin.tsx`, `app/(tabs)/history.tsx`
  - **Implementation**:
    - [x] `useFocusEffect` 내 `InteractionManager` 태스크 cleanup 명시적 강화.
    - [x] `useGolfRecord` 외 모든 주요 Hook/화면에 `isMounted` 체크 도입.
  - **Dependency**: None
  - **Verification**: 탭 전환 시 Unmounted state update warning 제거 확인.

- [x] **Task 2: Stable Ref Pattern (User Rule 9) 전면 적용**
  - **Goal**: 2개 이상의 state 필드 의존 시 Stable Ref를 사용하여 Stale Closure 및 무한 루프 방지.
  - **Status**: 완료
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts`, `src/modules/dashboard/hooks/useDashboardData.ts`
  - **Implementation**:
    - [x] `stateRef`, `latestRoundRef` 등을 활용하여 useCallback 의존성 최소화.
    - [x] `handleFinishRound`, `handleSaveCurrentHole` 등 핵심 로직 안정화.
  - **Dependency**: Task 1
  - **Verification**: 의존성 배열 간소화 후에도 기능 정상 작동 및 불필요한 함수 재생성 방지.

- [ ] **Task 3: Render Performance & List Virtualization Optimization**
  - **Goal**: 40KB+ 대형 파일(admin.tsx) 및 리스트 컴포넌트의 렌더 부하 감소.
  - **Status**: 진행 중 (AdminUsers 완료)
  - **Context**: `app/admin_users.tsx`, `app/(tabs)/admin.tsx`, `app/(tabs)/history.tsx`
  - **Implementation**:
    - [ ] `renderItem` 함수를 컴포넌트 외부로 분리하거나 `useCallback` 래핑.
    - [ ] `FlatList`에 `initialNumToRender`, `windowSize`, `removeClippedSubviews` 옵션 최적화 적용.
    - [ ] 리스트 아이템 컴포넌트(UserCard, RoundCard 등)를 `React.memo`로 래핑.
  - **Dependency**: None
  - **Verification**: 리스트 스크롤 시 프레임 드랍(FPS) 개선 여부 및 리렌더링 프로파일링 확인.

- [ ] **Task 4: Network & Query Optimization**
  - **Goal**: 불필요한 API 요청 호출 차단 및 캐시 효율성 증대.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts`, `repository` 레이어
  - **Implementation**:
    - [ ] `sync_queue_count` 등 빈번한 쿼리에 5~10초의 `staleTime` 부여.
    - [ ] Supabase repository 메서드에 `AbortController` 지원 추가하여 불필요한 네트워크 작업 취소.
  - **Dependency**: Task 1
  - **Verification**: 네트워크 탭에서 중복/중첩된 API 요청 감소 확인.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Stable Ref Pattern**: User Rule 9 강제 준수.
- **any 금지**: 타입 가드 사용 필수.

## ✅ Definition of Done

1. [ ] 모든 핵심 화면(Record, History, Admin)에서 마운트 해제 경고 없음.
2. [ ] 대량의 중복 리렌더링 제거 (React DevTools 기준).
3. [ ] `memory.md` 및 `README.md`에 최적화 내역 업데이트 완료.
