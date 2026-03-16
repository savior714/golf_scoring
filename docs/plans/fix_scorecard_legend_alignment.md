# 🗺️ Project Blueprint: 스코어카드 범례 아이콘 정렬 불일치 수정

> 생성 일시: 2026-03-16 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

스마트폰에서 이글/더블보기 아이콘(이중 원·이중 사각형)의 내부 도형이 중앙에서 벗어나 몰려 보이는 문제를 수정한다.

- **SSOT**: `docs/CRITICAL_LOGIC.md` 와 충돌 없음 (UI 스타일 전용 변경)

---

## 🔍 근본 원인 분석 (Root Cause)

### 문제 구조

```
ScoreCardLegend.tsx
  └─ <View style={[symbolCircle, symbolDouble]}>   ← 이글 외부 원
       └─ <View style={symbolCircleInner} />        ← 이글 내부 원 (문제)

  └─ <View style={[symbolSquare, symbolDouble]}>   ← 더블보기 외부 사각형
       └─ <View style={symbolSquareInner} />        ← 더블보기 내부 사각형 (문제)
```

### 핵심 원인: `position: 'absolute'` + 하드코딩 오프셋

| 스타일 키 | 현재 값 | 문제점 |
|---|---|---|
| `symbolCircleInner` | `position: 'absolute', top: 1, left: 1` | 픽셀 고정 오프셋 → 기기 DPR에 따라 어긋남 |
| `symbolSquareInner` | `position: 'absolute', top: 2, left: 2` | 동일 문제 |
| `symbolCircle` | `justifyContent/alignItems` 없음 | flex 중앙 정렬 선언 없이 absolute에만 의존 |
| `symbolSquare` | `justifyContent/alignItems` 없음 | 동일 문제 |
| `symbolDouble` | `justifyContent: 'center', alignItems: 'center'` | absolute 자식은 flex 중앙 정렬을 **무시**함 |

### PC vs 스마트폰 차이가 나는 이유

- **PC 웹 브라우저**: CSS 엔진이 `absolute` 요소를 렌더링할 때 서브픽셀 보간을 적용 → `top:1, left:1`이 "우연히" 중앙처럼 보임
- **스마트폰 (React Native / Yoga)**: Yoga 레이아웃 엔진은 정수 픽셀 단위로 처리, DPR(2x/3x)에 따라 오프셋이 실제 물리 픽셀로 환산되면서 중앙을 벗어남

### 올바른 해결 방향

`position: 'absolute'`를 제거하고 **부모에 flex 중앙 정렬**을 선언하면,
자식 View는 flex 흐름에 따라 어느 기기에서도 정확히 가운데 배치된다.

```
Before: absolute + top/left 오프셋 → 기기 의존적
After:  부모 justifyContent/alignItems center → 플랫폼 무관 정확한 중앙
```

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ 각 Task는 단 하나의 도구 호출로 완료되어야 한다.

### 📦 Task List

- [ ] **Task 1: `ScoreCardModal.styles.ts` 읽기 — 현재 스타일 구조 재확인**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/styles/ScoreCardModal.styles.ts`
  - **Goal**: `symbolCircle`, `symbolCircleInner`, `symbolSquare`, `symbolSquareInner`, `symbolDouble` 5개 스타일 최신 상태 확인
  - **Dependency**: None

- [ ] **Task 2: `ScoreCardModal.styles.ts` 스타일 수정 — absolute 제거 및 flex 중앙 정렬 적용**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/styles/ScoreCardModal.styles.ts`
  - **Goal**: 내부 도형이 부모 중앙에 정확히 위치하도록 레이아웃 방식 교체
  - **Pseudocode**:
    ```ts
    // Before
    symbolCircle:      { width:14, height:14, borderRadius:7, borderWidth:1, ... }
    symbolCircleInner: { position:'absolute', top:1, left:1, width:10, height:10, ... }
    symbolSquare:      { width:14, height:14, borderWidth:1, ... }
    symbolSquareInner: { position:'absolute', top:2, left:2, width:8, height:8, ... }

    // After
    symbolCircle:      { width:14, height:14, borderRadius:7, borderWidth:1, ...,
                         justifyContent:'center', alignItems:'center' }
    symbolCircleInner: { width:10, height:10, borderRadius:5, borderWidth:1, ... }
                       // position/top/left 제거
    symbolSquare:      { width:14, height:14, borderWidth:1, ...,
                         justifyContent:'center', alignItems:'center' }
    symbolSquareInner: { width:8, height:8, borderWidth:1, ... }
                       // position/top/left 제거
    // symbolDouble은 불필요해지므로 제거 검토 (ScoreCardLegend.tsx 참조 확인 후)
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: `ScoreCardLegend.tsx` 확인 — `symbolDouble` 참조 제거**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/components/ScoreCardLegend.tsx`
  - **Goal**: `[styles.symbolCircle, styles.symbolDouble]` → `styles.symbolCircle` 단일 스타일로 단순화 (symbolDouble 불필요)
  - **Dependency**: Task 2

- [ ] **Task 4: `ScoreCardTable.tsx` 동일 패턴 확인 및 수정**
  - **Tool**: `Read` → `Edit`
  - **Target**: `src/shared/components/ScoreCardTable.tsx`
  - **Goal**: 동일한 `position: absolute` 패턴이 있는 `scoreCircleInner` / `scoreSquareInner` 도 동일하게 수정
  - **Dependency**: Task 2

- [ ] **Task 5: TypeScript 타입 검증**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | Select-Object -Last 20`
  - **Goal**: 스타일 변경 후 타입 에러 없음 확인
  - **Dependency**: Task 3, 4

---

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM 고정
- `symbolDouble` 스타일 클래스 삭제 시 `ScoreCardTable.tsx`에도 동일 참조가 있을 수 있으므로 Task 4에서 반드시 검토
- `ScoreCardTable.tsx` 의 `scoreCircleInner` / `scoreSquareInner` 는 크기가 달라 별도 확인 필요

## ✅ Definition of Done

1. [ ] 이글(이중 원), 더블보기(이중 사각형) 내부 도형이 부모 중앙에 정렬됨
2. [ ] PC와 스마트폰에서 동일하게 표시됨
3. [ ] TypeScript 컴파일 에러 없음
