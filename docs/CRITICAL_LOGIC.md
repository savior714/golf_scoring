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
*   **Fairway Hit (FIR):** Tracked for Par 4/5 holes. Represented as a binary toggle (Hit/Miss) in the UI and persisted as `is_fairway` in the database.
*   **Miss Shot Pattern Analysis:** Up to **2 patterns can be selected per hole**, stored as comma-separated values.

*   **Intelligent Automation (Three-putt):** If the putt count is 3 or more, the system automatically adds the 'Three-putt' pattern. Conversely, it is removed if the count drops below 3. If 2 patterns are already selected, it follows a FIFO (First-In, First-Out) logic to maintain the latest status.

*   **Auth-Mandatory Policy:** Authentication via Supabase is mandatory. Guest/Anonymous modes are deprecated.
*   **Source of Truth (SSOT):** Based on `AsyncStorage` with user-specific keys (`@golf_rounds_data_{userId}`).
*   **Storage Key Integrity (Singleton Promise):** To prevent race conditions during multiple asynchronous calls immediately after login, `getStorageKey` must use the Singleton Promise pattern, ensuring only one session lookup occurs even with concurrent calls.
*   **Auth State Change Handling:** When fetching data (Pull) in the `onAuthStateChange` callback, the `session` object provided by the callback must be passed directly as a parameter to avoid race conditions caused by timing differences in `getSession` responses.
*   **Unique Session ID:** Each round has a unique ID in the format of `round_Timestamp`.
*   **Active Session Tracking:** The `@current_round_id` key tracks the currently ongoing round, enabling automatic recovery upon app restart.
*   **Offline Support - Sync Queue:** If cloud synchronization fails, the system enqueues the failed round ID into @pending_sync_ids in AsyncStorage. These pending records are automatically retried during session initialization or when manually triggered, ensuring data integrity even in unstable network environments.
*   **Cloud Synchronization (Supabase):** Local data is automatically synchronized (Upserted) to Supabase cloud upon ending a round, adhering to RLS policies on `rounds` and `holes` tables.
*   **Keyed Async Lock (Serialization):** To prevent race conditions during rapid hole switching or overlapping sync calls, a `KeyedAsyncLock` is used in the repository layer. Sync operations for a specific round ID are serialized to ensure sequential processing and data integrity.
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

## 6. Active Session & UI Workflow (Session Management & UI Workflow)
*   **Hole Selector Grid**: Standardized the `HoleSelectorGrid` component for quick navigation across 18 holes, accessible directly from the recording screen.
*   **Modular Recording UI**: Refactored `record.tsx` into specialized sub-components (`HoleSelectorGrid`, `ScoreAdjuster`, `MissShotPatternGrid`, `CourseHeader`) to improve maintainability.
*   **Tab Button Role Separation (2026-03-10 refactor)**:
    *   **Bottom Tab (Pen icon / `NewRoundTabButton`)**: Always navigates directly to `record.tsx`. If a `currentRoundId` exists, the existing round is loaded for editing. If not, a new round flow begins. No confirmation dialog.
    *   **Top-right "새 라운딩" Button (Dashboard)**: Always calls `startNewRound()`, which clears `currentRoundId` and navigates to `record.tsx` with `mode: 'new'`. Unconditional — no "이어하기" path.
*   **History → Record Flow**: The history screen exposes a single "보기 / 수정" button per record. Tapping it calls `setCurrentRoundId(id)` and navigates to `record.tsx` with `params: { source: 'history' }`. This merges the former separate "보기" (view) and "수정" (edit) actions into one.
*   **Dynamic Tab Label (`tabBarLabel`)**: The record tab label is controlled at two levels:
    *   **Default** (`_layout.tsx`): `tabBarLabel: '새 라운딩'` — shown when entering via the tab button or fresh navigation.
    *   **Override** (`record.tsx` via `<Tabs.Screen>`): When `source === 'history'`, the label overrides to `'기록 수정'` using Expo Router's in-screen `Tabs.Screen` options pattern. This ensures the `Stack.Screen` title (`HOLE N`) never pollutes the tab bar label.
*   **LeaderboardCard Cleanup**: The inline X(delete) and Save(continue) icon buttons inside the dark score card have been removed. Record deletion is handled from the History screen only.
*   **Early Termination**: Supports closing a round before finishing 18 holes via an explicit finish/clear trigger, which removes `currentRoundId` from local storage.
*   **Feedback System (Haptic & Toast):** Every critical user action (+/- score, sync success/fail, OB/Penalty) triggers tactile feedback (Haptic) and visual confirmation (Toast). Non-critical alerts are replaced with Toasts to avoid interrupting the user flow.
    *   **Toast Width:** `customToast` style must use `width: '100%'` in `ToastConfig.tsx`. Setting a percentage like `90%` causes the toast container to shrink relative to the library's own wrapper, visually narrowing the toast.
*   **Tee Selection Step**: Added a mandatory Tee choice (Black/Blue/White/Red) during the course selection workflow to ensure distance data accuracy (meters) per hole.
*   **Auth Logout Reset**: Upon user logout, the `currentRoundId` and related local states are explicitly cleared to prevent cross-session data leaks.

## 6-2. Animation & Modal Rules (애니메이션 & 모달 규칙)
*   **`exiting` 금지 in RN Modal**: React Native (Web 포함)의 `<Modal>` 컴포넌트 내부에서 `react-native-reanimated`의 `exiting` prop을 사용하면 안 된다. Modal이 `visible=false`로 전환될 때 RN이 children을 즉시 unmount하면서 exit 애니메이션이 이미 사라진 노드를 참조, 렌더 크래시(GlobalErrorBoundary 트리거)를 유발한다.
    *   **허용**: `entering={FadeIn}` — Modal이 표시될 때(mount)만 실행되므로 안전.
    *   **금지**: `exiting={FadeOut}` inside `<Modal>`.
*   **`useNavigation().getParent()?.setOptions()`**: Expo Router Tabs 환경에서 화면 컴포넌트 내부에 `<Tabs.Screen name="...">` JSX를 사용하면 "name prop may only be used inside a Layout route" 크래시가 발생한다. Tab 옵션 동적 변경은 반드시 `useNavigation().getParent()?.setOptions()` + `useEffect` 패턴을 사용한다. cleanup에서 기본값으로 복원하는 것을 필수로 한다.

## 6-1. Admin UI Layout Rules (관리자 화면 레이아웃)
*   **Tab Navigator 조건부 렌더링:** Expo Router `Tabs`에서 탭을 조건부로 숨길 때 `href: null` 방식을 사용하면, 런타임에 `href` 값이 변경될 때 Navigator가 재마운트되어 이중 렌더링이 발생한다. 반드시 **`tabBarButton: () => null`** 방식을 사용하여 Navigator 구조(Tabs.Screen 개수)는 고정하고 버튼만 숨긴다.
    *   `isLoading` 중에도 `tabBarButton: () => null` 유지 → 깜빡임 방지.
    *   올바른 패턴: `tabBarButton: (isAdmin && !isLoading) ? undefined : () => null`
*   **홀별 전장 입력 그리드:** `holeInputRow`는 반드시 `flex: 1`을 포함해야 한다. 없으면 내부 `distanceInput`의 `flex: 1`이 부모 width constraint를 참조하지 못해 박스를 초과(overflow)하는 현상이 발생한다.

## 7. AI Developer Experience & Tooling Policy (AI DX & Tooling Policy)
*   **Silent Execution Protocol**: To maintain a seamless developer experience and **prevent terminal flickering (pop-up windows)** on the user's machine, the AI assistant must adhere to the **Extreme Silent Protocol**:
    *   **Zero-Shell Information Gathering**: It is **strictly prohibited to use `run_command` (shell) to read local files** (e.g., `Get-Content`, `cat`, `type`). Internal IDE tools (`view_file`, `list_dir`, `grep_search`) must be used 100% of the time for these tasks.
    *   **Reasoning**: Any call to `run_command` triggers a terminal handshake and profile initialization, which causes visible UI flickering and pop-ups even with an `automationProfile` configured.
*   **Terminal Usage Restriction**: The terminal (`run_command`) should only be used for process execution tasks that cannot be handled natively:
    *   Executing build scripts or development servers (e.g., `npm run dev`).
    *   Git operations (e.g., `git commit`, `git push`).
    *   Running complex automation scripts (e.g., `dev.ps1`).
*   **Background Monitoring**: When a long-running terminal command is necessary, minimize the use of `command_status` polling if it causes excessive terminal UI updates on the host OS.
## 8. TypeScript Strict Typing Policy (타입 무결성)
*   **`any` 금지**: 모든 `app/` 및 `src/` 코드에서 `any` 사용을 엄격히 금지. catch 블록은 `unknown` + `instanceof Error` 가드로 처리.
*   **Catch Binding**: 미사용 catch 변수는 빈 `catch {}` 바인딩으로 처리 (ES2019+).
*   **Hook Return Boundary**: Hook 내부 state setter는 외부에서 직접 노출하지 않으며, 필요한 경우 high-level action function으로 래핑하여 반환.
*   **Asset `require()` 예외**: Expo 번들러의 asset 로딩(`require('../assets/...')`)은 표준 패턴으로, `eslint-disable` 주석으로 예외 처리 허용.

## 9. Advanced Resilience & State Management (Advanced Resilience & State Management)
*   **Atomic State Orchestration (useReducer):** Complex scoring sessions are managed via a centralized useReducer rather than multiple useState hooks. This ensures atomic updates (e.g., updating multiple scoring fields and the current hole simultaneously) and prevents illegal state transitions.
*   **Background Sync Strategy:** Performance is prioritized by executing cloud sync in the background without blocking the UI. The UI reflects the syncStatus ('syncing', 'synced', 'failed') to inform the user of the current persistence state.
*   **Fault Tolerance (Error Boundaries):**
    *   **GlobalErrorBoundary:** Wrapped at the root layout (`_layout.tsx`) to catch unexpected system-wide failures and provide a recovery mechanism.
    *   **HoleErrorBoundary:** Wrapped at the hole recording level (`record.tsx`) to isolate scoring logic failures, allowing users to refresh a single hole's UI without losing session state.