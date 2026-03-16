# 🗺️ Project Blueprint: `CRITICAL_LOGIC.md` 한글 통일 작업

> 생성 일시: 2026-03-16 14:15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- `docs/CRITICAL_LOGIC.md` 파일에 혼재된 영어 표현 및 기술 용어를 **한국어**로 통일하여 가독성을 높이고 관리 표준을 정립한다.
- 코드 직접 참조(함수명, 변수명)는 유지하되 설명 문맥은 시니어 아키텍트 톤의 한국어로 정제한다.
- **SSOT**: `docs/CRITICAL_LOGIC.md`의 내용을 유지하면서 언어 정합성만 확보한다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: `docs/CRITICAL_LOGIC.md` 섹션 0-4 번역 및 정제**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\docs\CRITICAL_LOGIC.md`
  - **Goal**: 코스 구조, 스코어링 정책, 개발 표준, 아키텍처, 데이터 무결성 섹션의 영문/혼용구 정리.
  - **Pseudocode**:
    ```markdown
    - **싱글톤 프로미스 (Singleton Promise)**: 로그인 직후 ...
    - **클라우드 동기화 (Supabase)**: ...
    - **렌더링 최적화**: FlatList 관련 설정 파라미터 한글 설명 보강.
    ```
  - **Dependency**: None

- [ ] **Task 2: `docs/CRITICAL_LOGIC.md` 섹션 5-10 번역 및 정제**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\docs\CRITICAL_LOGIC.md`
  - **Goal**: 세션 관리, 진단, 관리자 가이드, TS 정책, 에러 핸들링, 인프라 섹션 정리.
  - **Pseudocode**:
    ```markdown
    - **명시적 탐색 프로토콜**: mode, id 등 파라미터 역할 한국어 상술.
    - **에러 스키마**: 도메인 주도 에러 구조 설명.
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: `docs/CRITICAL_LOGIC.md` 섹션 11-14 번역 및 정제**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\docs\CRITICAL_LOGIC.md`
  - **Goal**: 애니메이션, 캐싱, 인증 안정성, IDE 안정성 섹션 최종 정리 및 마무리.
  - **Pseudocode**:
    ```markdown
    - **네이티브 모달 애니메이션**: Reanimated 대신 네이티브 위임 로직 설명.
    - **IDE 안정성**: 스캔 범위 및 루프 방지 로직 한국어화.
    ```
  - **Dependency**: Task 2

- [ ] **Task 4: `memory.md` 업데이트 및 최종 검증**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\docs\memory.md`
  - **Goal**: 문서 언어 통일 완료 및 SSOT 최신화 확인.
  - **Dependency**: Task 3

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 준수.
- **용어 원칙**: 핵심 기술 용어(Supabase, AsyncStorage, React Query 등)는 고유 명사로 유지하되, 설명문 내 조사 및 서술어는 완벽한 한국어로 작성한다.
- **강조**: 핵심 키워드는 **굵게** 표시한다.

## ✅ Definition of Done

1. [ ] `docs/CRITICAL_LOGIC.md` 내에 어색한 한영 혼용 구문이 제거됨.
2. [ ] 모든 섹션의 타이틀과 설명이 시니어 아키텍트 톤의 한국어로 통일됨.
3. [ ] `memory.md`에 해당 작업 내용이 반영됨.

[BLUEPRINT CHECKLIST]
- [ ] Task 1 진행 요청
- [ ] Task 2 진행 요청
- [ ] Task 3 진행 요청
- [ ] Task 4 진행 요청
