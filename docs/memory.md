# Project Memory

## Date: 2026-03-04 ~ 2026-03-05
## Summary: Initial Development and Core Feature Implementation

- [2026-03-04] **Phase 1: Foundation & Core UI**
  - Initialized Golf Tracker using Expo Router with a 3-layer architecture (Definition, Repository, Service).
  - Implemented Entrance screen (Room Code/Player Name) and Real-time Leaderboard.
  - Developed Hole Recording UI with Par (3/4/5), Distance (m), and Score (Stroke/Putt) tracking.
  - Added OB/Penalty Area tracking (statistical only, manual stroke adjustment required).
  - Integrated Arista CC (Lake/Mountain) and Sunning Point CC (later removed) master data.
  - Implemented Dashboard with score distribution (Eagle+, Birdie, Par, Bogey, D-Bogey-) and progress tracking.
  - Added Miss Shot Pattern analysis (Slice, Hook, Top, Fat, Pop, Shank) with horizontal scroll and grid layout.
  - Configured Vercel deployment and KakaoTalk external browser redirect logic.

- [2026-03-04 21:30] Refined Miss Shot types: Added 'Bunker' and 'Three-putt', removed 'Pop' and 'Top' based on feedback.
- [2026-03-04 21:45] Integrated Supabase for cloud synchronization (Upsert logic).
- [2026-03-05 00:55] Re-designed Scorecard Table: 9-hole split, hole-specific symbols (◎, ○, □, ◇), and auto-calculation.
- [2026-03-05 01:15] Security & Auth: Integrated Supabase Auth with RLS policies.
- [2026-03-05 01:25] Implemented Data Migration: Anonymous data automatically moves to user account upon login.
- [2026-03-05 01:35] Introduced Google OAuth via browser popup for improved UX.
- [2026-03-05 02:30] Quality Audit: Fixed TypeScript errors (Href types, import syntax) and removed dead code across 7 files.
- [2026-03-05 08:25] DDD Refactoring: Isolated domain logic into `src/modules/golf` and shared infra into `src/shared`.
- [2026-03-05 10:00] Multi-Tee Support: Added distances for Black/Blue/White/Red tees.
- [2026-03-05 13:00] Admin System: Built Master DB for Clubs/Courses/Holes/Distances with RLS restricted to admins.
- [2026-03-05 14:52] Intelligent Automation: Auto-select/deselect 'Three-putt' pattern based on putt count (>=3).
- [2026-03-05 15:20] UI/UX Polish: Enhanced Dashboard main card with glassmorphism and bottom-layered progress bar.
- [2026-03-05 16:00] Universal Rules: Standardized UTF-8 encoding and PowerShell 7 scripts across 10 project folders.
- [2026-03-05 17:25] Sync Logic Fixes: Added `updatedAt` field and improved merge logic to prevent multi-device data loss.
- [2026-03-05 21:00] Course Auto-Import System:
  - Created Edge Function using Gemini 2.5 Flash for parsing HTML/Text into structured course data.
  - Implemented Admin UI for URL/Text import with confidence indicators.
  - Expanded Par range (3-7) to support specialized courses (e.g., Gunsan CC Par 6/7).
- [2026-03-05 22:20] Global Instruction Sync: Reproduced latest `CLAUDE.md` across all projects.

## Date: 2026-03-06
- [2026-03-06 00:39] Refactored SSOT documentation: Translated `docs/CRITICAL_LOGIC.md` to English for token efficiency.
- [2026-03-06 00:41] Continued Documentation English transformation: Translated `docs/COURSE_AUTO_IMPORT_PLAN.md` to English.
- [2026-03-06 00:43] Refactored `docs/memory.md`: Consolidated and translated historical logs to English (SSOT compliance).
- [2026-03-06 00:49] SSOT English migration complete: all Korean comments in src/**/*.ts(x), app/**/*.tsx translated to English. UI-facing Korean strings preserved. README.md translated to English.
- [2026-03-06 01:03] Fixed data loss issue on Back navigation by intercepting headerLeft to trigger auto-save before popping screen.
- [2026-03-06 01:03] Updated 18th hole finish logic to explicitly clear currentRoundId, effectively closing the local active session upon completion.
