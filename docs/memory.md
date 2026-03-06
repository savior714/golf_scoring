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

- [2026-03-06 17:15] **SSOT Hardening (Extreme Silent Protocol)**:
  - Updated `docs/CRITICAL_LOGIC.md` and `CLAUDE.md` to strictly forbid using `run_command` for reading local files.
  - Replaced instructions for `Get-Content` with internal tool alternatives (`view_file`, `list_dir`) to eliminate terminal flickering and pop-up windows during information gathering.
  - Defined the "Zero-Shell Information Gathering" rule as a core DX standard.

- [2026-03-06 17:10] **Terminal Stability Finalized**: Resolved 'Agent-to-Shell Handshake' flicker loop by shifting 100% of information gathering to internal tools (view_file, etc.). Verified 0% flicker in new sessions after standardizing powershell.exe and UTF-8 encoding. Status: RESOLVED.
- [2026-03-06 18:11] **Fixed Dev Script Launch Error**: Replaced 'pwsh' with 'powershell' in dev.bat to fix "'pwsh' is not recognized" error following the removal of PowerShell 7 requirement.
- [2026-03-06 18:15] **Diagnosed Course Auto-Import Issue**: Diagnosed a 429 Too Many Requests error during URL import. The `GOOGLE_AI_API_KEY` configured in Supabase Edge Functions has exceeded its quota/billing limits. Advised user to replace the API key or upgrade their Google AI Studio tier.
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
- Updated Dashboard UX: 'New Round' button now shows 'Continue' (ì´ì–´í•˜ê¸°) if an active session exists.
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

- [2026-03-06 17:15] **SSOT Hardening (Extreme Silent Protocol)**:
  - Updated `docs/CRITICAL_LOGIC.md` and `CLAUDE.md` to strictly forbid using `run_command` for reading local files.
  - Replaced instructions for `Get-Content` with internal tool alternatives (`view_file`, `list_dir`) to eliminate terminal flickering and pop-up windows during information gathering.
  - Defined the "Zero-Shell Information Gathering" rule as a core DX standard.

- [2026-03-06 17:10] **Terminal Stability Finalized**: Resolved 'Agent-to-Shell Handshake' flicker loop by shifting 100% of information gathering to internal tools (view_file, etc.). Verified 0% flicker in new sessions after standardizing powershell.exe and UTF-8 encoding. Status: RESOLVED.
- [2026-03-06 18:11] **Fixed Dev Script Launch Error**: Replaced 'pwsh' with 'powershell' in dev.bat to fix "'pwsh' is not recognized" error following the removal of PowerShell 7 requirement.
- [2026-03-06 18:15] **Diagnosed Course Auto-Import Issue**: Diagnosed a 429 Too Many Requests error during URL import. The `GOOGLE_AI_API_KEY` configured in Supabase Edge Functions has exceeded its quota/billing limits. Advised user to replace the API key or upgrade their Google AI Studio tier.
- [2026-03-06 18:20] **Removed course auto-import & Fixed orphaned browser**: Removed Gemini AI auto-import functionality per user request (removed UI and edge function). Also removed background `Start-Process` browser launch from `dev.ps1` to prevent orphaned windows when terminating the developer shell.
- [2026-03-06 18:22] **Restored Emulated Browser Launch**: Restored the background browser launch for mobile browser emulation. Noted that the user should press `Ctrl+C` in the terminal to invoke the cleanup script (`Stop-Development`), rather than clicking the console 'X' button, which causes orphaned browser processes.
- [2026-03-06 18:26] **Reverted Score Detail Granularity**: Merged 'Triple Bogey or Worse' back into 'Double Bogey+' based on user feedback. Removed `tripleBogeysOrWorse` from `golf.types.ts` and UI (`index.tsx`) to simplify the dashboard to a clean 3x5 grid.
- [2026-03-06 18:32] **Analyzed Data Sync Conflict (Data Loss)**: Diagnosed an issue where cloud edits (e.g. miss shots: Bunker 4, Three-putt 7) were overwritten and reset to 0. This occurs when a local session maintains a newer `updatedAt` timestamp than the cloud, or when a partial Supabase upsert fails but the `rounds` timestamp updates. The local state subsequently overwrites the cloud upon automatic background sync.
- [2026-03-06 18:43] **Implemented Safe Sync Protocol**: Modified `golf.repository.ts` to implement strict version control during background synchronization. The new logic dictates that if the cloud data has the exact same timestamp as the local data, it will only overwrite the local data if the cloud inherently possesses *more* hole records. This effectively eradicates the risk of a failed partial sync overwriting complete local data with truncated fallback data.
- [2026-03-06 18:50] **Fixed Orphaned Browser on Terminal X Close**: Modified `dev.ps1` to use a dedicated `--user-data-dir` (`GolfTrackerBrowserProfile`) for the dev browser, isolating its process tree from the user's main browser instance. Implemented a hidden PowerShell Watchdog process that monitors the main `dev.ps1` PID. When the user abruptly closes the terminal (e.g. clicking the X button), the Watchdog immediately detects the exit and aggressively kills all browser instances associated with the isolated profile.
- [2026-03-06 18:55] **Resolved Authentication Required Error on Startup**: Handled the startup `Authentication required to access storage` LogBox red screen. Modified `golf.repository.ts` so `getStorageKey()` returns `null` instead of throwing an error when no user session exists (which is expected behavior before the user logs in on a fresh profile). Updated all repository methods to gracefully handle this `null` state and return empty arrays/null values silently instead of crashing.
- [2026-03-06 18:58] **Restored Main Browser Profile with Process Tagging**: Reverted the isolated `--user-data-dir` so the user's existing Chrome profile (and cookies/logins) remains intact. Retained the Watchdog auto-cleanup functionality by injecting a dummy argument (`--disable-session-crashed-bubble=golf_tracker_dev_app`) when launching Chrome. The Watchdog now safely scans for this unique fingerprint string in the `CommandLine` of running Chrome processes and only kills the specific instances spawned by the dev environment, leaving the user's other Chrome windows unaffected.
- [2026-03-06 19:15] **Extensive Memory Leak Audit**: Conducted a full codebase audit targeting common React/React Native memory leak vectors (`setInterval`, `setTimeout`, unchecked `BackHandler`, un-subscribed `EventEmitter`s, and un-resolved Promises). 
  - Verified `AsyncLock` implementation (No dangling promise chains).
  - Verified Supabase `onAuthStateChange` listeners (Proper `unsubscribe` calls in `_layout.tsx` and `useIsAdmin.ts`).
  - Verified Component Unmounts (Expo Router top-level tabs correctly retain states without firing zombie updates).
  - Verified UI List Memory (Max 18 elements in ScrollView is perfectly lightweight, FlatList not strictly required).
  - Conclusion: The codebase is clean and well-optimized. No severe UI or State memory leaks detected.
