# Project Code Review & Improvement Plan

이 문서는 **golf_scoring** 프로젝트의 현재 코드 베이스를 분석하고, 시니어 아키텍트 관점에서 제안하는 개선 방향과 단계별 실행 계획을 담고 있습니다.

---

## 1. 종합 진단 (Architectural Overview)

현재 프로젝트는 **DDD(Domain Driven Design)**의 흔적이 있으나, 기능이 확장됨에 따라 **UI 계층에 비즈니스 로직이 과도하게 집중(Massive View Controller)**되는 경향을 보이고 있습니다.

### 주요 문제점 (Crucial Findings)
- [x] **Phase 1: 구조적 리팩토링 (컴포넌트 추출)**
  - `app/(tabs)/index.tsx`의 거대 컴포넌트를 `Dashboard` 하위 컴포넌트로 분리
  - `app/(tabs)/record.tsx`의 코스 선택 및 입력 UI를 `Record` 하위 컴포넌트로 분리
  - `src/modules/golf/components` 구조 확립
*   **Logic Leakage**: 세션 시작/종료, 점수 계산 로직 등이 ecord.tsx 내부 useEffect와 함수들에 흩어져 있어 재사용성과 테스트가 어렵습니다.
*   **Type Weakness**: Supabase 쿼리 결과나 로컬 스토리지 JSON 파싱 시 ny 타입 사용이나 명시적 타입 캐스팅이 부족한 구간이 존재합니다.
*   **Redundant States**: ecord.tsx에서 20개 이상의 useState를 개별적으로 관리하고 있어 상태 전이 추적이 어렵습니다.

---

## 2. 계층별 개선 포인트 (Layered Improvements)

### [UI Layer] 프레젠테이션 분리
*   **분리 대상**: 대시보드의 StatItem, 점수판 테이블, 공유 모달 등을 별도 컴포넌트로 추출하여 src/shared/components 또는 src/modules/golf/components로 이동.
*   **전략**: **Atomic Design** 패턴을 참고하여 최소 단위 컴포넌트부터 재구성.

### [Service Layer] 도메인 로직 중심화
*   **이동 대상**: saveCurrentHole, utoSync, 	hree-putt detection 등을 golf.service.ts로 이전.
*   **도입**: 비즈니스 워크플로우를 처리하는 **Unit of Work** 패턴 적용 고려.

### [Data Layer] 저장소 최적화
*   **동기화 엔진**: 현재 .then().catch() 기반의 임시방편적 동기화를 React Query Mutations 또는 전용 SyncService로 고도화하여 네트워크 불안정 상황 대응.
*   **타입 안정성**: Supabase CLI를 통한 **Schema Type Generation** 도입 권장.

---

## 3. 단계별 개선 로드맵 (Step-by-Step Roadmap)

### **1단계: 구조적 정제 (Structural Refactoring)**
*   **목표**: 비대한 컴포넌트 쪼개기 및 공통 컴포넌트 추출.
*   **작업**:
    *   StatItem 등 작은 UI 조각들을 모듈화.
    *   ecord.tsx의 코스 선택 로직을 별도 컴포넌트로 분리.

### **2단계: 커스텀 훅 도입 (Logic Abstraction)**
*   **목표**: UI 파일의 줄 수를 50% 이상 감축하고 로직 재사용성 확보.
*   **작업**:
    *   useGolfRecord: 점수 입력 및 캐싱 로직 담당.
    *   useGolfSync: Supabase 동기화 및 상태 관리 담당.
    *   useGolfSession: 라운딩 시작/재개/종료 워크플로우 담당.

### **3단계: 상태 관리 최적화 (State Orchestration)**
*   **목표**: useState의 늪에서 탈출하여 안정적인 데이터 흐름 구축.
*   **작업**:
    *   필요 시 useReducer 또는 Zustand 도입 검토.
    *   React Query의 Select 옵션을 적극 활용하여 데이터 가공 로직 최소화.

### **4단계: 고도화 및 안정성 (Hardening)**
*   **목표**: 예외 처리 강화 및 오프라인 지원 완벽화.
*   **작업**:
    *   Centralized Error Boundary 및 Toast 알림 시스템 구축.
    *   오프라인 시 기록된 데이터를 큐에 쌓고 온라인 시 자동 업로드하는 메커니즘 강화.

---

> [!IMPORTANT]
> **가장 시급한 조치는 pp/(tabs)/index.tsx와 ecord.tsx에서 비즈니스 로직을 추출하여 Service 레이어와 Custom Hook으로 옮기는 것입니다.** 이를 통해 코드의 가독성과 유지보수성을 즉각적으로 향상시킬 수 있습니다.

**위 계획에 따라 1단계부터 차례대로 진행하시겠습니까?**