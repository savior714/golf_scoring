# Golf Scoring Application - Optimization Plan (성능 및 메모리 최적화 계획)

**이 문서는 애플리케이션의 런타임 성능을 극대화하고, 메모리 누수를 방지하며, 부드러운 사용자 경험을 유지하기 위한 세부 최적화 단계를 정의합니다.** 각 단계는 독립적으로 실행 및 검증 가능한 최소 단위로 설계되었습니다.

---

## Phase 4: Runtime Stability & Memory Hygiene (런타임 안정성 및 메모리 관리)

### 4.1. Hook 레퍼런스 안정성 (Referential Stability)

사용자 입력 빈도가 높은 `useGolfRecord` 훅의 반환값 구조를 최적화하여 불필요한 리렌더링을 차단합니다.

- [x] **Step 4.1.1: State/Dispatch 분리** - `useGolfRecord`에서 `state`와 `actions`를 완전히 분리하여 반환하거나, 고정된 함수 객체를 보장.
- [x] **Step 4.1.2: Callback 클로저 최적화** - `handleSaveCurrentHole` 등 상태 전체에 의존하는 함수들을 `useRef`를 활용해 재생성 방지 (Stable Ref Pattern 적용).
- [x] **Step 4.1.3: Stable Action Pattern** - 모든 세터 함수(`setStroke`, `setPutt` 등) 및 async 함수(`startNewRound`, `handleSaveCurrentHole`)가 `useCallback`으로 래핑되어 동일한 메모리 주소를 유지하도록 보장. `any` 제거 (Double Cast 패턴 적용).

### 4.2. 리스트 렌더링 최적화 (List Performance)

`History` 화면과 같이 데이터 양이 늘어날 수 있는 화면의 렌더링 효율을 개선합니다.

- [x] **Step 4.2.1: 컴포넌트 메모이제이션 (React.memo)** - `HistoryItem` 컴포넌트 추출 후 `React.memo` 적용. `ScoreCardTable`에도 `memo` 래핑 완료. Props 비교 안정화.
- [x] **Step 4.2.2: RenderItem 외부 추출** - `HistoryItem`을 독립 컴포넌트로 분리하고 `renderItem`을 `useCallback`으로 래핑. `handleViewRound`, `handleDeleteRound`, `handleSync`, `keyExtractor`, `handleRefresh`도 전부 `useCallback` 적용.
- [x] **Step 4.2.3: FlatList 속성 튜닝** - `initialNumToRender=5`, `maxToRenderPerBatch=10`, `windowSize=5`, `removeClippedSubviews=true` 설정 완료.
- [~] **Step 4.2.4: getItemLayout 도입** — **SKIP (고정 높이 보장 불가)**
  - 근거: `item.courseType` 조건부 렌더링(`&&`)으로 인해 카드 높이가 약 16px 변동됨.
  - `getItemLayout`은 완전 고정 높이 보장 시에만 안전. 현 구조에서 적용 시 스크롤 복원 위치 오차 발생 위험.
  - 대안: 카드 내 `courseType` 공간을 항상 확보(빈 Text 유지)하여 고정 높이화하거나, Phase 5에서 가상화 라이브러리(`@shopify/flash-list`) 검토.

### 4.3. 자원 해제 및 데이터 위생 (Memory Hygiene)

애플리케이션이 백그라운드로 가거나 컴포넌트가 언마운트될 때 남은 자원을 철저히 정리합니다.

- [x] **Step 4.3.1: Listener Audit** — AppState(2개), Supabase Auth(2개) 전체 cleanup 확인. BackHandler/Keyboard/NetInfo/Realtime 미사용. 누수 없음.
- [x] **Step 4.3.2: 타이머 관리** — `setTimeout`은 `Promise` 래핑 delay 헬퍼 1개뿐, 자동 회수됨. `setInterval` 미사용. 누수 없음.
- [~] **Step 4.3.3: Image Cache Policy** — **N/A**: `Image` 컴포넌트 미사용. 모든 아이콘은 `lucide-react-native` SVG 벡터. 이미지 캐시 전략 불필요.
- [x] **Step 4.3.4: Modal Unmount Crash 방지** — 커밋 `d04cdc5`에서 수정 완료. `exiting` 애니메이션 제거 및 `TEE_COLORS.find` null-safety 추가.

### 4.4. 계산 비용 최적화 (Computational Efficiency)

통계 계산 등 복잡한 로직이 UI 스레드를 차단하지 않도록 개선합니다.

- [x] **Step 4.4.1: 통계 엔진 지연 계산 (Pre-slice Optimization)** — `useDashboardData.ts:175`
  - 기존: `calculateAdvancedStats(rounds)` 전체 N개 라운드 → `calculateSummary()` N회 실행 → `.slice(-5)`
  - 개선: `rounds.filter→sort→slice(-5)` 후 `calculateAdvancedStats(recentRounds[5])` → `calculateSummary()` 최대 5회 실행
  - 성과: **O(N×18홀) → O(5×18홀)** — 라운드 50개 기준 900→90 반복 (10× 절감). **TSC EXIT:0.**
- [x] **Step 4.4.2: useMemo 의존성 최소화** — `useDashboardData.ts:17-19, 124`
  - `isSyncingRef` Stable Ref Pattern 적용 → `handleFinishRound` 의존성 `[latestRound, isSyncing, queryClient]` → `[latestRound, queryClient]`
  - `sync` 시작/종료 시 `handleFinishRound` 함수 재생성 차단. **TSC EXIT:0.**
- [~] **Step 4.4.3: Batch Updates** — **N/A (React 18 자동 배치 적용됨)**
  - React 18 automatic batching이 async 함수 내 `setState` 호출을 자동으로 배치 처리.
  - `useReducer`는 이미 `useGolfRecord`에서 적용 중. 추가 최적화 불필요.

---

## Phase 5: Advanced Infrastructure (고급 인프라)

### 5.1. 캐시 및 영속성 전략

- [x] **Step 5.1.1: TanStack Query 최적화** — `staleTime: Infinity` 적용 (`useDashboardData.ts:22,28`, `history.tsx:107`)
  - 대상 쿼리: `golf_rounds`, `current_round_id` — 모두 로컬 AsyncStorage 기반, 모든 변경 지점 `invalidateQueries` 완비
  - 효과: 앱 포커스 복귀(`windowFocus`) 시 불필요한 AsyncStorage 재읽기 완전 차단. **TSC EXIT:0.**
- [x] **Step 5.1.2: Offline Sync Queue 고도화** — `golf.repository.ts`
  - `MAX_SYNC_QUEUE_SIZE = 20` 상수 추가 → `_addToSyncQueue` 크기 상한 적용 (초과 시 오래된 항목 slice)
  - `pruneSyncQueue()` 메서드 추가: 로컬에 미존재 고아 ID 일괄 제거. `retryPendingSyncs` 전 선택적 호출 가능. **TSC EXIT:0.**
