# 🗺️ Project Blueprint: 히스토리 보기/수정 후 라운딩 종료 시 다른 코스 기록 노출 버그 수정

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

---

## 🔍 버그 재현 흐름 (Root Cause Analysis)

### 증상
히스토리에서 여러 기록을 "보기/수정"으로 열어놓은 뒤, 대시보드에서 "라운딩 종료"를 누르면
해당 기록이 종료되는 대신 **다른 코스의 기록이 대시보드에 등장**한다.

### 원인 추적 (3단계 연쇄 버그)

```
[1단계] history.tsx > handleViewRound()
    → roundRepository.setCurrentRoundId(roundId) 호출
    → 여러 기록을 연속으로 열면 currentRoundId가 마지막에 연 기록 ID로 덮어씌워짐

[2단계] index.tsx > isRoundComplete
    const isRoundComplete = latestRound.holes.length === 18 && latestRound.id === currentRoundId
    → 18홀 완료된 '과거 기록'이 currentRoundId와 일치하므로 true
    → 과거 기록에 "라운딩 종료" 버튼이 노출됨 (의도치 않은 활성화)

[3단계] handleFinishRound() 실행 후
    → setCurrentRoundId(null) 호출
    → getDashboardDisplayRound(rounds, null, undefined) 호출
    → selectedId도 없고 currentId도 null이므로 fallback: return rounds[0] 실행
    → rounds[0] = getAllRounds()의 첫 번째 요소 (정렬 미보장, '다른 코스')가 대시보드에 등장
```

### 핵심 결함 파일

| 파일 | 위치 | 결함 내용 |
|------|------|-----------|
| `src/modules/golf/golf.service.ts` | `getDashboardDisplayRound` L232 | `return rounds[0]` → currentId=null 시 엉뚱한 라운드 노출 |
| `app/(tabs)/history.tsx` | `handleViewRound` L181-185 | 읽기 전용 조회 목적임에도 `setCurrentRoundId`를 호출해 전역 활성 세션 오염 |

---

## 🎯 Architectural Goal

- **1차 수정 (필수)**: `getDashboardDisplayRound`의 `return rounds[0]` fallback을 `return null`로 변경
  → currentRoundId가 null이면 대시보드가 EmptyState를 표시하도록 보장
- **2차 수정 (근본 원인)**: `handleViewRound`가 `setCurrentRoundId`를 호출하지 않도록 변경
  → 히스토리 "보기/수정"은 읽기 전용 세션이므로 전역 활성 라운드를 오염시켜선 안 됨
  → record 탭의 URL param `id`가 이미 라운드 특정에 사용되므로 setCurrentRoundId 불필요

- **SSOT**: `docs/CRITICAL_LOGIC.md`와의 정렬 여부 확인 필요

---

## 🛠️ Step-by-Step Execution Plan

> 각 Task는 단 하나의 도구 호출로 완료되어야 한다.

### 📦 Task List

- [ ] **Task 1: golf.service.ts 읽기 — getDashboardDisplayRound 전체 컨텍스트 파악**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/golf.service.ts`
  - **Goal**: `getDashboardDisplayRound` 함수 전후 컨텍스트 및 다른 호출자 확인
  - **Dependency**: None

- [ ] **Task 2: golf.service.ts 수정 — fallback return rounds[0] → return null**
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/golf.service.ts`
  - **Goal**: `getDashboardDisplayRound`에서 currentId=null/undefined이고 selectedId도 없을 때 `null`을 반환하여 EmptyState가 정상 표시되도록 수정
  - **Pseudocode**:
    ```typescript
    // Before:
    return rounds[0]; // Fallback to latest  ← 제거

    // After:
    return null; // 활성 세션 없으면 EmptyState 표시
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: history.tsx 수정 — handleViewRound에서 setCurrentRoundId 호출 제거**
  - **Tool**: `Edit`
  - **Target**: `app/(tabs)/history.tsx`
  - **Goal**: 히스토리 "보기/수정"이 전역 currentRoundId를 오염시키지 않도록 수정
    record 탭은 URL param `id`로 라운드를 특정하므로 setCurrentRoundId 불필요
  - **Pseudocode**:
    ```typescript
    // Before:
    const handleViewRound = useCallback(async (roundId: string) => {
        await roundRepository.setCurrentRoundId(roundId);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
        router.push({ pathname: '/(tabs)/record', params: { source: 'history', mode: 'edit', id: roundId } });
    }, [queryClient, router]);

    // After:
    const handleViewRound = useCallback((roundId: string) => {
        router.push({ pathname: '/(tabs)/record', params: { source: 'history', mode: 'edit', id: roundId } });
    }, [router]);
    ```
  - **Dependency**: Task 2

- [ ] **Task 4: record.tsx / useGolfRecord 확인 — id param만으로 세션 로딩이 가능한지 검증**
  - **Tool**: `Read`
  - **Target**: `app/(tabs)/record.tsx` 및 관련 훅
  - **Goal**: Task 3 적용 시 record 탭이 URL param `id`만으로 올바르게 기록을 로딩하는지 확인
    (현재 `setCurrentRoundId` 없이도 동작하는지 검증)
  - **Dependency**: Task 3

- [ ] **Task 5: TypeScript 타입 검사**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | Select-Object -Last 30`
  - **Goal**: 변경 사항으로 인한 타입 오류 없음 확인
  - **Dependency**: Task 4

---

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM 고정
- `getDashboardDisplayRound`의 반환 타입 `GolfRound | null`은 이미 null 허용이므로 타입 변경 불필요
- `handleViewRound`에서 `setCurrentRoundId` 제거 시, record 탭이 URL param `id` 로만 동작하는지 반드시 Task 4에서 검증 후 Task 3을 확정할 것

---

## ✅ Definition of Done

1. [ ] 히스토리 "보기/수정" 여러 번 클릭 → 대시보드 "라운딩 종료" → EmptyState 표시 (다른 코스 기록 미노출)
2. [ ] 신규 라운드 진행 중 대시보드 → 정상적으로 현재 라운드 표시
3. [ ] 히스토리 "보기/수정" → record 탭에서 정상적으로 해당 기록 표시
4. [ ] TypeScript 오류 없음
