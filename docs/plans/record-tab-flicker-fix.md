# 🗺️ Project Blueprint: 기록 수정 탭 진입 시 CourseSelector 깜빡임(Flicker) 제거
> 생성 일시: 2026-03-12 | 상태: Task 1~3 완료

---

## 🎯 Architectural Goal

"기록 수정" 탭을 누를 때 CourseSelector(구장 선택 화면)가 약 100~400ms 동안 잠깐 표시된 후
스코어 입력 화면으로 전환되는 시각적 Flicker를 제거한다.

---

## 🔍 Root Cause Analysis

### 렌더링 흐름 (현재)

```
탭 클릭
  └─ record.tsx 포커스
       └─ 초기 state: activeSession = null, isManualLoading = false
            └─ !activeSession → CourseSelector 즉시 렌더  ← [FLICKER 시작]
                 └─ useFocusEffect 트리거
                      └─ InteractionManager.runAfterInteractions 예약
                           └─ (탭 전환 애니메이션 완료 대기: ~200ms)
                                └─ loadMasterAndSession() 실행
                                     └─ DB 쿼리 + INIT_SESSION dispatch
                                          └─ activeSession 설정
                                               └─ 스코어 화면으로 전환  ← [FLICKER 끝]
```

### 핵심 원인 3가지

1. **`initialState.isManualLoading = false`**: 초기 렌더에서 "아직 로딩 중"임을 모름
   → `activeSession = null`이지만 `isLoadingMaster`도 false이므로 CourseSelector가 바로 표시됨

2. **`InteractionManager.runAfterInteractions` 지연**: 탭 전환 애니메이션이 끝날 때까지
   `loadMasterAndSession`이 실행되지 않음 (~200ms 공백)

3. **`record.tsx` 분기 누락**: `!activeSession` 시 무조건 CourseSelector를 렌더하고,
   "초기화 중인지 / 진짜 세션 없음인지"를 구분하는 로직이 없음

---

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `isManualLoading` 초기값을 `true`로 변경**
  - **Goal**: 앱이 처음 렌더될 때부터 "로딩 중" 상태임을 선언하여,
    데이터가 확인되기 전 CourseSelector 노출을 원천 차단한다.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts` — `initialState` 객체
  - **Implementation**:
    - [ ] `isManualLoading: false` → `isManualLoading: true`로 변경
    - [ ] `RESET_SESSION` 액션에서도 `isManualLoading: true`가 되지 않도록 확인
          (`RESET_SESSION`은 `initialState`로 돌아가므로 같이 true가 됨 → Task 3 참고)
  - **Pseudocode**:
    ```ts
    const initialState: GolfRecordState = {
      // ...
      isManualLoading: true,  // false → true
    };
    ```
  - **Dependency**: None
  - **Verification**: 탭 진입 시 CourseSelector 대신 스피너/빈 화면이 먼저 표시됨

---

- [x] **Task 2: `record.tsx`에 초기화 중 분기 추가**
  - **Goal**: `isLoadingMaster`(= isManualLoading || isLoadingClubs 등)가 true이고
    `activeSession`이 없을 때 CourseSelector 대신 로딩 화면을 렌더한다.
  - **Context**: `app/(tabs)/record.tsx` — CourseSelector 렌더 분기 (`if (!activeSession)`)
  - **Implementation**:
    - [ ] 기존 `if (!activeSession)` 앞에 `if (!activeSession && isLoadingMaster)` 로딩 뷰 분기 삽입
    - [ ] 로딩 뷰: 단순 `ActivityIndicator` (CourseSelector와 동일한 배경색 유지)
  - **Pseudocode**:
    ```tsx
    // CourseSelector 반환 직전에 삽입
    if (!activeSession) {
      if (isLoadingMaster) {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
            <ActivityIndicator size="large" color="#0A2647" />
          </View>
        );
      }
      return <CourseSelector ... />;
    }
    ```
  - **Dependency**: Task 1 (isManualLoading 초기값 변경이 전제)
  - **Verification**: 탭 진입 → 스피너 → 세션 복원 후 스코어 화면 (CourseSelector 깜빡임 없음)

---

- [x] **Task 3: `RESET_SESSION` 시 `isManualLoading` 처리 정교화**
  - **Goal**: `finishRound` 후 탭을 다시 눌렀을 때 CourseSelector가 올바르게 표시되어야 함.
    `RESET_SESSION`이 `initialState`로 돌아가면 `isManualLoading: true`가 되므로,
    `loadMasterAndSession` 완료 후 세션이 없을 때 `false`로 전환되는 흐름을 확인한다.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts` — `loadMasterAndSession` 내 `finally` 블록
  - **Implementation**:
    - [ ] `finally`의 `SET_MANUAL_LOADING: false`가 세션 없음 경우에도 정상 실행되는지 확인
    - [ ] 이미 `finally`에서 `false`로 세팅하므로 현재 코드 그대로 OK
    - [ ] `RESET_SESSION` 리듀서에서 `isManualLoading`을 `true`로 설정하는 것이 의도적인지 주석 추가
  - **Pseudocode**:
    ```ts
    // loadMasterAndSession의 finally 블록 (현재 코드 — 변경 불필요)
    finally {
      dispatch({ type: 'SET_MANUAL_LOADING', payload: false });
      // 세션 있음 → 스코어 화면 / 세션 없음 → CourseSelector
    }
    ```
  - **Dependency**: Task 1, Task 2
  - **Verification**: 라운딩 완료(finishRound) 후 탭 재진입 시 CourseSelector 정상 표시됨

---

- [ ] **Task 4 (Optional): `InteractionManager` 제거 검토**
  - **Goal**: `InteractionManager.runAfterInteractions`가 만들어내는 ~200ms 지연을 없애
    로딩 상태 자체의 체감 시간을 줄인다.
  - **Context**: `app/(tabs)/record.tsx` — `useFocusEffect` 내부
  - **Trade-off 분석**:
    - **제거 시 장점**: 탭 클릭 즉시 DB 쿼리 시작 → 스코어 화면 도달 시간 ~200ms 단축
    - **제거 시 단점**: 탭 전환 애니메이션과 DB 쿼리가 동시에 실행 → 저사양 기기에서 Jank 위험
    - **결론**: Task 1~3으로 Flicker는 해결됨. InteractionManager는 일단 유지 권장.
      추후 실기기 테스트 후 제거 여부 결정.
  - **Dependency**: None (독립적)
  - **Verification**: 탭 전환 애니메이션 부드러움 유지 확인

---

## ⚠️ 기술적 제약 및 규칙

- **최소 수정**: Task 1~3 외 리팩토링 금지.
- **Encoding**: UTF-8 no BOM 고정.
- **Environment**: Windows 11 / Expo Router 환경 보장.
- **Side Effect 주의**: `RESET_SESSION`이 `initialState`를 재사용하므로
  `isManualLoading: true`가 되는 것은 의도된 동작 (finishRound 후 재진입 시 로딩 스피너 표시).

---

## ✅ Definition of Done

1. [ ] 기록 수정 탭 진입 시 CourseSelector(구장 선택 화면)가 표시되지 않고 로딩 스피너가 표시됨.
2. [ ] 세션 복원 완료 후 스코어 화면으로 자연스럽게 전환됨.
3. [ ] 라운딩 완료(finishRound) 후 재진입 시 CourseSelector 정상 표시됨.
4. [ ] 린트 에러 0개.
