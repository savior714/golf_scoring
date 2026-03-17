# 🗺️ Project Blueprint: 히스토리 보기/수정 후 대시보드 공백 버그 수정

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

히스토리 탭에서 과거 기록 "보기/수정" 후 대시보드 탭으로 돌아오면 아무것도 표시되지 않는 버그를 수정한다.

### 🔍 근본 원인 분석

**직전 커밋 `de048a5`에서 두 가지 변경이 동시에 이루어졌다:**

| 변경 | 내용 | 평가 |
|------|------|------|
| `history.tsx` — `handleViewRound`에서 `setCurrentRoundId` 제거 | 전역 세션 오염 차단 | ✅ **올바른 수정** |
| `golf.service.ts` — `getDashboardDisplayRound` fallback을 `rounds[0]` → `null`로 교체 | "정렬 미보장" 이유로 fallback 제거 | ❌ **과도한 수정 → 신규 버그 유발** |

**결과**: `currentRoundId`가 `null`인 상태(라운딩 미진행 / 완료 후)에서 대시보드가 항상 `EmptyState`를 렌더링하게 됨.

**의도한 동작**:
- `currentRoundId` 존재 → 해당 진행 중 라운드 표시
- `currentRoundId` 없음 → **가장 최근 완료 라운드 표시** (fallback 필요)

**`rounds[0]`이 문제였던 진짜 이유**: `getAllRounds()`가 날짜 정렬을 보장하지 않아 어떤 라운드가 `[0]`인지 불확실했기 때문. 해결책은 fallback을 없애는 게 아니라 **정렬 후 fallback**이다.

---

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: `golf.service.ts` 읽기 — `getDashboardDisplayRound` 현재 상태 확인**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/golf.service.ts`
  - **Goal**: 함수 전체 컨텍스트 및 주변 코드 파악
  - **Dependency**: None

- [ ] **Task 2: `getDashboardDisplayRound` fallback을 정렬 기반으로 복원**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/golf.service.ts`
  - **Goal**: `currentRoundId`가 없을 때 날짜 내림차순 정렬 후 첫 번째 라운드를 반환
  - **Pseudocode**:
    ```ts
    // 기존: return null;
    // 수정: 날짜 내림차순 정렬 후 최신 라운드 반환
    const sorted = [...rounds].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0] ?? null;
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: TypeScript 컴파일 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | tail -20`
  - **Goal**: 타입 오류 없음 확인
  - **Dependency**: Task 2

---

## ⚠️ 기술적 제약 및 규칙

- `getAllRounds()`는 **정렬을 보장하지 않음** — 서비스 레이어에서 직접 정렬할 것
- `history.tsx`의 `handleViewRound` 수정(`setCurrentRoundId` 제거)은 **올바른 수정이므로 건드리지 않음**
- `selectedRoundId` 우선순위(사용자가 명시적으로 선택한 라운드)는 유지

## ✅ Definition of Done

1. [ ] `currentRoundId`가 `null`일 때 대시보드에 가장 최근 라운드가 정상 표시됨
2. [ ] 히스토리 "보기/수정" 후 대시보드 복귀 시에도 정상 표시됨
3. [ ] TypeScript 컴파일 오류 Zero
