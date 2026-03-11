# 구장/코스 선택 화면 회귀 및 리렌더링 현상 진단 보고서

## 1. 개요

새 라운딩 시작 시, **구장 선택 -> 전반 코스 선택** 과정에서 화면이 구장 선택 단계로 돌아가거나(Reset), 비정상적으로 깜빡이며 리렌더링되는 현상이 보고되었습니다. 이 현상은 대개 상태 관리와 비동기 로직 간의 **경쟁 상태(Race Condition)** 또는 **컴포넌트 생명주기 관리**의 허점에서 기인합니다.

---

## 2. 발생 가능성 분석 (Possibilities)

### [Case A] 비동기 로직의 Stale Ref 참조 (Race Condition) - **가장 유력**

* **현상**: 사용자가 구장을 클릭하여 단계를 `out`으로 변경했음에도, 동시에 실행 중이던 `loadMasterAndSession` 비동기 함수가 완료된 후 **과거의 상태(`club`)**를 참조하여 `RESET_SESSION`을 호출함.
* **원인**: 현재 `stateRef`를 `useEffect`에서 업데이트하고 있는데, `useEffect`는 렌더링 이후 비동기적으로 실행됩니다. 만약 `loadMasterAndSession` 내의 `await`가 끝나는 시점이 `useEffect`가 실행되기 전이라면, `stateRef.current.selectionStep`은 여전히 `'club'`인 상태로 체크되어 세션이 리셋됩니다.
* **영향**: 단계가 `'club'`으로 초기화되어 구장 선택 화면으로 돌아감.

### [Case B] `isLoadingMaster` 상태에 의한 컴포넌트 Unmount/Remount

* **현상**: 선택 과정 중 `loadMasterAndSession`이 재호출되면서 `isLoadingMaster`가 `true`가 됨.
* **원인**: `CourseSelector` 컴포넌트 로직상 `isLoadingMaster`가 `true`일 때 스피너를 보여주고 기존 UI(버튼들)를 화면에서 제거합니다.
* **영향**: UI가 언마운트되었다가 다시 마운트되면서 스크롤 위치가 초기화되거나, 진행 중이던 인터랙션이 끊기고 깜빡임(Glitch)으로 느껴짐.

### [Case C] `useFocusEffect` 및 Dependency 불안정

* **현상**: 구장/코스 선택 중 화면이 "리포커스"된 것으로 간주되어 `loadMasterAndSession`이 중복 호출됨.
* **원인**: `record.tsx`의 `useFocusEffect`가 `loadMasterAndSession`을 의존성으로 갖는데, `loadMasterAndSession`은 `mode` 파라미터에 의존합니다. 만약 Router의 파라미터가 미세하게 변경되거나 `useLocalSearchParams`가 새 객체를 반환하면 의존성 체인이 깨져 효과가 재실행될 수 있습니다.
* **영향**: 의도치 않은 데이터 로딩 및 상태 초기화 로직 실행.

### [Case D] Reducer `INIT_SESSION` 로직의 논리적 허점

* **현상**: 세션 초기화 시 현재 단계(`selectionStep`)를 유지하는 조건문이 특정 상황에서 `club`으로 강제 설정됨.
* **원인**: `useGolfRecord.ts` 114라인의 `selectionStep` 결정 로직이 복잡하여, `activeSession`이 null임에도 불구하고 특정 조건에서 초기값으로 회귀할 가능성이 있음.

---

## 3. 단계별 해결 전략 (Proposed Solutions)

### **Step 1: State Ref 업데이트의 동기화 (Critical)**

* **변경**: 렌더링 바디에서 직접 `stateRef.current = state`를 수행하여 **렌더링과 동시에 Ref를 동기화**합니다. 이를 통해 비동기 함수의 continuation이 항상 최신 렌더링 상태를 즉시 읽을 수 있게 합니다.

### **Step 2: `loadMasterAndSession` 실행 조건 강화 (Guard)**

* **기존**: 포커스 시 무조건 실행.
* **변경**: 이미 `isLoadingMaster`가 `true`이거나, `activeSession`이 로드된 상태 또는 선택이 한참 진행 중(`selectionStep !== 'club'`)인 경우 불필요한 재로딩을 방지하는 Guard Clause를 추가합니다.

### **Step 3: 로딩 중 UI 보존 (Soft Loading)**

* **기존**: 로딩 중 전체 UI를 스피너로 교체.
* **변경**: 구장 목록이 이미 존재한다면 스피너 대신 Overlay 형태의 로딩을 사용하거나, `CourseSelector` 내부에서 목록을 유지한 채 로딩 상태를 표시하여 **컴포넌트 언마운트를 방지**합니다.

### **Step 4: Reducer 로직 단순화**

* **변경**: `INIT_SESSION` 시 세션이 없는 경우 `selectionStep`을 건드리지 않도록 명확히 분리하고, 강제 리셋은 오직 `RESET_SESSION` 액션을 통해서만 발생하도록 엄격하게 제어합니다.

---

## 4. 실행 계획 (Action Plan)

1. **[검증]** `stateRef` 업데이트 방식을 동기 방식으로 수정하여 Race Condition 제거.
2. **[최적화]** `loadMasterAndSession` 내부에 중복 실행 방지 플래그 적용.
3. **[UI 개선]** `CourseSelector`에서 로딩 시 UI가 통째로 사라지지 않도록 구조 변경.
4. **[테스트]** Android/iOS 환경에서 선택 단계별 탭 전환 및 연속 클릭 테스트 수행.
