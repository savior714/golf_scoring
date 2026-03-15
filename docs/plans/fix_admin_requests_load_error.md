# 🗺️ Project Blueprint: 구장 추가 요청 관리 로드 오류 해결

> 생성 일시: 2026-03-15 10:15 | 상태: 완료

## 🎯 Architectural Goal

- `AdminRequestsScreen`에서 발생하는 **데이터 로딩 중 오류**를 해결하고, 시스템 안정성을 확보함.
- **SSOT**: `src/modules/admin/admin.repository.ts`에서의 에러 처리 방식을 `getAllUsers` 수준으로 강화하여 마이그레이션 미비 시에도 앱이 크래시되지 않도록 보장함.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: admin.repository.ts 분석 및 에러 핸들링 보강**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\admin.repository.ts`
  - **Goal**: `getCourseRequests` 메서드에 `42P01` (Table Not Found) 에러 대응 로직을 추가하여 안전한 초기 진입을 보장함.
  - **Pseudocode**:
    ```typescript
    if (error) {
      if (error.code === '42P01') return []; // 테이블 부재 시 빈 배열 반환
      throw error;
    }
    ```

- [x] **Task 2: Supabase 마이그레이션 현황 및 Join 정렬 확인**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\supabase\migrations\20260312000003_fix_requests_join.sql`
  - **Goal**: 테이블 정의와 실제 repository의 join 쿼리(`profiles:user_id`)가 일치하는지 최종 검토.
  - **Dependency**: Task 1

- [x] **Task 3: 관리자 SELECT 권한 RLS 정책 추가 검토**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\supabase\migrations\20260312000003_fix_requests_join.sql`
  - **Goal**: (필요 시) 관리자 전용 SELECT 정책이 누락되었는지 확인하고 보강함.
  - **Dependency**: Task 2

- [x] **Task 4: AdminRequestsScreen 리트라이 로직 검토**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\app\admin_requests.tsx`
  - **Goal**: 에러 발생 시 UI에서 `loadRequests`를 다시 호출하는 `RefreshCcw` 버튼이 정상 작동하는지 확인.
  - **Dependency**: Task 1

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Graceful Degradation**: DB 마이그레이션이 수동으로 진행되는 환경을 고려하여, 테이블 부재 시 에러 대신 빈 리스트와 경고 로그를 출력함.
- **Strict Typing**: Repository에서 반환되는 데이터 타입을 `CourseRequest[]`로 유지함.

## ✅ Definition of Done

1. [x] `getCourseRequests`에서 테이블 부재 시 `catch` 블록으로 빠지지 않고 빈 배열을 반환함.
2. [x] UI에서 "데이터 로딩 중 오류" 대신 (테이블이 비어있다면) "요청 내역이 없습니다"가 표시됨.
3. [x] `memory.md` 및 `CRITICAL_LOGIC.md`에 관리자 기능 안정화 내역 반영.
