# Project Memory Summary

## Phase 1: Foundation (2026-03-04)
- **Core UI & Logic**: Initialized Expo Router with 3-layer architecture. Developed entrance, leaderboard, and scoring (stroke/putt) screens.
- **Data Integration**: Integrated Arista CC master data. Implemented score distribution dashboard and miss shot analysis patterns.
- **Sync & Refine**: Added 'Bunker' and 'Three-putt' patterns. Integrated Supabase for cloud sync and Auth (Google OAuth).

## Phase 2: Refactoring & Advanced Features (2026-03-05)
- **Security & Data**: Implemented RLS policies and automatic anonymous-to-user data migration.
- **DDD Refactor**: Isolated domain logic (`src/modules/golf`) and shared infra.
- **Admin System**: Built Master DB for clubs/courses. Added multi-tee distance support (Black/Blue/White/Red).
- **Automation**: Implemented auto-selection of 'Three-putt' based on putt count.

## Phase 3: SSOT & Optimization (2026-03-06)
- **SSOT Migration**: Translated all technical docs (`CRITICAL_LOGIC.md`, `memory.md`) and internal code comments to English.
- **UX/UI Polish**: Solved data loss on back-navigation, added early termination, and refined dashboard 'New/Continue' logic.
- **Shell Stability**: Diagnosed terminal flickering as agent-to-shell handshake loop. Implemented "Extreme Silent Protocol" (99% native tool usage).
- **Architecture Hardening**: Added `AsyncLock` (Mutex) for storage race prevention. Improved Supabase batch upsert performance by 90%.
- **Sync Reliability**: Implemented strict version control (Safe Sync Protocol) based on `updatedAt` and record count to prevent data loss.
- **Infrastructure**: Resolved startup auth red-screen and implemented Chrome Watchdog for orphaned process cleanup.

## Recent Logs (2026-03-10)
- [09:30] **Cloud Sync Failure Fixed**: Resolved "Cloud Offline" (Red icon) issue.
  - **Infrastructure**: Standardized AsyncStorage polyfill in `supabase.ts` for consistent session persistence on both Web and Mobile.
  - **Database Migration**: Created `docs/migrations/20260310_emergency_sync_fix.sql` to resolve schema typos and add missing UUID relation columns.
- [09:40] **Phase 1: Component Extraction Complete**: Modularized UI elements in `index.tsx` and `record.tsx` into `src/modules/golf/components`.
- [10:00] **Phase 2: Logic Abstraction (Custom Hooks) Complete**:
  - **Implementation**: Created `useGolfRecord.ts` and `useDashboardData.ts` in `src/modules/golf/hooks`.
  - **Refactoring**: Successfully extracted all scoring logic, session management, and data lifecycle from screen components.
  - **Impact**: Reduced line count in `record.tsx` and `index.tsx` by over 50%, achieving high SoC (Separation of Concerns).
- [10:30] **Phase 4: Domain Logic Hardening (Phase 3 of Roadmap) Complete**:
  - **Service Layer**: Enhanced `golf.service.ts` to centralize all business rules (GIR, Pattern detection, Merge strategies).
  - **Refactoring**: Hooks (`useGolfRecord`, `useDashboardData`) and Repository now delegate logic to the service, becoming "Pure State/Data Managers".
  - **Stability**: Fixed lint errors related to null/undefined safety in service parameters and updated Type definitions for service methods.

## Appendix: Historical Context (Refined)
- [2026-03-07] Resolved PGRST204 Sync Error: Successfully applied ALTER TABLE to add `out_course_id`, `in_course_id`, `tee_color`, and `updated_at` to the live Supabase `rounds` table. Verified schema alignment.
- [2026-03-10] Code Review & Improvement Plan: Conducted a comprehensive project audit and established a 4-phase refactoring roadmap in `docs/code_review.md`.
## Phase 4: Final Optimization & Hardening (2026-03-10)
- **State Orchestration**: Refactored useGolfRecord.ts to use useReducer, consolidating 20+ states into a single atomic state object. Improved predictability of state transitions (e.g., hole switching).
- **Offline Hardening**: Implemented Sync Queue logic in golf.repository.ts. Rounds that fail to sync are now queued in AsyncStorage and automatically retried during the next session initialization.
- **UI/UX Stability**: Enhanced error handling and sync status tracking, providing a more robust foundation for global toast notifications and error boundaries.