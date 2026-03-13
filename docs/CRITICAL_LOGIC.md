# Golf Scoring Application - Critical Logic (SSOT)

## 0. Course Master Data Structure (Course Master Structure)

- **4-Layer Hierarchy**: Managed in the order of Club > Course > Hole > Distance.
- **Course Unitization**: Every course is managed as a 9-hole unit. (An 18-hole club consists of 2 courses, a 27-hole club consists of 3 courses).
- **Out-In Combination Logic**: An 18-hole round is defined as a dynamic combination of an Out (Front) 9-hole unit and an In (Back) 9-hole unit.
- **Security Policy**: Creation, modification, and deletion of course master information are restricted to specific accounts with administrator privileges via Database RLS (Row Level Security).
- **Authorization SSOT (Role-based)**: `public.profiles` 테이블의 `role` 컬럼은 권한 관리의 유일한 진실 원천(SSOT)으로 정의된다. 코드상의 하드코딩된 이메일 체크는 지양하며, DB RLS 정책은 반드시 `profiles.role` 값을 참조하여 동작한다. (예: `role = 'admin'`)

## 1. Scoring Policy (Scoring Policy)

- **Total Score**: The sum of `stroke` values for all holes.
- **Relative Score**: Calculated as `Total Score - Total Par`. Visualized with Red for Over(+), Green for Under(-), and White/Gray for Even(E).
- **GIR (Green In Regulation)**: Determined as successful if `(stroke - putt) <= (par - 2)`.
- **Penalty (OB/Penalty Area) Handling**: OB and Penalty buttons are for statistical tracking only and **are not automatically added to the Total Stroke.** Users must manually adjust the final stroke count according to the rules.
- **Miss Shot Pattern Analysis**: Up to **2 patterns can be selected per hole**, stored as comma-separated values.
- **Intelligent Automation (Three-putt)**: If the putt count is 3 or more, the system automatically adds the 'Three-putt' pattern. Conversely, it is removed if the count drops below 3. If 2 patterns are already selected, it follows a FIFO (First-In, First-Out) logic to maintain the latest status.
- **Rounding Creation Limit (Daily & Date Guard)**: 사용자의 남용 방지 및 데이터 정합성을 위해 하루 최대 10건(`GOLF_LIMITS.MAX_DAILY_ROUNDS`)의 라운드 기록만 생성을 허용한다. 삭제된 기록은 개수 산정에서 제외되는 **Net Count** 방식을 따른다. 또한, **과거 날짜의 기록 생성**은 원격 동기화 정합성을 위해 원천 차단된다.
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

## 2. Development & Performance Standards (Development & Performance Standards)

- **Environment Compatibility (SSR Safety)**: Since modules accessing browser APIs (Supabase, AsyncStorage, etc.) can cause errors during build time (Node.js environment), they must include a `typeof window !== 'undefined'` check or use a Dummy Storage Wrapper.
- **Async Optimization**: Independent asynchronous tasks (e.g., storage save + session ID setting) must be processed in parallel using `Promise.all`.
- **Computation Optimization**: High-cost calculations such as summary statistics or progress indicators must use `useMemo` to prevent unnecessary re-computations.
- **React Query staleTime Policy (Cross-Tab Isolation)**: AsyncStorage 기반 로컬 쿼리(`['golf_clubs']`, `['current_round_id']`, `['golf_rounds']`)는 **`staleTime: Infinity`**를 필수적으로 설정한다. 이 쿼리들은 네트워크가 아닌 로컬 스토리지에서 읽히므로, 포커스 복구 시의 `invalidateQueries` 호출이 `isLoading=true`를 전파하여 생기는 2~3초 리렌더링 버그를 차단한다. 데이터 변경 시에만 명시적 갱신을 수행한다.
- **Component Reuse**: Core UI elements like the scorecard table are unified into the `ScoreCardTable` component to maintain data consistency.
- **List Rendering Optimization (FlatList Pattern)**: For lists with potentially large data sets (e.g., History screen), apply the following invariants:
  - List item components (e.g., `HistoryItem`) must be extracted as standalone components wrapped with `React.memo`.
  - Shared list components (e.g., `ScoreCardTable`) must also be wrapped with `React.memo`.
  - `renderItem`, `keyExtractor`, and all event handler callbacks passed as props must be stabilized with `useCallback`.
  - FlatList baseline tuning: `initialNumToRender=5`, `maxToRenderPerBatch=10`, `windowSize=5`, `removeClippedSubviews=true`.

## 3. Architecture (Architecture - DDD & 3-Layer)

- **Domain Modularization (`src/modules/golf`)**: Encapsulates all logic related to the specific business domain (golf) into subdirectories.
  - **golf.types.ts**: Data models and interface definitions (Definition).
  - **golf.repository.ts**: Data storage access layer (Repository).
  - **golf.service.ts**: Business calculation logic (Service).
  - **golf.data.ts**: Static domain-related data (Data).
- **Common Infrastructure (`src/shared`)**: Manages shared UI (`components`), configurations (`lib`), and themes (`constants`) separately.
- **Routing & Views (`app/`)**: Follows Expo Router standards, focusing on UI rendering while excluding business logic.
- **Analytics Engine (`golf.service.ts`)**: Centralized logic for multi-round trend analysis (`calculateAdvancedStats`). Derived statistics (Score, Putt, GIR) must be computed here to ensure consistency across the dashboard and stats views.

## 4. Course Data Integrity & Validator (Data Integrity & Validator)

- **Zero-Tolerance Policy**: To maintain absolute data quality, only data that passes 100% of the validation rules is allowed to enter the database.
- **Validator Engine (`validateClubData.ts`)**: The single source of truth for course master data validation.
  - Exactly 9 holes per course.
  - Total Par sum must be exactly 36.
  - Hole numbers must be sequential (1-9).
  - At least one distance entry per tee color for each hole.
  - All distances must be non-zero positive integers.
- **Atomic Bulk Insertion (Chunked)**: Large-scale data imports are processed via Supabase RPC (`insert_clubs_bulk`). To prevent database session timeouts (`57014`), data must be partitioned into **chunks of 50 clubs** and processed sequentially at the repository layer.
- **Data Integrity**: All data must pass 100% of the validation rules before any chunk is sent to the DB. 하나라도 실패하면 전체 프로세스를 중단하여 원자적(All-or-Nothing) 무결성을 보존한다.
- **Course Deletion 2-Step Protocol**: `golf_courses` 레코드 삭제 시 반드시 `rounds.out_course_id` / `rounds.in_course_id`를 NULL로 UPDATE하여 FK 위반을 방지한다. 순서: **선 rounds 참조 NULL화 후 golf_courses DELETE**. 하위 `golf_holes`, `hole_distances`는 DB CASCADE로 자동 제거.
- **JSON Import Smart Quote Normalization**: `handleParse` 실행 시 `normalizeJsonText()`로 스마트 쿼트, non-breaking space, BOM 등을 표준 ASCII로 변환하여 `Unterminated string in JSON` 오류를 차단한다.
- **Course Verification Filter**: 사용자에게 노출되는 구장 목록(`CourseSelector`)은 `isVerified === true`인 데이터로 한정된다. 관리자(Admin)는 전체 데이터를 조회하여 검수를 수행한다.
- **Club Name Normalization**: 구장 공식 명칭은 표준화된 포맷(예: '골프리조트' -> 'CC')을 지향하며, 신규 등록 시 중복 방지 및 검수 효율을 위해 정규화 스크립트를 경유한다.

## 5. Active Session & UI Workflow (Session Management & UI Workflow)

- **Hole Selector Grid**: Standardized the `HoleSelectorGrid` component for quick navigation across 18 holes, accessible directly from the recording screen.
- **Modular Recording UI**: Refactored `record.tsx` into specialized sub-components (`HoleSelectorGrid`, `ScoreAdjuster`, `MissShotPatternGrid`, `CourseHeader`) to improve maintainability.
- **Tab Button Role Separation (2026-03-10 refactor)**:
  - **Bottom Tab (Pen icon / `NewRoundTabButton`)**: Always navigates directly to `record.tsx`. If a `currentRoundId` exists, the existing round is loaded for editing. If not, a new round flow begins. No confirmation dialog.
  - **Top-right "신규 라운드" Button (Dashboard)**: Always calls `startNewRound()`, which clears `currentRoundId` and navigates to `record.tsx` with `mode: 'new'`. Unconditional — no "이어하기" path.
- **History -> Record Flow**: The history screen exposes a single "보기 / 수정" button per record. Tapping it calls `setCurrentRoundId(id)` and navigates to `record.tsx` with `params: { source: 'history', mode: 'edit' }`. This merges the former separate "보기" (view) and "수정" (edit) actions into one.
- **Explicit Navigation Protocol (2026-03-11)**: To prevent unintended session resets while ensuring high-reliability data loading, all programmatic navigation to `record.tsx` must include a `mode` parameter:
  - **`mode: 'edit'`**: Used when continuing an existing session (from Dashboard) or editing a past record (from History). This bypasses the selection-step guard to force-load the targeted session data.
  - **`mode: 'new'`**: Used when intentionally starting a fresh round (from Dashboard's "신규 라운드"). This bypasses all guards to perform a clean `RESET_SESSION`. **To prevent infinite reset loops during re-renders or re-focusing, the `mode: 'new'` parameter must be consumed and cleared via `router.setParams({ mode: undefined })` immediately after the session is successfully initialized.**
  - **No `mode`**: Only occurs during simple tab switching. The system preserves the current `selectionStep` to prevent losing work-in-progress during course selection.
- **Dynamic Tab Label (`tabBarLabel`)**: `_layout.tsx`에서 `useQuery(['current_round_id'])`로 `currentRoundId` 유무를 구독하여 탭 라벨을 결정. `currentRoundId` 존재 시 '기록 수정', 없으면 '신규 라운드'. `invalidateQueries(['current_round_id'])` 호출 시 자동 반영.
- **Record Tab Button Routing**: `RecordTabButton`은 `currentRoundId` 유무에 따라 `mode=edit` 또는 `mode=new`로 `router.replace` 분기. `router.push` 금지 (history stack 누적 방지).
- **Stale Cache Recovery (course_id 만료)**: `loadMasterAndSession`에서 `getCourseWithHoles()` 결과값이 null인 경우(로컬 캐시의 course_id가 DB에서 삭제/변경됨), Supabase `rounds` 테이블을 직접 조회하여 최신 `out_course_id`/`in_course_id` 정황을 재수집한다. 성공 시 `pullRoundsFromSupabase(force=true)`로 로컬 캐시를 동기화한다.
- **DB 직접 수정 시 주의**: `resolveMergedRounds`는 `updatedAt` 기준으로 원격/로컬 승자를 결정한다. SQL로 `rounds` 테이블을 직접 수정할 때 **반드시 `updated_at = NOW()`를 포함**해야 원격 데이터가 로컬 캐시를 올르게 덮어쓴다.
- **Navigation Title Integration (2026-03-13)**:
  - **SSOT**: `app/(tabs)/_layout.tsx`에서 모든 탭의 하단 라벨(`tabBarLabel`)과 상단 헤더 타이틀(`headerTitle`)을 중앙 관리한다.
  - **Flicker Protection**: `Record` 탭의 동적 라벨('기록 수정' / '스코어 입력') 결정 시 `useQuery`의 `isLoading` 상태를 활용하여 데이터 로딩 중 라벨이 튀는 현상을 방지('확인 중...' 표시)한다.
  - **Redundancy removal**: 개별 화면(`.tsx`) 파일에서 하드코딩된 `Stack.Screen`의 `title` 옵션은 모두 제거하여 레이아웃의 정의를 따르도록 한다. 단, 헤더 좌/우 버튼 로직을 위해 `options`의 다른 속성은 사용할 수 있다.
  - **Record Tab Header Policy**: `Record` 탭은 정보량이 많은 커스텀 헤더(`CourseHeader`)를 사용하므로 네이티브 헤더를 감춘다(`headerShown: false`). 이때 발생할 수 있는 상단 겹침 문제는 `useSafeAreaInsets`를 통해 최상위 컨테이너에 동적 `paddingTop`을 주어 해결한다.

## 6. Diagnosis & Troubleshooting (진단 및 문제 해결)

### [Issue] 구장/코스 선택 화면 회귀 및 리렌더링 현상

- **원인 (Race Condition)**: 비동기 로직이 완료된 후 과거의 상태(club)를 참조하여 `RESET_SESSION`을 호출하는 경쟁 상태 발생.
- **해결 전략**:
  1. **State Ref 동기화**: 렌더링 바디에서 직접 `stateRef.current = state`를 수행하여 비동기 continuation이 항상 최신 상태를 읽도록 보장.
  2. **Guard Clause 강화**: `isLoadingMaster`가 true이거나 `selectionStep !== 'club'`인 경우 불필요한 재로딩 방지.
  3. **Soft Loading**: 로딩 중 전체 UI를 스피너로 교체하는 대신, 기존 목록을 유지하여 컴포넌트 언마운트 방지.

## 7. Admin Guide: Course Data Preparation (구장 데이터 준비 가이드)

### JSON Bulk Import 규격

- **구조**: `[{ "name": "구장명", "address": "주소", "courses": [{ "name": "코스명", "holes": [...] }] }]`
- **필수 규칙**:
  - 코스당 정확히 **9홀**.
  - 9홀의 파 합계 = **정확히 36**.
  - 각 홀에 최소 1개 이상의 티 거리 데이터 필수.
  - 거리 값은 양의 정수만 허용.

### 데이터 확보 방법

1. **AI 프롬프트 활용**: ChatGPT/Claude에게 9홀 단위 분리, Par 합계 36 준수 프롬프트로 생성 요청.
2. **공식 홈페이지 참고**: 야드(yd) 단위인 경우 `* 0.9144`를 통해 미터(m)로 변환하여 기록.

## 8. TypeScript & Resilience Policy

- **any 금지**: 모든 코드에서 any 사용 엄격 금지. `unknown` + Type Guard 조합 사용.
- **Memory Leak Protection (isMounted Guard)**: 모든 비동기 로직을 포함하는 Hook은 `isMounted` Ref를 사용하여 언마운트 후의 상태 업데이트(`setState`, `dispatch`)를 차단한다.
- **Stable Ref Pattern**: `useReducer`와 함께 사용되는 async 콜백은 반드시 `useRef`로 최신 상태를 참조하여 **Stale Closure**를 방지한다.

## 9. Error Handling & Persistence Strategy (에러 핸들링 및 데이터 영속성)

- **Domain-Driven Error Schema**: 모든 도메인 에러는 `golf.types.ts`에 정의된 `GolfErrorCode`와 `GolfDomainError` 인터페이스를 준수해야 한다.
- **Repository-Level Wrapping**: Repository 레이어의 모든 외부 I/O(Storage, DB) 시도는 반드시 `try-catch`로 래핑되어야 하며, 발생한 에러는 `GolfDomainError` 규격으로 변환하여 상위 레이어(Service/UI)로 전달(throw)한다.
- **Error Codes**:
  - `AUTH_REQUIRED`: 인증이 필요한 작업이나 세션이 없는 경우.
  - `VALIDATION_FAILED`: 비즈니스 로직 검증 실패.
  - `SYNC_CONFLICT`: 원격/로컬 데이터 충돌 시.
  - `STORAGE_ERROR`: 로컬 저장소(AsyncStorage) I/O 실패.
