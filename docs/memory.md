# Project Memory Summary (Condensed)

## Architecture & Core System
- **3-Layer Domain**: Definition, Repository, Service (src/modules/golf).
- **Cloud Sync**: Supabase integration with Safe Sync Protocol & AsyncLock.
- **State Management**: useReducer based atomic orchestration for scoring sessions.
- **Observability**: GlobalErrorBoundary, HoleErrorBoundary, and standardized logging.

## Milestone Logs
- **Phase 1-5 (Hardening)**: Expo Router, useReducer, High-performance Dashboard, Sync Queue, Keyed Async Lock.
- **Phase 6.2 (Polish & Bugfix)**: Course Selection Reset bug resolved. 프리미엄 디자인 시스템 적용. **TSC EXIT:0.**
- **Phase A-1 ~ A-6 (UX/Stability)**: scoreUtils 추출, ProgressBar, 명시적 네비게이션 프로토콜, Fixed Layout.
- **Phase Admin**: 구장 데이터 자동 검증(`validateClubData`) 및 `is_verified` 자동 결정.

## Codebase Cleanup (2026-03-11)
- **폐기 계획 코드 전면 정리** (`docs/IMPROVEMENT_PLAN.md` 기준):
  - `HoleRecord.memo?` 제거 (A-5: DB sync 없음)
  - `isFairway` 전체 제거: `HoleRecord`, `GolfRecordState`, `setIsFairway`, `DbHoleRow.is_fairway`, `holesToSync.is_fairway`, `getHoleData` 기본값 (B-2)
  - `firRate` 전체 제거: `RoundSummary`, `AdvancedStats`, `calculateSummary` 계산 로직, `calculateAdvancedStats` 반환값 (B-2)
  - DB 마이그레이션: `supabase/migrations/20260311000000_drop_is_fairway.sql` — `holes.is_fairway` 컬럼 DROP (적용 완료)
  - `CRITICAL_LOGIC.md §11` 영구 폐기 기능 목록 추가 (A-2, A-4~A-7, B-1~B-2, B-5~B-6, C-5~C-6, G-1, G-4~G-5)

## Recent Improvements (2026-03-11)
- **총 타수 색상 코딩** (`LeaderboardCard`):
  - `getTotalScoreColor(totalScore)` 추가 (`scoreUtils.ts`)
  - <80 파랑, 80~89 초록, 90~99 노랑, 100~109 주황, 110+ 빨강
- **상대 점수 표기**: `+30` → `(+30)` 괄호 추가 (`LeaderboardCard.tsx`)

## Handoff Protocol (2026-03-11)
- **현재 상태**: 폐기 코드 정리 완료 + UX 개선 완료. **TSC EXIT:0. 테스트 15/15.**
- **SSOT**: `CRITICAL_LOGIC.md §11` — 향후 기획 시 폐기 목록 참조 필수.
- **다음 목표**: 안정성 모니터링 및 사용자 추가 피드백 대응.
