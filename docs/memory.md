# 🧠 Project Memory: Golf Scoring App

> 마지막 갱신: 2026-03-16 (관리자 실시간 알림 안정성 확보 완료) | 상태: 완료 (Completed)

## 🎯 핵심 요약 (SSOT Summary)

- **Navigation**: 히스토리 탭 네비게이션 시 `id` 파라미터 기반 세션 동기화 및 생명주기 가드 최적화 완료.
- **Architecture**: Domain-Driven (Definition, Repository, Service) 3-Layer 구조 준수.
- **SSOT**: `docs/CRITICAL_LOGIC.md`를 비즈니스 로직 및 정책의 유일한 진실 공급원으로 운용.
- **Database**: GitHub Actions 기반 AES-256 암호화 매일 자동 백업 체계 구축.
- **Performance**: `staleTime: Infinity`, `isMounted` Guard 및 `InteractionManager`를 통한 네비게이션 애니메이션 우선 순위 확보.
- **Integrity**: 전역 UTF-8 no BOM(소스) 및 UTF-8 with BOM(PowerShell) 인코딩 준수.
- **Standards**: `Rule 3`에 의거하여 `.ps1` 파일의 BOM 무결성 확보 완료.
- **300라인 초과 파일**: 현재 없음 (전부 해소).

## 🚀 최근 변경 사항 (Recent Changes)

- **[2026-03-16: 알트탭 리렌더링 및 UI 깜빡임 해결 - 전체 완료]**
    - **내용**: 브라우저 포커스 복귀 시 발생하는 불필요한 리렌더링 및 UI 깜빡임을 근본적으로 해결함. `QueryClient` 전역 설정에서 `refetchOnWindowFocus`를 차단하고, `AdminContext`에서 세션 갱신 시 캐시된 정보가 있다면 로딩 상태 토글을 생략하는 "Soft Refetch" 전략을 도입함.
    - **파일**: `app/_layout.tsx`, `src/shared/contexts/AdminContext.tsx`, `app/admin_import.tsx`.
    - **검증**: `jsonText` 데이터 유실 Zero 및 스피너 노출 차단 확인.

- **[2026-03-16: 관리자 실시간 알림 안정성 확보 - 전체 완료]**
    - **내용**: `useAdminRequestToast` 훅에 **Instance Identity** 전략을 도입함. `activeChannel` 로컬 변수와 부모 스코프의 `channel`을 비교하여, `removeChannel` 이후 비동기적으로 발생하는 지연된 `CLOSED` 이벤트가 새로운 구독 세션에 간섭하지 않도록 차단함. `CLOSED` 상태를 에러 로그에서 제외하여 불필요한 노이즈 제거 완료.
    - **파일**: `src/shared/hooks/useAdminRequestToast.ts`.
    - **검증**: `npx tsc --noEmit` 통과 확인.

 
- **[2026-03-16: 관리자 전역 상태 최적화 - Task 4 완료]**
    - **내용**: `admin_import.tsx` 페이지의 권한 체크 로직을 Early Return에서 조건부 렌더링으로 변경하여 Root Container(`/SafeAreaView`)를 유지함. `AdminContext`의 전역 캐시와 결합하여 페이지 재진입 시 "Spinner -> Content" 전환을 제거하고, `Animated.View`의 중복 애니메이션 실행을 원천 차단함.
    - **파일**: `app/admin_import.tsx`.
    - **검증**: `Stack.Screen` 위치 조정 및 JSX 구조 안정화 확인.

- **[2026-03-16: 관리자 전역 상태 최적화 - Task 3 완료]**
    - **내용**: `AdminContext` 및 `AdminProvider`를 도입하여 관리자 권한 확인 로직을 단일화함. `useIsAdmin` 훅이 이 전역 컨텍스트를 구독하도록 리팩토링하여, 화면 전환 시 발생하는 중복 API 호출 및 불필요한 상태 업데이트(리렌더링)를 원천 차단함.
    - **파일**: `src/shared/contexts/AdminContext.tsx`, `src/shared/components/useIsAdmin.ts`, `app/_layout.tsx`.
    - **검증**: `AdminProvider`를 `app/_layout.tsx`에 적용하여 앱 전역에서 상태 공유 확인.

- **[2026-03-16: 관리자 전역 상태 최적화 - Task 2 완료]**
    - **내용**: `useAdminRequestToast` 훅에 `InteractionManager`를 도입하여 네비게이션 애니메이션 중 구독 시도를 지연시키고, `CHANNEL_ERROR` 발생 시 지수 백오프(Exponential Backoff) 기반의 재시도 로직을 추가하여 실시간 알림의 안정성을 확보함.
    - **파일**: `src/shared/hooks/useAdminRequestToast.ts`.
    - **검증**: `InteractionManager` 및 `setTimeout` 클린업 로직 적용 완료.

- **[2026-03-16: 관리자 전역 상태 최적화 - Task 1 완료]**
    - **내용**: `useIsAdmin` 훅의 `syncAdminStatus` 내부에 함수형 업데이트(`setIsAdmin(prev => ...)`) 및 조건부 가드를 적용하여, 값이 실제로 변하지 않았을 때 발생하는 불필요한 리렌더링을 완전히 차단함.
    - **파일**: `src/shared/components/useIsAdmin.ts`.
    - **검증**: `isChanged` 미사용 변수 제거 및 런타임 안정성 확보.


- **[2026-03-16: JSON Bulk Import 성능 최적화 - Task 4 및 전체 완료]**
  - **내용**: `useIsAdmin` 훅의 상태 업데이트 로직을 최적화하여 권한 확인 시 값이 변경되지 않았거나 이미 로딩이 완료된 경우 불필요한 리렌더링을 차단함. 이로써 `useBulkImport`, `ClubPreviewCard`, `admin_import`를 포함한 모든 성능 최적화 태스크(Task 1~4)가 완료됨.
  - **파일**: `src/shared/components/useIsAdmin.ts`, `app/admin_import.tsx`, `src/modules/admin/hooks/useBulkImport.ts`, `src/modules/admin/components/ClubPreviewCard.tsx`.
  - **검증**: 상태 업데이트 가드 로직 적용 확인.

- **[2026-03-16: JSON Bulk Import 성능 최적화 - Task 3 완료]**
  - **내용**: `admin_import.tsx` 페이지의 대량 데이터 검증 로직(map/reduce)을 `useMemo`로 추출하고, `Stack.Screen` 옵션 및 샘플 로드 핸들러를 메모이제이션하여 윈도우 포커스 전환 시 발생하는 리렌더링 및 연산 부하를 최소화함.
  - **파일**: `app/admin_import.tsx`.
  - **검증**: `useMemo`, `useCallback` 적용 및 인라인 로직 분리 확인.

- **[2026-03-16: JSON Bulk Import 성능 최적화 - Task 2 완료]**
  - **내용**: `ClubPreviewCard` 컴포넌트에 `React.memo`를 적용하여 부모 컴포넌트(`admin_import.tsx`) 리렌더링 시 불필요한 하위 트리 렌더링을 차단함. 대량의 구장 데이터 로드 시 UI 응답성 향상.
  - **파일**: `src/modules/admin/components/ClubPreviewCard.tsx`.
  - **검증**: `React.memo` 적용 확인.

- **[2026-03-16: JSON Bulk Import 성능 최적화 - Task 1 완료]**
  - **내용**: `useBulkImport` 훅의 모든 핸들러를 `useCallback`으로 래핑하고 반환 객체를 `useMemo`로 처리하여 참조 안정성을 확보함. 부모 컴포넌트 리렌더링 시 불필요한 훅 내부 로직 재계산 방지.
  - **파일**: `src/modules/admin/hooks/useBulkImport.ts`.
  - **검증**: `useMemo`, `useCallback` 적용 확인.

- **[2026-03-16: GitHub Actions DB 백업 워크플로우 Task 1 철회 및 롤백]**
  - **내용**: 이전 세션에서 이미 해결된 문제(`PGHOST` 방식 호출 및 `pg_dump 17` 설치)임이 확인되어, 이번 세션에서 시도했던 `SUPABASE_DB_URL` 기반 통합 및 가드 추가 작업을 철회하고 `db_backup.yml`을 이전 상태로 롤백함.
- **[2026-03-16: GitHub Actions DB 백업 pg_dump 버전 불일치 수정]**
  - **원인**: Supabase 서버 PostgreSQL **17.6** vs Ubuntu 기본 `pg_dump` **16.13** — 메이저 버전 불일치로 pg_dump 거부.
  - **수정**: `.github/workflows/db_backup.yml` — PGDG 공식 apt 리포지토리를 추가하여 `postgresql-client-17` 설치로 변경.
  - **이전 문제**: `SUPABASE_DB_URL` 단일 시크릿 → `PGHOST`/`PGUSER`/`PGPASSWORD` 분리 방식 전환(이전 세션 완료). 이번 세션에서 연결 성공 확인(`SELECT 1` 통과).
  - **필요 시크릿**: `SUPABASE_DB_HOST`, `SUPABASE_DB_USER`(`postgres.eqzobqeotfxvsllforew`), `SUPABASE_DB_PASSWORD`, `BACKUP_PASSWORD`
  - **배경**: GitHub Actions 러너는 IPv4 전용 → Direct connection URL(IPv6 전용) 불가 → Session Pooler 필수.
  - **검증**: 워크플로우 재실행 필요 (코드 수정 완료).
- **[2026-03-16: 히스토리 네비게이션 세션 동기화 수정 완료]**
  - **내용**: 히스토리 탭에서 다른 라운드 기록을 연달아 수정 진입할 때 이전 세션이 남는 문제를 해결함. `record.tsx`에 `id` 파라미터 감지 로직을 추가하고, `useFocusEffect` 클린업 시 소비 상태를 초기화하여 서로 다른 세션 간 전환이 즉각적으로 반영되도록 개선함.
  - **파일**: `app/(tabs)/history.tsx`, `app/(tabs)/record.tsx`, `docs/plans/fix_history_sync_issue.md`.
  - **검증**: `npx tsc --noEmit` 통과 및 파라미터 소비 로직 정상 작동 확인.
- **[2026-03-16: 기록 컴포넌체 런타임 에러(순환 참조) 수정 완료]**
  - **내용**: `RecordMainContent.tsx`와 `index.ts` 간의 순환 참조로 인해 발생하던 `Component is not a function` 에러를 해결함. `RecordMainContent` 내부의 하위 컴포넌트 임포트를 개별 파일 직접 참조로 변경하고, `app/(tabs)/record.tsx`에서도 직접 참조 방식을 적용하여 런타임 안정성을 확보함.
  - **파일**: `src/modules/golf/components/Record/RecordMainContent.tsx`, `app/(tabs)/record.tsx`.
  - **검증**: `npx tsc --noEmit` 통과 및 런타임 렌더링 정상 확인.
- **[2026-03-16: 기록 수정 진입 및 렌더링 최적화 - Task 4 완료]**
  - **내용**: `RecordMainContent`에서 `CourseHeader`를 `Animated.View` 외부로 분리하여 홀 전환 시 상단 UI의 안정성을 확보함. `InteractionManager`와 `isTransitioning` 상태를 도입하여 홀 전환 애니메이션이 시작될 때 무거운 UI 렌더링을 지연시키는 "Animation First" 전략을 적용함.
  - **파일**: `src/modules/golf/components/Record/RecordMainContent.tsx`.
  - **검증**: `npx tsc --noEmit` 통과 및 홀 전환 시각적 부드러움 개선.
- **[2026-03-16: 기록 수정 진입 및 렌더링 최적화 - Task 3 완료]**
  - **내용**: `useGolfRecord`, `useGolfSession`, `useRoundActions` 훅의 반환 객체에 `useMemo`를 적용하여 참조 안정성을 확보함. `setCurrentHole`과 `setPutt` 내부에 상태 동기화 로직을 통합하여 불필요한 `useEffect` 기반 디스패치를 제거하고 렌더링 사이클을 단축함.
  - **파일**: `src/modules/golf/hooks/useGolfRecord.ts`, `src/modules/golf/hooks/useGolfSession.ts`, `src/modules/golf/hooks/useRoundActions.ts`.
  - **검증**: `npx tsc --noEmit` 통과 및 훅 구조 최적화 완료.
- **[2026-03-16: 기록 수정 진입 및 렌더링 최적화 - Task 2 완료]**
  - **내용**: `RecordScreen`, `RecordMainContent`, `RecordFooter` 컴포넌트 내의 모든 인라인 핸들러를 `useCallback`으로 메모이징하여 하위 컴포넌트의 불필요한 재렌더링을 차단함. `ScoreAdjuster` 등 핵심 UI 요소에 전달되는 콜백의 참조 안정성 확보.
  - **파일**: `app/(tabs)/record.tsx`, `src/modules/golf/components/Record/RecordMainContent.tsx`, `src/modules/golf/components/Record/RecordFooter.tsx`.
  - **검증**: `npx tsc --noEmit` 통과.
- **[2026-03-16: 기록 수정 진입 및 렌더링 최적화 - Task 1 완료]**
  - **내용**: `app/(tabs)/record.tsx`의 거대한 렌더링 트리를 `RecordMainContent` 컴포넌트로 분리하고 `React.memo`를 적용함. `GolfState`, `GolfActions` 등 핵심 인터페이스를 `golf.types.ts`에 정의하여 엄격한 타이핑(Strict Typing)을 구현함.
  - **파일**: `app/(tabs)/record.tsx`, `src/modules/golf/components/Record/RecordMainContent.tsx`, `src/modules/golf/golf.types.ts`.
  - **검증**: `npx tsc --noEmit` 통과.
- **[2026-03-16: 네비게이션 리다이렉트 버그 수정 - Task 3 완료]**
  - **내용**: `src/shared/components/useIsAdmin.ts` 훅의 로딩 상태 제어 로직을 보강함. 로그인(`SIGNED_IN`) 및 초기 권한 확인 시 `isLoading` 상태를 명시적으로 true로 제어하여, 관리자 탭이 순식간에 사라졌다 나타나는 플리커(Flicker) 현상을 방지함.
  - **파일**: `src/shared/components/useIsAdmin.ts`
  - **검증**: `tsc --noEmit` 통과.
- **[2026-03-16: 네비게이션 리다이렉트 버그 수정 - Task 2 완료]**
  - **내용**: `app/(tabs)/record.tsx`의 `useFocusEffect` 초기화 로직을 보강함. 파라미터가 없는 일반 진입 시에도 `activeSession`이 없고 초기 상태(`selectionStep === 'club'`)라면 DB에서 진행 중인 라운드를 자동으로 조회하여 수정 화면으로 진입하도록 개선함.
  - **파일**: `app/(tabs)/record.tsx`
  - **검증**: `loadMasterAndSession` 호출 조건 명확화 및 `tsc --noEmit` 통과.
- **[2026-03-16: 네비게이션 리다이렉트 버그 수정 - Task 1 완료]**
  - **내용**: `app/(tabs)/_layout.tsx`에서 탭 버튼 클릭 시 호출되던 `router.setParams`를 제거하여 현재 활성화된 탭의 파라미터가 오염되는 문제를 원천 차단함. `RecordTabButton`의 이벤트 핸들러 타입을 `any`에서 `unknown`으로 강화하여 타입 안정성을 확보함.
  - **파일**: `app/(tabs)/_layout.tsx`
  - **검증**: `handleRecordTabPress` 내 파라미터 주입 로직 제거 확인.
- **[2026-03-15: 히스토리 탭 자동 리다이렉트 버그 수정 완료]**
  - **내용**: 히스토리 탭 클릭 시 기록 수정 탭으로 강제 이동되던 현상을 해결함. `app/(tabs)/_layout.tsx`에서 `router.replace` 대신 `setParams`를 사용하여 내비게이션 경쟁 상태를 제거하고, `app/(tabs)/record.tsx`에 `consumedModeRef`를 도입하여 파라미터 소비 루프를 차단함.
  - **파일**: `app/(tabs)/_layout.tsx`, `app/(tabs)/record.tsx`.
  - **검증**: `npx tsc --noEmit` 통과 및 실제 기기 동작 확인.
- **[2026-03-15: 히스토리 탭 리스트 정렬 안정화 완료]**
  - **내용**: 데이터 동기화 시 리스트 순서가 무작위로 변하는 현상을 방지하기 위해 UI(`HistoryScreen`)와 서비스 레이어(`resolveMergedRounds`) 모두에 `date` 내림차순(1순위), `id` 내림차순(2순위) 정렬 로직을 적용함.
  - **파일**: `app/(tabs)/history.tsx`, `src/modules/golf/golf.service.ts`.
  - **검증**: `npx tsc --noEmit` 통과 및 리스트 정렬 안정성 확보.
- **[2026-03-15: 히스토리 탭 성능 최적화 Task 4 완료]**
  - **내용**: `RecordScreen` 초기 로딩(`loadMasterAndSession`) 시 발생하는 상태 업데이트를 병합하여 불필요한 재렌더링을 방지함. `INIT_SESSION` 액션 시점에 `isManualLoading`을 동시에 해제하도록 리듀서를 최적화함.
  - **파일**: `src/modules/golf/hooks/golfRecord.state.ts`, `src/modules/golf/hooks/useGolfSession.ts`.
- **[2026-03-15: 히스토리 탭 성능 최적화 Task 3 완료]**
  - **내용**: `HistoryItem` 컴포넌트 내부에 `useMemo`를 적용하여 라운드 요약 정보(`calculateSummary`)의 불필요한 재계산을 방지하고 렌더링 효율을 개선함.
  - **파일**: `app/(tabs)/history.tsx`.
- **[2026-03-15: 히스토리 탭 성능 최적화 Task 2 완료]**
  - **내용**: `ClubQueryRepository`에 인메모리 캐싱(`courseCache`)을 도입하여 동일 코스 정보 조회 시 불필요한 Supabase 네트워크 호출을 제거함.
  - **파일**: `src/modules/golf/repository/golf.club.query.repository.ts`.
- **[2026-03-15: 히스토리 탭 성능 최적화 Task 1 완료]**
  - **내용**: `HistoryScreen` 진입 시 자동 동기화 로직에 `InteractionManager`를 적용하여 탭 전환 애니메이션 중 발생하는 렉(Lag)을 제거함.
  - **파일**: `app/(tabs)/history.tsx`.
- **[2026-03-15: 스코어카드 모달 닫기 애니메이션 최적화 완료]**
  - **결과**: `Reanimated`의 `exiting` 속성을 제거하고 Native `Modal`의 `fade` 애니메이션에 종료 라이프사이클을 위임하여 고스팅(Ghosting) 현상 완전 해결.
  - **스타일**: `modalOverlay` 배경색을 `rgba(0, 0, 0, 0.75)`로 조정하여 페이드 아웃 시 시각적 잔상 최소화 및 깊이감 확보.
  - **검증**: `tsc --noEmit` 통과 및 실제 환경에서 종료 누락 현상 없음 확인.
- **[2026-03-15: 스코어카드 하단 홍보 문구 추가 완료]**
  - **기능**: 대시보드 스코어카드 확인 시 18홀 완료 기록에 대해 "오늘 라운딩은 즐거우셨나요?" 홍보 섹션 노출.
  - **디자인**: `Glassmorphism` 스타일 적용 (투명도 있는 배경 및 테두리).
  - **기술적 세부사항**: `ViewShot` 외부에 배치하여 공유 이미지에는 포함되지 않도록 설계 (사용자 요청 반영).
  - **파일**: `ScoreCardModal.tsx`, `ScoreCardModal.styles.ts`.
  - **검증**: `tsc --noEmit` 통과.
- **[2026-03-15: dev.bat 실행 시 surgical_guard.ps1 파싱 에러 해결]**
  - **원인**: `surgical_guard.ps1` 및 `error_handler.ps1`이 BOM 없는 UTF-8로 저장되어 있어, PowerShell 5.1 환경에서 한국어 문자열을 CP949로 잘못 파싱하여 구문 오류(문자열 종료 미비 등) 발생.
  - **수정**: 해당 파일들을 .NET API(`WriteAllText`)를 사용하여 **UTF-8 with BOM** 형식으로 재저장함.
  - **검증**: `dev.bat` 실행 시 PowerShell 구문 에러 없이 정상적으로 앱 환경 감지 및 Metro Bundler 단계 진입 확인.
  - **Rule 준수**: `User Rule 3` (PowerShell = UTF-8 with BOM) 엄격 적용.
- **[2026-03-15: 히스토리 전환 시 기록 로딩 오류 수정 완료]**
  - **원인**: `useFocusEffect`의 Guard 로직이 `mode: 'edit'` 상태를 고려하지 않아, 히스토리에서 다른 기록 선택 시 기존 세션을 그대로 유지하는 버그 발생.
  - **수정**: `app/(tabs)/record.tsx` — `mode` 파라미터 존재 시 기존 세션 무시 및 로딩 프로세스 강제. 로딩 직후 `mode` 파라미터 소비(`clear`) 로직을 `'edit'` 케이스까지 확장.
  - **SSOT**: `docs/CRITICAL_LOGIC.md` Section 5의 네비게이션 프로토콜에 파라미터 소비 정책(**Parameter Consumption Policy**) 명문화.
  - **검증**: `tsc --noEmit` 결과 오류 0 확인.

## 🗂️ 레포지토리 구조 (Repository Layer)

```text
src/modules/golf/repository/
  golf.round.repository.ts         ← Aggregator (7라인)
  golf.round.local.repository.ts   ← Local CRUD + 큐 관리 (140라인)
  golf.round.sync.repository.ts    ← Supabase 동기화 (197라인)
  golf.club.repository.ts          ← Aggregator (7라인)
  golf.club.query.repository.ts    ← 조회 전용 (174라인)
  golf.club.mutation.repository.ts ← 쓰기/삭제 (149라인)
  golf.match.repository.ts
```

## 🛠️ 기술적 완성도 (Technical Debt Status)

- **Encoding**: UTF-8 no BOM 물리 무결성 확보.
- **Async Strategy**: Singleton Promise 및 Keyed Async Lock을 통한 경쟁 상태(Race Condition) 방지.
- **UI Stable**: Stable Ref Pattern (User Rule 9) 적용으로 Hook 안정성 확보.

## 🔜 향후 과제 (Next Steps)

1. 백업 워크플로우 수동 재실행으로 `pg_dump 17` + 암호화 업로드 end-to-end 검증.
2. UI/UX 디자인 고도화 (Ark UI 최우선 적용).

---

### 🔗 Artifacts & Documents

- [CRITICAL_LOGIC.md](./CRITICAL_LOGIC.md) : 비즈니스 로직 SSOT
- [archives/plans/](./archives/plans/) : 완료된 작업 실록

Generated by Antigravity Senior Architect
