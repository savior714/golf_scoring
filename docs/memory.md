# Project Memory Summary (Condensed)

## Architecture & Core System
- **3-Layer Domain**: Definition, Repository, Service (src/modules/golf).
- **Cloud Sync**: Supabase integration with Safe Sync Protocol & AsyncLock.
- **State Management**: useReducer based atomic orchestration for scoring sessions.
- **Observability**: GlobalErrorBoundary, HoleErrorBoundary, and standardized logging.

## Milestone Logs
- **Phase 1-5 (Hardening)**: Expo Router, Consistently consolidated useReducer, High-performance Dashboard, Sync Queue, and Keyed Async Lock.
- **Phase 6.2 (Polish & Bugfix)**: Course Selection Reset bug resolved. UI 개편 (프리미엄 Squircle 디자인 시스템 적용). **TSC EXIT:0.**

## Recent Improvements (2026-03-11)
- **Phase 4 (Stability/Optimization)**:
  - hook referential stability (Stable Ref Pattern) 적용. 
  - FlatList list rendering 최적화 및 pre-slice optimization (O(N) -> O(5)).
  - Sync Queue 상한(20) 추가 및 캐시 무효화(`staleTime: Infinity`) 강화.
- **Phase A-1 (UX Consistency)**:
  - `src/shared/utils/scoreUtils.ts` 추출 및 전 가시적 지점 스코어 컬러 리팩토링.
  - 언더파(-) 색상 초록색(#38E54D) 통일 및 유틸리티화.

- **Phase A-3 (UX Progress Bar)**:
  - `ProgressBar` 컴포넌트 신설 및 `useGolfRecord` 파생 상태(`filledHoles`, `progressPercentage`) 연동.
  - Reanimated `withSpring` 기반의 부드러운 애니메이션 적용.

- **Phase A-4 (Bugfix: Selection Reset)**:
  - 구장 선택 시 Race Condition 해결 (Stable Ref 동기 업데이트).
  - `loadMasterAndSession` 로딩 Guard 추가 및 `CourseSelector` UI 언마운트 최적화.

- **Phase A-5 (Bugfix: Omnichannel Navigation Consistency)**:
  - 히스토리 뿐만 아니라 **대시보드(중단 재개), 스코어카드(홀 점프), 빈 화면(새 시작)** 전 구간 가드 우회 로직 완료.
  - 명시적 네비게이션 프로토콜(`mode: 'edit' | 'new'`) 수립 및 `CRITICAL_LOGIC.md` 반영.
  - 단순 탭 전환(Implicit)과 명시적 진입(Explicit)을 구분하여 사용자 작업 데이터 보존 및 안정성 동시 확보.

- **Phase A-6 (UI Layout Optimization)**:
  - `RecordScreen`의 `ScrollView`를 제거하고 `flex: 1` 기반의 Fixed Layout으로 전환.
  - 컴포넌트 간 간격 및 버튼 크기 최적화로 한 화면(Single Viewport)에 모든 UI 요소 배치 완료.
  - 가로/세로 간격(`gap`, `padding`) 조정을 통한 스크롤 제거 및 UX 피드백 반영.

## Handoff Protocol (2026-03-11 22:15)
- **현재 상태**: Phase A-6 완료 (RecordScreen 한 화면 레이아웃 최적화). **TSC EXIT:0.**
- **동기화**: `CRITICAL_LOGIC.md` 및 `memory.md` 최신 상태 유지.
- **다음 목표**: 안정성 모니터링 및 사용자 추가 피드백 대응.
