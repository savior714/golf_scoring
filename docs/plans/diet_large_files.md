# 🗺️ Project Blueprint: 대형 파일 다이어트 (2차 — 리팩토링 후 잔존 파일)

> 생성 일시: 2026-03-12 갱신 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

1차 리팩토링으로 `admin.tsx`(155줄), `index.tsx`(177줄) 해결 완료.
**2차 대상: 300라인 초과 잔존 파일 8개**를 논리적 단위로 분리해
단일 파일 **200~300라인 이하**로 유지한다.

**SSOT**: `docs/CRITICAL_LOGIC.md` 3-Layer 구조(Definition / Repository / Service) 준수.

---

## 📊 현황 (2026-03-12 측정)

| 우선순위 | 파일 | 라인 | 분리 전략 |
|---------|------|------|----------|
| 🔴 | `src/modules/golf/hooks/useGolfRecord.ts` | **542** | 훅 3분할: 세션복원·라운드액션·오케스트레이터 |
| 🔴 | `src/modules/admin/styles/adminImport.styles.ts` | **475** | 영역별 스타일 파일 분리(모달·배너·테이블) |
| 🟡 | `app/admin_users.tsx` | **464** | UserCard·StatCard·styles 추출 |
| 🟡 | `app/admin_requests.tsx` | **445** | styles 분리 |
| 🟡 | `src/modules/golf/components/Record/CourseSelector.tsx` | **426** | styles 분리 |
| 🟡 | `src/modules/admin/components/AdminFormComponents.tsx` | **410** | 타입/상수 → admin.types.ts 분리 |
| 🟢 | `app/(tabs)/history.tsx` | **405** | styles 분리 |
| 🟢 | `app/(tabs)/record.tsx` | **373** | styles 분리 |

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ 각 Task = 단 하나의 도구 호출. 실행 전 사용자 승인 필수.

---

### 🔴 Priority 1: `useGolfRecord.ts` (542줄) — 훅 3분할

#### Task 1-A: useGolfRecord.ts 전체 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/hooks/useGolfRecord.ts`
- **Goal**: 세션복원(~L69~234) / 신규라운드 시작(~L235~349) / 홀동기화·자동퍼팅(~L350~542) 경계 확정
- **Dependency**: None

#### Task 1-B: `useGolfSession.ts` 신규 생성 (세션복원 분리)
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/hooks/useGolfSession.ts`
- **Goal**: `loadMasterAndSession` 이관. `dispatch`/`stateRef`/`queryClient`/`modeRef`/`isMounted`를 파라미터로 수신.
- **Pseudocode**:
  ```ts
  export function useGolfSession({ dispatch, stateRef, queryClient, modeRef, isMounted }) {
    const loadMasterAndSession = useCallback(async () => { ... }, [...]);
    return { loadMasterAndSession };
  }
  ```
- **Dependency**: Task 1-A

#### Task 1-C: `useRoundActions.ts` 신규 생성 (라운드 액션 분리)
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/hooks/useRoundActions.ts`
- **Goal**: `startNewRound`, `finalizeRound`, `updateScore`, 홀동기화·자동퍼팅 로직 이관
- **Dependency**: Task 1-B

#### Task 1-D: `useGolfRecord.ts` 오케스트레이터로 축소
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/hooks/useGolfRecord.ts`
- **Goal**: 위 두 훅을 합성하는 얇은 오케스트레이터(목표 ~100라인)로 교체
- **Dependency**: Task 1-C

---

### 🔴 Priority 2: `adminImport.styles.ts` (475줄) — 영역별 스타일 분리

#### Task 2-A: adminImport.styles.ts 전체 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/styles/adminImport.styles.ts`
- **Goal**: 5개 섹션(커스텀 모달·결과 배너·AI 경고·홀 테이블·인간 검증) 라인 경계 확정
- **Dependency**: None

#### Task 2-B: 모달 스타일 분리
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/styles/adminImport.modal.styles.ts`
- **Goal**: 커스텀 모달 관련 스타일 이관
- **Dependency**: Task 2-A

#### Task 2-C: 배너 스타일 분리
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/styles/adminImport.banner.styles.ts`
- **Goal**: 결과 배너 + AI 경고 배너 스타일 이관
- **Dependency**: Task 2-B

#### Task 2-D: 테이블 스타일 분리
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/styles/adminImport.table.styles.ts`
- **Goal**: 홀 테이블 + 인간 검증 체크박스 스타일 이관
- **Dependency**: Task 2-C

#### Task 2-E: 원본 파일 공통 레이아웃만 남기기
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/styles/adminImport.styles.ts`
- **Goal**: 분리된 섹션 제거, 분리된 파일들을 사용하는 곳에서 직접 import 교체
- **Dependency**: Task 2-D

---

### 🟡 Priority 3: `admin_users.tsx` (464줄) — UserCard 추출

#### Task 3-A: admin_users.tsx 전체 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/app/admin_users.tsx`
- **Goal**: `UserCard`(L44~100) / `StatCard`(L248~268) / `getTimeAgo`(L268~284) / `styles`(L284~끝) 경계 확정
- **Dependency**: None

#### Task 3-B: UserCard + StatCard + 유틸 추출
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/components/UserCard.tsx`
- **Goal**: 재사용 가능한 `UserCard`, `StatCard`, `getTimeAgo` 이관
- **Dependency**: Task 3-A

#### Task 3-C: admin_users.tsx에서 추출 코드 제거
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/app/admin_users.tsx`
- **Goal**: 추출된 컴포넌트를 import로 교체, 화면 레이아웃만 잔존
- **Dependency**: Task 3-B

---

### 🟡 Priority 4: `admin_requests.tsx` (445줄) — styles 분리

#### Task 4-A: admin_requests.tsx 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/app/admin_requests.tsx`
- **Goal**: StyleSheet 시작 라인(L300) 및 StatCard 컴포넌트 재사용 가능 여부 확정
- **Dependency**: None

#### Task 4-B: styles 분리
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/styles/adminRequests.styles.ts`
- **Goal**: L300~끝 StyleSheet 이관
- **Dependency**: Task 4-A

#### Task 4-C: admin_requests.tsx import 교체
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/app/admin_requests.tsx`
- **Goal**: 분리된 styles import, 화면 로직만 잔존
- **Dependency**: Task 4-B

---

### 🟡 Priority 5: `CourseSelector.tsx` (426줄) — styles 분리

#### Task 5-A: CourseSelector.tsx 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/components/Record/CourseSelector.tsx`
- **Goal**: L268~끝 StyleSheet 경계 확정
- **Dependency**: None

#### Task 5-B: styles 파일 생성
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/components/Record/courseSelector.styles.ts`
- **Goal**: StyleSheet 이관
- **Dependency**: Task 5-A

#### Task 5-C: CourseSelector.tsx import 교체
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/components/Record/CourseSelector.tsx`
- **Goal**: 인라인 StyleSheet 제거, import 교체
- **Dependency**: Task 5-B

---

### 🟡 Priority 6: `AdminFormComponents.tsx` (410줄) — 타입/상수 분리

#### Task 6-A: AdminFormComponents.tsx 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/components/AdminFormComponents.tsx`
- **Goal**: `TEE_COLORS`, `TeeColorKey`, `HoleInput`, `CourseInput` 분리 영향도 확정
- **Dependency**: None

#### Task 6-B: 타입/상수 파일 생성
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/admin.types.ts`
- **Goal**: `TEE_COLORS`, `TeeColorKey`, `HoleInput`, `CourseInput` 이관
- **Dependency**: Task 6-A

#### Task 6-C: AdminFormComponents.tsx + 참조 파일 import 교체
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/src/modules/admin/components/AdminFormComponents.tsx`
- **Goal**: 분리된 타입 import, 컴포넌트 코드만 잔존
- **Dependency**: Task 6-B

---

### 🟢 Priority 7: `history.tsx` (405줄) — styles 분리

#### Task 7-A: history.tsx StyleSheet 경계 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/app/(tabs)/history.tsx`
- **Goal**: StyleSheet 시작 라인 확정
- **Dependency**: None

#### Task 7-B: styles 파일 생성
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/styles/history.styles.ts`
- **Goal**: StyleSheet 이관
- **Dependency**: Task 7-A

#### Task 7-C: history.tsx import 교체
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/app/(tabs)/history.tsx`
- **Goal**: 인라인 StyleSheet 제거, import 교체
- **Dependency**: Task 7-B

---

### 🟢 Priority 8: `record.tsx` (373줄) — styles 분리

#### Task 8-A: record.tsx 읽기
- **Tool**: `Read`
- **Target**: `c:/develop/golf_scoring/app/(tabs)/record.tsx`
- **Goal**: StyleSheet 경계 및 추가 추출 대상 확정
- **Dependency**: None

#### Task 8-B: styles 파일 생성
- **Tool**: `Write`
- **Target**: `c:/develop/golf_scoring/src/modules/golf/styles/record.styles.ts`
- **Goal**: StyleSheet 이관
- **Dependency**: Task 8-A

#### Task 8-C: record.tsx import 교체
- **Tool**: `Edit`
- **Target**: `c:/develop/golf_scoring/app/(tabs)/record.tsx`
- **Dependency**: Task 8-B

---

## ⚠️ 기술적 제약

- **Encoding**: UTF-8 no BOM 고정.
- **타입 안전성**: 분리 후 `npx tsc --noEmit 2>&1 | head -50` 오류 0 검증.
- **배럴 금지**: 스타일 파일들을 index.ts re-export로 묶지 않는다 — 직접 import 유지.
- **이름 충돌**: `StatCard`가 admin_users/admin_requests 양쪽에 있으므로 추출 시 props 인터페이스 확인 필수.

## ✅ Definition of Done

1. [ ] 300라인 초과 파일 **0개** 달성.
2. [ ] `npx tsc --noEmit` 오류 0개.
3. [ ] `docs/memory.md` 변경 이력 반영.
