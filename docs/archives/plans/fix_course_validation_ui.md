# 🗺️ Project Blueprint: 구장 관리(관리자) 진입 시 빈 상태에서 유효성 경고 노출 방지

> 생성 일시: 2026-03-12 18:35 | 상태: 완료 (2026-03-12 18:44)

## 🎯 Architectural Goal

- 관리자 구장 관리 화면 진입 시, 사용자가 데이터를 입력하기 전(Pristine State)에는 '코스 데이터 주의' 경고 상자가 노출되지 않도록 개선합니다.
- 사용자가 입력을 시작하거나 '저장' 버튼을 눌렀을 때만 유효성 검사 결과를 노출하여 UX를 개선합니다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: CourseInput 인터페이스 확장 및 초기 상태 관리**
  - **Goal**: 코스의 '수정 여부(isDirty)'를 추적할 수 있는 필드를 추가하거나, 컴포넌체 내부에서 Pristine 상태를 판별하는 로직을 구현합니다.
  - **Context**: `src/modules/admin/components/AdminFormComponents.tsx`
  - **Implementation**:
    - `CourseInput` 인터페이스에 (필요시) `isDirty` 필드 검토.
    - `CourseSection` 내부에 `isPristine` 계산 로직 도입.
  - **Pseudocode**:

    ```typescript
    const isPristine = !course.id && !course.courseName.trim() && 
      course.holes.every(h => Object.values(h.distances).every(d => !d));
    ```

  - **Dependency**: None
  - **Verification**: 코스 추가 시 초기 상태에서 `isPristine`이 `true`로 계산되는지 확인.

- [x] **Task 2: CourseSection 유효성 경고 노출 조건 수정**
  - **Goal**: `isValid`가 `false`이더라도 `isPristine` 상태일 때는 경고 박스를 숨깁니다.
  - **Context**: `src/modules/admin/components/AdminFormComponents.tsx`
  - **Implementation**:
    - `issuesCard` 렌더링 조건에 `!isPristine` 추가.
  - **Pseudocode**:

    ```tsx
    {!isValid && !isPristine && issues.length > 0 && (
        <View style={styles.issuesCard}>...</View>
    )}
    ```

  - **Dependency**: Task 1
  - **Verification**: 탭 진입 시 경고 박스가 보이지 않는지 확인.

- [x] **Task 3: 저장 시도 시 강제 노출 로직 (Optional but Recommended)**
  - **Goal**: 아무것도 입력하지 않고 '저장'을 눌렀을 때는 무엇이 잘못되었는지 알려줘야 합니다.
  - **Context**: `app/(tabs)/admin.tsx`, `src/modules/admin/components/AdminFormComponents.tsx`
  - **Implementation**:
    - `AdminForm`에서 `submitted` 상태를 관리하거나 `forceShowErrors` prop을 `CourseSection`에 전달합니다.
    - 또는 `handleSave` 호출 시 빈 필드에 대해 `Alert`을 띄우는 기존 로직을 강화합니다.
  - **Dependency**: Task 2
  - **Verification**: 빈 상태에서 '저장' 클릭 시 오류 메시지나 경고 알럿이 정상 동작하는지 확인.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Refactoring**: UX 개선을 위한 최소한의 수정만 진행.
- **Environment**: Windows 11 / Expo React Native.

## ✅ Definition of Done

1. [x] 관리자 탭 진입 시 '코스 데이터 주의' 경고 상자가 나타나지 않음.
2. [x] 코스 이름을 입력하거나 홀 정보를 입력하기 시작하면 경고 상자가 (필요시) 나타남.
3. [x] `memory.md`에 개선 내용 기록 완료.
