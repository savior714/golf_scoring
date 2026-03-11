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
- [ ] **Step 4.2.4: getItemLayout 도입** - 고정 높이를 가진 리스트 아이템에 대해 레이아웃 계산 생략 로직 추가.

### 4.3. 자원 해제 및 데이터 위생 (Memory Hygiene)

애플리케이션이 백그라운드로 가거나 컴포넌트가 언마운트될 때 남은 자원을 철저히 정리합니다.

- [ ] **Step 4.3.1: Listener Audit** - `AppState`, `BackHandler`, 무선 네트워크 상태 등 모든 이벤트 리스너의 `remove()` 호출 누락 여부 전수 조사 및 수정.
- [ ] **Step 4.3.2: 타이머 관리** - `setTimeout`, `setInterval` 사용 시 반드시 cleanup 함수에서 `clear` 처리 보장.
- [ ] **Step 4.3.3: Image Cache Policy** - 대용량 이미지나 아이콘 로딩 시 메모리 캐시 전략 확인 (필요 시 `expo-image` 등 활용 검토).
- [ ] **Step 4.3.4: Modal Unmount Crash 방지** - `exiting` 애니메이션 및 조건부 렌더링 시 Modal이 닫히는 시점과 Unmount 시점의 불일치로 인한 좀비 컴포넌트 방지.

### 4.4. 계산 비용 최적화 (Computational Efficiency)

통계 계산 등 복잡한 로직이 UI 스레드를 차단하지 않도록 개선합니다.

- [ ] **Step 4.4.1: 통계 엔진 지연 계산 (Lazy Computation)** - 대시보드 진입 시 모든 통계를 즉시 계산하지 않고, 화면에 보이는 부분만 우선 계산.
- [ ] **Step 4.4.2: useMemo 의존성 최소화** - `advancedStats` 등 무거운 계산 Hook의 의존성 배열을 정교화하여 불필요한 재계산 횟수 감소.
- [ ] **Step 4.4.3: Batch Updates** - 여러 상태 변화가 동시에 일어날 때 `useReducer` 또는 `unstable_batchedUpdates`를 통해 렌더링 횟수 단축.

---

## Phase 5: Advanced Infrastructure (고급 인프라)

### 5.1. 캐시 및 영속성 전략

- [ ] **Step 5.1.1: TanStack Query 최적화** - `staleTime`, `cacheTime` 설정을 통해 불필요한 API 요청 및 데이터 처리 최소화.
- [ ] **Step 5.1.2: Offline Sync Queue 고도화** - 동기화 실패 기록의 메모리 점유를 방지하기 위해 `AsyncStorage` 청소 기능 추가.
