# 🗺️ Project Blueprint: 중복 코스 레코드 정리
> 생성 일시: 2026-03-12 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

**같은 구장에 4개의 코스가 중복 등록된 문제를 제거한다.**

### 현재 상태 (DB golf_courses)
| 코스명 | 홀 수 | 유형 | 문제 |
|---|---|---|---|
| Lake Course | 18홀 | 수기 입력 (구버전) | **삭제 대상** |
| Mountain Course | 18홀 | 수기 입력 (구버전) | **삭제 대상** |
| Mountain (OUT) | 9홀 | JSON 임포트 | 유지 |
| Lake (IN) | 9홀 | JSON 임포트 | 유지 |

### 근본 원인
- `registerClub` / `insert_clubs_bulk` RPC는 `onConflict: 'club_id,name'` 기반으로 upsert
- 수기입력 코스명("Lake Course")과 JSON 임포트 코스명("Lake (IN)")이 달라 → 중복 레코드 생성됨
- 결과: 동일 구장에 코스가 4개로 증식

---

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: Supabase SQL로 구버전 코스 직접 삭제** ⭐ 최속 해결
  - **Goal**: "Lake Course"와 "Mountain Course" 레코드를 DB에서 제거한다
  - **Context**: Supabase Dashboard → SQL Editor
  - **Implementation**:
    - [ ] 해당 구장의 `club_id` 확인 쿼리 실행
    - [ ] "Lake Course", "Mountain Course" `course_id` 확인
    - [ ] 해당 course_id를 참조하는 `rounds` 레코드 존재 여부 확인 (out_course_id / in_course_id)
    - [ ] 영향받는 rounds가 없다면 → golf_courses 삭제 (golf_holes cascade)
    - [ ] 영향받는 rounds가 있다면 → rounds 업데이트 후 삭제
  - **Pseudocode**:
    ```sql
    -- 1. 구장 확인
    SELECT id, name FROM golf_clubs WHERE name ILIKE '%청구%';

    -- 2. 코스 확인
    SELECT id, name, hole_count FROM golf_courses WHERE club_id = '<club_id>';

    -- 3. 영향받는 라운드 확인
    SELECT id, out_course_id, in_course_id FROM rounds
    WHERE out_course_id IN ('<old_lake_id>', '<old_mountain_id>')
       OR in_course_id IN ('<old_lake_id>', '<old_mountain_id>');

    -- 4. 코스 삭제 (golf_holes는 ON DELETE CASCADE 전제)
    DELETE FROM golf_courses WHERE id IN ('<old_lake_id>', '<old_mountain_id>');
    ```
  - **Dependency**: None
  - **Verification**: 코스 선택 화면에서 해당 구장 선택 시 2개 코스만 표시됨

---

- [ ] **Task 2: 관리자 화면에 코스 삭제 기능 추가** (재발 시 대응 도구)
  - **Goal**: `admin_import.tsx`에 기존 구장/코스를 조회하고 개별 코스를 삭제할 수 있는 "구장 관리" 탭 추가
  - **Context**: `app/admin_import.tsx`, `src/modules/golf/golf.repository.ts`
  - **Implementation**:
    - [ ] `golf.repository.ts`에 `deleteCourse(courseId: string)` 함수 추가
    - [ ] `admin_import.tsx`에 "구장 관리" 섹션 추가 (기존 JSON Import 탭과 분리)
    - [ ] 구장 목록 → 구장 선택 → 코스 목록 표시 → 각 코스 옆 삭제 버튼
    - [ ] 삭제 전 확인 Modal (해당 코스를 참조하는 라운드 수 표시)
    - [ ] `clubRepository.deleteCourse` 구현 (rounds 참조 여부 체크 → 경고 또는 cascade 처리)
  - **Pseudocode**:
    ```typescript
    // golf.repository.ts 추가
    async deleteCourse(courseId: string): Promise<{ success: boolean; affectedRounds: number; error?: string }> {
      // 1. rounds 참조 확인
      const { count } = await supabase.from('rounds')
        .select('id', { count: 'exact', head: true })
        .or(`out_course_id.eq.${courseId},in_course_id.eq.${courseId}`);
      // 2. 삭제 실행 (cascade: golf_holes)
      const { error } = await supabase.from('golf_courses').delete().eq('id', courseId);
      return { success: !error, affectedRounds: count ?? 0 };
    }
    ```
  - **Dependency**: Task 1 이후에도 남아있을 경우 또는 앞으로의 중복 발생 시 대응
  - **Verification**: 관리자 화면에서 구버전 코스를 앱에서 직접 삭제 가능

---

- [ ] **Task 3: 향후 import 시 중복 방지 로직 개선** (예방)
  - **Goal**: 같은 구장에 코스를 재임포트할 때, 기존 코스명이 달라도 안전하게 병합되도록 경고를 제공한다
  - **Context**: `app/admin_import.tsx` (프리뷰 단계)
  - **Implementation**:
    - [ ] 프리뷰 단계에서 DB에 이미 존재하는 구장인지 확인
    - [ ] 존재한다면 "기존 코스 N개가 있습니다. 코스명 불일치 시 중복 생성될 수 있습니다." 경고 표시
    - [ ] 기존 코스 목록과 임포트할 코스 목록을 나란히 diff 형태로 표시
  - **Dependency**: Task 1 또는 Task 2 완료 후 진행 권장
  - **Verification**: 동일 구장 재임포트 시 중복 경고가 프리뷰 단계에서 명확하게 표시됨

---

## ⚠️ 기술적 제약 및 규칙 (SSOT)
- **Cascade**: `golf_holes`가 `golf_courses.id`를 FK로 참조. Supabase에서 `ON DELETE CASCADE` 설정 여부 확인 필수.
- **Rounds 보호**: 기존 라운드 데이터가 구버전 course_id를 참조하고 있을 경우 절대 무결성 손상 금지.
- **Encoding**: UTF-8 no BOM 고정.
- **Refactoring**: 기능 구현에 필수적이지 않은 리팩토링 금지.

## ✅ Definition of Done
1. [ ] "전반 코스 선택" 화면에서 해당 구장 선택 시 코스가 정확히 2개만 표시됨.
2. [ ] 기존 라운드 기록 데이터 손상 없음.
3. [ ] `memory.md` 변경 사항 반영 완료.
