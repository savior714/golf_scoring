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
*   **Multi-Device Consistency (Pull-before-Write):** To prevent data overwriting across different devices (PC, Mobile), the latest cloud data is automatically pulled upon entering the dashboard. It is a strict principle to ensure the latest state is retrieved before any write operation. **Cloud data is prioritized during merging if the `updatedAt` timestamp is greater than or equal to the local one**, ensuring that format changes (e.g., localized miss shot patterns) are propagated from the central source.
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

## 5. Course Auto-Import System (Course Auto-Import)
*   **Entry Point**: Admin Tab → "Auto-import Course (AI)" card (`app/(tabs)/admin.tsx`)
*   **Edge Function**: `supabase/functions/course-import/index.ts` (Deno runtime)
*   **AI Model**: **Google Gemini 2.5 Flash** used. API key stored only in Supabase Secrets as `GOOGLE_AI_API_KEY`.
    *   `gemini-2.0-flash` / `gemini-2.0-flash-lite` → 429 `limit: 0` (Free tier not supported, unusable).
    *   `gemini-1.5-flash` → 404 (v1beta not supported).
    *   **`gemini-2.5-flash` → Operational (Current selection).**
    *   API keys must be generated via a **"New Project"** in AI Studio. Using existing Google Cloud projects with billing attached might result in a zero free-tier bucket.
*   **Error Response Principle**: The Edge Function **always responds with HTTP 200**. Error types are distinguished via the `{ error: 'ERROR_CODE', message: '...' }` fields. This ensures the Supabase SDK `functions.invoke()` can receive the data even when an error occurs, as it returns `null` for non-2xx responses.
*   **Two Input Modes**:
    *   `mode: "url"` — Fetches a course introduction page URL provided by the admin → Deno fetch → HTML pre-processing (stripHtml, 40KB limit) → Gemini parsing.
    *   `mode: "text"` — Handles sites requiring JS rendering. If the URL crawl result is under 300 characters, it returns `JS_RENDER_REQUIRED` → App automatically switches to text paste mode.
*   **Output Structure**: `{ clubName, courses[{ courseName, holes[{ holeNumber, par, distances[{ teeColor, distanceMeter }] }] }], confidence: "high"|"medium"|"low" }`
*   **teeColor Standard**: `"Black"` (Champion), `"Blue"` (Back), `"White"` (Standard/Silver), `"Red"` (Lady). If only one distance is available without distinction, it is treated as `"White"`.
*   **Par Allowable Range:** Integers from 3 to 7. Verified in specialized courses like Gunsan CC (Kimje Course: PAR6, Jeongeup Course: PAR7).
*   **Par Validation (registerClub):** Deprecated fixed sum (9h=36, 18h=72) validation → Replaced with **per-hole valid range (3~7) check**, allowing non-standard courses.
*   **Confidence Levels**:
    *   `high` — All hole PARs confirmed + 80%+ distances present + clear course names → Immediate save allowed.
    *   `medium` — All hole PARs confirmed + partial distance missing or ambiguous course names → Save after review.
    *   `low` — Holes with null PAR or major missing info → Manual correction required.
*   **Storage Flow**: AI Parsing Result → Form Auto-fill (Auto-toggle tees) → Admin Review/Edit → `clubRepository.registerClub` (Includes per-hole PAR range re-validation).
*   **Admin UI Tee Input**: Toggle active tees (Black/Blue/White/Red) per course → Only selected tees are displayed as grid columns. At least one tee is required.
*   **Multi-course Clubs**: Import individual course URLs → Accumulated as courses under the same club name using upsert logic (onConflict: golf_clubs.name).
*   **Local DB Viewer Tool**: `local/course-viewer.html` — Opens directly in a browser to view all club/course/hole data in the current DB (Gitignored).
*   **Design Document**: `docs/COURSE_AUTO_IMPORT_PLAN.md`.

## 6. Active Session & UI Workflow (Session Management & UI Workflow)
*   **Hole Selector Grid**: Standardized the `HoleSelectorGrid` component for quick navigation across 18 holes, accessible directly from the recording screen.
*   **Modular Recording UI**: Refactored `record.tsx` into specialized sub-components (`HoleSelectorGrid`, `ScoreAdjuster`, `MissShotPatternGrid`, `CourseHeader`) to improve maintainability.
*   **Active Session Detection**: The Dashboard automatically detects `currentRoundId` in storage. If present, the primary CTA changes from "New Round" to "Continue (이어하기)".
*   **Session Guard (Alert/Confirm)**: If a user attempts to enter a new room or start a fresh round while a session is already active, a confirmation dialog is triggered to prevent accidental overwriting.
*   **Early Termination**: Supports closing a round before finishing 18 holes via an explicit finish/clear trigger, which removes `currentRoundId` from local storage.
*   **Tee Selection Step**: Added a mandatory Tee choice (Black/Blue/White/Red) during the course selection workflow to ensure distance data accuracy (meters) per hole.
*   **Auth Logout Reset**: Upon user logout, the `currentRoundId` and related local states are explicitly cleared to prevent cross-session data leaks.

## 7. AI Developer Experience & Tooling Policy (AI DX & Tooling Policy)
*   **Silent Execution Protocol**: To maintain a seamless developer experience and prevent UI flickering (Terminal flashing) on the user's machine, the AI assistant must follow these tool usage rules:
    *   **Internal Tools Priority**: Always prioritize internal IDE tools (e.g., `view_file`, `list_dir`, `grep_search`) over shell-based commands (e.g., `Get-Content`, `ls`, `findstr`) for gathering information.
    *   **Terminal Usage Restriction**: The terminal (`run_command`) should only be used for tasks that cannot be performed by internal tools, such as:
        *   Executing build scripts or development servers (e.g., `npm run dev`).
        *   Git operations (e.g., `git commit`, `git push`).
        *   Running custom automation scripts (e.g., `dev.ps1`).
    *   **Background Monitoring**: When a long-running terminal command is necessary, minimize the use of `command_status` polling if it causes excessive terminal UI updates on the host OS.