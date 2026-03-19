# 🚀 SYSTEM_SPEC: Golf Scoring App Overview

> 상태: 초안 (Draft) | 기준: 2026-03-19

## 1. Project Overview

- **프로젝트명**: Golf Scoring App
- **핵심 목표**: 골퍼의 라운드 기록을 정밀하게 추적하고, 통계를 제공하며, 다중 기기 간 실시간 동기화를 보장하는 고성능 스코어링 플랫폼.
- **핵심 가치**: 데이터 무결성(Data Integrity), 오프라인 지원(Offline First), 직관적인 UX(Intuitive UX), 확장 가능한 아키텍처(Scalable Architecture).

## 2. Core Architecture (SDD 3-Layer)

프로젝트는 **Spec-Driven Design (SDD)** 아키텍처를 따르며, 비즈니스 로직과 기술 세부를 엄격히 분리한다.

### 2.1 Layered Structure

1. **Domain Layer (`src/modules/*/domain`)**:
   - **순수성 (Pure)**: 외부 라이브러리나 기술에 의존하지 않는 비즈니스 정수.
   - **엔티티 (Entities)**: 핵심 데이터 모델 (`golf.types.ts`).
   - **도메인 서비스 (Domain Services)**: 복잡한 계산식, 분석 로직 (`golf.domain.service.ts`).
   - **포트 (Ports)**: 외부 협업을 위한 인터페이스 (`repositories/`).
2. **Application Layer (`src/modules/*/application`)**:
   - **유즈케이스 (Use Cases)**: 비즈니스 시나리오 오케스트레이션 (라운드 라이프사이클 관리).
   - **세션 관리**: 동기화 조정, 세션 복구 및 상태 전파.
3. **Infrastructure Layer (`src/modules/*/infrastructure`)**:
   - **기술 구현 (Adapters)**: 저장소 인터페이스의 구체 구현 (`RoundRepositoryImpl`).
   - **외부 연동 (External I/O)**: Supabase, AsyncStorage 연동 로직.

### 2.2 Module Organization

- **`src/modules/golf/`**: 골프 라운드 및 스코어링 핵심 도메인.
- **`src/modules/admin/`**: 관리자 전용 데이터 관리 및 통계 도메인.
- **`src/shared/`**: UI 컴포넌트, 유틸리티 등 공통 인프라.

## 3. Technology Stack

- **Framework**: React Native (with Expo)
- **Language**: TypeScript (v5+)
- **Storage**: AsyncStorage (Local), Supabase (Remote Cloud)
- **State Management**: React Query (Cache), React Hooks (UI State)
- **Routing**: Expo Router (File-based Routing)
- **Icons**: Lucide Icons (Direct Import Optimization)

## 4. Architectural Rules

- **No Circular Dependency**: 하위 레이어는 상위 레이어를 참조할 수 없다. (`Domain <- Application <- Infrastructure/UI`)
- **Single Source of Truth (SSOT)**: 정책 문서는 `docs/specs/` 하위에 위치하며, 코드는 이를 100% 준수한다.
- **Line Count Guard**: 단일 파일 500라인 초과 시 강제 리팩토링 및 분리.
- **Absolute Alias Import**: `@/src/` 별칭을 통한 절대 경로 임포트 강제.
