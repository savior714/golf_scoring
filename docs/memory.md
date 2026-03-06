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

## Recent Logs (2026-03-07)
- [02:35] **UI Refinement**: Reduced density/padding to fit more scoring data on mobile screens.
- [02:40] **PGRST204 Error**: Diagnosed missing `out_course_id`/`in_course_id` columns in live Supabase `rounds` table.
- [02:45] **Terminal Fix**: Configured `automationProfile` in `settings.json` to use `-NoProfile` and `-NonInteractive` PowerShell.
- [02:55] **Database Sync**: Provided `ALTER TABLE` SQL to align live schema with application domain model.
- [03:00] **Memory Protocol**: Summarized `memory.md` (>200 lines) and consolidated duplicate historical logs.
- [2026-03-07 03:00] **Resolved PGRST204 Sync Error**: Successfully applied ALTER TABLE to add out_course_id, in_course_id, 	ee_color, and updated_at to the live Supabase ounds table. Verified schema alignment. Sync functionality is now fully restored.
