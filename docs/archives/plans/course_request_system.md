# 🗺️ Project Blueprint: 구장 요청 시스템 (Course Request System)
> 생성 일시: 2026-03-12 11:55 | 상태: 설계 승인 대기

## 🎯 Architectural Goal
- 일반 사용자가 검색 결과에서 원하는 구장이 없을 경우 직접 요청할 수 있는 기능을 구현하고, 관리자가 이를 한눈에 관리할 수 있게 한다.
- **SSOT**: `course_requests` 테이블을 유일한 요청 데이터 저장소로 활용.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: Database Schema 설계 및 반영**
  - **Goal**: 요청된 구장 데이터를 저장할 테이블 생성 및 RLS 설정.
  - **Context**: `supabase/migrations/` 신규 파일 생성
  - **Implementation**:
    - [ ] `course_requests` 테이블 생성 (id, user_id, requested_club_name, status, created_at)
    - [ ] 관리자만 읽기/쓰기 가능, 일반 사용자는 쓰기만 가능하도록 RLS 설정.
  - **Pseudocode**:
    ```sql
    CREATE TABLE course_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id),
      requested_club_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```
  - **Dependency**: None
  - **Verification**: Supabase Dashboard 또는 SQL Editor에서 테이블 생성 확인.

- [ ] **Task 2: User-side 요청 UI 구현 (CourseSelector)**
  - **Goal**: 구장 검색 결과가 없을 때나 하단에 요청 버튼/모달 노출.
  - **Context**: `src/modules/golf/components/Record/CourseSelector.tsx`
  - **Implementation**:
    - [ ] 검색 결과가 없거나 검색어 입력 시 하단에 "구장 요청하기" 버튼 추가.
    - [ ] 간단한 입력 폼(구장 이름)을 포함한 Modal 구현.
    - [ ] `supabase` 클라이언트를 통해 `course_requests`에 데이터 insert.
  - **Dependency**: Task 1
  - **Verification**: 검색 후 버튼 클릭 -> 모달 -> 요청 완료 메시지 확인.

- [ ] **Task 3: Admin-side 요청 관리 화면 구현**
  - **Goal**: 관리자가 유저들의 요청을 확인하고 상태(대기/완료)를 변경할 수 있는 화면 제공.
  - **Context**: `app/admin_requests.tsx`, `src/modules/admin/admin.repository.ts`
  - **Implementation**:
    - [ ] `admin.repository.ts`에 `getCourseRequests`, `updateRequestStatus` 메서드 추가.
    - [ ] `app/admin_requests.tsx` 신규 파일 생성 (리스트 렌더링).
    - [ ] `_layout.tsx` 또는 관리자용 메뉴에 링크 추가.
  - **Dependency**: Task 1, 2
  - **Verification**: /admin_requests 접속 시 요청 목록 표시 및 상태 변경 동작 확인.

## ⚠️ 기술적 제약 및 규칙 (SSOT)
- **Encoding**: UTF-8 no BOM 고정.
- **Refactoring**: 기능 구현에 필수적이지 않은 리팩토링 금지.
- **Environment**: Windows 11 / PowerShell 기반 작동 보장.
- **UI**: `Ark UI` 컨셉 유지 (현재는 React Native 기반이므로 Native UI 스타일 준수).

## ✅ Definition of Done
1. [ ] 사용자가 구장을 요청하고 DB에 정상 저장됨.
2. [ ] 관리자 페이지에서 해당 요청을 확인하고 상태를 변경할 수 있음.
3. [ ] `memory.md`에 변경 사항 반영 완료.
