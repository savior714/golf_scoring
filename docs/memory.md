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

## Handoff Protocol (2026-03-11 16:30)

- **현재 상태**: Phase 4.2.1~4.2.3 (List Rendering Optimization) 완료. TSC EXIT:0 / BOM=False 확인.
- **다음 목표**: [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 기반 **Phase 4.2.4 → 4.3** 착수.
  - Step 4.2.4: getItemLayout 도입 (HistoryItem 고정 높이 측정 후 적용)
  - Step 4.3.1: Listener Audit (AppState, BackHandler, 네트워크 상태 리스너 전수 조사)
