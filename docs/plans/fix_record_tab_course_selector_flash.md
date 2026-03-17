# 🗺️ Project Blueprint: Record 탭 진입 시 CourseSelector 노출 버그 수정

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

대시보드에서 진행 중인 라운드 스코어가 표시된 상태에서 Record 탭(스코어 입력/기록 수정)으로
전환 시, **세션 복원 로딩 중에도 CourseSelector(새 구장 선택 화면)가 노출**되는 UX 버그를 수정한다.

- **SSOT**: `docs/CRITICAL_LOGIC.md`와의 정렬 여부 확인 필요

---

## 🔍 근본 원인 분석 (Root Cause Analysis)

### 버그 발생 흐름

```
1. 대시보드 → record 탭 포커스
2. useFocusEffect 실행 → loadMasterAndSession() 호출 (비동기)
3. 로딩 중: activeSession = null, isLoadingMaster = true
4. record.tsx:171 조건: !activeSession → true → 조건 분기 진입
5. record.tsx:174 조건: isLoadingMaster && activeSession !== null
                         = true              && false            = false ← 항상 false!
6. → CourseSelector 렌더링 (로딩 스피너 대신)
7. 로딩 완료 후 세션 복원 → RecordMainContent로 전환
```

### 버그 코드 위치

**파일**: [record.tsx:171-190](../../app/(tabs)/record.tsx#L171-L190)

```typescript
// 현재 (버그):
if (!activeSession) {
  return (
    <View ...>
      {isLoadingMaster && activeSession !== null  // ← 이 블록 안에서 activeSession은 항상 null
        ? <ActivityIndicator />                   //   → 이 조건은 항상 false → 스피너 절대 표시 안 됨
        : <CourseSelector ... />                  //   → 항상 CourseSelector 표시
      }
    </View>
  );
}
```

### 원인 요약

| 원인 | 위치 | 설명 |
|------|------|------|
| **로딩 스피너 조건 오류** | `record.tsx:174` | `isLoadingMaster && activeSession !== null` — `!activeSession` 블록 내부이므로 `activeSession !== null`은 항상 `false` |
| **결과** | `record.tsx:179` | 로딩 중에도 `CourseSelector`가 즉시 렌더링됨 |

---

## 🛠️ Step-by-Step Execution Plan

> 단 **1개의 Edit**으로 수정 가능한 단순 버그입니다.

### 📦 Task List

- [ ] **Task 1: record.tsx 읽기 — 수정 대상 라인 최종 확인**
  - **Tool**: `Read`
  - **Target**: `app/(tabs)/record.tsx`
  - **Goal**: 170-191번 라인 코드 확인 및 주변 컨텍스트 파악
  - **Dependency**: None

- [ ] **Task 2: record.tsx 로딩 스피너 조건 수정**
  - **Tool**: `Edit`
  - **Target**: `app/(tabs)/record.tsx`
  - **Goal**: `!activeSession` 분기 내 로딩 스피너 조건에서 잘못된 `activeSession !== null` 제거
  - **Pseudocode**:
    ```typescript
    // Before (버그):
    {isLoadingMaster && activeSession !== null ? <ActivityIndicator /> : <CourseSelector />}

    // After (수정):
    {isLoadingMaster ? <ActivityIndicator /> : <CourseSelector />}
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: 타입 체크 검증**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | Select-Object -Last 20`
  - **Goal**: 변경 후 타입 오류 없음 확인
  - **Dependency**: Task 2

---

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM 고정.
- **최소 수정 원칙**: 단 한 줄의 조건 변경으로 수정 완료. 불필요한 리팩토링 금지.
- **Side Effect**: `isLoadingMaster`가 `true`인 동안 스피너가 표시되다가, 로딩 완료 후
  - `activeSession` 있음 → RecordMainContent (정상 동작)
  - `activeSession` 없음 → CourseSelector (정상: 신규 라운드 시작 시)

---

## 🔄 보조 관찰 사항 (즉시 수정 필요 없음)

`_layout.tsx:63-65` — `handleRecordTabPress`가 빈 함수:
```typescript
const handleRecordTabPress = useCallback((_e: unknown) => {
  // 의도적으로 비움: record.tsx의 useFocusEffect에서 처리
}, []);
```
- 현재 `record.tsx`의 `useFocusEffect` → DB 재조회(`getCurrentRoundId`) → 세션 복원 흐름이 올바르게 설계됨
- 단, Task 2 수정 후에도 **DB 조회 지연(~수백ms)** 동안 스피너가 보이는 것은 정상 UX임
- `currentRoundId`를 파라미터로 명시 전달하는 최적화는 별도 이슈로 트래킹 가능

---

## ✅ Definition of Done

1. [ ] record 탭 전환 시 세션 로딩 중에는 스피너가 표시됨.
2. [ ] 세션 복원 완료 후 RecordMainContent가 즉시 표시됨.
3. [ ] 진행 중인 라운드가 없을 때만 CourseSelector가 표시됨.
4. [ ] `npx tsc --noEmit` 통과 (타입 오류 없음).
