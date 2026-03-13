# 🗺️ Project Blueprint: 스코어카드 공유 이미지 디자인 개선

> 생성 일시: 2026-03-13 10:45 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **대시보드와 공유 이미지의 시각적 일치**: 사용자가 대시보드에서 보는 '깔끔한' 스코어카드 디자인을 공유 이미지에서도 동일하게 유지.
- **SSOT**: `src/modules/golf/components/ScoreCardModal.tsx`의 스타일이 `ViewShot` 및 웹 캡처 영역에 동일하게 적용되도록 구조 개선.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `ScoreCardModal.tsx` 스타일 분석 및 구조 파악**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\ScoreCardModal.tsx`
  - **Goal**: 현재 `scoreCardContainer`와 `ViewShot` 스타일 차이 및 `scoreCardDomRef` 위치 확인.
  - **Dependency**: None

- [x] **Task 2: `ScoreCardModal.tsx` 디자인 동기화 수정**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\ScoreCardModal.tsx`
  - **Goal**: 
    1. `ViewShot`의 인라인 스타일을 `scoreCardContainer` 수준(padding 24, borderRadius 32 등)으로 상향.
    2. 웹 캡처용 `scoreCardDomRef`를 `ViewShot` 바로 아래의 래퍼(모든 레이아웃을 포함하는 영역)로 이동하여 패딩이 포함된 결과물이 생성되도록 수정.
    3. 캡처 시 불필요한 스크롤바나 절단이 발생하지 않도록 레이아웃 최적화.
  - **Pseudocode**: 
    ```tsx
    // ViewShot 스타일을 모달 컨테이너와 일치
    <ViewShot ref={viewShotRef} style={styles.captureArea}>
      <View ref={scoreCardDomRef} style={styles.captureContent}>
        <View style={styles.scoreCardHeader}>...</View>
        <View style={styles.tablesContainer}>
           <ScoreCardTable ... />
           <ScoreCardTable ... />
        </View>
      </View>
    </ViewShot>
    ```
  - **Dependency**: Task 1

- [x] **Task 3: 린트 체크 및 동작 확인**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 구문 오류 확인 및 스타일 변경 후 레이아웃 깨짐 여부 검토.
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **ViewShot vs DOM**: 네이티브는 `ViewShot` 자체의 스타일을 캡처하고, 웹은 `scoreCardDomRef`가 가리키는 요소의 스타일을 캡처하므로 두 영역이 동일한 스타일을 공유해야 함.
- **ScrollView**: `ViewShot`으로 캡처 시 내부가 `ScrollView`면 전체 내용이 캡처되지 않고 현재 보이는 화면만 캡처될 수 있음. 공유용 캡처 영역은 스크롤 없이 전체가 펼쳐진 상태여야 함.

## ✅ Definition of Done

1. [ ] 공유된 이미지의 패딩과 라운드 처리가 대시보드 모달과 동일함.
2. [ ] 웹과 모바일 모두에서 스코어카드 전체 내용(전/후반)이 누락 없이 캡처됨.
3. [ ] `memory.md`에 변경 사항 기록 완료.
