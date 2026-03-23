# 🎯 골프 스코어링 애플리케이션 - 핵심 로직 (Master SSOT)

> 최종 업데이트: 2026-03-19 | 상태: SDD 구조화 완료

본 문서는 프로젝트의 모든 비즈니스 규칙, 기술 스펙, 그리고 운영 정책을 연결하는 **최상위 진실 원천(Master SSOT)**입니다. 모든 상세 명세는 `docs/specs/` 하위의 개별 스펙 문서로 구조화되어 있습니다.

---

## 🏗️ SDD Architecture Overview (SDD 아키텍처 개요)

시스템은 **Spec-Driven Design (SDD)** 아키텍처를 기반으로 비즈니스 로직과 기술 인프라를 엄격히 분리하여 설계되었습니다.

- **전체 시스템 개요**: [`SYSTEM_SPEC.md`](./specs/SYSTEM_SPEC.md)를 참조하십시오.
- **아키텍처 규칙 (3-Layer)**: `Domain <- Application <- Infrastructure/UI` 순의 단방향 의존성 정책을 준수합니다.

---

## 🏌️ 핵심 도메인 규칙 (Domain Specs)

골프 스코어링의 비즈니스 로직 및 데이터 모델 정책입니다.

- [x] **코스 마스터 데이터**: 클럽(Club) > 코스(Course) > 홀(Hole) > 거리(Distance) 4계층 구조.
- [x] **스코어링 정책**: Stroke, Putt, GIR 계산 및 간이 핸디캡(Estimated Handicap) 분석 로직.
- [x] **데이터 무결성**: 코스당 정확히 9홀 및 총 Par 36 준수 검증 엔진.
- **상세 내용**: [`DOMAIN_SPEC.md`](./specs/DOMAIN_SPEC.md)

---

## 🏗️ 유즈케이스 및 흐름 제어 (Application Specs)

비즈니스 시나리오 오케스트레이션 및 세션 관리 정책입니다.

- [x] **라운드 생명주기**: 라운드 시작부터 종료, 저장 및 클라우드 동기화 흐름.
- [x] **세션 자동 복구**: `@current_round_id` 추적 및 데이터 정합성 리페어(Auto-Repair).
- [x] **동기화 프로토콜**: 최신 데이터 우선(LWW) 및 중복 방지 직렬화 잠금 정책.
- **상세 내용**: [`APPLICATION_SPEC.md`](./specs/APPLICATION_SPEC.md)

---

## 📁 기술 인프라 및 성능 (Infrastructure Specs)

영속성, 네트워크, 그리고 개발/성능 표준 정책입니다.

- [x] **다중 저장소 전략**: 로컬(AsyncStorage)과 리모트(Supabase) 간의 통합 영속성.
- [x] **성능 최적화**: React Query 캐시, Memoization, 그리고 비동기 병렬화 정책.
- [x] **환경 무결성**: UTF-8 인코딩 표준, 절대 경로 임포트(@/src/), 백업 프로토콜.
- **상세 내용**: [`INFRASTRUCTURE_SPEC.md`](./specs/INFRASTRUCTURE_SPEC.md)

---

## 🎨 사용자 인터페이스 표준 (UI Specs)

UI/UX 가이드라인 및 컴포넌트 정책입니다.

- [x] **내비게이션 정책**: 명시적 모드 파라미터 기반 이동 및 하이재킹 가드 적용.
- [x] **UI 워크플로우**: 모달 라이프사이클 관리, 스피너 노출 방지, 그리고 시각적 피드백.
- [x] **컴포넌트 재사용**: 공통 `ScoreCardTable` 및 모듈형 기록 UI 구조.
- **상세 내용**: [`UI_SPEC.md`](./specs/UI_SPEC.md)

---

## 🛠️ 문제 해결 및 운영 (Diagnosis & Ops)

시스템 유지보수 및 진단 가이드입니다.

- **구장/코스 선택 화면 회귀 현상**: 비동기 로드 시 최신 상태 참조(State Ref) 및 조기 가딩을 통해 경쟁 상태 해결.
- **IDE 안정성 정책**: 무한 권한 요청 방지를 위한 리소스 제외 스캔 경계 정의.
- **[2026-03-20] 스코어 입력 중 내비게이션 데이터 유실**: 대시보드 이동 후 복귀 시 `useFocusEffect`의 세션 리로드로 인해 마지막 1-2홀의 미저장 데이터가 소실되는 현상 해결. `useGolfRecord`에 **디바운스 오토세이브** 및 `RecordScreen`에 **Save-on-Blur** 로직을 추가하여 영속성을 강화함.
- **[2026-03-23] 히스토리 수정 시 데이터 초기화 및 오토세이브 오염**: 완료된 라운드 수정 진입 시 `INIT_SESSION` 리듀서에서 상위 스코어 필드(`par`, `stroke` 등)가 마지막 홀 데이터와 동기화되지 않아 '1,1,1'로 초기화된 값이 오토세이브되는 버그 해결. `INIT_SESSION` 내부에 `golfDomainService.getHoleData`를 통한 필드 동기화 로직 추가.
- **[2026-03-19] 동기화 미완료 버그**: `enforce_round_constraints` BEFORE INSERT 트리거가 `upsert(ON CONFLICT DO UPDATE)` 시에도 발동하여 과거 날짜 라운드의 클라우드 동기화를 차단하던 버그. 트리거 내부에서 `SELECT EXISTS(SELECT 1 FROM rounds WHERE id = NEW.id)`로 기존 레코드 여부를 판별하여 upsert UPDATE 패스는 제약을 스킵하도록 수정. (`20260319000000_fix_round_constraints_trigger.sql`)
