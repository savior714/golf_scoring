# Project Memory Summary (Condensed)

## Architecture & Core System

- **3-Layer Domain**: Definition, Repository, Service (src/modules/golf).
- **Cloud Sync**: Supabase integration with Safe Sync Protocol & AsyncLock.
- **State Management**: useReducer based atomic orchestration for scoring sessions.
- **Observability**: GlobalErrorBoundary, HoleErrorBoundary, and standardized logging.

## Milestone Logs

- **Phase 1-3 (Foundations)**: Expo Router, Master DB (27-hole), OAuth, and English SSOT migration.
- **Phase 4-5 (Hardening)**: useReducer consolidation, Sync Queue, and Keyed Async Lock.
- **Phase 6 (Polish)**: react-native-toast-message, expo-haptics, FIR tracking, and performance optimization.

## Recent Improvements (2026-03-10 ~ 11)

- **Navigation Hotfixes**: Resolved Expo Router Tabs.Screen and Animated exiting crashes.
- **UX Simplification**: Refactored tab role separation and history-to-record deep linking.
- **Type Safety**: Achieved **Lint-Zero** for TypeScript (no any) and Markdown docs.
- **Analytics & Insight**: TrendChart + PatternHeatmap 대시보드 통합. calculateAdvancedStats 고도화.
- **Admin Infrastructure**: Phase 3.1 완료. is_verified 필드 기반 구장 관리 UX 및 데이터 무결성 검증 엔진 구축.
- **System Hardening**: Phase 3.2 완료. Unit Test (golf.service.ts), 네트워크 복구 시나리오 자동 리트라이.

## Change Log (2026-03-11)

- **Phase 4.1 완전 완료 (Hook Referential Stability)**:
  - 4.1.1: useGolfRecord state/actions 분리.
  - 4.1.2: handleSaveCurrentHole Stale Closure 제거 → stateRef Stable Ref Pattern. 의존성 [state] → [queryClient].
  - 4.1.3: startNewRound useCallback 적용. any → unknown 경유 이중 캐스팅 대체. **TSC EXIT:0.**
- **GEMINI.md 고도화**: 좀비 프로세스 게이트(섹션 3), 이중 캐스팅(섹션 6), React Hook 안정성(섹션 9 신설) 추가.
- **CRITICAL_LOGIC.md 동기화**: Section 9에 Stable Ref Pattern 및 Double Cast Pattern SSOT 반영.
- **Phase 4.2.1~4.2.3 완료 (List Rendering Optimization)**:
  - HistoryItem 독립 컴포넌트 추출 + React.memo 적용 (Props 비교 안정화).
  - ScoreCardTable → React.memo 래핑 완료.
  - renderItem, keyExtractor, handleRefresh, handleSync, handleViewRound, handleDeleteRound 전체 useCallback 안정화.
  - FlatList: initialNumToRender=5, maxToRenderPerBatch=10, windowSize=5, removeClippedSubviews=true. **TSC EXIT:0. BOM=False.**

## Change Log (2026-03-11 — Phase 4.2.4 & 4.3)

- **Phase 4.2.4 SKIP**: `item.courseType` 조건부 렌더링으로 카드 높이 ~16px 가변 → getItemLayout 적용 불가. OPTIMIZATION_PLAN에 근거 기록.
- **Phase 4.3.1 완료 (Listener Audit)**: AppState(2개), Supabase Auth(2개) 전체 cleanup 확인. 누수 없음.
- **Phase 4.3.2 완료 (타이머 관리)**: setTimeout Promise 래핑 1개뿐, setInterval 미사용. 누수 없음.
- **Phase 4.3.3 N/A (Image Cache)**: Image 컴포넌트 미사용, lucide-react-native SVG만 사용.
- **Phase 4.3.4 기완료**: 커밋 d04cdc5에서 Modal exiting 크래시 수정 완료.

## Change Log (2026-03-11 — Phase 4.4)

- **Phase 4.4.1 완료 (Pre-slice Optimization)**: `useDashboardData.ts`의 `advancedStats` useMemo에서 `rounds` 전체를 `calculateAdvancedStats`에 넘기기 전 pre-filter→sort→slice(-5) 적용. `calculateSummary` 호출 O(N) → O(5). **TSC EXIT:0.**
- **Phase 4.4.2 완료 (isSyncing Stable Ref)**: `isSyncingRef` 패턴으로 `handleFinishRound` 의존성 배열에서 `isSyncing` 제거. sync 시작/종료 시 함수 재생성 차단.
- **Phase 4.4.3 N/A**: React 18 자동 배치(automatic batching)로 async 함수 내 setState 이미 배치 처리됨.

## Change Log (2026-03-11 — Phase 5.1)

- **Phase 5.1.1 완료 (TanStack Query staleTime)**:
  - `golf_rounds`, `current_round_id` 쿼리에 `staleTime: Infinity` 적용 (`useDashboardData.ts`, `history.tsx`)
  - 로컬 AsyncStorage 기반 쿼리 — 모든 변경 지점에서 `invalidateQueries` 명시적 호출 완비 → 앱 포커스 시 불필요한 재읽기 완전 차단.
- **Phase 5.1.2 완료 (Sync Queue 고도화)**:
  - `MAX_SYNC_QUEUE_SIZE = 20` 상한 캡 + `pruneSyncQueue()` 고아 ID 청소 메서드 추가 (`golf.repository.ts`)
  - **TSC EXIT:0. BOM=False.**

## Change Log (2026-03-11 — Phase 6.1 UI/UX Refinement)

- **UI 전면 개편 완료**: "허전한 빈 공간" 및 "촌스러운 원형 버튼" 문제 해결.
  - 전용 프리미엄 디자인 시스템 구축 (부드러운 사각형 Squircle, Subtle Shadow, Glow 효과).
  - 레이아웃 최적화: `ScrollView` + `scrollContent` 패딩 조정으로 수직 공백 제거.
  - `ScoreAdjuster`, `PAR`, `PatternGrid` 전체 버튼 디자인 통일.
- **Round Finish 프로세스 정상화**:
  - `Alert` Suppression 방지 정책 수립: 시스템 `Alert` 대신 커스텀 `Modal`을 사용하여 UI Serialization 문제 원천 해결.
  - 18홀 종료 시 [저장 완료 토스트 → 확인 모달 → 대시보드 강제 이동] 시퀀스 완비.
  - `finishRound` 전 `saveCurrentHole` 강제 호출로 데이터 무결성 보장. **TSC EXIT:0.**

## Handoff Protocol (2026-03-11)

- **현재 상태**: Phase 6.1 UI/UX 리뉴얼 완료. **TSC EXIT:0. BOM=False.**
- **Git Push (2026-03-11)**: UI 전면 개편 및 Round Finish 모달화 내용 원격 푸시 완료.
- **다음 목표**: [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 기반 잔여 최적화 또는 기능 고도화.
