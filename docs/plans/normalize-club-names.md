# 🗺️ Project Blueprint: 구장명 CC 정규화 누락 수정

> 생성 일시: 2026-03-15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **구장 선택 화면**에 "내장산 골프앤리조트", "안성 컨트리클럽" 등 비정규화된 구장명이 표시되는 문제 수정
- 모든 구장명이 **`[구장명]CC`** 형식으로 통일되도록 두 경로를 동시에 수정
- **SSOT**: `docs/CRITICAL_LOGIC.md`의 "구장명은 CC 형식으로 통일" 원칙 준수

## 🔍 근본 원인 (Root Cause Analysis)

`normalizeClubName()` 함수는 `golf.service.ts`에 이미 구현되어 있으나,
**벌크 임포트 경로**에서 JS 정규화가 적용되지 않아 원본 이름이 DB에 그대로 저장됨.

```
[Gemini AI 생성 JSON]
    └─ useBulkImport.handleConfirmSave()
         └─ clubRepository.registerClubsBulk(parsedData)   ← normalizeClubName() 미호출 ❌
              └─ supabase.rpc('insert_clubs_bulk', ...)      ← SQL 레벨에도 정규화 없음 ❌
```

`registerClub()` (단건 등록)은 `normalizeClubName()`을 정상 호출 ✅

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료되어야 한다.**

### 📦 Task List

- [ ] **Task 1: `golf.club.mutation.repository.ts` 읽기 — 현재 상태 재확인**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/repository/golf.club.mutation.repository.ts`
  - **Goal**: `registerClubsBulk()` 내부에서 정규화 삽입 위치 확인 (라인 149~180)
  - **Dependency**: None

- [ ] **Task 2: `registerClubsBulk()`에 `normalizeClubName()` 적용**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/repository/golf.club.mutation.repository.ts`
  - **Goal**: RPC 호출 전 `clubs` 배열의 각 항목에 `golfService.normalizeClubName()` 적용
  - **Pseudocode**:
    ```typescript
    // 기존
    const { data, error } = await supabase.rpc('insert_clubs_bulk', { p_clubs_json: chunk });

    // 변경 후 (청크 생성 전 정규화)
    const normalizedClubs = (clubs as any[]).map(club => ({
        ...club,
        name: golfService.normalizeClubName((club as any).name ?? ''),
    }));
    // 이후 normalizedClubs로 청크 분할
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: SQL 마이그레이션 작성 — 기존 DB 데이터 정규화**
  - **Tool**: `Write`
  - **Target**: `supabase/migrations/20260315000002_normalize_club_names.sql`
  - **Goal**: 현재 DB에 저장된 비정규화 구장명을 일괄 UPDATE
  - **Pseudocode**:
    ```sql
    -- 접미사 제거 후 CC 접미 (JS normalizeClubName 동작 재현)
    UPDATE public.golf_clubs
    SET name = regexp_replace(
        trim(regexp_replace(name,
            '(골프앤리조트|골프앤드리조트|컨트리클럽|컨트리 클럽|골프클럽|골프 클럽|골프장|CC|GC|G\.C|C\.C)\s*$',
            '', 'i'
        )) || 'CC',
        '^$', name  -- 빈 문자열이 되면 원본 유지
    )
    WHERE name !~ 'CC$';
    ```
  - **Dependency**: None (Task 2와 병렬 가능)

- [ ] **Task 4: 타입 체크**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | Select-Object -Last 20`
  - **Goal**: TypeScript 컴파일 오류 없음 확인
  - **Dependency**: Task 2

- [ ] **Task 5: 마이그레이션 적용 (Supabase)**
  - **Tool**: `Bash`
  - **Command**: `npx supabase db push --include-all 2>&1 | tail -20`
  - **Goal**: 기존 DB 데이터 정규화 반영
  - **Dependency**: Task 3, Task 4

---

## ⚠️ 기술적 제약 및 위험 요소

| 항목 | 내용 |
|------|------|
| **충돌 위험** | 정규화 후 이름이 같아지는 두 레코드가 있을 경우 UNIQUE 제약 위반 가능 |
| **대응 방안** | 마이그레이션 전 중복 검사 쿼리 실행: `SELECT ...GROUP BY ... HAVING count > 1` |
| **롤백** | 마이그레이션 적용 전 `supabase db dump` 백업 권장 |
| **`ClubInfo` 타입** | `any[]` 캐스팅 주의 — `name` 필드 존재 보장 필요 |

## ✅ Definition of Done

1. [ ] `구장 선택` 화면에서 모든 구장명이 `XXX CC` 없이 `XXXCC` 형식으로 표시
2. [ ] 새 구장 벌크 임포트 시 정규화 자동 적용 확인
3. [ ] TypeScript 컴파일 오류 없음
4. [ ] `memory.md` 업데이트 완료
