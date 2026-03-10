# Phase 5: 시스템 안정화 및 고도화 계획 (2026-03-10)


## 1. 최근 변경 사항 검토 (Post Phase 4 Review)
- **성과**: useReducer를 통한 원자적 상태 관리 도입으로 20개 이상의 흩어져 있던 상태를 하나로 결합 완료. UI와 로직의 분리(SoC) 수준이 크게 향상됨.
- **현황**: golf.repository.ts에 오프라인 큐(Queue)가 도입되어 동기화 실패 시 자동 재시도 기큐 확보.


## 2. 발견된 문제점 및 개선 포인트 (Current Issues)


### A. 상태 업데이트 로직의 부적절함 (useGolfRecord.ts)
- **[Critical]** setSelectedTee 함수가 단순히 티(Tee) 색상만 바꾸는 것이 아니라 세션 전체를 초기화하는 INIT_SESSION 액션을 오용하고 있음. 이로 인해 불필요한 전체 리렌더링과 잠재적인 데이터 덮어쓰기 위험이 존재함.
- **[Magic Strings]** '없음', 'White', 'Black' 등의 문자열이 코드 곳곳에 하드코딩되어 있어 유지보수가 어려움.


### B. 동기화 경합 및 데이터 무결성 (golf.repository.ts)
- **[Race Condition]** syncRoundToSupabase가 비동기로 동작하지만, 사용자가 빠르게 홀을 넘길 경우 이전 요청이 끝나기 전에 새로운 요청이 발생하여 데이터 순서가 뒤섞일 가능성이 있음. (동일 ID에 대한 Lock 기전 부족)


### C. UI/UX 정밀도 부족
- **[Hardcoded Value]** saveCurrentHole 시 isFairway: true가 상수로 박혀 있음. 페어웨이 안착 여부 선택 로직이 누락됨.
- **[Error Feedback]** Alert.alert를 사용한 에러 노출은 사용자 경험을 저해함. 세련된 토스트(Toast) 시스템 필요.


## 3. 단계별 실행 계획 (Action Plan)


### Step 1: 아키텍처 기초 정비 (Foundations)
- src/modules/golf/golf.constants.ts 생성하여 테마 컬러, 티 색상, 미스샷 패턴 상수화.
- useGolfRecord.ts 리듀서에 SET_TEE_COLOR 전용 액션 추가.


### Step 2: 동기화 엔진 강화 (Hardening)
- golf.repository.ts 내 syncRoundToSupabase에 **Round ID별 비동기 Lock** 도입.
- 동기화 상태(syncStatus)를 UI 상단 바에 시각화하여 사용자에게 신뢰감 제공.


### Step 3: UI 기능 완성 (UX Completion) - [DONE]
- 페어웨이 안착(Fairway Hit) 토글 기능 추가.
- ny 타입 제거 및 CombinedPars를 통한 파생 데이터 연산 최적화.
- functional update를 지원하는 세터(Setter) 구현으로 타입 안정성 확보.
