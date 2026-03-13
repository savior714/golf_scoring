# 🗺️ Project Blueprint: Navigation UI Inconsistency Fix

> 생성 일시: 2026-03-13 10:30 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **일관성 확보**: 하단 탭 바 라벨(tabBarLabel)과 상단 헤더 타이틀(headerTitle) 간의 텍스트 불일치를 해소.
- **동적 라벨 안정화**: `Record` 탭의 라벨 변경 시 발생하는 인지적 혼란 및 로딩 중 플리커링 방지.
- **SSOT 정렬**: 네비게이션 옵션을 정의부(`_layout.tsx`)로 최대한 모으고, 각 화면에서의 중복 정의(`Stack.Screen`) 제거.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `app/(tabs)/_layout.tsx` - 네비게이션 라벨 및 타이틀 통합 정의**
  - **Tool**: `Replace`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\_layout.tsx`
  - **Goal**: 하단 탭 라벨과 상단 헤더 타이틀을 통일하고, `recordTabLabel` 로딩 상태 대응.
  - **Pseudocode**:
    ```tsx
    const recordTabLabel = isLoadingRound ? '확인 중...' : (currentRoundId ? '기록 수정' : '스코어 입력');
    // Screen options options={{ title: '대시보드' }} 등으로 통일
    ```

- [x] **Task 2: 각 탭 화면에서 중복/불일치하는 `Stack.Screen` 제거**
  - **Tool**: `Replace`
  - **Target**: `app/(tabs)/index.tsx`, `app/(tabs)/history.tsx`, `app/(tabs)/admin.tsx`
  - **Goal**: 화면 내에 하드코딩된 `title`을 제거하여 `_layout.tsx`의 정의를 따르도록 함 (단, 헤더 버튼 로직은 유지).
  - **Dependency**: Task 1

- [x] **Task 3: `Record` 탭 헤더 노출 여부 검토 및 상단 여백 조정**
  - **Tool**: `Edit`
  - **Target**: `app/(tabs)/record.tsx`, `src/modules/golf/components/Record/CourseSelector.tsx`
  - **Goal**: `headerShown: false`를 유지(커스텀 헤더 정보량이 많아 유지 결정)하고, 상단 `SafeAreaInsets`를 적용하여 여백 보정. 중복 `Stack.Screen` 제거.
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Navigation Logic**: Expo Router의 `Tabs.Screen` 옵션이 SSOT(Single Source of Truth)가 되어야 함.
- **User Rule 7**: UI 컴포넌트 변경 후 즉시 상태 동기화 확인.

## ✅ Definition of Done

1. [ ] 탭을 이동해도 하단 라벨과 상단 타이틀이 동일하게 유지됨.
2. [ ] `Record` 탭 진입 시 로딩 중 라벨이 튀는 현상(Flicker)이 제어됨.
3. [ ] 모든 탭에서 네비게이션 옵션이 `_layout.tsx`로 중앙 정렬됨.
