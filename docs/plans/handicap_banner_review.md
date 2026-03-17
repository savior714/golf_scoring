# 🗺️ Project Blueprint: HandicapBanner 중복성 검토 및 제거

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

사용자 질문의 핵심: "MY HANDICAP 배너"와 "최근 5경기 Avg" 값이 같은 로직인가?

### 결론: **다른 로직이지만 배너 제거가 타당**

| 항목 | 계산 방식 | 현재 표시 상황 |
|------|---------|--------------|
| **MY HANDICAP** | 최근 20경기 중 상위 25% 차분 평균 × 0.96 (USGA) | 5경기 미만 → "N경기 더 기록하면" 안내만 표시 |
| **최근 5경기 Avg** | 최근 5경기 totalScore 단순 평균 | 항상 표시 (경기 수 무관) |

**배너 제거가 타당한 근거:**
1. **5경기 미만일 때** (현재 상태): "N경기 더 기록하면 핸디캡 측정이 가능해요" — 정보 밀도 0, 화면 공간만 차지
2. **5경기 이상일 때**: USGA 핸디캡 지수를 보여주나, 골프 앱 특성상 일반 사용자에게 핸디캡 지수(예: 24.5)보다 단순 평균 스코어(예: 102)가 더 직관적
3. **히스토리 탭에서도 동일**: `history.tsx`에서도 `HandicapBanner`를 `ListHeaderComponent`로 사용 중 — 동일하게 제거 가능

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료되어야 한다.**

### 📦 Task List

- [x] **Task 1: 대시보드에서 HandicapBanner 제거 확인 — useDashboardData 읽기**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/hooks/useDashboardData.ts`
  - **Goal**: `estimatedHandicap` 반환값이 다른 곳에서 사용되는지 확인 (제거 시 사이드이펙트 파악)
  - **Dependency**: None

- [x] **Task 2: 대시보드 화면에서 HandicapBanner 제거**
  - **Tool**: `Edit`
  - **Target**: `app/(tabs)/index.tsx` (또는 dashboard 화면 파일)
  - **Goal**: `<HandicapBanner />` 렌더링 코드 제거
  - **Pseudocode**:
    ```tsx
    // 제거 대상
    <HandicapBanner value={estimatedHandicap} roundsCount={rounds?.length ?? 0} />
    // → 해당 라인 삭제, import도 제거
    ```
  - **Dependency**: Task 1

- [x] **Task 3: 히스토리 탭에서 HandicapBanner 제거**
  - **Tool**: `Edit`
  - **Target**: `app/(tabs)/history.tsx`
  - **Goal**: `ListHeaderComponent`에서 `HandicapBanner` 제거, `estimatedHandicap` useMemo 제거
  - **Pseudocode**:
    ```tsx
    // 제거 대상 (라인 133-136)
    const estimatedHandicap = useMemo(() => { ... }, [rounds]);
    // 제거 대상 (라인 268-272)
    ListHeaderComponent={<HandicapBanner value={estimatedHandicap} roundsCount={...} />}
    ```
  - **Dependency**: Task 2

- [x] **Task 4: HandicapBanner 컴포넌트 파일 삭제 또는 보존 결정**
  - **Tool**: `Bash`
  - **Command**: `grep -r "HandicapBanner" c:/develop/golf_scoring/src c:/develop/golf_scoring/app --include="*.tsx" --include="*.ts" -l`
  - **Goal**: 다른 곳에서 HandicapBanner를 사용하는지 최종 확인 후, 미사용 시 파일 삭제
  - **Dependency**: Task 3

- [x] **Task 5: useDashboardData에서 estimatedHandicap 제거**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/hooks/useDashboardData.ts`
  - **Goal**: 미사용 `estimatedHandicap` useMemo 및 return 필드 정리
  - **Dependency**: Task 4

- [x] **Task 6: 타입 체크로 사이드이펙트 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | Select-Object -Last 30`
  - **Goal**: 제거 후 타입 에러 없음 확인
  - **Dependency**: Task 5

## ⚠️ 기술적 제약 및 고려사항

- **golf.service.ts의 `estimateHandicap()`**: 배너를 제거해도 함수 자체는 유지 (향후 필요 시 재활용)
- **히스토리 탭 `ListHeaderComponent`**: 제거 후 null 또는 다른 헤더로 교체 여부 결정 필요
- **SSOT**: `docs/CRITICAL_LOGIC.md`에 핸디캡 로직 명시되어 있으면 업데이트 필요

## ✅ Definition of Done

1. [x] 대시보드와 히스토리 탭에서 `HandicapBanner` UI가 완전히 제거됨
2. [x] 제거 후 타입 에러 없음 (`npx tsc --noEmit` 통과)
3. [x] 미사용 import 및 useMemo 정리 완료
