# 🗺️ Project Blueprint: 코스명 suffix 언어 일관성 수정

> 생성 일시: 2026-03-15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

### 문제 정의

1단계 정규화 후에도 영문 label에 한글 "코스"가 붙는 혼용 현상이 잔존:

| 표시 결과 | 원인 |
|---|---|
| `Lake 코스` | label="Lake"(라틴) + suffix="코스"(한글) 무조건 결합 |
| `Mountain 코스` | 동일 |
| `홍단풍 코스` | label="홍단풍"(한글) + suffix="코스" → 자연스러움 ✅ |
| `전반 코스` | label="전반"(한글) + suffix="코스" → 자연스러움 ✅ |

### 해결 목표

`parseCourseDisplayName()`의 반환 타입에 **`suffixType`을 추가**하여,
렌더링 시 언어 계열에 따라 suffix를 자동 분기.

### 목표 결과물 (Before → After)

| Before | After |
|---|---|
| `Lake 코스` | **Lake Course** |
| `Mountain 코스` | **Mountain Course** |
| `홍단풍 코스` | **홍단풍 코스** (변경 없음) |
| `전반 코스` | **전반 코스** (변경 없음) |

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료되어야 한다.**

### 📦 Task List

- [ ] **Task 1: `golf.constants.ts` — `parseCourseDisplayName()` suffix 분기 추가**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/golf.constants.ts`
  - **Goal**: label의 언어 계열을 판별하여 `suffix: 'Course' | '코스'` 필드를 반환타입에 추가
  - **Pseudocode**:
    ```ts
    // 반환 타입 확장
    type CourseDisplayParts = {
      label: string;
      direction: 'OUT' | 'IN' | null;
      suffix: 'Course' | '코스';   // 추가
    };

    // label 언어 판별 (라틴 문자만으로 구성된 경우 → 'Course')
    const isLatinLabel = /^[A-Za-z\s]+$/.test(label);
    const suffix = isLatinLabel ? 'Course' : '코스';

    return { label, direction, suffix };
    ```
  - **Dependency**: None

- [ ] **Task 2: `CourseSelector.tsx` — suffix 필드 렌더링 적용**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/components/Record/CourseSelector.tsx`
  - **Goal**: `{label} 코스` 하드코딩 → `{label} {suffix}` 로 교체
  - **Pseudocode**:
    ```tsx
    // 기존
    const { label, direction } = parseCourseDisplayName(course.name);
    <Text>{label} 코스</Text>

    // 변경 후
    const { label, direction, suffix } = parseCourseDisplayName(course.name);
    <Text>{label} {suffix}</Text>
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: TypeScript 컴파일 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | tail -20`
  - **Goal**: 타입 오류 Zero 확인
  - **Dependency**: Task 2

---

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM 고정
- **Pure Function**: `parseCourseDisplayName`의 순수 함수 속성 유지 (side-effect 없음)
- **SSOT**: suffix 판별 로직은 `golf.constants.ts` 한 곳에만 존재
- **판별 기준**: `/^[A-Za-z\s]+$/` — 공백 포함 순수 라틴 문자열만 `'Course'` 적용. 숫자·한글 혼용은 `'코스'` 유지

## ✅ Definition of Done

1. [ ] 영문 코스명(`Lake`, `Mountain`)에 `Course` suffix 적용됨
2. [ ] 한글 코스명(`홍단풍`, `전반`)에 `코스` suffix 유지됨
3. [ ] `tsc --noEmit` 오류 Zero
4. [ ] DB 데이터 및 기타 로직 무영향
