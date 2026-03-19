# 🗺️ Project Blueprint: SDD Specification Reorganization

> 생성 일시: 2026-03-19 14:45 | 상태: 완료 (Execution Completed)

## 🎯 Architectural Goal

- **Spec-Driven Design (SDD) 문서 체계 정립**: 파편화된 `docs/CRITICAL_LOGIC.md`의 내용을 SDD 아키텍처 레이어에 맞게 분할하여 `docs/specs/` 하위로 구조화한다.
- **관심사 분리 (Separation of Concerns)**:
  - `DOMAIN_SPEC.md`: 순수 비즈니스 규칙 및 데이터 모델 (무엇을 하는가).
  - `APPLICATION_SPEC.md`: 유즈케이스 및 흐름 제어 (어떻게 협업하는가).
  - `INFRASTRUCTURE_SPEC.md`: 기술적 구현 세부 및 외부 연동 (어디에 저장/통신하는가).
  - `UI_SPEC.md`: 사용자 경험 및 인터페이스 표준 (어떻게 보여주는가).
- **진실 원천(SSOT)의 명확화**: 각 스펙 파일이 해당 도메인의 최종 권위 문서가 되도록 구성한다.

## 🔍 Impact Scope (영향 범위)

| 수정 대상 파일 | 현재 상태 | 역할 | 비고 |
| -------------- | :----------: | ---- | ---- |
| `docs/CRITICAL_LOGIC.md` | ~237줄 | 현재의 통합 SSOT | **분할 및 재구조화의 소스** |
| `docs/specs/SYSTEM_SPEC.md` | 미생성 | 전체 시스템 개요 | 신규 생성 |
| `docs/specs/DOMAIN_SPEC.md` | 미생성 | 비즈니스 로직 규격 | 신규 생성 |
| `docs/specs/APPLICATION_SPEC.md` | 미생성 | 유즈케이스 규격 | 신규 생성 |
| `docs/specs/INFRASTRUCTURE_SPEC.md` | 미생성 | 기술 인프라 규격 | 신규 생성 |
| `docs/specs/UI_SPEC.md` | 미생성 | UI/UX 규격 | 신규 생성 |

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `docs/specs/` 기본 구조 및 `SYSTEM_SPEC.md` 생성**
  - **Action**: 파일 생성
  - **Target**: `docs/specs/SYSTEM_SPEC.md`
  - **Goal**: 프로젝트의 목적, 기술 스택, 고수준 아키텍처(3-Layer SDD) 개요를 정의한다.
  - **Verify**: 파일이 생성되고 아키텍처 다이어그램(Mermaid) 및 핵심 모듈 설명이 포함됨.

- [x] **Task 2: `DOMAIN_SPEC.md` - 비즈니스 정수 추출**
  - **Action**: 파일 생성
  - **Target**: `docs/specs/DOMAIN_SPEC.md`
  - **Goal**: `CRITICAL_LOGIC.md`의 섹션 0(마스터 데이터), 1(스코어링 정책), 4(데이터 무결성), 7/15(관리자/공지 정책) 등을 이동.
  - **Verify**: 골프 스코어링의 핵심 규칙(Par, GIR, 핸디캡 계산 등)이 명확히 기술됨.

- [x] **Task 3: `APPLICATION_SPEC.md` - 유즈케이스 및 흐름 정의**
  - **Action**: 파일 생성
  - **Target**: `docs/specs/APPLICATION_SPEC.md`
  - **Goal**: `CRITICAL_LOGIC.md`의 섹션 5(활성 세션), 13(인증 안정성), 16(오케스트레이션) 등을 이동.
  - **Verify**: 라운드 시작부터 종료, 동기화 프로세스의 흐름이 기술됨.

- [x] **Task 4: `INFRASTRUCTURE_SPEC.md` - 기술 규격 정립**
  - **Action**: 파일 생성
  - **Target**: `docs/specs/INFRASTRUCTURE_SPEC.md`
  - **Goal**: `CRITICAL_LOGIC.md`의 섹션 2(성능 표준), 8(resilience), 10(백업), 12(캐싱), 17(레포지토리 구현) 등을 이동.
  - **Verify**: Supabase, AsyncStorage, 네트워크 정책, 에러 핸들링 규격이 포함됨.

- [x] **Task 5: `UI_SPEC.md` - 사용자 인터페이스 표준 정의**
  - **Action**: 파일 생성
  - **Target**: `docs/specs/UI_SPEC.md`
  - **Goal**: `CRITICAL_LOGIC.md`의 섹션 5(UI 워크플로우), 11(관리자 UI), 16(애니메이션) 등을 이동.
  - **Verify**: 네비게이션 정책, 컴포넌트 재사용 규칙, 시각적 피드백 표준이 기술됨.

- [x] **Task 6: `CRITICAL_LOGIC.md` 리팩토링 및 통합 인덱스화**
  - **Action**: 파일 수정
  - **Target**: `docs/CRITICAL_LOGIC.md`
  - **Goal**: 기존 내용을 각 스펙으로 이관한 후, 이 파일은 전체 스펙을 연결하는 **Master Index 및 핵심 요약 문서**로 재구성한다.
  - **Verify**: 각 섹션이 `docs/specs/`의 파일을 참조하도록 링크가 걸리고 중복 내용이 제거됨.

## ⚠️ 기술적 제약 및 규칙

- **Encoding**: UTF-8 no BOM 준수.
- **Consistency**: 코드 베이스의 실제 구현(3-Layer)과 문서 구조가 100% 일치해야 함.
- **No Orphan Specs**: 모든 스펙은 `CRITICAL_LOGIC.md` 또는 `README.md`에서 접근 가능해야 함.

## ✅ Definition of Done

1. [ ] `docs/specs/` 내에 5개의 핵심 스펙 문서가 존재함.
2. [ ] `CRITICAL_LOGIC.md`가 200라인 이내의 인덱스 문서로 최적화됨.
3. [ ] 모든 비즈니스 규칙과 기술 스펙이 누락 없이 이관됨.
4. [ ] `docs/memory.md`에 문서 체계 유무 반영 완료.
