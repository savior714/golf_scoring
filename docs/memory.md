# 🧠 Project Memory: Golf Scoring App

> 마지막 갱신: 2026-03-16 (구장 선택 화면 Race Condition 버그 수정 완료) | 상태: 안정

## 🎯 핵심 요약 (SSOT Summary)

- **Performance**: Metro 번들러 Persistent Cache 강화, Lucide Direct Import 패턴 전수 적용, EXPO_USE_METRO_WORKSPACE_ROOT=1 환경 변수 적용 완료.
- **Navigation**: 히스토리 탭 `id` 파라미터 기반 세션 동기화 및 생명주기 가드 최적화 완료.
- **Architecture**: Domain-Driven (Definition, Repository, Service) 3-Layer 구조 준수.
- **SSOT**: `docs/CRITICAL_LOGIC.md`를 비즈니스 로직 및 정책의 유일한 진실 공급원으로 운용.
- **Database**: GitHub Actions 기반 AES-256 암호화 매일 자동 백업 체계 구축.
- **Integrity**: 전역 UTF-8 no BOM(소스) 및 UTF-8 with BOM(PowerShell) 인코딩 준수.
- **300라인 초과 파일**: 현재 없음 (전부 해소).

## 🚀 최근 변경 사항 (Recent Changes)

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
2. UI/UX 디자인 고도화 (Ark UI 최우선 적용).

---

### 🔗 Artifacts & Documents

- [CRITICAL_LOGIC.md](./CRITICAL_LOGIC.md) : 비즈니스 로직 SSOT
- [archives/plans/](./archives/plans/) : 완료된 작업 실록

Generated by Antigravity Senior Architect
