# 🗺️ Project Blueprint: 관리자 구장 추가 요청 실시간 알림

> 생성 일시: 2026-03-13 11:30 | 상태: 완료

## 🎯 Architectural Goal

- **실시간성**: 사용자가 구장 추가 요청을 보냈을 때 관리자가 앱 사용 중이라면 즉시 알림(Toast)을 수신해야 함.
- **권한 제어**: 일반 사용자가 아닌 **관리자(role: admin)**에게만 알림이 노출되어야 함.
- **범용성**: 특정 페이지에 종속되지 않고 앱 어디서든(`RootLayout`) 알림이 동작해야 함.
- **SSOT**: `course_requests` 테이블의 `INSERT` 이벤트를 유일한 진실 공급원으로 사용.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `useAdminRequestToast.ts` Hook 생성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\shared\hooks\useAdminRequestToast.ts`
  - **Goal**: Supabase Realtime을 통해 `course_requests` 테이블의 `INSERT` 이벤트를 구독하고 토스트를 띄우는 로직 구현.
  - **Pseudocode**:
    ```typescript
    useEffect(() => {
      if (!isAdmin) return;
      const channel = supabase.channel('admin-requests')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'course_requests' }, (p) => {
          Toast.show({ type: 'info', text1: '새 구장 요청', text2: p.new.requested_club_name });
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }, [isAdmin]);
    ```
  - **Dependency**: None (`useIsAdmin`, `supabase`, `Toast` 라이브러리 활용)

- [x] **Task 2: `app/_layout.tsx`에 Hook 통합**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\_layout.tsx`
  - **Goal**: `RootLayoutNav` 컴포넌트에 `useAdminRequestToast()`를 추가하여 전역 알림 활성화.
  - **Dependency**: Task 1

- [x] **Task 3: 린트 체크 및 검증**
  - **Tool**: `run_command`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 타입 오류 및 린트 위반 여부 확인.
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Supabase Realtime**: `course_requests` 테이블의 Realtime 기능이 DB에서 활성화되어 있어야 함 (이 작업은 코드 레벨에서만 다룸).
- **Cleanup**: 채널 구독 해제(`removeChannel`)를 반드시 수행하여 메모리 누수 방지.
- **Admin Check**: `useIsAdmin` 훅을 재사용하여 권한 로직 정렬.

## ✅ Definition of Done

1. [ ] 관리자 계정으로 로그인 시 토스트 알림 구독이 시작됨.
2. [ ] `course_requests`에 새로운 데이터 삽입 시 앱 내 어디서든 토스트 알림이 표시됨.
3. [ ] 관리자가 아닌 사용자는 알림을 받지 않음.
4. [ ] 코드가 `300라인` 규칙을 준수하며 린트 오류가 없음.
