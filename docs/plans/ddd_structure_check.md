# 🗺️ Project Blueprint: DDD 규격 준수 및 구조 정적 강화
> 생성 일시: 2026-03-12 18:00 | 상태: 설계 승인 대기 (마이크로태스크 재분해)

## 🎯 Architectural Goal
- 프로젝트 전반의 **DDD 3-Layer (Definition, Repository, Service)** 규격 준수 확인 및 교정.
- **Definition** 레이어에 **Error Schema**를 포함시켜 타입 무결성 강화.
- 루트 디렉토리 **Orphan Cleanup** 으로 물리적 청결도 확보.

> ⚠️ **마이크로태스크 원칙**: 각 Task = 단 하나의 도구 호출(Read / Edit / Bash). 순서대로 하나씩 진행할 것.

---

## 🛠️ Step-by-Step Execution Plan

### 그룹 A: Definition 계층 — Error Schema 추가

- [x] **Task A-1: `golf.types.ts` 읽기 — 현재 타입 정의 파악** (완료)
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/golf.types.ts`
  - **Goal**: 기존 타입 목록 확인, `GolfErrorCode` / `GolfDomainError` 중복 여부 파악
  - **Dependency**: None

- [x] **Task A-2: `golf.types.ts`에 `GolfErrorCode` 유니온 타입 추가** (완료)
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/golf.types.ts`
  - **Goal**: 도메인 에러 코드 열거형 추가
  - **Pseudocode**:
    ```typescript
    export type GolfErrorCode =
      | 'AUTH_REQUIRED'
      | 'VALIDATION_FAILED'
      | 'SYNC_CONFLICT'
      | 'STORAGE_ERROR';
    ```
  - **Dependency**: Task A-1

- [x] **Task A-3: `golf.types.ts`에 `GolfDomainError` 인터페이스 추가** (완료)
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/golf.types.ts`
  - **Goal**: 에러 객체 구조 타입 정의
  - **Pseudocode**:
    ```typescript
    export interface GolfDomainError {
      code: GolfErrorCode;
      message: string;
      details?: unknown;
    }
    ```
  - **Dependency**: Task A-2

- [x] **Task A-4: `golf.types.ts` 린트 체크** (완료)
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | head -20`
  - **Goal**: A-2, A-3 변경 후 타입 오류 없음 확인
  - **Dependency**: Task A-3

---

### 그룹 B: Root Orphan Cleanup

- [x] **Task B-1: 루트 파일 목록 확인** (완료 - 대부분 부재 확인)
  - **Tool**: `Bash`
  - **Command**: `ls -la c:/develop/golf_scoring/*.txt c:/develop/golf_scoring/*.json 2>/dev/null`
  - **Goal**: 삭제 대상 파일 실존 여부 확인 (errors.txt, line181.txt, response.txt, ts_errors.txt, eslint_output.json)
  - **Dependency**: None

- [x] **Task B-2: 임시 텍스트 파일 삭제 (대상 부재)** (완료)
  - **Tool**: `Bash`
  - **Command**: `rm -f c:/develop/golf_scoring/errors.txt c:/develop/golf_scoring/line181.txt c:/develop/golf_scoring/response.txt c:/develop/golf_scoring/ts_errors.txt`
  - **Goal**: 개발 중 생성된 임시 로그 파일 제거
  - **Dependency**: Task B-1

- [x] **Task B-3: `eslint_output.json` 삭제 (대상 부재)** (완료)
  - **Tool**: `Bash`
  - **Command**: `rm -f c:/develop/golf_scoring/eslint_output.json`
  - **Goal**: eslint 출력 임시 파일 제거
  - **Dependency**: Task B-1

- [x] **Task B-4: `patch_antigravity.js` 참조 조사 (참조 없음 확인)** (완료)
  - **Tool**: `Grep`
  - **Pattern**: `patch_antigravity`
  - **Path**: `c:/develop/golf_scoring`
  - **Goal**: 해당 파일이 다른 파일에서 import/require 되는지 확인
  - **Dependency**: None

- [x] **Task B-5: `patch_antigravity.js` 처리 (`scripts/`로 이동 완료)** (완료)
  - **Tool**: `Bash` (참조 없으면 삭제, 있으면 `scripts/`로 이동)
  - **Command**: `rm -f c:/develop/golf_scoring/patch_antigravity.js` (참조 없을 경우)
  - **Goal**: 루트 스크립트 정리
  - **Dependency**: Task B-4

---

### 그룹 C: Repository 계층 — 예외 처리 보강

- [x] **Task C-1: `golf.repository.ts` 읽기 — 현재 에러 처리 패턴 파악** (완료)
  - **분석 결과**: 대부분의 메서드가 에러를 catch하여 로깅만 하거나 `{ success: false, error }`를 반환함. `deleteRound`만 `throw e` 수행 중. `GolfDomainError` 규격으로 통일 필요.

- [x] **Task C-2: `getAllRounds` 에러 래핑** (완료)
  - **Tool**: `Edit`
  - **Target**: `src/modules/golf/golf.repository.ts`
  - **Goal**: `getAllRounds`의 catch 블록을 `GolfDomainError` 규격으로 변환
  - **Dependency**: Task C-1

- [x] **Task C-3: `pullRoundsFromSupabase` 에러 래핑** (완료)
  - **Goal**: `pullRoundsFromSupabase`의 에러 반환 방식을 `GolfDomainError` 포함 구조로 정형화
  - **Dependency**: Task C-2
  - **결과**: 반환 타입 정형화 (`error?: GolfDomainError`) 및 `AUTH_REQUIRED`, `STORAGE_ERROR` 적용 완료.

- [x] **Task C-4: `saveRound` 에러 래핑** (완료)
  - **Goal**: `saveRound`에서 삼켜지던 에러를 `GolfDomainError`로 throw하도록 수정
  - **Dependency**: Task C-3
  - **결과**: `AUTH_REQUIRED` 및 `STORAGE_ERROR` throw 구조 적용 완료. 기존에 에러를 삼키던(log-only) 로직을 상위로 전파하도록 수정.

- [ ] **Task C-5: `syncRoundToSupabase` 에러 래핑**
  - **Goal**: 동기화 실패 시 `GolfDomainError` 반환 구조 강화
  - **Dependency**: Task C-4

- [ ] **Task C-6: `deleteRound` 에러 래핑**
  - **Goal**: raw Error를 throw하던 것을 `GolfDomainError`로 변환하여 throw
  - **Dependency**: Task C-5

  > ℹ️ 메서드가 여러 개이면 이 태스크를 메서드별로 반복(C-2, C-3, C-4...) 생성하여 진행한다.

- [ ] **Task C-last: `golf.repository.ts` 린트 체크**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | head -20`
  - **Goal**: 래핑 완료 후 타입 오류 없음 확인
  - **Dependency**: 그룹 C 마지막 Edit 완료 후

---

### 그룹 D: Service 계층 — 물리 구조 통합

- [ ] **Task D-1: `service/validateClubData.ts` 읽기**
  - **Tool**: `Read`
  - **Target**: `src/modules/golf/service/validateClubData.ts`
  - **Goal**: 파일 내용 파악, 이동 시 인터페이스 변경 여부 판단
  - **Dependency**: None

- [ ] **Task D-2: `validateClubData.ts` import 참조 전수 조사**
  - **Tool**: `Grep`
  - **Pattern**: `validateClubData`
  - **Path**: `src/`
  - **Goal**: 이동 전 영향받는 파일 목록 확보
  - **Dependency**: Task D-1

- [ ] **Task D-3: `golf.validator.ts` 파일 생성 (내용 이식)**
  - **Tool**: `Write`
  - **Target**: `src/modules/golf/golf.validator.ts`
  - **Goal**: 단일 파일 계층으로 정형화
  - **Dependency**: Task D-1

- [ ] **Task D-4: 참조 파일들의 import 경로 수정**
  - **Tool**: `Edit`
  - **Target**: Task D-2 조사로 발견된 파일들 (파일별 별도 Task)
  - **Goal**: 깨진 import 없이 이전 경로 → 새 경로로 교체
  - **Dependency**: Task D-3

- [ ] **Task D-5: 구 `service/validateClubData.ts` 삭제**
  - **Tool**: `Bash`
  - **Command**: `rm src/modules/golf/service/validateClubData.ts`
  - **Goal**: 이중 파일 제거
  - **Dependency**: Task D-4

- [ ] **Task D-6: 린트 체크**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | head -20`
  - **Goal**: 이동 후 타입/경로 오류 없음 확인
  - **Dependency**: Task D-5

---

## ⚠️ 기술적 제약 및 규칙 (SSOT)
- **Encoding**: 모든 수정은 **UTF-8 no BOM** 규격 준수.
- **DDD Consistency**: 3-Layer 구조 엄격 유지. View(`app/`)와 Logic(`src/`) 분리 보존.
- **Safety**: 파일 이동/삭제 전 반드시 Grep으로 참조 전수조사 선행.
- **순서**: 각 Task를 완전히 완료한 뒤 다음 Task로 진행. 절대 병렬 진행 금지.

## ✅ Definition of Done
1. [ ] `golf.types.ts`에 `GolfErrorCode`, `GolfDomainError` 타입이 명시적으로 존재함.
2. [ ] 프로젝트 루트에 불필요한 임시 파일이 모두 제거됨.
3. [ ] `golf.repository.ts` catch 블록이 `GolfDomainError` 규격으로 래핑됨.
4. [ ] `src/modules/golf` 내 서비스 계층 물리 위치가 일관성을 가짐.
5. [ ] `npx tsc --noEmit` 오류 0개.
6. [ ] `docs/memory.md`에 구조 개선 사항 기록 완료.
