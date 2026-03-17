# 🗺️ Project Blueprint: 구장 선택 화면 성능 최적화 (Virtualization)

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **대량 데이터 최적화**: 구장 데이터가 수백 개 이상으로 늘어날 경우를 대비하여 `ScrollView`를 `FlatList`로 교체하고 가상화(Virtualization)를 적용함.
- **렌더링 효율성**: 리스트 아이템을 별도 컴포넌트로 분리하고 `React.memo`를 적용하여 검색어 입력 시 발생하는 불필요한 재렌더링을 차단함.
- **SSOT 유지**: 기존 `CourseSelectorProps` 및 데이터 흐름을 유지하며 내부 구현만 성능 중심으로 개선함.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: `CourseSelector.tsx` 구조 분석 및 `FlatList` 전환 준비**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/components/Record/CourseSelector.tsx`
  - **Goal**: 현재 `ScrollView` 내부의 각 단계별(club, out, in, tee) 렌더링 로직 확인.
  - **Dependency**: None

- [x] **Task 2: 리스트 아이템 컴포넌트 분리 및 메모이제이션**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/components/Record/CourseSelector.tsx` (또는 신규 파일)
  - **Goal**: `ClubItem`, `CourseItem`, `TeeItem` 등을 `React.memo`를 적용한 컴포넌트로 분리하여 리렌더링 부하 감소.
  - **Pseudocode**:
    ```typescript
    const ClubItem = React.memo(({ club, onPress }) => (
      <TouchableOpacity style={styles.selectItem} onPress={onPress}>
        <Text style={styles.selectText}>{club.name}</Text>
        <Text style={styles.selectSubText}>{club.courseCount}개 코스</Text>
      </TouchableOpacity>
    ));
    ```

- [x] **Task 3: `ScrollView`를 `FlatList`로 교체**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/components/Record/CourseSelector.tsx`
  - **Goal**: `FlatList` 도입 및 최적화 속성(`initialNumToRender`, `windowSize`, `getItemLayout` 등) 적용.
  - **Pseudocode**:
    ```typescript
    <FlatList
      data={filteredClubs}
      renderItem={({ item }) => <ClubItem club={item} ... />}
      keyExtractor={item => item.id}
      initialNumToRender={15}
      windowSize={5}
      removeClippedSubviews={true}
    />
    ```

- [x] **Task 4: 스타일 최적화 및 레이아웃 유지**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/components/Record/courseSelector.styles.ts`
  - **Goal**: `FlatList` 전환 시 발생할 수 있는 레이아웃 변화(Sticky Header 등) 대응 및 스타일 정렬.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Interaction**: 구장 요청 버튼(찾으시는 구장이 없나요?)은 `ListFooterComponent`로 배치하여 리스트 최하단에 자연스럽게 위치시킴.
- **Filtering**: 기존 `useMemo` 기반의 필터링 로직은 유지하되, 리스트 데이터 교체 시 대기 시간을 최소화함.
- **Consistency**: 단계별 전환(club -> out -> in -> tee) 시 애니메이션이나 UX 흐름이 깨지지 않도록 주의.

## ✅ Definition of Done

1. [ ] 400개 이상의 더미 데이터를 넣었을 때 스크롤이 끊김 없이 부드럽게 동작함.
2. [ ] 검색어 입력 시 리스트 필터링 속도가 UI 스레드 점유 없이 즉각적으로 반응함.
3. [ ] `FlatList` 최적화 옵션이 적용되어 메모리 사용량이 안정적으로 유지됨.
