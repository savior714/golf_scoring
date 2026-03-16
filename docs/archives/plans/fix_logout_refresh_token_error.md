# 🗺️ Project Blueprint: 로그아웃 세션 예외 처리 및 안정화

> 생성 일시: 2026-03-16 13:30 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **문제**: 로그아웃 버튼 클릭 후 `Invalid Refresh Token: Refresh Token Not Found` 런타임 에러 발생.
- **원인 분석**:
    1. `supabase.auth.signOut()`이 `void`로 실행되어 완료를 대기하지 않음 (Async Race Condition).
    2. 로그아웃 처리 중 또는 직후에 `useDashboardData` 등의 훅이 잔존하여 `pullRoundsFromSupabase` 내부의 `getSession()`을 호출함.
    3. `getSession()`은 스토리지의 갱신 토큰을 통해 세션을 복구하려 시도하나, 로그아웃으로 인해 토큰이 사라진 상태에서 내부 예외 발생.
- **해결 전략**: 
    - 로그아웃 처리 시 `await`를 강제하여 스토리지 클린업 보장.
    - 리포지토리 레이어에서 `getSession()` 호출 전 상태 가드 및 예외 처리 강화.
    - 로그아웃 직후 불필요한 백그라운드 동기화 차단.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: index.tsx 로그아웃 로직 수정**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\index.tsx`
  - **Goal**: `signOut()`을 `await` 처리하고, 로그아웃 진행 중 상태를 관리하여 중복 요청 및 오동작 방지.
  - **Pseudocode**:
    ```tsx
    const handleLogout = async () => {
      await supabase.auth.signOut();
      queryClient.clear();
      // router.replace('/(auth)/login'); // _layout에서 처리하므로 생략 가능하나 명시적 처리 검토
    };
    ```

- [x] **Task 2: syncRoundRepository 가드 강화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\repository\golf.round.sync.repository.ts`
  - **Goal**: `getSession()` 호출 시 발생할 수 있는 잠재적 예외를 캐치하고, 세션 부재 시 즉각 Early Return.
  - **Pseudocode**:
    ```typescript
    const { data: { session }, error } = await supabase.auth.getSession().catch(() => ({ data: { session: null }, error: null }));
    if (!session || error) return { success: false, ... };
    ```

- [x] **Task 3: AdminContext 초기화 로직 보완**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\shared\contexts\AdminContext.tsx`
  - **Goal**: `onAuthStateChange`에서 `SIGNED_OUT` 이벤트 발생 시 추가적인 `getSession()` 호출이 발생하지 않도록 로직 재검토.
  - **Dependency**: Task 2

- [x] **Task 4: 테스트 및 검증**
  - **Tool**: `Bash`
  - **Goal**: 로그아웃 반복 실행 시 `LogBox` 에러 발생 여부 확인 및 `npx tsc --noEmit` 무결성 검증.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Auth Lifecycle**: `supabase.auth.signOut()`은 로컬 스토리지를 물리적으로 삭제하므로, 이후의 모든 Supabase 호출은 세션 존재 여부를 반드시 체크해야 함.
- **Race Condition**: 탭 이동이나 포커스 이벤트가 로그아웃 애니메이션 중에 발생할 수 있음을 고려하여 `isValidating` 또는 `isAdmin` 상태를 가드로 사용.

## ✅ Definition of Done

1. [x] 로그아웃 버튼 클릭 시 `Invalid Refresh Token` 에러 없이 로그인 화면으로 전환됨.
2. [x] `npx tsc --noEmit` 명령어가 에러 없이 완주됨.
3. [x] `memory.md`에 로그아웃 안정화 작업 내용 기록 완료.
