# 🗺️ Project Blueprint: 기록 탭 과다 리렌더링 제거
> 생성 일시: 2026-03-12 | 상태: ✅ 구현 완료 (2026-03-12)

## 🎯 Architectural Goal

**기록 탭 진입 시 불필요한 화면 깜빡임/재마운트를 제거한다.**

### 특정된 Root Cause 3가지

| # | 원인 | 파일 | 영향 |
|---|---|---|---|
| A | `RecordTabButton`이 `TabLayout` 내부에서 정의됨 → 매 렌더마다 새 컴포넌트 참조 생성 | `_layout.tsx` | 탭 버튼 재마운트 → 전체 탭 flicker |
| B | `loadMasterAndSession`의 `useCallback` 의존성에 `mode` URL 파라미터 포함 → URL 변경마다 함수 재생성 → `useFocusEffect` 재등록 → 화면 재실행 | `useGolfRecord.ts` | 탭 포커스 시마다 상태 초기화 플래시 |
| C | `RecordTabButton`이 `router.push` 사용 → history stack 누적 → 중복 navigation 이벤트 | `_layout.tsx` | 예상치 못한 뒤로가기 동작, 중복 렌더 |

---

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `RecordTabButton`을 파일 스코프로 이동 + `tabBarButton` prop 안정화**
  - **Goal**: `TabLayout` 리렌더 시 `RecordTabButton` 참조가 바뀌지 않도록 한다
  - **Context**: `app/(tabs)/_layout.tsx`
  - **Implementation**:
    - [ ] `RecordTabButton`을 `TabLayout` 함수 **바깥(파일 최상단)**으로 이동
    - [ ] `hasActiveRound: boolean`, `onNavigate: () => void` 를 props로 주입
    - [ ] `TabLayout` 내에서 `onNavigate`를 `useCallback`으로 메모이제이션
    - [ ] `tabBarButton`을 `useMemo`로 고정하여 참조 안정성 보장
  - **Pseudocode**:
    ```typescript
    // 파일 최상단 (TabLayout 밖)
    interface RecordTabButtonProps extends BottomTabBarButtonProps {
      hasActiveRound: boolean;
      onNavigate: () => void;
    }
    function RecordTabButton({ hasActiveRound, onNavigate, ...props }: RecordTabButtonProps) {
      return <TouchableOpacity {...(props as TouchableOpacityProps)} onPress={onNavigate} />;
    }

    // TabLayout 내부
    const handleRecordTabPress = useCallback(() => {
      if (currentRoundId) {
        router.replace({ pathname: '/(tabs)/record', params: { mode: 'edit' } });
      } else {
        router.replace({ pathname: '/(tabs)/record', params: { mode: 'new', t: Date.now().toString() } });
      }
    }, [currentRoundId, router]);

    const recordTabButton = useMemo(
      () => (props: BottomTabBarButtonProps) =>
        <RecordTabButton {...props} hasActiveRound={!!currentRoundId} onNavigate={handleRecordTabPress} />,
      [currentRoundId, handleRecordTabPress]
    );
    // tabBarButton: recordTabButton
    ```
  - **Dependency**: None
  - **Verification**: 다른 탭 왔다갔다 해도 기록 탭 버튼이 flicker 없이 안정적으로 유지됨

---

- [x] **Task 2: `loadMasterAndSession`의 `mode` 의존성을 Ref로 대체**
  - **Goal**: URL params(`mode`)가 변경되어도 `loadMasterAndSession`이 재생성되지 않게 한다
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts`
  - **Implementation**:
    - [ ] `mode` prop을 `modeRef`에 저장하는 패턴 적용 (CLAUDE.md Stable Ref Pattern)
    - [ ] `loadMasterAndSession`의 `useCallback` 의존성 배열에서 `mode` 제거
    - [ ] 함수 본문에서 `mode` → `modeRef.current`로 교체
  - **Pseudocode**:
    ```typescript
    const modeRef = useRef(mode);
    useEffect(() => { modeRef.current = mode; });

    const loadMasterAndSession = useCallback(async () => {
      const currentMode = modeRef.current;
      if (stateRef.current.selectionStep !== 'club' && !currentMode) return;
      ...
      if (savedId && currentMode !== 'new') { ... }
      else {
        if (stateRef.current.selectionStep === 'club' || currentMode) {
          dispatch({ type: 'RESET_SESSION' });
        }
      }
    }, [queryClient]); // mode 제거 → queryClient만 남음
    ```
  - **Dependency**: None (Task 1과 독립적)
  - **Verification**: `mode=edit`로 진입 후 다른 탭 갔다 돌아와도 `loadMasterAndSession`이 재실행되지 않음 (or 실행되어도 상태 변화 없음)

---

- [x] **Task 3: `router.push` → `router.replace`로 교체**
  - **Goal**: 탭 전환 시 navigation history stack이 쌓이지 않게 한다
  - **Context**: `app/(tabs)/_layout.tsx` (Task 1의 `handleRecordTabPress` 내부)
  - **Implementation**:
    - [ ] `router.push` → `router.replace` 변경
  - **Pseudocode**:
    ```typescript
    // push: stack에 추가 (뒤로가기 시 이전 탭으로 돌아감 — 의도치 않은 동작)
    // replace: 현재 stack entry를 교체 (탭 네이티브 동작과 일치)
    router.replace({ pathname: '/(tabs)/record', params: { mode: 'edit' } });
    ```
  - **Dependency**: Task 1 (handleRecordTabPress와 같은 위치)
  - **Verification**: 기록 탭 여러 번 눌러도 뒤로가기 버튼이 생기지 않음

---

## ⚠️ 기술적 제약 및 규칙 (SSOT)
- **MEMORY.md 패턴 준수**: `tabBarButton` prop은 런타임에 참조가 바뀌면 Navigator 재마운트 발생 → 반드시 안정적인 참조로 고정.
- **Stable Ref Pattern**: CLAUDE.md §9 — 의존성 배열에 state/prop 2개 이상 시 Ref로 대체.
- **Refactoring 금지**: 리렌더링 수정 외 로직 변경 금지.
- **Encoding**: UTF-8 no BOM 고정.

## ✅ Definition of Done
1. [x] 탭 전환 시 기록 화면 flicker/재마운트 없음.
2. [x] `mode=edit` 진입 후 다른 탭 갔다가 돌아와도 세션 유지됨.
3. [x] navigation history stack이 탭 전환으로 오염되지 않음.
4. [x] `memory.md` 변경 사항 반영 완료.
