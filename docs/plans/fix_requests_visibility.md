# 🗺️ Project Blueprint: 구장 요청 노출 버그 수정 (Course Requests Visibility)

> 생성 일시: 2026-03-12 14:45 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- 사용자가 요청한 구장 내역이 관리자 화면(`admin_requests.tsx`)에서 정상적으로 조회되지 않는 문제 해결.
- **핵심 원인 가설**: `course_requests.user_id`가 `auth.users(id)`를 참조하고 있어, `public.profiles`와의 직접적인 Join 실패(Relationship not found).
- **해결책**: DB 스키마 보완(직접 외래키 추가) 및 RLS 정책 일원화.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: DB 스키마 보완 (FK 및 Role 컬럼 추가)**
  - **Goal**: PostgREST Join 지원을 위한 직접 외래키 추가 및 관리자 권한 관리를 위한 `role` 컬럼 도입.
  - **Context**: `supabase/migrations/20260312000003_fix_requests_join.sql` (신규)
  - **Implementation**:
    - [ ] `profiles` 테이블에 `role` TEXT 컬럼 추가 (Default: 'user').
    - [ ] 'savior714@gmail.com' 사용자의 `role`을 'admin'으로 설정.
    - [ ] `course_requests` 테이블의 `user_id`에 `public.profiles(id)` 참조 외래키 명시적 추가.
  - **Pseudocode**:

    ```sql
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    UPDATE public.profiles SET role = 'admin' WHERE email = 'savior714@gmail.com';
    
    -- Join 성능 및 PostgREST 관계 인식을 위한 FK 추가
    ALTER TABLE public.course_requests 
    ADD CONSTRAINT fk_course_requests_profiles 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    ```

  - **Dependency**: `20260312000002_create_course_requests.sql` (기존 마이그레이션)
  - **Verification**: Supabase SQL Editor에서 `course_requests`와 `profiles` Join 쿼리(JS와 동일 로직) 실행 시 데이터 반환 확인.

- [ ] **Task 2: RLS 정책 및 Repository 쿼리 검증**
  - **Goal**: `role` 컬럼 기반의 RLS 정책으로 수정하고, Repository 쿼리에서 발생하는 잠재적 오류 차단.
  - **Context**: `supabase/migrations/20260312000003_fix_requests_join.sql`, `src/modules/admin/admin.repository.ts`
  - **Implementation**:
    - [ ] `course_requests`의 `UPDATE` RLS 정책을 새 `role` 컬럼 기준으로 수정.
    - [ ] `adminRepository.getCourseRequests`에서 에러 발생 시 로그에 상세 원인(Error Code) 출력하도록 보완.
  - **Verification**: `admin_requests.tsx` 접속 시 "데이터 로딩 중..." 후 목록이 정상 노출되는지 확인.

- [ ] **Task 3: Admin 권한 감지 로직 동기화**
  - **Goal**: UI에서 사용하는 `useIsAdmin` 훅이 DB `role` 컬럼과 정합성을 가지도록 함 (선택적).
  - **Context**: `src/shared/components/useIsAdmin.ts`
  - **Implementation**:
    - [ ] 현재는 하드코딩된 이메일 체크 중. DB `role` 컬럼을 조회하는 로직으로 전환 검토 (필요 시).
  - **Verification**: 관리자 계정 접속 시 탭 노출 및 기능 정상 동작 확인.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM.
- **Join Convention**: PostgREST에서 Join을 사용하려면 가급적 `public` 스키마 내 테이블 간의 명시적 `FOREIGN KEY`가 필요함.
- **Rollback**: `ALTER TABLE DROP CONSTRAINT`, `ALTER TABLE DROP COLUMN role` 스크립트 준비.

## ✅ Definition of Done

1. [ ] 사용자가 입력한 구장 요청이 `admin_requests.tsx` 리스트에 정상적으로 나타남.
2. [ ] `profiles` 테이블에 `role` 컬럼이 추가되고 관리자 권한이 정상 부여됨.
3. [ ] `memory.md`에 DB 스키마 변경 사항 반영.
