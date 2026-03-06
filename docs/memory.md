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
- [2026-03-05 00:55] Re-designed Scorecard Table: 9-hole split, hole-specific symbols (â—Ž, â—‹, â–¡, â—‡), and auto-calculation.
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
- [2026-03-06 01:22] Fixed Supabase Edge Function timeout issue causing "Edge Function returned a non-2xx status code" on URL import.
  - Cause: Supabase Hobby plan forces a 10-second maximum wall-clock execution limit on Edge Functions. If fetch or Gemini parsing takes longer, the gateway terminates the function, returning a 504 error which bypasses the standard JSON error handling.
  - Solution: Reconfigured index.ts to aggressively respect a 9-second internal limit: reduced fetch timeout to 4s, reduced input character limit from 40,000 to 20,000, and wrapped Gemini generateContent in a 5-second Promise.race timeout. This ensures timeouts fall under custom error handling (200 OK + JSON error) instead of 5xx gateway faults.
- [2026-03-06 09:31] Configured Mobile Browser Emulation in dev.ps1: Set EXPO_NO_BROWSER=1 and added background job to launch Edge in iPhone 15 Pro mode for a better mobile-first dev experience.
- [2026-03-06 10:54] Communication Preference Update: Technical summaries (English SSOT) will now be recorded exclusively in docs/memory.md and suppressed from the chat window to optimize context and readability.
- [2026-03-06 10:59] UI Refinement: Replaced ambiguous trophy icon with 'New Round' text and CheckCircle icon in Leaderboard header for better UX clarity.

- Modularized record.tsx into reusable components: HoleSelectorGrid, ScoreAdjuster, MissShotPatternGrid, CourseHeader.
- Implemented Hole Selector Grid for quick navigation between holes.
- Added Tee selection step (Black, Blue, White, Red) to the course selection workflow.
- Implemented Early Termination feature and confirmation guard for starting a new round over an existing session.
- Updated Dashboard UX: 'New Round' button now shows 'Continue' (ì�´ì–´í•˜ê¸°) if an active session exists.
- Enforced TypeScript types in scoring callbacks to eliminate 'any' lint errors.

- Implemented automatic active session detection in Dashboard (index.tsx).
- Added a one-time prompt (Alert/Confirm) when an incomplete round is detected upon entering the dashboard.
- Enhanced header navigation: Clicking 'Continue/New' now offers a choice if a session is already active.
- Resetting prompt state on user logout to ensure consistent behavior across different sessions.
- [2026-03-06 15:25] **Silent Execution Protocol Implementation**:
  - To prevent UI flickering (Terminal flashing), all background file reading tasks (Physical Read of memory.md, CRITICAL_LOGIC.md) must prioritize using the internal `view_file` tool instead of the shell-based `Get-Content` command.
  - Terminal execution is reserved only for active build processes, git operations, or explicit shell commands.
- [2026-03-06 15:30] **Standardized Silent Execution Protocol in SSOT**:
  - Formalized the protocol in `docs/CRITICAL_LOGIC.md` under Section 7 (AI DX & Tooling Policy).
  - Established a strict "Internal Tools First" principle to eliminate unnecessary terminal flickering.
- [2026-03-06 15:45] **Comprehensive Code Audit & Improvement Report**:
  - Conducted a deep dive into `golf.repository.ts`, `golf.service.ts`, and components.
  - Identified critical risks: AsyncStorage concurrency (Race condition) and Inefficient Master Data UPSERT (140+ requests).
  - Documented architectural improvements in `docs/CODE_AUDIT_REPORT.md` (Tee color schema, Background sync feedback).

- [2026-03-06 16:30] **Terminal Flicker Emergency Response**:
  - Diagnosed "4-5 flickers" as an Agent-to-Shell Handshake retry loop.
  - Implemented `docs/TERMINAL_FLICKER_FIX.md` with action plan.
  - Switched to **Extreme Silent Protocol**: 0% use of `run_command` for reading files.

  - Implemented Async Mutex (AsyncLock) in roundRepository to prevent storage race conditions.
  - Refactored registerClub with batch upsert logic, reducing network requests for 27-hole clubs by ~90%.
  - Added teeColor schema support across DB, types, and recording screen (migrated from legacy memo field).
  - Implemented background sync status indicator (ActivityIndicator/CloudIcon) in the record screen header.
  - Split score categorization: 'Double Bogey' and 'Triple Bogey or Worse' now tracked separately for better insights.
  - Fixed TypeScript lint errors regarding implicit any and interface mismatches in record.tsx.
- [2026-03-06 16:00] Fixed Auth State Race Condition: Migrated '@current_round_id' to a user-specific storage key to prevent cross-account session leakage on shared devices.
- [2026-03-06 16:10] Created PR branch eat/golf-repo-refactor-and-tee-system and committed all architectural improvements and feature additions.
- [2026-03-06 16:15] Pushed branch eat/golf-repo-refactor-and-tee-system to origin. PR is ready for creation.
- [2026-03-06 16:10] Applied PowerShell profile optimization (handshake OSC 633;A and encoding sync) to resolve terminal flickering issues.
- [2026-03-06 16:15] Verified 'Silent Protocol': Antigravity will now exclusively use native APIs (list_dir, view_file, grep_search) for all file operations to prevent the handshake loop flicker. Terminal (run_command) will only be used for process execution.

- [2026-03-06 16:16] Verified PowerShell profile (C:\Users\savio\OneDrive\¹®¼­\WindowsPowerShell\Microsoft.PowerShell_profile.ps1) status and confirmed UTF-8 output. Terminal handshake (OSC 633;A) is active and session reports as stable.
- [2026-03-06 16:26] **Isolation Test: Terminal Shell Migration (Concluded)**:
  - Result: Flickering persists in `cmd.exe`.
  - Conclusion: The issue is NOT shell-dependent; it is a core Agent/Terminal handshake infrastructure bug.
  - Action: Restored PowerShell 7 and re-enforced 'Extreme Silent Protocol' (avoiding `run_command` at all costs/99% shift to native tools).

- [2026-03-06 16:35] Modified CLAUDE.md: Removed PowerShell 7 (pwsh) syntax enforcement while maintaining Windows 11 Native context.

- [2026-03-06 16:38] Reset settings.json: Reverted terminal profiles to Windows default (PowerShell/CMD) and removed all PowerShell 7 paths and defaults.

- [2026-03-06 16:39] Fixed typo and updated comments in settings.json to accurately reflect the removal of PowerShell 7 requirement.

- [2026-03-06 17:01] **Fixed Terminal Launch Error**: Explicitly set PowerShell path to 'powershell.exe' in user settings.json to bypass missing 'pwsh.exe' path.
