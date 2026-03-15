# 🗺️ Project Blueprint: 구장 추가 요청 관리 데이터 로딩 오류 수정

> 생성 일시: 2026-03-15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

관리자 화면(`app/admin_requests.tsx`)에서 "데이터 로딩 중 오류가 발생했습니다."가 표시되는 버그를 수정한다.

**핵심 원인 (2개, 우선순위 순)**

| # | 원인 | 위치 | 심각도 |
|---|------|------|--------|
| 1 | **PostgREST JOIN 실패** — `user_id`가 `auth.users(id)`를 참조하지만, `profiles:user_id` JOIN은 `profiles(id)` FK가 필요. 마이그레이션 `000003`이 Cloud DB에 미적용되었을 가능성 높음 | `admin.repository.ts:139-148` | 🔴 Critical |
| 2 | **RLS 정책 미정리** — `"Anyone can view course requests"` (USING true)와 `"Only admins can select course requests"` 두 정책이 공존하여 의도가 불분명함 | `migrations/000002` | 🟡 Medium |

**SSOT**: `docs/CRITICAL_LOGIC.md` — Admin 권한 체계와 무관. DB 스키마 수정 범위.

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료. 반드시 순서대로 실행할 것.**

---

### 📦 Task List

#### ✅ [진단] DB 실제 상태 확인

- [ ] **Task 1: Supabase 대시보드 SQL로 현재 FK·RLS·role 컬럼 진단**
  - **Tool**: 사용자가 직접 Supabase SQL Editor에서 실행
  - **Target**: Cloud Supabase DB
  - **Goal**: 어떤 마이그레이션이 실제로 적용됐는지, FK/RLS 상태가 코드와 일치하는지 확인
  - **SQL**:
    ```sql
    -- 1. course_requests FK 목록 확인
    SELECT conname, confrelid::regclass AS ref_table
    FROM pg_constraint
    WHERE conrelid = 'public.course_requests'::regclass AND contype = 'f';

    -- 2. RLS 정책 목록 확인
    SELECT policyname, cmd, qual
    FROM pg_policies
    WHERE tablename = 'course_requests';

    -- 3. profiles 테이블에 role 컬럼이 있는지 확인
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role';
    ```
  - **판단 기준**:
    - FK가 `auth.users`만 참조 → Task 2(마이그레이션) 필수
    - `"Anyone can view course requests"` 정책이 존재 → Task 2에서 DROP 포함
    - `role` 컬럼 없음 → Task 2 필수
  - **Dependency**: None

---

#### 🔧 [수정 경로 A] DB 마이그레이션으로 근본 해결 (권장)

> Task 1 결과 마이그레이션 미적용 확인 시 선택

- [ ] **Task 2-A: 신규 마이그레이션 파일 작성**
  - **Tool**: `Write`
  - **Target**: `supabase/migrations/20260315000001_fix_admin_requests_rls.sql`
  - **Goal**: FK 이중화 제거, RLS 정책 정리, role 컬럼 보장
  - **Pseudocode**:
    ```sql
    -- 1. profiles.role 컬럼 보장
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    UPDATE public.profiles SET role = 'admin' WHERE email = 'savior714@gmail.com';

    -- 2. RLS 정책 정리 (Anyone can view → DROP)
    DROP POLICY IF EXISTS "Anyone can view course requests" ON public.course_requests;

    -- 3. 기존 auth.users FK 제거 후 profiles FK로 재설정
    ALTER TABLE public.course_requests DROP CONSTRAINT IF EXISTS course_requests_user_id_fkey;
    ALTER TABLE public.course_requests DROP CONSTRAINT IF EXISTS fk_course_requests_profiles;
    ALTER TABLE public.course_requests
      ADD CONSTRAINT fk_course_requests_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    ```
  - **Dependency**: Task 1 결과 확인 후

- [ ] **Task 2-B: `npx supabase db push`로 마이그레이션 적용**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx supabase db push 2>&1 | Select-Object -Last 20`
  - **Goal**: Cloud DB에 마이그레이션 적용
  - **Dependency**: Task 2-A

---

#### 🔧 [수정 경로 B] 코드 레벨 임시 수정 (Task 1 결과 대기 없이 즉시 적용 가능)

> DB 마이그레이션과 병행하여 에러 처리 강화. 또는 마이그레이션 적용 전 안전망.

- [ ] **Task 3: `admin.repository.ts` getCourseRequests JOIN 방식 변경**
  - **Tool**: `Edit`
  - **Target**: `src/modules/admin/admin.repository.ts:137-162`
  - **Goal**: `profiles:user_id` PostgREST JOIN(FK 의존) 대신 user_id만 SELECT 후 별도 profiles 조회로 변경, 에러 코드별 처리 강화
  - **Pseudocode**:
    ```typescript
    // 변경 전: profiles:user_id JOIN (FK 필요)
    .select(`*, profiles:user_id (full_name, email)`)

    // 변경 후: JOIN 제거, user_id 포함 SELECT 후 profiles 별도 조회
    const { data, error } = await supabase
      .from('course_requests').select('*').order('created_at', { ascending: false });
    // error.code === 'PGRST200' (JOIN FK 없음) 에러 핸들링 추가
    const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name, email').in('id', userIds);
    // merge profiles into requests
    ```
  - **Dependency**: None (독립 실행 가능)

---

#### ✅ [검증]

- [ ] **Task 4: TypeScript 컴파일 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | Select-Object -Last 20`
  - **Goal**: 타입 오류 없음 확인
  - **Dependency**: Task 3

---

## 🔀 실행 시나리오 결정 트리

```
Task 1 진단 실행
    │
    ├─ FK = auth.users만 존재 (profiles FK 없음)
    │   └─ → Task 2-A → Task 2-B → Task 3 → Task 4
    │
    ├─ FK = 두 개 존재 (ambiguity)
    │   └─ → Task 2-A (FK 정리) → Task 2-B → Task 4
    │
    └─ FK = profiles 정상 존재 (마이그레이션 적용됨)
        └─ → 다른 원인 탐색 필요
            (RLS 정책 확인, role='admin' 설정 여부 확인)
```

---

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM
- **FK 변경 주의**: `user_id`의 기존 `auth.users` 참조를 `profiles` 참조로 변경 시, profiles.id와 auth.users.id가 동일해야 함 (Supabase 기본 설계상 보장됨)
- **RLS 이중 정책**: PostgreSQL은 같은 operation의 정책들을 OR로 처리 → "Anyone can view" 정책이 남아있으면 admin 전용 정책이 무의미해짐 (보안 이슈)
- **마이그레이션 순서**: Cloud DB에서 `supabase migration list`로 적용 이력 확인 후 진행

---

## ✅ Definition of Done

1. [ ] 관리자 로그인 후 구장 추가 요청 목록이 정상 로딩됨
2. [ ] 비관리자 접근 시 빈 목록 또는 권한 오류가 적절히 표시됨
3. [ ] `npx tsc --noEmit` 에러 Zero
4. [ ] RLS 정책이 `"Only admins can select"` 하나로 정리됨
