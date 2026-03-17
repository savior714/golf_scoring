# 🗺️ Project Blueprint: 대시보드 Stale 데이터 갱신 버그 수정

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

---

## 🎯 Architectural Goal

히스토리에서 이전 라운딩 수정 후 대시보드로 돌아올 때, **React Query 캐시가 즉시 무효화되지 않아** 이전 구장 기록이 그대로 표시되는 버그를 수정한다.

### 버그 재현 경로
1. 대시보드 진입 (라운드 A 표시)
2. 라운딩 종료 → 저장
3. 히스토리 탭 → "보기/수정" 클릭 (라운드 B 진입)
4. 대시보드 이동 → **라운드 A가 그대로 표시** ❌
5. 타 탭 전환 후 재진입 → 비로소 갱신 ✓

### 근본 원인 요약

| 레이어 | 파일 | 문제 |
|--------|------|------|
| **Navigation** | `app/(tabs)/history.tsx` | "보기/수정" 진입 시 `currentRoundId` 캐시 무효화 누락 |
| **Session Cleanup** | `app/(tabs)/record.tsx` | 히스토리 수정 완료 후 `handleFinish()` — `currentRoundId` 초기화 및 캐시 무효화 누락 |
| **AutoSync** | `src/modules/golf/hooks/useDashboardData.ts` | `autoSync()`에서 `refetchType: 'none'`으로 `currentRoundId` 재읽기 차단 |

- **SSOT 정렬**: `docs/CRITICAL_LOGIC.md` — 히스토리 수정 플로우와 충돌 없음 확인

---

## 🔍 캐시 상태 흐름 (현재 버그)

```
T1 대시보드:   currentRoundId=null  → latestRound=라운드A (메모이징)
T2 히스토리 "수정" 클릭: ❌ 캐시 무효화 없음 → cache 그대로
T3 Record useFocusEffect: setCurrentRoundId(B) ← AsyncStorage만 업데이트, ❌ QueryCache 미반영
T4 라운딩 종료 클릭: handleFinish() → router.push('/(tabs)') — ❌ setCurrentRoundId(null) 미호출
T5 대시보드 포커스: autoSync() → rounds 리페치, currentRoundId는 refetchType:'none' ← ❌ 재읽기 차단
    → useMemo 의존성 [rounds, currentRoundId] 미변경 → latestRound = 라운드A 그대로
```

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출(Read / Edit 중 1개)로 완료되어야 한다.**

---

### 📦 Task 1: `useDashboardData.ts` 읽기 — autoSync 캐시 정책 확인
- **Tool**: `Read`
- **Target**: `src/modules/golf/hooks/useDashboardData.ts`
- **Goal**: `autoSync()` 내 `refetchType: 'none'` 위치 및 전체 구조 파악
- **Dependency**: None

---

### 📦 Task 2: `useDashboardData.ts` — `refetchType` 정책 수정
- **Tool**: `Edit`
- **Target**: `src/modules/golf/hooks/useDashboardData.ts`
- **Goal**: `current_round_id` 캐시 무효화 후 즉시 재읽기 실행
- **Pseudocode**:
  ```typescript
  // Before:
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id(), refetchType: 'none' });

  // After:
  await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
  // refetchType 기본값 = 'active' → 활성 쿼리 즉시 리페치
  ```
- **Dependency**: Task 1

---

### 📦 Task 3: `record.tsx` 읽기 — `handleFinish` 및 `useFocusEffect` 확인
- **Tool**: `Read`
- **Target**: `app/(tabs)/record.tsx`
- **Goal**: `handleFinish()` 콜백 구조, `source === 'history'` 분기 처리 확인
- **Dependency**: None (Task 1과 병렬 가능)

---

### 📦 Task 4: `record.tsx` — 히스토리 수정 완료 후 `currentRoundId` 초기화 추가
- **Tool**: `Edit`
- **Target**: `app/(tabs)/record.tsx`
- **Goal**: 히스토리에서 진입(`source === 'history'`)한 경우 종료 시 `currentRoundId`를 null로 초기화하고 캐시 무효화
- **Pseudocode**:
  ```typescript
  const handleFinish = useCallback(async () => {
    // 히스토리 수정 진입이었다면 currentRoundId 초기화
    if (source === 'history') {
      await roundRepository.setCurrentRoundId(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
    }
    router.push('/(tabs)');
  }, [source, router, queryClient]);
  ```
- **Dependency**: Task 3

---

### 📦 Task 5: `history.tsx` 읽기 — `handleViewRound` 구조 확인
- **Tool**: `Read`
- **Target**: `app/(tabs)/history.tsx`
- **Goal**: "보기/수정" 진입 핸들러 전체 구조 및 queryClient 접근 가능 여부 확인
- **Dependency**: None (Task 1, 3과 병렬 가능)

---

### 📦 Task 6: `history.tsx` — 진입 전 `currentRoundId` 캐시 무효화 추가
- **Tool**: `Edit`
- **Target**: `app/(tabs)/history.tsx`
- **Goal**: "보기/수정" 클릭 시 `current_round_id` 캐시를 즉시 무효화하여 Record 탭 진입 전 캐시 정합성 확보
- **Pseudocode**:
  ```typescript
  const handleViewRound = useCallback((roundId: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
    router.push({ pathname: '/(tabs)/record', params: { source: 'history', mode: 'edit', id: roundId } });
  }, [router, queryClient]);
  ```
- **Dependency**: Task 5

---

### 📦 Task 7: TypeScript 빌드 검증
- **Tool**: `Bash`
- **Command**: `cd c:/develop/golf_scoring && npx tsc --noEmit 2>&1 | Select-Object -Last 30`
- **Goal**: 전체 변경 후 타입 에러 Zero 확인
- **Dependency**: Task 2, 4, 6

---

## ⚠️ 기술적 제약 및 주의 사항

| 항목 | 내용 |
|------|------|
| **staleTime: Infinity** | 해당 설정은 유지 (의도적 설계). 무효화는 명시적 `invalidateQueries`로만 수행 |
| **source 파라미터** | `record.tsx`의 `source` 값이 `'history'`인 경우에만 조건부 초기화 적용 |
| **finishRound()** | `useRoundActions.ts`의 기존 라운딩 종료 로직은 이미 올바름 — 건드리지 않음 |
| **Atomic Change** | Task 2, 4, 6은 각각 독립된 파일 단위로 수정하며 한 번에 하나씩 진행 |

---

## ✅ Definition of Done

1. [ ] 히스토리 → 수정 → 대시보드 진입 시 최신 데이터가 **즉시** 표시됨
2. [ ] 타 탭 전환 없이도 단일 진입으로 갱신 확인
3. [ ] `npx tsc --noEmit` 타입 에러 Zero
4. [ ] 기존 정상 플로우(신규 라운딩 종료 → 대시보드) 동작 이상 없음
