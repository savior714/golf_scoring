# Golf Scoring Application - Critical Logic (SSOT)

## 0. Course Master Data Structure (Course Master Structure)
*   **4-Layer Hierarchy**: Managed in the order of Club > Course > Hole > Distance.
*   **Course Unitization**: Every course is managed as a 9-hole unit. (An 18-hole club consists of 2 courses, a 27-hole club consists of 3 courses).
*   **Out-In Combination Logic**: An 18-hole round is defined as a dynamic combination of an Out (Front) 9-hole unit and an In (Back) 9-hole unit.
*   **Security Policy**: Creation, modification, and deletion of course master information are restricted to specific accounts with administrator privileges (`is_admin()`) via Database RLS (Row Level Security).

## 1. Scoring Policy (Scoring Policy)
*   **Total Score:** The sum of `stroke` values for all holes.
*   **Relative Score:** Calculated as `Total Score - Total Par`. Visualized with Red for Over(+), Green for Under(-), and White/Gray for Even(E).
*   **GIR (Green In Regulation):** Determined as successful if `(stroke - putt) <= (par - 2)`.
*   **Penalty (OB/Penalty Area) Handling:** OB and Penalty buttons are for statistical tracking only and **are not automatically added to the Total Stroke.** Users must manually adjust the final stroke count according to the rules.
*   **Miss Shot Pattern Analysis:** Up to **2 patterns can be selected per hole**, stored as comma-separated values.
*   **Intelligent Automation (Three-putt):** If the putt count is 3 or more, the system automatically adds the 'Three-putt' pattern. Conversely, it is removed if the count drops below 3. If 2 patterns are already selected, it follows a FIFO (First-In, First-Out) logic to maintain the latest status.

*   **Auth-Mandatory Policy:** Authentication via Supabase is mandatory. Guest/Anonymous modes are deprecated.
*   **Source of Truth (SSOT):** Based on `AsyncStorage` with user-specific keys (`@golf_rounds_data_{userId}`).
*   **Storage Key Integrity (Singleton Promise):** To prevent race conditions during multiple asynchronous calls immediately after login, `getStorageKey` must use the Singleton Promise pattern, ensuring only one session lookup occurs even with concurrent calls.
*   **Auth State Change Handling:** When fetching data (Pull) in the `onAuthStateChange` callback, the `session` object provided by the callback must be passed directly as a parameter to avoid race conditions caused by timing differences in `getSession` responses.
*   **Unique Session ID:** Each round has a unique ID in the format of `round_Timestamp`.
*   **Active Session Tracking:** The `@current_round_id` key tracks the currently ongoing round, enabling automatic recovery upon app restart.
*   **Cloud Synchronization (Supabase):** Local data is automatically synchronized (Upserted) to Supabase cloud upon ending a round, adhering to RLS policies on `rounds` and `holes` tables.
*   **Multi-Device Consistency & Safe Sync Protocol:** To prevent data overwriting across different devices (PC, Mobile), the latest cloud data is automatically pulled upon entering the dashboard. It is a strict principle to ensure the latest state is retrieved before any write operation. **Cloud data is prioritized during merging if the `updatedAt` timestamp is greater than the local one.** If timestamps are exactly equal, the cloud data only overwrites the local data if it possesses **more hole records**, preventing partial sync failures from wiping out complete local data.
*   **27-Hole Specification:** The `rounds` table tracks the 9-hole course combination used via `out_course_id` and `in_course_id`. Master data is joined based on these IDs for statistics and detailed views.

## 3. Development & Performance Standards (Development & Performance Standards)
*   **Environment Compatibility (SSR Safety):** Since modules accessing browser APIs (Supabase, AsyncStorage, etc.) can cause errors during build time (Node.js environment), they must include a `typeof window !== 'undefined'` check or use a Dummy Storage Wrapper.
*   **Async Optimization:** Independent asynchronous tasks (e.g., storage save + session ID setting) must be processed in parallel using `Promise.all`.
*   **Computation Optimization:** High-cost calculations such as summary statistics or progress indicators must use `useMemo` to prevent unnecessary re-computations.
*   **Component Reuse:** Core UI elements like the scorecard table are unified into the `ScoreCardTable` component to maintain data consistency.

## 4. Architecture (Architecture - DDD & 3-Layer)
*   **Domain Modularization (`src/modules/golf`):** Encapsulates all logic related to the specific business domain (golf) into subdirectories.
    *   **golf.types.ts**: Data models and interface definitions (Definition).
    *   **golf.repository.ts**: Data storage access layer (Repository).
    *   **golf.service.ts**: Business calculation logic (Service).
    *   **golf.data.ts**: Static domain-related data (Data).
*   **Common Infrastructure (`src/shared`):** Manages shared UI (`components`), configurations (`lib`), and themes (`constants`) separately.
*   **Routing & Views (`app/`):** Follows Expo Router standards, focusing on UI rendering while excluding business logic.

## 5. Course Auto-Import System (Course Auto-Import - DEPRECATED)
*   **Status**: **DEPRECATED AND REMOVED** per user request (2026-03-06).
*   **Reason**: Gemini AI auto-import functionality, UI elements, and the corresponding Supabase Edge Function were removed to simplify the architecture and avoid Google AI API 429 quota limits. Course data must now be entered manually via the Admin UI.
*   **Design Document**: `docs/COURSE_AUTO_IMPORT_PLAN.md` remains strictly for historical reference.

## 6. Active Session & UI Workflow (Session Management & UI Workflow)
*   **Hole Selector Grid**: Standardized the `HoleSelectorGrid` component for quick navigation across 18 holes, accessible directly from the recording screen.
*   **Modular Recording UI**: Refactored `record.tsx` into specialized sub-components (`HoleSelectorGrid`, `ScoreAdjuster`, `MissShotPatternGrid`, `CourseHeader`) to improve maintainability.
*   **Active Session Detection**: The Dashboard automatically detects `currentRoundId` in storage. If present, the primary CTA changes from "New Round" to "Continue (이어하기)".
*   **Session Guard (Alert/Confirm)**: If a user attempts to enter a new room or start a fresh round while a session is already active, a confirmation dialog is triggered to prevent accidental overwriting.
*   **Early Termination**: Supports closing a round before finishing 18 holes via an explicit finish/clear trigger, which removes `currentRoundId` from local storage.
*   **Tee Selection Step**: Added a mandatory Tee choice (Black/Blue/White/Red) during the course selection workflow to ensure distance data accuracy (meters) per hole.
*   **Auth Logout Reset**: Upon user logout, the `currentRoundId` and related local states are explicitly cleared to prevent cross-session data leaks.

## 7. AI Developer Experience & Tooling Policy (AI DX & Tooling Policy)
*   **Silent Execution Protocol**: To maintain a seamless developer experience and **prevent terminal flickering (pop-up windows)** on the user's machine, the AI assistant must adhere to the **Extreme Silent Protocol**:
    *   **Zero-Shell Information Gathering**: It is **strictly prohibited to use `run_command` (shell) to read local files** (e.g., `Get-Content`, `cat`, `type`). Internal IDE tools (`view_file`, `list_dir`, `grep_search`) must be used 100% of the time for these tasks.
    *   **Reasoning**: Any call to `run_command` triggers a terminal handshake and profile initialization, which causes visible UI flickering and pop-ups even with an `automationProfile` configured.
*   **Terminal Usage Restriction**: The terminal (`run_command`) should only be used for process execution tasks that cannot be handled natively:
    *   Executing build scripts or development servers (e.g., `npm run dev`).
    *   Git operations (e.g., `git commit`, `git push`).
    *   Running complex automation scripts (e.g., `dev.ps1`).
*   **Background Monitoring**: When a long-running terminal command is necessary, minimize the use of `command_status` polling if it causes excessive terminal UI updates on the host OS.