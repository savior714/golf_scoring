# Golf Scoring Application - Critical Logic (SSOT)

## 0. Course Master Data Structure (Course Master Structure)

- **4-Layer Hierarchy**: Managed in the order of Club > Course > Hole > Distance.
- **Course Unitization**: Every course is managed as a 9-hole unit. (An 18-hole club consists of 2 courses, a 27-hole club consists of 3 courses).
- **Out-In Combination Logic**: An 18-hole round is defined as a dynamic combination of an Out (Front) 9-hole unit and an In (Back) 9-hole unit.
- **Security Policy**: Creation, modification, and deletion of course master information are restricted to specific accounts with administrator privileges (`is_admin()`) via Database RLS (Row Level Security).

## 1. Scoring Policy (Scoring Policy)

- **Total Score**: The sum of `stroke` values for all holes.
- **Relative Score**: Calculated as `Total Score - Total Par`. Visualized with Red for Over(+), Green for Under(-), and White/Gray for Even(E).
- **GIR (Green In Regulation)**: Determined as successful if `(stroke - putt) <= (par - 2)`.
- **Penalty (OB/Penalty Area) Handling**: OB and Penalty buttons are for statistical tracking only and **are not automatically added to the Total Stroke.** Users must manually adjust the final stroke count according to the rules.
- **Miss Shot Pattern Analysis**: Up to **2 patterns can be selected per hole**, stored as comma-separated values.
- **Intelligent Automation (Three-putt)**: If the putt count is 3 or more, the system automatically adds the 'Three-putt' pattern. Conversely, it is removed if the count drops below 3. If 2 patterns are already selected, it follows a FIFO (First-In, First-Out) logic to maintain the latest status.
- **Auth-Mandatory Policy**: Authentication via Supabase is mandatory. Guest/Anonymous modes are deprecated.
- **Source of Truth (SSOT)**: Based on `AsyncStorage` with user-specific keys (`@golf_rounds_data_{userId}`).
- **Storage Key Integrity (Singleton Promise)**: To prevent race conditions during multiple asynchronous calls immediately after login, `getStorageKey` must use the Singleton Promise pattern, ensuring only one session lookup occurs even with concurrent calls.
- **Auth State Change Handling**: When fetching data (Pull) in the `onAuthStateChange` callback, the `session` object provided by the callback must be passed directly as a parameter to avoid race conditions caused by timing differences in `getSession` responses.
- **Unique Session ID**: Each round has a unique ID in the format of `round_Timestamp`.
- **Active Session Tracking**: The `@current_round_id` key tracks the currently ongoing round, enabling automatic recovery upon app restart.
- **Offline Support - Sync Queue**: If cloud synchronization fails, the system enqueues the failed round ID into @pending_sync_ids in AsyncStorage. These pending records are automatically retried during session initialization, **when the app comes to the foreground (AppState changes)**, or when manually triggered. **Retries are processed in descending order of round date (newest first)** to ensure the most recent data is synchronized with priority.
- **Cloud Synchronization (Supabase)**: Local data is automatically synchronized (Upserted) to Supabase cloud upon ending a round, adhering to RLS policies on `rounds` and `holes` tables.
- **Sync Throttling (30m)**: To prevent excessive network traffic and server load, automatic `pullRoundsFromSupabase` calls are throttled to a **30-minute interval** using `@last_pull_time` in AsyncStorage. Manual refresh (Pull-to-Refresh) bypasses this throttling with a `force` flag.
- **Silent Sync Policy**: Background or automatic synchronization (e.g., during app startup or tab switching) must be **silent** (no UI notifications/toasts) unless data changes occur or a manual trigger is used. This prevents visual clutter and improves UX perceived performance.
- **Keyed Async Lock (Serialization)**: To prevent race conditions during rapid hole switching or overlapping sync calls, a `KeyedAsyncLock` is used in the repository layer. Sync operations for a specific round ID are serialized to ensure sequential processing and data integrity.
- **Multi-Device Consistency & Safe Sync Protocol**: To prevent data overwriting across different devices (PC, Mobile), the latest cloud data is automatically pulled upon entering the dashboard. It is a strict principle to ensure the latest state is retrieved before any write operation. **Cloud data is prioritized during merging if the `updatedAt` timestamp is greater than the local one.** If timestamps are exactly equal, the cloud data only overwrites the local data if it possesses **more hole records**, preventing partial sync failures from wiping out complete local data.
- **27-Hole Specification**: The `rounds` table tracks the 9-hole course combination used via `out_course_id` and `in_course_id`. Master data is joined based on these IDs for statistics and detailed views.

## 3. Development & Performance Standards (Development & Performance Standards)

- **Environment Compatibility (SSR Safety)**: Since modules accessing browser APIs (Supabase, AsyncStorage, etc.) can cause errors during build time (Node.js environment), they must include a `typeof window !== 'undefined'` check or use a Dummy Storage Wrapper.
- **Async Optimization**: Independent asynchronous tasks (e.g., storage save + session ID setting) must be processed in parallel using `Promise.all`.
- **Computation Optimization**: High-cost calculations such as summary statistics or progress indicators must use `useMemo` to prevent unnecessary re-computations.
- **React Query staleTime Policy (Cross-Tab Isolation)**: AsyncStorage 기반 로컬 쿼리(`['golf_clubs']`, `['current_round_id']`, `['golf_rounds']`)는 **`staleTime: Infinity`** 를 필수로 설정한다. 이 쿼리들은 외부 네트워크가 아닌 로컬 스토리지에서 읽히므로, 포커스 복귀나 타 탭의 `invalidateQueries` 호출 시 즉시 `isLoading=true`가 전파되어 UI 스피너가 재출현하는 버그(2~3초 풀 리렌더)를 유발한다. `staleTime: Infinity` 설정 시 쿼리는 배경에서 quietly refetch되며 `isLoading`이 절대 true로 올라가지 않는다. 데이터 변경 시에는 반드시 명시적 `invalidateQueries`를 통해 갱신한다.
- **Component Reuse**: Core UI elements like the scorecard table are unified into the `ScoreCardTable` component to maintain data consistency.
- **List Rendering Optimization (FlatList Pattern)**: For lists with potentially large data sets (e.g., History screen), apply the following invariants:
  - List item components (e.g., `HistoryItem`) must be extracted as standalone components wrapped with `React.memo`.
  - Shared list components (e.g., `ScoreCardTable`) must also be wrapped with `React.memo`.
  - `renderItem`, `keyExtractor`, and all event handler callbacks passed as props must be stabilized with `useCallback`.
  - FlatList baseline tuning: `initialNumToRender=5`, `maxToRenderPerBatch=10`, `windowSize=5`, `removeClippedSubviews=true`.

## 4. Architecture (Architecture - DDD & 3-Layer)

- **Domain Modularization (`src/modules/golf`)**: Encapsulates all logic related to the specific business domain (golf) into subdirectories.
  - **golf.types.ts**: Data models and interface definitions (Definition).
  - **golf.repository.ts**: Data storage access layer (Repository).
  - **golf.service.ts**: Business calculation logic (Service).
  - **golf.data.ts**: Static domain-related data (Data).
- **Common Infrastructure (`src/shared`)**: Manages shared UI (`components`), configurations (`lib`), and themes (`constants`) separately.
- **Routing & Views (`app/`)**: Follows Expo Router standards, focusing on UI rendering while excluding business logic.
- **Analytics Engine (`golf.service.ts`)**: Centralized logic for multi-round trend analysis (`calculateAdvancedStats`). Derived statistics (Score, Putt, GIR) must be computed here to ensure consistency across the dashboard and stats views.

## 5. Course Data Integrity & Validator (Data Integrity & Validator)

- **Zero-Tolerance Policy**: To maintain absolute data quality, only data that passes 100% of the validation rules is allowed to enter the database.
- **Validator Engine (`validateClubData.ts`)**: The single source of truth for course master data validation.
  - Exactly 9 holes per course.
  - Total Par sum must be exactly 36.
  - Hole numbers must be sequential (1-9).
  - At least one distance entry per tee color for each hole.
  - All distances must be non-zero positive integers.
- **Atomic Bulk Insertion (Chunked)**: Large-scale data imports are processed via Supabase RPC (`insert_clubs_bulk`). To prevent database session timeouts (`57014`), data must be partitioned into **chunks of 50 clubs** and processed sequentially at the repository layer.
- **Data Integrity**: All data must pass 100% of the validation rules before any chunk is sent to the DB. 하나라도 실패하면 전체 프로세스를 중단하여 원자적(All-or-Nothing) 무결성을 보존한다.
- **Course Deletion 2-Step Protocol**: `golf_courses` 레코드 삭제 전 반드시 `rounds.out_course_id` / `rounds.in_course_id`를 NULL로 UPDATE하여 FK 위반을 방지한다. 순서: **① rounds 참조 NULL화 → ② golf_courses DELETE**. 하위 `golf_holes`, `hole_distances`는 DB CASCADE로 자동 제거.
- **JSON Import Smart Quote Normalization**: `handleParse` 실행 전 `normalizeJsonText()`로 스마트 쿼트, non-breaking space, BOM을 표준 ASCII로 변환하여 `Unterminated string in JSON` 오류를 차단한다.
- **Course Verification Filter**: 사용자에게 노출되는 구장 목록(`CourseSelector`)은 `isVerified === true`인 데이터로 한정한다. 관리자(Admin)는 전체 데이터를 조회하여 검수를 수행한다.
- **Club Name Normalization**: 구장 공식 명칭은 표준화된 포맷(예: '골프앤리조트' -> 'CC')을 지향하며, 신규 등록 시 중복 방지 및 검색 효율을 위해 정규화 스크립트를 경유한다.

## 6. Active Session & UI Workflow (Session Management & UI Workflow)

- **Hole Selector Grid**: Standardized the `HoleSelectorGrid` component for quick navigation across 18 holes, accessible directly from the recording screen.
- **Modular Recording UI**: Refactored `record.tsx` into specialized sub-components (`HoleSelectorGrid`, `ScoreAdjuster`, `MissShotPatternGrid`, `CourseHeader`) to improve maintainability.
- **Tab Button Role Separation (2026-03-10 refactor)**:
  - **Bottom Tab (Pen icon / `NewRoundTabButton`)**: Always navigates directly to `record.tsx`. If a `currentRoundId` exists, the existing round is loaded for editing. If not, a new round flow begins. No confirmation dialog.
  - **Top-right "새 라운딩" Button (Dashboard)**: Always calls `startNewRound()`, which clears `currentRoundId` and navigates to `record.tsx` with `mode: 'new'`. Unconditional — no "이어하기" path.
- **History -> Record Flow**: The history screen exposes a single "보기 / 수정" button per record. Tapping it calls `setCurrentRoundId(id)` and navigates to `record.tsx` with `params: { source: 'history', mode: 'edit' }`. This merges the former separate "보기" (view) and "수정" (edit) actions into one.
- **Explicit Navigation Protocol (2026-03-11)**: To prevent unintended session resets while ensuring high-reliability data loading, all programmatic navigation to `record.tsx` must include a `mode` parameter:
  - **`mode: 'edit'`**: Used when continuing an existing session (from Dashboard) or editing a past record (from History). This bypasses the selection-step guard to force-load the targeted session data.
  - **`mode: 'new'`**: Used when intentionally starting a fresh round (from Dashboard's "새 라운딩"). This bypasses all guards to perform a clean `RESET_SESSION`.
  - **No `mode`**: Only occurs during simple tab switching. The system preserves the current `selectionStep` to prevent losing work-in-progress during course selection.
- **Dynamic Tab Label (`tabBarLabel`)**: `_layout.tsx`에서 `useQuery(['current_round_id'])`로 `currentRoundId` 유무를 구독하여 탭 라벨을 결정. `currentRoundId` 존재 시 `'기록 수정'`, 없으면 `'새 라운딩'`. `invalidateQueries(['current_round_id'])` 호출 시 자동 반영.
- **Record Tab Button Routing**: `RecordTabButton`은 `currentRoundId` 유무에 따라 `mode=edit` 또는 `mode=new`로 `router.replace` 분기. `router.push` 금지 (history stack 누적 방지).
- **Stale Cache Recovery (course_id 만료)**: `loadMasterAndSession`에서 `getCourseWithHoles()` 결과가 null인 경우(로컬 캐시의 course_id가 DB에서 삭제/변경됨), Supabase `rounds` 테이블을 직접 조회하여 최신 `out_course_id`/`in_course_id`를 확보 후 재시도한다. 성공 시 `pullRoundsFromSupabase(force=true)`로 로컬 캐시를 동기화한다.
- **Round Course-ID Auto-Repair (3-Pass)**: 코스 마스터 교체 후 `out/in_course_id`가 NULL이거나 만료된 경우 `loadMasterAndSession`이 자동 복원한다. Pass A: course ID null → `repairRoundCourseIds(clubName, courseType)` 호출 후 Supabase+로컬 영구 반영. Pass B: 로컬 캐시 만료 → Supabase 직접 재조회. Pass C: Supabase도 null → `repairRoundCourseIds` 재시도 후 삼중 갱신. 매칭 알고리즘 3단계: 1차 정확한 이름 일치(`out.name-in.name === courseType`), 2차 포함 검사(courseType에 두 코스명 포함), 3차 첫 단어 토큰 매칭. 복원 성공 시 이후 재실행에서 repair 없이 즉시 로드됨.
- **DB 직접 수정 시 주의**: `resolveMergedRounds`는 `updatedAt` 기준으로 원격/로컬 승자를 결정한다. SQL로 `rounds` 테이블을 직접 수정할 때 **반드시 `updated_at = NOW()`를 포함**해야 원격 데이터가 로컬 캐시를 올바르게 덮어쓴다.
- **LeaderboardCard Cleanup**: The inline X(delete) and Save(continue) icon buttons inside the dark score card have been removed. Record deletion is handled from the History screen only.
- **Early Termination**: Supports closing a round before finishing 18 holes via an explicit finish/clear trigger, which removes `currentRoundId` from local storage.
- **Feedback System (Haptic & Toast)**: Every critical user action (+/- score, sync success/fail, OB/Penalty) triggers tactile feedback (Haptic) and visual confirmation (Toast). Non-critical alerts are replaced with Toasts to avoid interrupting the user flow.
  - **Toast Width**: `customToast` style must use `width: '100%'` in `ToastConfig.tsx`. Setting a percentage like `90%` causes the toast container to shrink relative to the library's own wrapper, visually narrowing the toast.
- **Tee Selection Step**: Added a mandatory Tee choice (Black/Blue/White/Red) during the course selection workflow to ensure distance data accuracy (meters) per hole.
- **Auth Logout Reset**: Upon user logout, the `currentRoundId` and related local states are explicitly cleared to prevent cross-session data leaks.
- **Course Search UI Policy**: `CourseSelector` 화면의 구장 선택 단계(`selectionStep === 'club'`)에서만 검색창(`TextInput`)을 노출한다. 필터링은 `useMemo` + `includes()` 기반으로 파생 데이터를 생성하며, 단계 전환 시 `searchQuery`를 반드시 초기화한다. 검색 결과가 0건일 때는 검색어 유무에 따라 맥락에 맞는 안내 메시지를 분기하여 표시한다.

## 6-1. Admin UI & Navigation Constraints (관리자 화면 및 내비게이션 제약)

- **Admin-Only Tab Strategy**: To prevent hydration mismatches and navigation crashes in Expo Router, admin tabs are controlled via the `href` prop.
- **Stable Protocol**: `href: isLoading ? undefined : (isAdmin ? undefined : null)`. `isLoading` 상태를 반영하여 권한 확인 중 탭 바가 사라졌다 나타나는 'Jank'를 방지한다.
  - **Anti-Pattern**: Using `tabBarButton: () => null` for dynamic tabs can lead to "Route not found" or "other tab jumping" during fast switching.
- **Auth Redirection Guard**: Global auth redirects in `_layout.tsx` must explicitly check if the target destination is already the desired one (root segment comparison) to prevent loop/refresh cycles during rapid tab switching.
- **Declarative Tab Label Strategy**: Child screens must avoid calling `navigation.getParent()?.setOptions()`. Instead, use `useGlobalSearchParams` in the parent `_layout.tsx` to deterministically calculate tab labels (e.g., `'새 라운딩'` vs `'기록 수정'`) based on the current context. This eliminates race conditions during rapid tab switching.
- **Admin Statistics Screen (`app/admin_users.tsx`)**: 관리자는 가입자 가입/활성 통계 및 라운드 보유 수를 실시간으로 모니터링할 수 있는 전용 대시보드를 보유한다.
- **Admin Requests Screen (`app/admin_requests.tsx`)**: 사용자가 제출한 신규 구장 추가 요청을 관리(대기/완료/반려)한다. `isMounted` 가드와 `useCallback`을 통해 안정적인 리스트 렌더링을 제공한다.
- **Performance Optimization Directive (2026-03-12)**: `docs/plans/performance_optimization.md`의 설계에 따라, 모든 핵심 컴포넌트와 비동기 Hook은 **Cleanup Audit (Abort/Unmount protection)** 및 **Stable Ref Pattern (User Rule 9)** 을 강제 적용하여 리소스 누수와 무한 렌더링 루프를 원천 차단한다.
- **Network Request Cancellation (AbortSignal)**: 컴포넌트 언마운트 시 불필요한 네트워크 요청을 방지하기 위해 `clubRepository` 등 핵심 리포지토리는 `AbortSignal`을 지원하며, `useQuery`의 `signal`을 경유하여 쿼리 취소를 수행한다.

## 6-2. Animation & Modal Rules (애니메이션 & 모달 규칙)

- **`exiting` 금지 in RN Modal**: React Native (Web 포함)의 `<Modal>` 컴포넌트 내부에서 `react-native-reanimated`의 `exiting` prop을 사용하면 안 된다. Modal이 `visible=false`로 전환될 때 RN이 children을 즉시 unmount하면서 exit 애니메이션이 이미 사라진 노드를 참조, 렌더 크래시(GlobalErrorBoundary 트리거)를 유발한다.
  - **허용**: `entering={FadeIn}` — Modal이 표시될 때(mount)만 실행되므로 안전.
  - **금지**: `exiting={FadeOut}` inside `<Modal>`.
- **`useNavigation().getParent()?.setOptions()`**: Expo Router Tabs 환경에서 화면 컴포넌트 내부에 `<Tabs.Screen name="...">` JSX를 사용하면 "name prop may only be used inside a Layout route" 크래시가 발생한다. Tab 옵션 동적 변경은 반드시 `useNavigation().getParent()?.setOptions()` + `useEffect` 패턴을 사용한다. cleanup에서 기본값으로 복원하는 것을 필수로 한다.
- **`Modal` vs `Alert` Policy (UI Serialization)**: 모바일 환경(특히 WebView/RN)에서 `Toast`와 시스템 `Alert`을 동시에 트리거할 경우, UI 렌더링 스레드 우선순위 밀림으로 인해 `Alert`창이 Suppression(무시)되는 현상이 잦다.
  - **해결책**: 중요한 확인 절차(라운딩 종료 등)는 시스템 `Alert` 대신 앱 내부에 정의된 **커스텀 `Modal`**을 사용하여 UI를 직접 제어한다. 이는 플랫폼 독립적인 신뢰성을 보장하며, 디자인 일관성(Consistency) 유지에도 유리하다.

## 6-3. Dashboard Trend Analysis Logic (대시보드 트렌드 분석)

- **최근 5경기 트렌드**: `calculateAdvancedStats`를 통해 가공된 최근 5경기 데이터를 `TrendChart` 및 `PatternHeatmap` 컴포넌트로 시각화한다.
- **Visual Safety**: 차트 데이터가 2개 미만일 경우 빈 상태(Empty State)를 노출하여 통계적 오해를 방지한다.
- **Miss Shot Aggregation**: 대시보드의 미스 패턴은 최근 5경기의 `missShots` 데이터를 합산하여 빈도순으로 바 차트 히트맵을 생성한다.
- **Situational Analysis (Par 3 vs Par 4+)**: 미스 샷 통계는 파3(아이언 위주)와 파4/5(드라이버/우드 위주) 상황을 분리하여 제공한다. 이는 `hole.par` 값을 기준으로 `activeStats` 엔진에서 자동 분류된다.
- **Animation**: `react-native-reanimated`의 `FadeInDown` 및 `FadeIn`을 적용하여 대시보드 진입 및 탭 전환 시 시각적 만족감을 극대화한다.

## 7. AI Developer Experience & Tooling Policy (AI DX & Tooling Policy)

- **Silent Execution Protocol**: To maintain a seamless developer experience and **prevent terminal flickering (pop-up windows)** on the user's machine, the AI assistant must adhere to the **Extreme Silent Protocol**:
  - **Zero-Shell Information Gathering**: It is **strictly prohibited to use `run_command` (shell) to read local files** (e.g., `view_file`, `list_dir`, `grep_search`). Internal IDE tools (`view_file`, `list_dir`, `grep_search`) must be used 100% of the time for these tasks.
  - **Reasoning**: Any call to `run_command` triggers a terminal handshake and profile initialization, which causes visible UI flickering and pop-ups even with an `automationProfile` configured.
- **Terminal Usage Restriction**: The terminal (`run_command`) should only be used for process execution tasks that cannot be handled natively:
  - Executing build scripts or development servers (e.g., `npm run dev`).
  - Git operations (e.g., `git commit`, `git push`).
  - Running complex automation scripts (e.g., `dev.ps1`).
- **Background Monitoring**: When a long-running terminal command is necessary, minimize the use of `command_status` polling if it causes excessive terminal UI updates on the host OS.

## 8. TypeScript Strict Typing Policy (타입 무결성)

- **`any` 금지**: 모든 `app/` 및 `src/` 코드에서 `any` 사용을 엄격히 금지. catch 블록은 `unknown` + `instanceof Error` 가드로 처리.
- **Catch Binding**: 미사용 catch 변수는 빈 `catch {}` 바인딩으로 처리 (ES2019+).
- **Hook Return Boundary**: Hook 내부 state setter는 외부에서 직접 노출하지 않으며, 필요한 경우 high-level action function으로 래핑하여 반환.
- **Asset `require()` 예외**: Expo 번들러의 asset 로딩(`require('../assets/...')`)은 표준 패턴으로, `eslint-disable` 주석으로 예외 처리 허용.
- **Rules of Hooks 위반 방지**: 컴포넌트 함수 내 모든 `useState` / `useReducer` / `useMemo` / `useCallback` / `useEffect` 는 **Early Return 이전** 에 무조건 선언해야 한다. 권한 체크(`isAdminLoading`, `isAdmin`) 등 조건부 early return 이후에 Hook을 선언하면 렌더 간 Hook 순서가 달라져 React 크래시가 발생한다. 위반 시 나타나는 증상: `"Rendered more hooks than during the previous render"` 에러.

## 9. Advanced Resilience & State Management (Advanced Resilience & State Management)

- **Atomic State Orchestration (useReducer)**: Complex scoring sessions are managed via a centralized useReducer rather than multiple useState hooks. This ensures atomic updates (e.g., updating multiple scoring fields and the current hole simultaneously) and prevents illegal state transitions.
- **Hook Referential Stability (State/Actions Separation)**: High-frequency interaction hooks (e.g., `useGolfRecord`) must return a `{ state, actions }` structure.
  - **actions** object must be memoized with `useMemo(() => ({ ... }), [dispatch])`.
  - All action functions inside must be **stable** (using `useCallback` with only `dispatch` as a dependency) to prevent unnecessary re-renders of memoized child components.
- **Stable Ref Pattern (Stale Closure 방지)**: `useReducer`와 함께 사용하는 async 콜백(`handleSaveCurrentHole` 등)은 `state`를 직접 클로저로 캡처하면 Stale Closure가 발생한다. 반드시 `useRef`로 최신 상태를 참조해야 한다.
  - `const stateRef = useRef(state); useEffect(() => { stateRef.current = state; });` 패턴을 표준으로 사용한다.
  - `useCallback`의 의존성 배열에서 `state`를 제거하고 `stateRef.current`로만 접근한다.
  - `useMemo` 의존성에 포함되는 **모든 함수(async 포함)** 는 반드시 `useCallback`으로 래핑한다.
- **Double Cast Pattern (TypeScript)**: 인덱스 시그니처가 없는 `interface`/`type` 구조체를 동적 키로 접근할 때, `as Record<string, unknown>` 직접 캐스팅은 컴파일러가 거부한다. 반드시 `as unknown as Record<string, unknown>` 이중 경유 패턴을 사용한다.
- **Background Sync Strategy**: Performance is prioritized by executing cloud sync in the background without blocking the UI. The UI reflects the syncStatus ('syncing', 'synced', 'failed') to inform the user of the current persistence state.
- **Fault Tolerance (Error Boundaries)**:
  - **GlobalErrorBoundary**: Wrapped at the root layout (`_layout.tsx`) to catch unexpected system-wide failures and provide a recovery mechanism.
  - **HoleErrorBoundary**: Wrapped at the hole recording level (`record.tsx`) to isolate scoring logic failures, allowing users to refresh a single hole's UI without losing session state.
- **Memory Leak Protection (isMounted Guard)**: 모든 비동기 로직이 포함된 Hook 및 컴포넌트(`useGolfRecord`, `record.tsx` 등)는 `isMounted` Ref를 사용하여 언마운트 후의 상태 업데이트(`setState`, `dispatch`)를 차단한다. 이는 특히 탭 전환이 빈번한 환경에서 'Memory Leak' 경고와 'State update on unmounted component'를 방지하여 시스템 안정성을 확보한다.

## 10. Permanently Abandoned Features (영구 폐기 기능 목록)

| 코드 | 기능 | 폐기 사유 |
| --- | --- | --- |
| A-2 | 홀별 스와이프 네비게이션 | 기존 HoleSelectorGrid로 충분. 제스처 충돌 리스크 대비 효용 낮음 |
| A-4 | 다크모드/라이트모드 앱 내 토글 | OS 설정 연동으로 충분 |
| A-5 | 홀별 메모(Hole Memo) 입력 UI | 필드 및 관련 코드 완전 제거됨 |
| A-6 | 라운드 메모(Round Memo) 입력 UI | FinishRoundModal에 TextInput 추가 불필요 |
| A-7 | 햅틱 피드백 세분화 | 현재 수준(Light/Medium/Selection)으로 충분 |
| B-1 | 전반(OUT)/후반(IN) 소계 행 | ScoreCardTable 단순성 유지 |
| B-2 | FIR(페어웨이 안착률) UI 복구 | `isFairway` 필드 및 `is_fairway` DB 컬럼 완전 제거됨 |
| B-5 | 홀별 사진 첨부 | Supabase Storage 정책 복잡도 대비 효용 불분명 |
| B-6 | 라운드 복사(Round Duplication) | 코스 선택 흐름이 간단하여 불필요 |
| C-5 | 드라이빙 거리 추적 | 입력 부담 대비 활용도 낮음 |
| C-6 | 목표 스코어 설정 및 달성률 | 별도 설정 화면 필요 — 복잡도 대비 효용 낮음 |
| G-1 | 소셜/멀티플레이어 스코어카드 | Supabase Realtime 구현 비용 과도 |
| G-4 | 구장 지도 시각화 | 홀 좌표 데이터 수집 현실적으로 불가 |
| G-5 | 캐디 모드 (GPS 거리 측정) | G-4 선행 필요 + 배터리 소모 이슈 |
