# 🗺️ Project Blueprint: JSON Bulk Import 탭 전환 깜빡임 해결

> 생성 일시: 2026-03-16 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **목적**: 크롬 탭 전환이나 윈도우 포커스 시 발생하는 UI 깜빡임 현상을 제거.
- **핵심 원인**: `Supabase Auth`의 세션 갱신 이벤트 발생 시 `AdminContext`의 상태가 일시적으로 `false` 또는 `loading`으로 빠지는 현상 방지.
- **SSOT**: `AdminContext`는 사용자 세션이 완전히 종료된 것이 확인될 때만 권한을 박탈해야 함.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: AdminContext.tsx 수정 — 세션 동기화 로직 고도화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\shared\contexts\AdminContext.tsx`
  - **Goal**: `onAuthStateChange` 이벤트 핸들러에서 세션이 일시적으로 비어있을 가능성을 배제하고, 이미 확보된 권한을 불필요하게 초기화하지 않도록 가드 추가.
  - **Pseudocode**:
    ```typescript
    // onAuthStateChange 내부
    if (event === "SIGNED_OUT") {
      syncAdminStatus(false);
    } else if (session?.user?.id) {
      // 기존 권한이 있고 세션이 있다면 로딩을 띄우지 않고 백그라운드 체크만 수행
      checkAdmin(session.user.id, session.user.email);
    } else if (!session && event === "INITIAL_SESSION") {
      // 초기 로드 시에만 세션 없으면 false
      syncAdminStatus(false);
    }
    ```
  - **Dependency**: None

- [x] **Task 2: admin_import.tsx 보완 — UI 조건부 렌더링 가드 강화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\admin_import.tsx`
  - **Goal**: `isAdmin`이 `false`로 변하더라도 `jsonText`가 존재한다면 즉시 차단 화면을 띄우지 않고 마지막 유효 상태를 유지하는 유연한 가드 검토.
  - **Pseudocode**:
    ```tsx
    const showBlocked = !isAdmin && !isAdminLoading && !jsonText;
    // ...
    {isAdminLoading && !jsonText ? (
       <Spinner />
    ) : showBlocked ? (
       <AccessDenied />
    ) : (
       <MainContent />
    )}
    ```
  - **Dependency**: Task 1

- [x] **Task 3: 환경 검증 및 린트 체크**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 변경 사항으로 인한 타입 오류나 부작용 확인.
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Stability**: 권한 체크는 엄격해야 하지만, UI는 낙관적(Optimistic) 또는 관용적(Tolerant)으로 대응하여 깜빡임 최소화.
- **Memory Sync**: 작업 완료 후 `docs/memory.md`에 "탭 전환 안정성 확보" 기록.

## ✅ Definition of Done

1. [x] 크롬 탭을 이동했다가 돌아왔을 때 화면이 미동도 없이 유지됨.
2. [x] 로그아웃 시에는 즉시 "접근 권한 없음" 화면으로 전환됨.
3. [x] `jsonText`에 입력된 내용이 탭 전환 시에도 유지됨.
