# 🧠 Project Memory: Golf Scoring App

> 마지막 갱신: 2026-03-16 (스코어카드 범례 아이콘 정렬 불일치 수정 완료) | 상태: 안정

## 🎯 핵심 요약 (SSOT Summary)

- **Plans**: `docs/plans/fix_admin_import_back_button.md` 완료 (뒤로가기 아이콘 소실 해결).
- **Navigation**: 히스토리 탭 네비게이션 시 `id` 파라미터 기반 세션 동기화 및 생명주기 가드 최적화 완료.
- **Architecture**: Domain-Driven (Definition, Repository, Service) 3-Layer 구조 준수.
- **SSOT**: `docs/CRITICAL_LOGIC.md`를 비즈니스 로직 및 정책의 유일한 진실 공급원으로 운용.
- **Database**: GitHub Actions 기반 AES-256 암호화 매일 자동 백업 체계 구축.
- **Performance**: `staleTime: Infinity`, `isMounted` Guard 및 `InteractionManager`를 통한 네비게이션 애니메이션 우선 순위 확보.
- **Integrity**: 전역 UTF-8 no BOM(소스) 및 UTF-8 with BOM(PowerShell) 인코딩 준수.
- **Standards**: `Rule 3`에 의거하여 `.ps1` 파일의 BOM 무결성 확보 완료.
- **300라인 초과 파일**: 현재 없음 (전부 해소).

## 🚀 최근 변경 사항 (Recent Changes)

- **[2026-03-16: 스코어카드 범례 아이콘 정렬 불일치 수정 완료]**
    - **내용**: 이글(이중 원) 및 더블보기(이중 사각형) 아이콘이 스마트폰에서 몰려 보이는 문제 수정. `position: 'absolute'` + 하드코딩 오프셋(`top: 1, left: 1`) 방식을 부모 View의 `justifyContent/alignItems: 'center'` 기반 flex 정렬로 교체. `symbolDouble` 스타일 클래스 제거.
    - **원인**: Yoga 엔진(RN)은 정수 픽셀+DPR 환산으로 인해 픽셀 오프셋이 어긋남. 웹 브라우저는 서브픽셀 보간으로 우연히 중앙처럼 보였음.
    - **파일**: `src/modules/golf/styles/ScoreCardModal.styles.ts`, `src/modules/golf/components/ScoreCardLegend.tsx`, `src/shared/components/ScoreCardTable.tsx`.
    - **검증**: `npx tsc --noEmit` 통과.

- **[2026-03-16: `useAdminRequestToast` Realtime 오류 안정화 완료]**
    - **내용**: `CHANNEL_ERROR` 및 "Max retries reached" 로그를 `console.error` → `console.warn`으로 교정하여 Expo dev overlay 제거. `AppState` 리스너를 추가하여 앱 포그라운드 복귀 시 retryCount 리셋 및 자동 재구독 복구 로직 도입.
    - **파일**: `src/shared/hooks/useAdminRequestToast.ts`.
    - **검증**: `npx tsc --noEmit` 통과.

- **[2026-03-16: `admin_import` 헤더 뒤로가기 아이콘 소실 수정 완료]**
    - **내용**: `stackOptions` useMemo에 `headerBackVisible: true` 추가(Task 2). `</ScrollView>` 닫힘 태그 누락 및 3항 연산자 `)` 누락 JSX 구조 버그 병행 수정.
    - **파일**: `app/admin_import.tsx`.
    - **검증**: `npx tsc --noEmit` 통과.

- **[2026-03-16: 핵심 로직 문서(SSOT) 한글 통일 완료]**
    - **내용**: `docs/CRITICAL_LOGIC.md`의 한영 혼용 구문을 **한국어**로 전면 정제하여 가독성 및 관리 표준을 확보함.
    - **효과**: 시니어 아키텍트 톤의 일관된 언어 유지 및 비즈니스 로직에 대한 팀 내 이해도 증진.
    - **파일**: `docs/CRITICAL_LOGIC.md`.

- **[2026-03-16: Antigravity Extension Silent Loop 진단 및 긴급 조치]**
    - **현상**: `Always run` 팝업 무한 반복 및 `Permissions` 카운트 이상 상승.
    - **원인**: 백그라운드 명령어 스캔(`AutoCmd`)과 자동 승인(`AutoAcceptFREE`) 간의 이벤트 루프 발생.
    - **조치**: `.cursorrules`를 생성하여 `node_modules`, `tmp`, `.git` 등 불필요 경로의 스캔을 차단함.
    - **권장**: 조치 완료 후 IDE `Reload Window`를 통한 세션 초기화 필수.

- **[2026-03-16: JSON Bulk Import 탭 전환 깜빡임 해결 - 최종 고도화 완료]**
    - **내용**: 탭 전환 시의 세션 안정성을 극대화하고, 작업 중인 내용 유무와 상관없이 UI가 유지되도록 설계를 개선함.
    - **Task 1 (보완)**: `AdminContext`에서 권한 체크 실패 시, 기존에 관리자였다면 즉시 권한을 박탈하지 않고 상태를 유지하는 **Graceful Degradation** 도입.
    - **Task 2 (보완)**: `admin_import.tsx`에서 `jsonText` 의존성 제거. 빈 입력창 상태에서도 탭 전환 시 깜빡임이나 차단 화면 없이 UI 유지.
    - **검증**: `npx tsc --noEmit` 통과 및 논리 구조 검증 완료.

- **[2026-03-16: 로그아웃 세션 예외 처리 및 안정화 - 완료]**
    - **내용**: 로그아웃 과정에서 발생하는 `Invalid Refresh Token` 런타임 에러를 해결하고 세션 관리의 안정성을 확보함.
    - **Task 1**: `index.tsx` 로그아웃 버튼 `await signOut()` 적용 및 `isLoggingOut` 상태 가드 도입.
    - **Task 2**: `syncRoundRepository`의 `getSession()` 호출부에 `catch` 처리 및 세션 부재 시 즉시 Early Return 적용.
    - **Task 3**: `AdminContext`에서 `SIGNED_OUT` 이벤트 발생 시 추가적인 세션 조회를 차단하고 즉시 상태를 Guest로 동기화.
    - **Task 4**: `npx tsc --noEmit`을 통한 전체 프로젝트 타입 무결성 검증 완료.
    - **파일**: `app/(tabs)/index.tsx`, `src/modules/golf/repository/golf.round.sync.repository.ts`, `src/shared/contexts/AdminContext.tsx`.

- **[2026-03-16: 글로벌 깜빡임 방지 전수 점검 - Task 4 및 전체 완료]**
    - **내용**: `app/admin_import.tsx`에서 개발 및 검증 단계에서 사용되었던 디버깅용 `useEffect` 및 윈도우 포커스 이벤트 리스너를 제거함. 전수 점검(Task 1~4)을 통해 관리자 페이지 및 입력 폼에서의 깜빡임 프리 현상을 최종 확정함.
    - **파일**: `app/admin_import.tsx`.
    - **검증**: 불필요한 콘솔 로그 및 부수 효과 제거 완료.
    - **내용**: `src/modules/admin/components/` 내 관리자 컴포넌트들의 최적화 상태를 전수 점검함. `ClubPreviewCard`, `UserCard`, `AdminFormComponents` 등 주요 컴포넌트에 `React.memo` 적용을 확인하였으며, 누락되었던 `AdminNavButtons` 및 `ClubSelectModal`에 `memo`를 추가하여 리렌더링 부하를 최소화함.
    - **파일**: `src/modules/admin/components/AdminNavButtons.tsx`, `src/modules/admin/components/ClubSelectModal.tsx`.
    - **검증**: `memo` 적용 및 정적 분석 통과.

- **[2026-03-16: 글로벌 깜빡임 방지 전수 점검 - Task 2 완료]**
    - **내용**: `app/(tabs)/record.tsx` 및 `index.tsx`를 대상으로 포커스 복귀 시 데이터 유지 및 깜빡임 여부를 점검함. `index.tsx`는 `staleTime: Infinity`를 통해 안정성을 확보하고 있으며, `record.tsx`는 `useFocusEffect` 내부에 `activeSession` 존재 시 로딩을 건너뛰는 가드 로직이 완비되어 포커스 이동 시 UI Reset이 발생하지 않음을 확인(Pass).
    - **파일**: `app/(tabs)/record.tsx`, `app/(tabs)/index.tsx`, `src/modules/golf/hooks/useDashboardData.ts`.
    - **검증**: `useFocusEffect` 가드 로직 및 InteractionManager 적용 확인.

- **[2026-03-16: 글로벌 깜빡임 방지 전수 점검 - Task 1 완료]**

- **[2026-03-16: 알트탭 리렌더링 및 UI 깜빡임 해결 - 전체 완료]**

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

- **[2026-03-16: 핵심 도메인 인터페이스 Strict Typing 적용 완료]**
    - **내용**: `RecordMainContent` 등에 엄격한 타입을 적용함. `GolfState`, `GolfActions` 등 핵심 인터페이스를 `golf.types.ts`에 정의하여 엄격한 타이핑(Strict Typing)을 구현함.
    - **파일**: `app/(tabs)/record.tsx`, `src/modules/golf/components/Record/RecordMainContent.tsx`, `src/modules/golf/golf.types.ts`.
    - **검증**: `npx tsc --noEmit` 통과.

- **[2026-03-16: 히스토리 네비게이션 세션 동기화 수정 완료]**
  - **내용**: 히스토리 탭에서 다른 라운드 기록을 연달아 수정 진입할 때 이전 세션이 남는 문제를 해결함. `record.tsx`에 `id` 파라미터 감지 로직을 추가하고, `useFocusEffect` 클린업 시 소비 상태를 초기화하여 서로 다른 세션 간 전환이 즉각적으로 반영되도록 개선함.
  - **파일**: `app/(tabs)/history.tsx`, `app/(tabs)/record.tsx`, `docs/plans/fix_history_sync_issue.md`.
  - **검증**: `npx tsc --noEmit` 통과.

- **[2026-03-15: 이전 작업 요약]**
  - 히스토리 탭 리스트 정렬 안정화 및 성능 최적화 (Task 1~4 완료).
  - 스코어카드 모달 애니메이션 및 홍보 문구 추가.
  - `dev.bat` 실행 시 PowerShell 인코딩(BOM) 에러 해결.
  - 네비게이션 파라미터 소비 정책(`consumedModeRef`) 도입으로 리다이렉트 버그 수정.

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
