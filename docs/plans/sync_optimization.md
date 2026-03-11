# 🗺️ Project Blueprint: 데이터 동기화 최적화 및 렉 제거 (Sync Optimization)

> 생성 일시: 2026-03-12 00:30 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **탭 전환 시 발생하는 Jank(버벅임) 제거**: `useFocusEffect`에서 매번 실행되는 무거운 동기화 로직의 실행 빈도를 제한(Throttling)한다.
- **불필요한 알림 차단**: 자동 동기화 시 발생하는 "데이터 동기화 완료" 토스트를 제거하거나, 데이터가 실제로 변경된 경우에만 1회성으로 표시한다.
- **백그라운드 동기화 침묵**: 네트워크 재시도 및 자동 동기화는 사용자 흐름을 방해하지 않도록 'Silent' 모드로 수행한다.

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다. 우선순위에 따라 원하는 항목을 선택하여 진행을 요청하세요.

### 📦 Task List

- [x] **Task 1: [Logic] Sync Throttling & Last Exec Time Check**
  - **Goal**: 동일 세션 내에서 너무 빈번한 `pullRoundsFromSupabase` 호출을 차단.
  - **Context**: `src/modules/golf/golf.repository.ts`, `src/modules/golf/hooks/useDashboardData.ts`
  - **Implementation**:
    - [ ] `roundRepository` 내부 또는 `useDashboardData`에 `lastPullTime` 상태 관리.
    - [ ] 최근 30분 이내에 성공적으로 pull이 수행되었다면 자동 호출 스킵.
  - **Pseudocode**: `if (Date.now() - lastPullTime < 30 * 60 * 1000) return;`
  - **Dependency**: None
  - **Verification**: 탭을 빠르게 왔다갔다 해도 네트워크 탭에서 Supabase 요청이 반복되지 않음을 확인.

- [x] **Task 2: [UI] Silent Auto-Sync Refinement**
  - **Goal**: 사용자 모르게 수행되는 동기화는 알림을 생략하고, 수동 조작(새로고침 등) 시에만 피드백 제공.
  - **Context**: `app/_layout.tsx`, `src/modules/golf/hooks/useDashboardData.ts`
  - **Implementation**:
    - [ ] `_layout.tsx`의 `SIGNED_IN` 이벤트 핸들러에서 표시되는 토스트를 **최초 1회** 또는 **데이터 수 변화가 있을 때만** 노출하도록 수정.
    - [ ] `useDashboardData`의 `autoSync`에서 `isSyncing` 상태는 유지하되 토스트는 띄우지 않음.
  - **Dependency**: Task 1
  - **Verification**: 탭 전환 시 "데이터 동기화 완료" 메시지가 더 이상 반복되지 않음.

- [x] **Task 3: [UX] useFocusEffect 초기화 로직 격리**
  - **Goal**: `RecordScreen` 진입 시 이미 유효한 세션이 있다면 무거운 동기화 로직(`retryPendingSyncs`)을 비활성화.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts`
  - **Implementation**:
    - [ ] `loadMasterAndSession` 내의 `roundRepository.retryPendingSyncs()` 호출을 `AppState` 이벤트 핸들러로 완전히 위임하여 화면 전환 부하 제거.
    - [ ] 세션 복원이 필요한 경우에만 핵심 I/O 수행.
  - **Dependency**: None
  - **Verification**: `RecordScreen` 진입 시 `InteractionManager`와 함께 작동하여 로딩 스피너 노출 없이 부드럽게 진입 가능한지 확인.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Strict Silent**: 백그라운드에서 주기적으로 일어나는 동기화는 사용자에게 시각적으로 노출되지 않아야 함.
- **Performance**: I/O 바운드 작업은 최소화하며, React Query의 캐시를 최우선으로 신뢰함.

## ✅ Definition of Done

1. [ ] 탭 전환 시 "데이터 동기화 완료" 토스트가 반복적으로 발생하지 않음.
2. [ ] 탭 전환 직후의 stuttering(멈춤 현상)이 육안으로 체감되지 않을 정도로 개선됨.
3. [ ] `memory.md`에 "동기화 Throttling 및 Silent 모드 적용" 기록.
