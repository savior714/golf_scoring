# 🗺️ Project Blueprint: Repository Diet (round + club)

> 생성 일시: 2026-03-12 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- `golf.round.repository.ts`(355) / `golf.club.repository.ts`(350) 두 파일이 글로벌 룰 0(300라인 제한) 초과 상태.
- 각 파일의 **단일 책임 위반**을 해소하여 파일당 300라인 이하로 경량화.
- **Aggregator 패턴** 유지: 기존 import 경로(`golf.round.repository`, `golf.club.repository`) 그대로 보존 → 외부 호출 코드 무변경.

---

## 🔍 책임 분석

### golf.round.repository.ts (355라인)

| 책임 | 함수 | 이동 대상 |
|---|---|---|
| 로컬 스토리지 CRUD | getAllRounds, saveRound, deleteRound, getCurrentRoundId, setCurrentRoundId, getRoundsCountByDate | `golf.round.local.repository.ts` |
| 동기화 큐 관리 | _addToSyncQueue, _removeFromSyncQueue, pruneSyncQueue, getSyncQueueCount, retryPendingSyncs | `golf.round.local.repository.ts` |
| Supabase 동기화 | pullRoundsFromSupabase, syncRoundToSupabase, syncAllLocalRounds | `golf.round.sync.repository.ts` |

### golf.club.repository.ts (350라인)

| 책임 | 함수 | 이동 대상 |
|---|---|---|
| 조회 (Query) | getAllClubsSummary, getCourseWithHoles, getClubFullInfo | `golf.club.query.repository.ts` |
| 쓰기/삭제 (Mutation) | registerClub, registerClubsBulk, deleteGolfCourse | `golf.club.mutation.repository.ts` |

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료되어야 한다.**

### Phase A: golf.round 분리 (3 Tasks)

- [ ] **Task A-1: `golf.round.local.repository.ts` 생성**
  - **Tool**: `Write`
  - **Target**: `src/modules/golf/repository/golf.round.local.repository.ts`
  - **Goal**: 로컬 스토리지 CRUD + 큐 관리 함수 이동. `localRoundRepository` 로 export.
  - **내용**: `getAllRounds`, `saveRound`, `deleteRound`, `getCurrentRoundId`, `setCurrentRoundId`, `getRoundsCountByDate`, `_addToSyncQueue`, `_removeFromSyncQueue`, `pruneSyncQueue`, `getSyncQueueCount`, `retryPendingSyncs` + 공유 상수/락/타입
  - **예상 라인**: ~190라인
  - **Dependency**: None

- [ ] **Task A-2: `golf.round.sync.repository.ts` 생성**
  - **Tool**: `Write`
  - **Target**: `src/modules/golf/repository/golf.round.sync.repository.ts`
  - **Goal**: Supabase 동기화 함수 이동. `syncRoundRepository` 로 export. `localRoundRepository` import.
  - **내용**: `pullRoundsFromSupabase`, `syncRoundToSupabase`, `syncAllLocalRounds` + DbRoundRow/DbHoleRow 타입
  - **예상 라인**: ~190라인
  - **Dependency**: Task A-1

- [ ] **Task A-3: `golf.round.repository.ts` Aggregator로 교체**
  - **Tool**: `Write`
  - **Target**: `src/modules/golf/repository/golf.round.repository.ts`
  - **Goal**: 기존 export 이름 `roundRepository` 유지하면서 두 모듈 위임. 외부 호출 코드 무변경.
  - **Pseudocode**:
    ```ts
    import { localRoundRepository } from './golf.round.local.repository';
    import { syncRoundRepository } from './golf.round.sync.repository';
    export const roundRepository = { ...localRoundRepository, ...syncRoundRepository };
    ```
  - **예상 라인**: ~15라인
  - **Dependency**: Task A-2

### Phase B: golf.club 분리 (3 Tasks)

- [ ] **Task B-1: `golf.club.query.repository.ts` 생성**
  - **Tool**: `Write`
  - **Target**: `src/modules/golf/repository/golf.club.query.repository.ts`
  - **Goal**: DB Row 타입 정의 + 조회 함수 이동. `clubQueryRepository` 로 export.
  - **내용**: `DbHoleDistance`, `DbHole`, `DbCourse`, `DbClub` 타입 + `getAllClubsSummary`, `getCourseWithHoles`, `getClubFullInfo`
  - **예상 라인**: ~170라인
  - **Dependency**: None

- [ ] **Task B-2: `golf.club.mutation.repository.ts` 생성**
  - **Tool**: `Write`
  - **Target**: `src/modules/golf/repository/golf.club.mutation.repository.ts`
  - **Goal**: 쓰기/삭제 함수 이동. `clubMutationRepository` 로 export. query 파일에서 Db Row 타입 import.
  - **내용**: `registerClub`, `registerClubsBulk`, `deleteGolfCourse`
  - **예상 라인**: ~150라인
  - **Dependency**: Task B-1

- [ ] **Task B-3: `golf.club.repository.ts` Aggregator로 교체**
  - **Tool**: `Write`
  - **Target**: `src/modules/golf/repository/golf.club.repository.ts`
  - **Goal**: 기존 export 이름 `clubRepository` 유지. 외부 호출 코드 무변경.
  - **Pseudocode**:
    ```ts
    import { clubQueryRepository } from './golf.club.query.repository';
    import { clubMutationRepository } from './golf.club.mutation.repository';
    export const clubRepository = { ...clubQueryRepository, ...clubMutationRepository };
    ```
  - **예상 라인**: ~10라인
  - **Dependency**: Task B-2

### Phase C: 검증 (1 Task)

- [ ] **Task C-1: TSC 검증**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit 2>&1 | head -50`
  - **Goal**: 오류 0개 확인
  - **Dependency**: Task B-3

---

## ⚠️ 기술적 제약

- **공유 상수**: `BASE_STORAGE_KEY`, `PENDING_SYNC_KEY` 등 상수는 `local.repository`에 정의, `sync.repository`에서 import.
- **`storageLock`, `syncLocks`**: `local.repository`에 정의, `sync.repository`에서 import.
- **`isRetryingPending`**: `local.repository`에서만 사용되므로 해당 파일에 유지.
- **`getStorageKey()`**: `local.repository`에 정의, `sync.repository`에서 import.
- **DB Row 타입**: `golf.club.query.repository.ts`에 정의 후 `mutation.repository.ts`에서 import (DbHoleDistance 등 공유 필요시).

## ✅ Definition of Done

1. [ ] 6개 파일 모두 300라인 이하.
2. [ ] `roundRepository`, `clubRepository` export 이름 유지 → 외부 호출 코드 변경 없음.
3. [ ] TSC 오류 0개.
4. [ ] `memory.md` 갱신.
