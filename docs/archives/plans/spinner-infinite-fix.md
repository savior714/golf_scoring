# 🗺️ Project Blueprint: 기록 탭 스피너 무한 고착 완전 해결

> 생성 일시: 2026-03-12 03:27 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

이전 세션에서 스피너 재출현 문제를 해결하려다 **스피너가 멈추지 않는 새로운 증상**을 만들었다.
이번 Blueprint의 목표는 **진단 → 원인 확정 → 최소 수정**의 3단계로 스피너 고착을
완전히 해결하고, 더 이상 같은 문제가 반복되지 않는 견고한 구조를 만드는 것이다.

---

## 🔍 현재 상태 분석 (Situation)

### 이전 세션에서 적용한 변경 사항 (모두 현재 코드에 존재)

| 파일 | 변경 내용 | 상태 |
| --- | --- | --- |
| `useGolfRecord.ts` | `staleTime: Infinity` 3개 쿼리에 추가 | 유지됨 |
| `useGolfRecord.ts` | `isLoadingMaster: state.isManualLoading`으로 분리 | 유지됨 |
| `useGolfRecord.ts` | `isLoadingClubs/CurrentId/Rounds`, `isLoadingMaster` 변수 제거 | 유지됨 |
| `useDashboardData.ts` | `refetchType: 'none'` 추가 + `Alert/Platform` import 수정 | 유지됨 |
| `record.tsx` | `useFocusEffect`에 Guard 추가 + `activeSession` 의존성 추가 | **⚠️ 문제 의심** |

### 증상 변화 타임라인

```text
[이전 증상] 리더보드 → 기록 탭 복귀 시 2~3초 후 스피너 재출현 후 사라짐
[현재 증상] 스피너가 멈추지 않음 (무한 고착) -> 아님, 이전 증상과 동일
```

### 가장 유력한 원인 가설 3개

#### 🔴 가설 A — `useFocusEffect` 의존성 루프 (최유력)

```text
1. 탭 복귀 → useFocusEffect 발화 (activeSession = null)
2. Guard 통과 → loadMasterAndSession() 실행
3. loadMasterAndSession 내부 → SET_MANUAL_LOADING(true)
4. loadMasterAndSession 완료 → INIT_SESSION → activeSession 변경(null → object)
5. activeSession 변경 → useCallback 의존성 변경 → useFocusEffect 콜백 재생성
6. useFocusEffect 재발화 → 이번엔 activeSession 있으므로 Guard return
7. BUT: 발화 타이밍에 따라 InteractionManager task가 cancel되지 않으면
        이전 task가 완료되어 loadMasterAndSession 재실행
8. → SET_MANUAL_LOADING(true) 재발행 → 스피너 고착
```

#### 🟡 가설 B — `loadMasterAndSession` 내부 early return 조건 미충족

`useGolfRecord.ts` L179:

```typescript
if (stateRef.current.selectionStep !== 'club' && !currentMode) return;
```

`selectionStep`이 `'club'`이 아닌 상태에서 탭 복귀 시 early return해버리면
`SET_MANUAL_LOADING(true)`는 실행(L182)됐지만 `finally`의 `false` 전환 없이 종료.

→ `isManualLoading`이 영구 `true` 고착.

#### 🟠 가설 C — Guard로 인한 `loadMasterAndSession` 미실행, `isManualLoading=true` 초기값 고착

```text
initialState.isManualLoading = true  (초기값)
↓
컴포넌트 마운트 후 어떤 조건으로 loadMasterAndSession이 한 번도 실행되지 않는 경우
→ isManualLoading이 영구 true 유지
→ 스피너 무한 고착
```

Guard 조건 `activeSession && mode !== 'new'`가 잘못된 타이밍에 평가될 때 발생 가능.

---

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

---

- [x] **Task 1: Logger를 통한 정밀 진단 — 스피너 고착 경로 확정**

  - **Goal**: 코드 수정 없이 로그만 추가하여 어떤 경로로 스피너가 고착되는지 물리적으로 확인.
    가설 A/B/C 중 실제 원인을 실기기 로그로 확정한다.
  - **Context**: `record.tsx` (useFocusEffect 내부) + `useGolfRecord.ts` (loadMasterAndSession 내부)
  - **Implementation**:
    - [ ] `record.tsx` useFocusEffect 진입 시 `activeSession`, `mode` 값 로그 출력
    - [ ] `record.tsx` Guard 분기 결과 로그 출력
    - [ ] `useGolfRecord.ts` `loadMasterAndSession` 진입/early-return/finally 각 지점 로그 출력
    - [ ] `useGolfRecord.ts` `SET_MANUAL_LOADING` dispatch 지점마다 로그 출력
  - **Pseudocode**:

    ```typescript
    // record.tsx useFocusEffect
    useCallback(() => {
      logger.info('[useFocusEffect] fired', { hasSession: !!activeSession, mode });
      if (activeSession && mode !== 'new') {
        logger.info('[useFocusEffect] Guard: SKIPPED');
        return;
      }
      logger.info('[useFocusEffect] Guard: PASS → loadMasterAndSession');
      const task = InteractionManager.runAfterInteractions(() => {
        loadMasterAndSession();
      });
      return () => { logger.info('[useFocusEffect] cleanup: task.cancel'); task.cancel(); };
    }, [loadMasterAndSession, activeSession, mode])

    // useGolfRecord.ts loadMasterAndSession
    const loadMasterAndSession = useCallback(async () => {
      logger.info('[loadMasterAndSession] ENTER', { selectionStep: stateRef.current.selectionStep, mode: modeRef.current });
      const currentMode = modeRef.current;
      if (stateRef.current.selectionStep !== 'club' && !currentMode) {
        logger.warn('[loadMasterAndSession] early return: selectionStep is not club');
        return; // ← finally가 없으므로 isManualLoading=true 고착 가능!
      }
      try {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: true });
        logger.info('[loadMasterAndSession] SET_MANUAL_LOADING: true');
        // ...
      } finally {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: false });
        logger.info('[loadMasterAndSession] SET_MANUAL_LOADING: false');
      }
    }, [queryClient]);
    ```

  - **Dependency**: None (독립 적용 가능, 취약점 확인 후 Task 2~4 선택)
  - **Verification**: 실기기에서 스피너 고착 시 로그 패턴으로 가설 A/B/C 중 하나 확정

---

- [ ] **Task 2: `loadMasterAndSession` early return 버그 수정 (가설 B 해결)**

  - **Goal**: `loadMasterAndSession` 내부의 early return이 `isManualLoading=true` 고착을 유발하지
    않도록, early return 이전에 `isManualLoading=false`를 보장한다.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts` — L177~183
  - **Implementation**:
    - [ ] early return 경로에 `SET_MANUAL_LOADING(false)` 추가
    - [ ] 또는 `finally` 블록을 함수 최상단으로 이동하여 early return도 포함
  - **Pseudocode**:

    ```typescript
    const loadMasterAndSession = useCallback(async () => {
      const currentMode = modeRef.current;
      // ★ 핵심 수정: early return 전에 false 보장
      if (stateRef.current.selectionStep !== 'club' && !currentMode) {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: false }); // 추가
        return;
      }
      try {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: true });
        // ... 기존 로직 ...
      } catch (e: unknown) {
        logger.error("Initialization failed", e);
      } finally {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: false });
      }
    }, [queryClient]);
    ```

  - **Dependency**: Task 1 로그 확인 후 가설 B가 확실할 때 적용
  - **Verification**: 스피너 고착 없이 정상 세션 복원 완료

---

- [ ] **Task 3: `useFocusEffect` 의존성 루프 차단 (가설 A 해결)**

  - **Goal**: `activeSession`을 `useFocusEffect` 의존성 배열에서 제거하여
    콜백 재생성→재발화 루프를 차단한다. 대신 **Stable Ref Pattern**으로 안전하게 접근.
  - **Context**: `app/(tabs)/record.tsx` — L67~75
  - **Implementation**:
    - [ ] `activeSessionRef = useRef(activeSession)` 추가
    - [ ] `useEffect(() => { activeSessionRef.current = activeSession; })` 동기화
    - [ ] `useFocusEffect` 의존성에서 `activeSession` 제거, ref로 Guard 조건 접근
  - **Pseudocode**:

    ```typescript
    // Stable Ref: activeSession이 바뀌어도 useFocusEffect 콜백을 재생성하지 않음
    const activeSessionRef = useRef(activeSession);
    useEffect(() => { activeSessionRef.current = activeSession; });

    useFocusEffect(
      useCallback(() => {
        // ref로 접근 → 의존성 배열에서 제거 가능
        if (activeSessionRef.current && mode !== 'new') return;
        const task = InteractionManager.runAfterInteractions(() => {
          loadMasterAndSession();
        });
        return () => task.cancel();
      }, [loadMasterAndSession, mode]) // activeSession 제거
    );
    ```

  - **Dependency**: Task 1 로그 확인 후 가설 A가 확실할 때 적용 (또는 Task 2와 병행)
  - **Verification**: 탭 전환 N회 반복 후에도 스피너가 재출현 없이 정상 상태 유지

---

- [ ] **Task 4: `initialState.isManualLoading` 초기값 재설계 (가설 C 해결 + 구조 개선)**

  - **Goal**: `isManualLoading`의 초기값이 `true`인 것이 Guard 타이밍 이슈와 결합해
    "loadMasterAndSession이 한 번도 실행 안 되면 영구 스피너" 문제를 만든다.
    초기값을 `false`로 내리고, `loadMasterAndSession` 시작 시점에만 `true`로 올리는
    명시적 구조로 전환한다.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts` — L79
  - **Implementation**:
    - [ ] `initialState.isManualLoading: false`로 변경
    - [ ] `loadMasterAndSession` 진입 직전에 `SET_MANUAL_LOADING(true)` dispatch 이동
    - [ ] `record.tsx`의 스피너 분기 조건 검토 (`isLoadingMaster || !activeSessionLoaded` 등)
  - **Pseudocode**:

    ```typescript
    // initialState
    const initialState: GolfRecordState = {
      // ...
      isManualLoading: false, // 초기값 false → CourseSelector가 먼저 노출
      // ...
    };

    // 별도 Guard: 세션 로딩이 시작되기 전 CourseSelector 노출 차단은
    // `isSessionInitialized` 별도 플래그로 제어
    ```

  - **⚠️ 주의**: 이 변경은 초기 CourseSelector Flicker를 다시 유발할 수 있음.
    반드시 별도 `isSessionInitialized: boolean` 플래그를 추가하여 최초 로딩 완료 여부를 추적해야 함.
  - **Dependency**: Task 2 + Task 3 적용 후 잔재 현상 있을 때 적용 (구조 개선 목적)
  - **Verification**:
    - 앱 최초 진입 시 CourseSelector 노출 없이 스피너 표시
    - 탭 복귀 시 스피너 미출현
    - 긴 시간 앱 방치 후 복귀 시도 모두 정상

---

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **진단 우선**: Task 1 로그 확인 없이 Task 2~4 맹목 적용 금지.
  실기기 로그로 가설을 확정한 후, 해당 Task만 선택 적용.
- **최소 수정**: 목표 직결 부분만 수정. 요청 없는 리팩토링 금지.
- **early return + finally 패턴**: `isManualLoading` 토글이 있는 모든 함수에서
  early return 경로에도 반드시 `false` 전환 보장 (Task 2가 핵심 원칙).
- **Stable Ref Pattern 우선**: useFocusEffect/useEffect 의존성에 state 객체가 2개 이상이면
  반드시 Ref로 추출 (규칙 §9).
- **Encoding**: UTF-8 no BOM 고정.
- **Environment**: Windows 11 / PowerShell 기반 작동 보장.

---

## 🔄 현재 코드의 스피너 제어 흐름 (전체 맵)

```text
initialState.isManualLoading = true (초기값)
  │
  ▼
useFocusEffect 발화
  ├─ Guard: activeSession && mode !== 'new' → return (isManualLoading 현재값 유지)
  └─ Guard 통과 → InteractionManager → loadMasterAndSession()
       ├─ early return: selectionStep !== 'club' && !mode
       │    └─ ⚠️ isManualLoading = true 고착!! (가설 B)
       ├─ try: SET_MANUAL_LOADING(true)
       │    └─ 비동기 작업...
       └─ finally: SET_MANUAL_LOADING(false) → 스피너 해제

activeSession 변경 → useCallback 재생성 → useFocusEffect 재발화 (가설 A)
```

---

## ✅ Definition of Done

1. [ ] 기록 탭 최초 진입 시 정상 스피너 → 세션 복원 → 스코어 화면.
2. [ ] 리더보드 탭 이동 후 기록 탭 복귀 시 스피너 미출현.
3. [ ] N회 탭 반복 전환 후에도 스피너 고착 없음.
4. [ ] `mode=new` 진입 시 스피너 → 새 라운딩 설정 화면 정상 표시.
5. [ ] 린트 에러 0개.
6. [ ] `memory.md` 변경 사항 반영 완료.
