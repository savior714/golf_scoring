# 🗺️ Project Blueprint: 히스토리 탭 핸디캡 가시성 개선 및 안내 상세화

> 생성 일시: 2026-03-17 14:20 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **사용자 경험 개선**: 핸디캡 측정이 보이지 않는다는 피드백을 반영하여, 측정 조건 미달 시 구체적인 상태(남은 경기 수 등)를 안내함.
- **가시성 확보**: 히스토리 탭 및 대시보드에서 핸디캡 배너가 사용자에게 명확히 노출되도록 보장함.
- **SSOT 정렬**: `docs/CRITICAL_LOGIC.md`의 핸디캡 계산 정책(최소 5경기)을 유지하되, UI 피드백을 강화함.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: `HandicapBanner.tsx` 구성 요소 기능 확장**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\Dashboard\HandicapBanner.tsx`
  - **Goal**: `roundsCount` prop을 추가하고, 5경기 미만 시 "N경기 더 기록하면 확인 가능" 메시지 표시.
  - **Pseudocode**:
    ```tsx
    interface HandicapBannerProps {
      value: number | null;
      roundsCount: number;
    }
    // ...
    if (value === null) {
      const needed = 5 - roundsCount;
      const message = roundsCount === 0 
        ? "최소 5경기의 기록이 필요합니다" 
        : `${needed}경기 더 기록하면 핸디캡 측정이 가능해요`;
      // ... UI 표시
    }
    ```
  - **Dependency**: None

- [ ] **Task 2: `app/(tabs)/history.tsx`에서 Prop 전달 및 확인**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\history.tsx`
  - **Goal**: `HandicapBanner`에 `roundsCount={rounds?.length || 0}` 전달.
  - **Dependency**: Task 1

- [ ] **Task 3: `useDashboardData.ts` 훅 수정**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\hooks\useDashboardData.ts`
  - **Goal**: 대시보드에서 `roundsCount`를 반환하도록 수정 (이미 내부적으로 rounds를 관리 중이므로 노출만 하면 됨).
  - **Dependency**: Task 2

- [ ] **Task 4: `app/(tabs)/index.tsx` (Dashboard) 동기화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\index.tsx`
  - **Goal**: 대시보드에서도 동일하게 `roundsCount`를 전달하여 일관된 유저 경험 제공.
  - **Dependency**: Task 3

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **최소 경기 수**: `docs/CRITICAL_LOGIC.md`에 정의된 '최소 5경기' 기준을 엄격히 준수함.
- **데이터 일관성**: 대시보드와 히스토리 탭의 안내 문구가 동일해야 함.

## ✅ Definition of Done

1. [ ] 5경기 미만 시 "N경기 더 기록 시 측정 가능" 메시지가 정확히 노출됨.
2. [ ] 5경기 이상 시 기존처럼 핸디캡 수치가 정상적으로 표시됨.
3. [ ] 히스토리 탭 최상단에서 배너가 명확히 보임.
4. [ ] `memory.md`에 개선 사항 기록 완료.

[BLUEPRINT CHECKLIST]
- [ ] Task 1: HandicapBanner.tsx 확장
- [ ] Task 2: history.tsx 업데이트
- [ ] Task 3: useDashboardData.ts 업데이트
- [ ] Task 4: index.tsx 업데이트
