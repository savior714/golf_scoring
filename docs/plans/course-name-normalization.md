# 🗺️ Project Blueprint: 코스명 표시 통일 (Course Name Display Normalization)

> 생성 일시: 2026-03-15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

### 문제 정의
`CourseSelector.tsx`가 `course.name`을 **DB 원본 그대로** 렌더링하여, 아래 4가지 비일관적 패턴이 사용자에게 노출됨:

| DB 원본 값 | 구장 예시 | 패턴 유형 |
|---|---|---|
| `Lake Course` | 아리스타CC | 영문명 + 영문 "Course" suffix |
| `섬진코스` | 광주CC | 한글명 + "코스" 붙여쓰기 |
| `홍단풍 (OUT)` | 내장산CC | 한글명 + `(OUT)`/`(IN)` 괄호 |
| `OUT` / `IN` | 안성CC | 방향(OUT/IN)만 단독 표기 |

### 해결 목표
- **표시 레이어(Display Layer)**에서 모든 패턴을 단일 포맷으로 정규화
- DB 데이터 변경 없이 순수 프론트엔드 수정으로 해결
- OUT/IN 방향 정보는 **별도 뱃지(Badge)**로 시각적 분리

### 목표 결과물 (Before → After)

| Before | After (표시) |
|---|---|
| `Lake Course` | **Lake 코스** |
| `Mountain Course` | **Mountain 코스** |
| `섬진코스` | **섬진 코스** |
| `설산코스` | **설산 코스** |
| `홍단풍 (OUT)` | **홍단풍 코스** + `[OUT]` 뱃지 |
| `청단풍 (IN)` | **청단풍 코스** + `[IN]` 뱃지 |
| `OUT` | **전반 코스** + `[OUT]` 뱃지 |
| `IN` | **후반 코스** + `[IN]` 뱃지 |

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료되어야 한다.**

### 📦 Task List

- [ ] **Task 1: `CourseSelector.tsx` 현재 구조 파악**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/components/Record/CourseSelector.tsx`
  - **Goal**: 렌더링 구조, `course.name` 사용 위치, 현재 스타일 확인
  - **Dependency**: None

- [ ] **Task 2: `golf.constants.ts`에 `parseCourseDisplayName()` 유틸 함수 추가**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/golf.constants.ts`
  - **Goal**: 정규화 로직을 단일 Pure Function으로 캡슐화 (SSOT)
  - **Pseudocode**:
    ```ts
    // 반환 타입
    type CourseDisplayParts = { label: string; direction: 'OUT' | 'IN' | null };

    function parseCourseDisplayName(raw: string): CourseDisplayParts {
      // 1. (OUT) / (IN) 괄호 추출
      const dirMatch = raw.match(/\((OUT|IN)\)/i);
      const direction = dirMatch ? dirMatch[1].toUpperCase() as 'OUT' | 'IN' : null;

      // 2. 순수 방향 문자열 처리 ("OUT" / "IN" 단독)
      if (/^(OUT|IN)$/i.test(raw.trim())) {
        return { label: direction === 'OUT' ? '전반' : '후반', direction };
      }

      // 3. suffix 제거: " Course", "코스", "(OUT)", "(IN)", 앞뒤 공백
      const label = raw
        .replace(/\s*\((OUT|IN)\)/gi, '')
        .replace(/\s+Course$/i, '')
        .replace(/코스$/, '')
        .trim();

      return { label, direction };
    }
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: `courseSelector.styles.ts`에 방향 뱃지 스타일 추가**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/components/Record/courseSelector.styles.ts`
  - **Goal**: `directionBadge`, `directionBadgeText` 스타일 추가
  - **Pseudocode**:
    ```ts
    directionBadge: {
      backgroundColor: '#4A6FA5',  // 앱 테마 파란색 계열
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    directionBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    ```
  - **Dependency**: Task 1

- [ ] **Task 4: `CourseSelector.tsx`에 정규화 표시 적용**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/components/Record/CourseSelector.tsx`
  - **Goal**: `{course.name}` → `parseCourseDisplayName()` 결과로 교체, 방향 뱃지 렌더링
  - **Pseudocode**:
    ```tsx
    // 기존
    <Text style={styles.selectText}>{course.name}</Text>

    // 변경 후
    const { label, direction } = parseCourseDisplayName(course.name);
    <View style={styles.courseNameRow}>
      <Text style={styles.selectText}>{label} 코스</Text>
      {direction && (
        <View style={styles.directionBadge}>
          <Text style={styles.directionBadgeText}>{direction}</Text>
        </View>
      )}
    </View>
    ```
  - **Dependency**: Task 2, Task 3

- [ ] **Task 5: TypeScript 컴파일 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | tail -20`
  - **Goal**: 타입 오류 Zero 확인
  - **Dependency**: Task 4

---

## 🔀 대안 검토 (Alternatives Considered)

| 접근법 | 장점 | 단점 | 채택 여부 |
|---|---|---|---|
| **A. 표시 레이어 정규화** (채택) | DB 무변경, 롤백 쉬움 | 원본 데이터 불일치 잔존 | ✅ 채택 |
| B. DB 데이터 정규화 | 근본 해결 | 마이그레이션 필요, 기존 기록 영향 | ❌ 리스크 큼 |
| C. Edge Function import 시 정규화 | 신규 데이터만 통일 | 기존 수백 구장 데이터 미해결 | ⏩ 추후 보완 |

> **B + C 병행 전략**: 표시 레이어 정규화(즉시)로 UX를 먼저 개선하고,
> 향후 Edge Function에 `normalizeCourseDisplayName` 로직을 추가하여 신규 임포트 데이터도 정리한다.

---

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM 고정
- **Pure Function**: `parseCourseDisplayName`은 side-effect 없는 순수 함수로 작성
- **SSOT**: 정규화 로직은 `golf.constants.ts` 한 곳에만 정의 (중복 금지)
- **ScoreCardModal.tsx 영향 없음**: `courseType` 필드(`전반-후반` 하이픈 포맷)는 별도 경로이므로 이번 범위 외

## ✅ Definition of Done

1. [ ] 4가지 패턴 모두 통일된 포맷으로 표시됨
2. [ ] OUT/IN 방향 정보가 뱃지로 명확히 구분됨
3. [ ] `tsc --noEmit` 타입 오류 Zero
4. [ ] 기존 DB 데이터 및 ScoreCard 로직에 영향 없음
