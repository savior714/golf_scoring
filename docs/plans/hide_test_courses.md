# 🗺️ Project Blueprint: 구장 선택 화면에서 미검증/더미 구장 숨김 처리

> 생성 일시: 2026-03-12 11:45 | 상태: 설계 승인 완료 (Task 1 적용됨)

## 🎯 Architectural Goal

- 사용자가 라운딩 시작을 위해 구장을 선택하는 화면(`CourseSelector`)에서, **DB의 `is_verified` 플래그가 `false`인 구장(테스트용 더미 데이터 등)을 목록에서 제외**하여 데이터 신뢰성과 사용자 편의성을 높입니다.
- **관리자 화면(Admin)**에서는 데이터 정비를 위해 여전히 모든 구장(미검증 포함)을 확인하고 수정할 수 있는 상태를 유지합니다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `CourseSelector` 컴포넌트 필터링 로직 수정**
  - **Goal**: 데이터 원본인 `clubs` 배열에서 `isVerified`가 `true`인 항목만 필터링하여 사용자에게 노출.
  - **Context**: `file:///c:/develop/golf_scoring/src/modules/golf/components/Record/CourseSelector.tsx`
  - **Implementation**:
    - [x] `filteredClubs`를 생성하는 `useMemo` 블록(L38-42) 수정.
    - [x] `clubs.filter(club => club.isVerified === true)`를 기본 베이스로 사용하도록 변경.
  - **Pseudocode**:

    ```typescript
    const filteredClubs = useMemo(() => {
      const baseClubs = clubs.filter(club => club.isVerified === true); // 검증된 구장만 추출
      const normalized = searchQuery.trim().toLowerCase();
      if (!normalized) return baseClubs;
      return baseClubs.filter((club) => club.name.toLowerCase().includes(normalized));
    }, [clubs, searchQuery]);
    ```

  - **Dependency**: None
  - **Verification**:
    - 앱의 '기록 시작(Record)' 단계에서 구장 목록을 확인하여 "테스트 컨트리클럽 001" 등이 사라졌는지 확인. (완료)
    - 검색 기능을 통해 실제 구장(검증된 구장)은 정상적으로 검색되는지 확인. (완료)

- [x] **Task 2: 관리자 화면(Admin) 노출 정합성 검증**
  - **Goal**: 관리자 도구에서는 미검증 구장을 계속 수정할 수 있는지 물리적으로 확인.
  - **Context**: `file:///c:/develop/golf_scoring/app/(tabs)/admin.tsx`
  - **Implementation**:
    - [x] 관리자 화면의 '기존 구장 불러오기' 모달이 `clubRepository.getAllClubsSummary()` 결과를 그대로 사용하는지 확인 (별도 수정 불필요).
  - **Dependency**: Task 1
  - **Verification**:
    - 관리자 탭 진입 -> '기존 구장 불러오기' 클릭 -> 목록 하단의 미검증 구장들이 여전히 존재하는지 확인. (완료)

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Surgical Changes**: `CourseSelector`의 UI 컴포넌트 구조나 스타일을 변경하지 않고, 비즈니스 필터링 로직만 정밀 수정합니다.
- **Logic Consistency**: `isVerified` 플래그는 `golf_clubs` 테이블의 `is_verified` 컬럼과 매핑되어 있으며, 관리자 화면에서 데이터 입력 완결 시 자동으로 `true`로 설정되는 구조를 존중합니다.

## ✅ Definition of Done

1. [x] `CourseSelector.tsx`에서 미검증 구장 필터링 로직이 구현됨.
2. [x] 실제 사용 환경에서 더미 구장이 노출되지 않음을 확인.
3. [x] 관리자 환경에서는 모든 구장 데이터에 접근 가능함을 확인.
4. [x] `docs/memory.md`에 필터링 정책 변경 사항 기록.
