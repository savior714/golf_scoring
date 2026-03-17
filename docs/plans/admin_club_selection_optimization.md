# 🗺️ Project Blueprint: 구장 관리 검색 및 성능 최적화

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **대량 데이터 처리**: 400개 이상의 구장 리스트를 렉 없이 렌더링할 수 있는 가상화 리스트(`FlatList`) 도입.
- **검색 편의성**: 구장 이름 입력을 통한 실시간 필터링 기능 제공.
- **SSOT**: `ClubSummary` 타입을 유지하며 기저 로직 변경 없이 UI 레이어에서 처리.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `ClubSelectModal.tsx` 리팩토링 및 검색 로직 추가**
  - **Tool**: `Edit`
  - **Target**: `src/modules/admin/components/ClubSelectModal.tsx`
  - **Goal**: 검색 상태(`searchText`) 추가, 필터링 로직 구현, `ScrollView`를 `FlatList`로 교체.
  - **Pseudocode**:
    ```typescript
    const [searchText, setSearchText] = useState('');
    const filteredList = useMemo(() => 
      clubList.filter(c => c.name.includes(searchText)), 
      [clubList, searchText]
    );
    // Render FlatList instead of ScrollView
    ```

- [x] **Task 2: `adminStyles.ts`에 검색바 스타일 추가**
  - **Tool**: `Edit`
  - **Target**: `src/modules/admin/styles/adminStyles.ts`
  - **Goal**: 검색 입력창과 아이콘을 위한 세련된 스타일 정의.
  - **Pseudocode**:
    ```typescript
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', ... },
    searchInput: { flex: 1, padding: 12, ... }
    ```

- [x] **Task 3: 최종 검증 및 린트 체크**
  - **Tool**: `Read`
  - **Goal**: 검색 동작 확인 및 스타일 정렬 상태 점검.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Performance**: `FlatList`의 `getItemLayout`이나 `memo`를 활용하여 불필요한 재렌더링 방지.
- **UX**: 검색창은 `Sticky`하게 상단에 고정하거나 Header와 통합하여 스크롤 시에도 접근 가능하게 함.

## ✅ Definition of Done

1. [x] 구장 이름으로 검색 시 실시간으로 리스트가 필터링됨.
2. [x] `FlatList` 도입으로 스크롤 성능이 부드럽게 유지됨.
3. [x] 검색어가 없을 때 전체 통계(개수 등)가 정확히 표시됨.
