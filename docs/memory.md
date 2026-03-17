# 🧠 Project Memory: Golf Scoring App

> 마지막 갱신: 2026-03-17 (히스토리 보기/수정 후 라운딩 종료 시 다른 코스 기록 노출 버그 수정 완료) | 상태: 안정(Stable)

## 🎯 핵심 요약 (SSOT Summary)

- **Performance**: Metro 번들러 Persistent Cache 강화, Lucide Direct Import 패턴 전수 적용, EXPO_USE_METRO_WORKSPACE_ROOT=1 환경 변수 적용 완료.
- **Branding**: 서비스 명칭을 `GOLF SCORE`에서 **`Score Note`**로 공식 변경 및 랜딩 페이지 고도화 진행 중.
- **UI/UX**: `ServiceIntroSlider` 안정성 강화 및 로그인 버튼 레이아웃 최적화 계획 수립.
- **Navigation**: 히스토리 탭 `id` 파라미터 기반 세션 동기화 및 생명주기 가드 최적화 완료.
- **Architecture**: Domain-Driven (Definition, Repository, Service) 3-Layer 구조 준수.
- **SSOT**: `docs/CRITICAL_LOGIC.md`를 비즈니스 로직 및 정책의 유일한 진실 공급원으로 운용.
- **Database**: GitHub Actions 기반 AES-256 암호화 매일 자동 백업 체계 구축.
- **Integrity**: 전역 UTF-8 no BOM(소스) 및 UTF-8 with BOM(PowerShell) 인코딩 준수.
- **300라인 초과 파일**: 현재 없음 (전부 해소).

## 🚀 최근 변경 사항 (Recent Changes)

- **[2026-03-17: 히스토리 보기/수정 후 라운딩 종료 시 다른 코스 기록 노출 버그 수정]**
    - **증상**: 히스토리에서 여러 기록을 "보기/수정"으로 열어놓은 뒤, 대시보드에서 "라운딩 종료"를 누르면 해당 기록 대신 다른 코스의 기록이 대시보드에 등장.
    - **원인 1 (근본)**: `history.tsx#handleViewRound`가 기록 조회 목적으로 `setCurrentRoundId(roundId)`를 호출 → 전역 `currentRoundId`가 오염됨. `record.tsx`는 URL param `id`로 이미 자체 처리하므로 중복 호출이었음.
    - **원인 2 (증상)**: `golf.service.ts#getDashboardDisplayRound`의 `return rounds[0]` fallback → `currentRoundId=null`이 되면 정렬 미보장 `rounds[0]`(타 코스)가 렌더링됨.
    - **수정 1**: `getDashboardDisplayRound` fallback을 `return null`로 변경 → 활성 세션 없으면 `EmptyState` 정상 표시.
    - **수정 2**: `handleViewRound`에서 `setCurrentRoundId` 호출 완전 제거 → 읽기 전용 네비게이션으로 전환.
    - **파일**: `src/modules/golf/golf.service.ts` (1줄), `app/(tabs)/history.tsx` (4줄 → 2줄 축약).

- **[2026-03-17: Record 탭 진입 시 CourseSelector 불필요 노출 버그 수정]**
    - **증상**: 대시보드에서 진행 중인 라운드가 표시된 상태로 스코어 입력 탭 전환 시 구장 선택 화면이 노출됨.
    - **원인**: `record.tsx:174`의 로딩 스피너 조건 `isLoadingMaster && activeSession !== null`에서 `!activeSession` 블록 내부이므로 `activeSession !== null`이 항상 `false` → 스피너가 절대 표시되지 않고 `CourseSelector`가 즉시 렌더링됨.
    - **수정**: 조건을 `isLoadingMaster`로 단순화 → 세션 복원 로딩 중 스피너 표시, 완료 후 `RecordMainContent` 전환.
    - **파일**: `app/(tabs)/record.tsx` (1줄 수정).

- **[2026-03-17: Vercel 배포 결함 해결 및 임포트 경로 정규화 진행 중]**
    - **성과**: `babel-plugin-module-resolver` 설치(Task 1) 및 `babel.config.js` 설정(Task 2) 완료. `app/(tabs)/_layout.tsx` 임포트 정교화(Lucide v0.576.0 대응 포함) 및 Lucide Direct Import 원칙 고수(Task 3) 완료. `SSOT_PATH_CONVENTION.md` 작성을 통해 경로 규칙을 공식화(Task 4) 완료. 최종 환경 검증(`tsc` 및 `expo export`)을 통해 무결성 입증(Task 5) 완료.
    - **후속 작업**: Vercel 재배포 테스트 및 모니터링.

- **[2026-03-17: HandicapBanner 제거 완료 — UI 단순화]**
    - **결정**: `HandicapBanner` 컴포넌트 및 관련 `estimatedHandicap` 로직 전체 제거.
    - **근거**: 5경기 미만일 때 정보 밀도 0(안내문만 표시), 5경기 이상에서도 핸디캡 지수(24.5)보다 단순 평균 스코어가 일반 사용자에게 더 직관적. USGA 계산 로직(`golf.service.ts#estimateHandicap`)은 향후 재활용을 위해 서비스 레이어에 보존.
    - **파일 삭제**: `src/modules/golf/components/Dashboard/HandicapBanner.tsx`
    - **수정**: `app/(tabs)/index.tsx`, `app/(tabs)/history.tsx`, `src/modules/golf/hooks/useDashboardData.ts`, `src/modules/golf/components/Dashboard/index.ts`

- **[2026-03-17: TanStack Query 키 상수화 작업 완료]**
    - **Task 1, 2, 3 완료**: 프로젝트 내 모든 `queryKey` 리터럴을 `src/shared/lib/queryKeys.ts`에서 정의한 `QUERY_KEYS` 상수로 일괄 교체 완료.
    - **적용 범위**: `src/modules/golf/hooks/` (useRoundActions, useGolfSession, useGolfRecord, useDashboardData) 및 `app/` 하위 전역 (_layout, index, record, history, notice).
    - **효과**: 하드코딩된 문자열 리터럴 제거로 런타임 캐시 불일치 위험을 해소하고 타입 안정성 및 SSOT 확보.
    - **파일**: `src/shared/lib/queryKeys.ts`, `docs/plans/query_key_constantization.md` 및 다수 소스 파일.

- **[2026-03-17: 랜딩 슬라이더 실데이터 이미지 고도화 완료]**
    - `ServiceIntroSlider`: 기존 3슬라이드 → **5슬라이드**로 확장.
    - 3번 슬라이드(빈 대시보드 스크린샷) → `landing_dashboard.png`(실 데이터 포함)으로 교체.
    - 4번 슬라이드 추가: **미스 패턴 분석** (`landing_miss_pattern.png`).
    - 5번 슬라이드 추가: **스마트 통계 분석** (`landing_round_stats.png`, ROUND STATS 그리드).
    - **파일**: `src/shared/components/ServiceIntroSlider.tsx`.
    - **에셋**: `assets/images/landing_dashboard.png`, `landing_miss_pattern.png`, `landing_round_stats.png` (사용자 직접 배치).

- **[2026-03-17: 랜딩 페이지 UI 및 사용자 경험 개선 완료]**
    - `ServiceIntroSlider`: `useWindowDimensions` 및 `getItemLayout` 적용으로 웹/모바일 페이징 정확도 및 반응형 성능 확보.
    - 로그인 화면(`login.tsx`): 구글 로그인 버튼 및 헤더에 가로 패딩(40px)과 최대 너비(520px)를 적용하여 대칭미와 균형 잡힌 레이아웃 완성.
    - **파일**: `app/(auth)/login.tsx`, `src/shared/components/ServiceIntroSlider.tsx`.

- **[2026-03-16: 랜딩 페이지 고도화 및 브랜딩 변경 완료]**
    - 서비스 브랜딩을 `GOLF SCORE`에서 **`Score Note`**로 공식 변경.
    - 실제 서비스 화면(`Score Entry`, `History`, `Dashboard`)을 캡처한 홍보 에셋 생성 및 `assets/images/` 통합.
    - 로그인 전 서비스 기능을 미리 체험할 수 있는 `ServiceIntroSlider` 컴포넌트 구현 및 `app/(auth)/login.tsx` 통합.
    - 자동 슬라이딩(5초) 및 Reanimated 기반 인디케이터 애니메이션 적용.
    - **파일**: `app/(auth)/login.tsx`, `src/shared/components/ServiceIntroSlider.tsx`, `assets/images/landing_*.png`.
    - **에셋 고도화**: `landing_record.png`, `landing_history.png`, `landing_stats.png` (browser_subagent를 이용한 실제 UI 캡처 전수 적용 완료).
    - **플랜**: `landing_page_update.md` (완료), `docs/plans/landing_page_screenshots.md` (이미지 교체 완료).

- **[2026-03-16: 공지사항 수정 반영 오류 수정 완료]**
    - 공지사항 수정 후 목록에 즉시 반영되지 않던 현상 해결.
    - **원인 1**: Supabase RLS `UPDATE` 정책 미비 (정책 재정의 및 `query_params` 의존성 제거).
    - **원인 2**: React Query `invalidateQueries` 비동기 처리 누락 (`await` 추가하여 순서 보장).
    - **파일**: `app/(tabs)/notice.tsx`, `supabase/migrations/20260316000003_fix_notices_update_policy.sql`.
    - **플랜**: `docs/plans/fix_notice_update_reflection.md` (완료).

- **[2026-03-16: 스코어 입력 탭 전환 레이스 컨디션 버그 수정]**
    - `Record` 탭 진입 시 비동기 작업(`loadMasterAndSession`) 도중 탭을 전환할 경우 `router.setParams`가 현재 활성 탭을 강제로 변경하는 현상 해결.
    - `@react-navigation/native`의 `useIsFocused` 훅을 도입하여 파라미터 소비 시점에 화면 포커스 여부를 검증하는 가드 로직 추가.
    - **파일**: `app/(tabs)/record.tsx`.

- **[2026-03-16: 공지사항 탭 추가 — 조회/작성/수정/삭제 전체 구현]**
    - 탭 순서: 히스토리 ↔ 구장 관리 사이에 **공지사항** 탭 삽입.
    - 일반 사용자 4개 탭 / 관리자 5개 탭 구조로 전환.
    - 관리자 전용: FAB(+) → 바텀 시트 모달로 작성/수정, 카드 내 삭제 버튼.
    - RLS 이중 보호: UI(isAdmin) + DB(profiles.role = 'admin') 두 겹 차단.
    - `notice.tsx` 300줄 초과 방지를 위해 스타일을 `notice.styles.ts`로 분리.
    - `supabase/migrations/`: `20260316000001_create_notices.sql`, `20260316000002_notices_update_policy.sql` 추가.
    - `20260316000000_enable_realtime_course_requests.sql` idempotent DO-block으로 수정.
    - **파일**: `app/(tabs)/notice.tsx`, `app/(tabs)/_layout.tsx`, `src/modules/golf/styles/notice.styles.ts`, `supabase/migrations/` 3건.

- **[2026-03-16: 구장 선택 화면 Race Condition 버그 수정]**
    - `CourseSelector`에서 "구장 데이터를 불러오지 못했습니다" 에러 노출 현상 수정.
    - **원인**: `isLoadingMaster`가 `state.isManualLoading`만 참조하여, `loadMasterAndSession`이 먼저 완료되면 React Query `golf_clubs` 쿼리가 아직 진행 중임에도 `clubs=[] + isLoadingMaster=false` 조건이 성립 → 에러 화면 노출.
    - **수정**: `isClubsLoading` (React Query `isLoading`) 을 `isLoadingMaster`에 OR 조건으로 합산.
    - **파일**: `src/modules/golf/hooks/useGolfRecord.ts` (2줄 수정).

- **[2026-03-16: Vercel 웹 빌드 실패 수정 — metro.config.js blockList 과잉 차단]**
    - `blockList`의 `/node_modules\/.*\/node_modules\/.*/` 규칙이 Expo 55 SSR 빌드 시 `@expo/router-server/node/render.js` 경로를 차단하여 Vercel 빌드 실패.
    - 해당 규칙 제거. `test-results` 및 외부 `dist/` 차단 규칙만 유지.
    - **파일**: `metro.config.js`.

- **[2026-03-16: Lucide v0.576.0 아이콘 명명 규칙 변경 대응]**
    - v0.576.0에서 `{shape}-{modifier}` → `{modifier}-{shape}` 패턴으로 일괄 변경됨.
    - `StatGrid.tsx`: `check-circle` → `circle-check`, `alert-circle` → `circle-alert`, `x-circle` → `circle-x` 수정.
    - `metro.config.js`: `blockList` 정규식 수정 (`/dist\/.*/` → `node_modules` 외부만 차단), `resolver.resolveRequest` 추가 (`dist/icons/*` → `dist/cjs/icons/*` 자동 리다이렉트).
    - **파일**: `metro.config.js`, `src/modules/golf/components/Dashboard/StatGrid.tsx`.

- **[2026-03-16: Expo Web 성능 최적화 - 전체 완료]**
    - **Task 1**: `metro.config.js` 신규 생성. Metro Persistent Cache를 `.expo/metro-cache`로 설정하여 Windows I/O 병목 해소, `.mjs` 확장자 지원, 불필요한 노드 모듈 스캔 차단.
    - **Task 2**: `app/(tabs)/_layout.tsx`의 `record` 탭에 `shouldPrerender: true` 적용. 탭 클릭 전 배경 번들링 수행.
    - **Task 3**: `RecordMainContent.tsx`에서 Lucide 전체 패키지 로드 → Direct Import(`dist/icons`) 방식으로 전환.
    - **Task 4**: `EXPO_USE_METRO_WORKSPACE_ROOT=1` 환경 변수로 `npx expo start --web` 실행 완료. 번들링 로그 확인 후 memory.md 갱신.
    - **파일**: `metro.config.js`, `app/(tabs)/_layout.tsx`, `src/modules/golf/components/Record/RecordMainContent.tsx`.

- **[2026-03-16: Admin 모듈 Lucide 최적화 - 전체 완료]**
    - 모든 관리자 모듈 컴포넌트(`AdminNavButtons`, `ClubSelectModal`, `UserCard`, `ClubPreviewCard`, `AdminFormComponents`)의 아이콘 임포트를 Direct Import 방식으로 전환 완료.
    - `AdminNavButtons`, `ClubSelectModal`에 `React.memo` 추가로 리렌더링 부하 최소화.
    - **파일**: `src/modules/admin/components/` 하위 5개 파일.

- **[2026-03-16: 스코어카드 범례/레이아웃 최종 수정 완료]**
    - 이글(이중 원) 및 더블보기(이중 사각형) 아이콘 렌더링을 `absolute` → Nesting(중첩) 방식으로 전환.
    - `ScoreCardModal.styles.ts`의 `symbolSquareInner`를 8x8 → 10x10으로 규격 동기화.
    - `ScoreCardTable.tsx` 스타일을 `absolute` 방식에서 flex 중첩 구조로 전면 개편.

- **[2026-03-16: useAdminRequestToast Realtime 오류 안정화 완료]**
    - `course_requests` 테이블 Realtime Publication SQL 마이그레이션 적용.
    - Instance Identity 전략, 지수 백오프 재시도, TIMED_OUT 대응, AppState 리스너 추가.
    - **파일**: `src/shared/hooks/useAdminRequestToast.ts`, `supabase/migrations/`.

- **[2026-03-16: 관리자 전역 상태 최적화 완료]**
    - `AdminContext`/`AdminProvider` 도입, `useIsAdmin` 훅 리팩토링 — 화면 전환 시 중복 API 호출 차단.
    - `admin_import.tsx` 권한 체크 Early Return → 조건부 렌더링으로 변경하여 Spinner 전환 제거.
    - **파일**: `src/shared/contexts/AdminContext.tsx`, `src/shared/components/useIsAdmin.ts`, `app/_layout.tsx`, `app/admin_import.tsx`.

- **[2026-03-16: 스코어 탭 전환 플리커 제거 / 글로벌 깜빡임 전수 점검 완료]**
    - `useFocusEffect` 내 React Query 캐시 사전 체크로 불필요한 DB 조회 차단.
    - 세션 없을 때 로딩 스피너 → `CourseSelector` 즉시 표시로 시각적 연속성 확보.
    - **파일**: `app/(tabs)/record.tsx`.

- **[2026-03-16: 이전 주요 작업 요약]**
    - 히스토리 네비게이션 세션 동기화 (`id` 파라미터 기반) 완료.
    - 로그아웃 세션 예외 처리 및 안정화 완료.
    - JSON Bulk Import 성능 최적화 (Task 1~4) 완료.
    - `docs/CRITICAL_LOGIC.md` 한국어 전면 정제 완료.
    - 개발 모드 `dev.bat` PowerShell BOM 에러 해결.
    - 네비게이션 파라미터 소비 정책(`consumedModeRef`) 도입.

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
- **Async Strategy**: Singleton Promise 및 Keyed Async Lock을 통한 경쟁 상태 방지.
- **UI Stable**: Stable Ref Pattern 적용으로 Hook 안정성 확보.
- **Bundle**: Metro Persistent Cache + Direct Import + EXPO_USE_METRO_WORKSPACE_ROOT 3종 최적화 완료.

## 🔜 향후 과제 (Next Steps)

1. 백업 워크플로우 수동 재실행으로 `pg_dump 17` + 암호화 업로드 end-to-end 검증.
2. UI/UX 디자인 고도화 (현재 커스텀 UI 체계 유지 및 스타일 정교화).

---

### 🔗 Artifacts & Documents

- [CRITICAL_LOGIC.md](./CRITICAL_LOGIC.md) : 비즈니스 로직 SSOT
- [archives/plans/](./archives/plans/) : 완료된 작업 실록

Generated by Antigravity Senior Architect
