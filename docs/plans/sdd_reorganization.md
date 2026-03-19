# 🗺️ Project Blueprint: SDD Architecture Reorganization (Golf Module)

> 생성 일시: 2026-03-19 01:45 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **SDD (Spec-Driven Design) 기반 개편**: 비즈니스 로직과 인프라 레이어를 엄격히 분리하여 유지보수성과 확장성을 확보한다.
- **3-Layer 모듈화**:
  - `domain/`: 순수 비즈니스 로직 및 엔티티 (의존성 없음).
  - `application/`: 유즈케이스 및 서비스 오케스트레이션 (도메인 참조).
  - `infrastructure/`: 데이터 저장소 및 외부 API 구현 (도메인/어플리케이션 인터페이스 구현).
- **SSOT 정렬**: `docs/CRITICAL_LOGIC.md`의 정책에 따라 모든 로직을 일원화하고 중복을 제거한다.

## 🔍 Impact Scope (영향 범위)

| 수정 대상 파일 | 현재 라인 수 | 참조하는 파일 | 비고 |
| -------------- | :----------: | ------------- | ---- |
| `src/modules/golf/golf.service.ts` | 324 | `useGolfRecord.ts`, `useDashboardData.ts` | **Domain/Application 분리 필요** |
| `src/modules/golf/golf.types.ts` | ~200 | 전체 모듈 | **Domain 엔티티로 이동** |
| `src/modules/golf/repository/*` | ~500 (합계) | `useGolfRecord.ts`, `useRoundActions.ts` | **Infrastructure 계층화** |
| `src/modules/golf/hooks/*` | ~1000 (합계) | UI 컴포넌트 | **Application/Service 참조 변경** |

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다.

### 📦 Task List

- [x] **Task 1: SDD Foundation & Base Setup (물리 시스템 및 추상화 구조 정의)**
  - [x] **1.1: Physical Directory Layout**: 레이어별 디렉토리(`domain`, `application`, `infrastructure`) 생성 및 Barrel (`index.ts`) 기본 구축
  - [x] **1.2: Essential Domain Data Migration**: `golf.types.ts`, `golf.constants.ts` 등 도메인 타입 및 상수를 `domain/` 하위로 정밀 이동
  - [x] **1.3: Domain Standard Error Specification**: 모든 레이어에서 공통으로 처리하기 위한 `GolfError` 및 구체적 도메인 에러 클래스 정의 (`RoundNotFoundError` 등)
  - [x] **1.4: Repository Abstract Interface (Ports)**: 인프라에 의존하지 않는 비즈니스 중심의 저장소 인터페이스 정의 (`application` 레이어에서 호출할 인터페이스 명세)
  - [x] **1.5: Dependency Mapping & Lint Rule Setup**: 레이어 간 참조 규칙(No Circular Dependency)이 준수되도록 Import 정책 명확화
  - **Action**: 파일 생성/수정
  - **Target**: `src/modules/golf/domain/`
  - **Goal**: SDD 레이어별 기본 파일 시스템을 구축하고 도메인 전용 추상화 계층을 명확히 함.
  - **Verify**: `src/modules/golf/domain/{errors,repositories}/` 디렉토리 및 파일이 생성되고 레이어별 캡슐화 준비 완료.
  - **Dependency**: None

- [x] **Task 2: Domain Layer — 순수 비즈니스 로직(Pure Logic) 추출**
  - [x] **2.1: Core Stat Calculation (Domain Service)**: `calculateSummary`, `isGIR`, `calculateAdvancedStats`, `estimateHandicap` 추출 및 `src/modules/golf/domain/services/golf.domain.service.ts` 생성
  - [x] **2.2: Data Helpers & Patterns**: `updateMissShotPatterns`, `normalizeClubName`, `calculateCombinedPars` 등 보조 순수 함수 이동
  - [x] **2.3: Validation & Conflict Resolution**: `validateRoundData`, `resolveMergedRounds` 등 도메인 규칙 기반 로직 이동
  - [x] **2.4: Domain Barrel Integration**: `domain/index.ts`를 통해 `golfDomainService` 외부 노출
  - **Action**: 파일 생성/수정
  - **Target**: `src/modules/golf/domain/services/`
  - **Goal**: `golf.service.ts`의 계산 로직을 순수 함수로 구성된 `golfDomainService`로 완벽히 분리
  - **Verify**: 도메인 서비스가 생성되고 기존 `golfService`의 계산 기능이 독립적으로 테스트 가능한 상태가 됨.
  - **Dependency**: Task 1

- [x] **Task 3: Infrastructure Layer — Repository 인터페이스 및 구현 정리**
  - [x] **3.1: Repository Structural Setup**: Infrastructure 내 `repositories/`, `local/`, `supabase/` 세부 구조화 및 `infrastructure/index.ts` Barrel 기본 레이블릿 구축
  - [x] **3.2: Round Repository Logic Consolidation**: 기존 `golf.round.*.repository.ts` 산발적 로직 통합 및 `RoundRepository`(domain) 추상 인터페이스의 구체 구현체 `RoundRepositoryImpl` 생성 (Local/Sync 합본)
  - [x] **3.3: Club Repository Implementation**: `golf.club.*` 산재된 로직을 `ClubRepositoryImpl`로 통합 구현하여 `ClubRepository` 인터페이스 및 도메인 상위 레이어 바인딩
  - [x] **3.4: Match Repository Integration**: `golf.match.repository.ts`를 Infrastructure 레이어의 통합 저장소 규격에 맞춰 이동 및 정리
  - [x] **3.5: Infrastructure Service Registry (Binding)**: `infrastructure/index.ts`를 통해 구체 구현체 인스턴스를 노출하여 Application Layer에서 인터페이스 기반으로 호출 가능하도록 구성
  - **Action**: 파일 이동 및 리팩토링
  - **Target**: `src/modules/golf/infrastructure/`
  - **Goal**: 기존 `repository/` 내 파편화된 데이터 접촉점 로직을 정리하고, Domain/Application에서 사용 가능한 인터페이스 기반의 구체 Repository 구현체로 통합/재배치
  - **Verify**: `golf.round.repository.ts`, `golf.club.repository.ts` 등이 `infrastructure` 하위의 구체 클래스(`Impl`)로 이전됨.
  - **Dependency**: Task 1

- [x] **Task 4: Application Layer — Use Case/Service 오케스트레이션 구축**
  - [x] **4.1: Application Service Foundation & Round Use Cases**: `GolfApplicationService` 클래스 기본 구조 설계 및 라운드 생명주기 관리(Start, Save, Finish) 로직 오케스트레이션 (기존 `useRoundActions` 기능 이관)
  - [x] **4.2: Session Management & Auto-Repair Use Cases**: 세션 로드, 복원 및 구장/코스 데이터 무결성 체크(Auto-Repair) 로직 구현 (기존 `useGolfSession` 기능 이관)
  - [x] **4.3: Sync & Conflict Resolution Use Cases**: 로컬/서버 데이터 병합 정책 (`resolveMergedRounds`) 기반의 통합 동기화 서비스 로직 구축
  - [x] **4.4: Application Layer Barrel & Service Registry**: `application/index.ts`를 통해 `golfApplicationService` 노출 및 레이어 간 의존성 주입 구조 완성
  - **Action**: 파일 생성/수정
  - **Target**: `src/modules/golf/application/`
  - **Goal**: `golfService`의 잔여 로직과 Hook에 산재된 비즈니스 워크플로우를 Application 서비스로 통합하여 가독성 및 재사용성 극대화
  - **Verify**: UI Hook(`useGolfRecord`)에서 복잡한 비즈니스 로직이 제거되고 Application 서비스 호출만으로 기능이 동작함.
  - **Dependency**: Task 2, Task 3

- [x] **Task 5: Hook 및 컴포넌트 참조 업데이트 (Migration)**
  - **Action**: `useGolfRecord`, `useRoundActions`, `useDashboardData`, `CourseSelector` 등이 새로운 `GolfApplicationService` 및 `infrastructure` 레이어를 사용하도록 업데이트
  - [x] 5.1 `useRoundActions`, `useGolfSession` 이 `GolfApplicationService`를 사용하도록 수정
  - [x] 5.2 `useGolfRecord` 가 `infrastructure` 리포지토리 및 `domain` 서비스 사용하도록 수정
  - [x] 5.3 `useDashboardData` 가 `infrastructure` 및 `domain` 로직 사용하도록 수정
  - [x] 5.4 UI 컴포넌트(`CourseSelector` 등)의 직접 참조를 `domain` 레이어로 교체
  - [x] 5.5 최종 검증 및 타입 정합성 확인
  - **Action**: 파일 수정
  - **Target**: `src/modules/golf/hooks/`, `src/modules/golf/components/`
  - **Goal**: 기존 `golfService` 및 파편화된 `repository` 참조를 새로운 SDD 레이어 참조로 변경
  - **Verify**: 빌드 오류가 없으며 기능이 기존과 동일하게 동작함(Regression Test).
  - **Dependency**: Task 4

- [x] **Task 6: Obsolete File Cleanup**
  - **Action**: 구형 `golf.repository.ts`, `golf.service.ts` 및 관련 폴더(`repository/`, `service/`) 삭제
  - **Goal**: 레거시 코드 제거로 신규 아키텍처 SSOT 유지
  - **Check**: `src/modules/golf/` 하위에 구형 파일이 존재하지 않음.

- [x] **Task 7: Session Handoff Protocol**
  - **Action**: `docs/memory.md` 최신화 및 `/go` 명령어로 다음 세션 준비
  - **Goal**: 작업 이관 및 상태 보존
  - **Check**: `/go` 출력 확인
## ⚠️ 기술적 제약 및 규칙

- **No circular dependency**: 하위 레이어는 상위 레이어를 참조할 수 없다. (Domain <- Application <- Infrastructure/UI)
- **Error Handling**: 도메인 에러(`GolfDomainError`) 규격을 유지하며 레이어 간 전파를 명확히 한다.
- **Line Count**: 각 파일은 500라인을 넘지 않도록 기능을 세분화하며, 필요시 추가 파일로 분리한다.

## ✅ Definition of Done

1. [x] `domain` 레이어는 순수 함수로만 구성되어 테스트 용이성이 확보됨.
2. [x] `application` 레이어는 비즈니스 시나리오를 명확히 표현함.
3. [x] `infrastructure` 레이어는 Supabase/AsyncStorage 구현 세부를 캡슐화함.
4. [x] `docs/memory.md`에 아키텍처 개편 사항 반영 완료.
