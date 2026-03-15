# 🧠 Project Memory: Golf Scoring App

> 마지막 갱신: 2026-03-15 | 상태: 안정 (Stable)

## 🎯 핵심 요약 (SSOT Summary)

- **Architecture**: Domain-Driven (Definition, Repository, Service) 3-Layer 구조 준수.
- **SSOT**: `docs/CRITICAL_LOGIC.md`를 비즈니스 로직 및 정책의 유일한 진실 공급원으로 운용.
- **Database**: GitHub Actions 기반 AES-256 암호화 매일 자동 백업 체계 구축.
- **Performance**: `staleTime: Infinity` 및 `isMounted` Guard 적용으로 리렌더링 및 메모리 누수 원천 차단.
- **Integrity**: 전역 UTF-8 no BOM 인코딩 및 마크다운 린트 Zero 준수.
- **Standard**: 프로젝트 루트의 `AI_GUIDELINES.md` 최상위 상속 및 `config/paths.ps1` 기반 경로 정규화 준수.
- **300라인 초과 파일**: 현재 없음 (전부 해소).

## 🚀 최근 변경 사항 (Recent Changes)

- **[2026-03-15: 상태 관리 버튼 웹 호환성 수정 완료]**
  - **원인**: `Alert.alert()` 4버튼 → React Native Web 매핑 불가 → 웹 환경 완전 무반응
  - **수정**: `Alert.alert` → `Modal` 바텀시트(크로스플랫폼 공통)로 교체
  - **파일**: `app/admin_requests.tsx`, `src/modules/admin/styles/adminRequests.styles.ts`
  - **패턴**: `selectedId` 상태로 모달 제어, `handleConfirmStatus(status)` 분리

- **[2026-03-15: 구장 추가 요청 관리 로드 오류 근본 해결 완료]**
  - **원인**: `20260312000003` 마이그레이션 Cloud DB 미적용 → `user_id → profiles` FK 부재 → PostgREST `profiles:user_id` JOIN 실패
  - **DB 수정**: Supabase SQL Editor에서 직접 실행
    - `course_requests_user_id_fkey` (auth.users 참조) 제거 → `fk_course_requests_profiles` (profiles 참조) 추가
    - `"Anyone can view course requests"` (USING true) 정책 DROP → `"Only admins can select course requests"` 정책으로 일원화
  - **코드 동기화**: `supabase/migrations/20260315000001_fix_admin_requests_rls.sql` 마이그레이션 파일 작성 완료

- **[2026-03-15: 글로벌 리팩토링 및 품질 개선 최종 완료]**
  - **Task 5 (최종 완료)**: 모든 리포지토리(`*.repository.ts`) 레이어의 에러 핸들링을 `GolfDomainError` 규격으로 통일하고, `Try-Catch` 구조에서 에러를 삼키지 않고 상위로 전달(throw)하도록 보완 완료.
  - **Task 4 (최종 완료)**: `admin_users.tsx` 및 `admin_requests.tsx` 내의 잔존 인라인 스타일(아이콘 등)을 전용 `.styles.ts` 파일로 완전히 추출하여 SoC 및 심미적 완성도 확보.
  - **Task 3 (최종 완료)**: `ScoreCardModal.tsx` 경량화(128라인) 및 `router.replace` 적용으로 네비게이션 SSOT 준수. 추출된 `ScoreCardHeader`, `ScoreCardLegend` 컴포넌트의 타입 안정성 및 중복 렌더링 최적화 확인.
  - **Task 2 (최종 완료)**: `ScoreCardModal.styles.ts`를 통한 스타일 분리 완료 및 UI 일관성 검증.
  - **Task 1 (최종 완료)**: 대형 파일(300라인 이상)의 물리적 분리 및 모듈 간 종속성 정적 분석 완료.

- **[Task 4: SSOT 정합성 감사 및 보완 완료]** `docs/CRITICAL_LOGIC.md`에 관리자 실시간 알림 로직 및 UI 표준 섹션을 추가하여 비즈니스 로직의 완결성을 확보함. `AI_GUIDELINES.md`에 `Stable Ref Pattern` 등 프론트엔드 안정성 지침을 통합하고, 중복 문서인 `docs/STABILITY_RULES.md`를 식별하여 정리를 완료함. 모든 SSOT 문서 간의 충돌을 제거하고 구조 최적화를 달성함.
- **[Task 5: SSOT 동기화 및 Git 푸시 완료]** `AI_GUIDELINES.md` 수립, `scripts/check-env.ps1`을 사용한 무결성 검증, 그리고 `README.md`와 `CRITICAL_LOGIC.md`를 포함한 모든 SSOT 문서의 최신화 및 Git 푸시를 완료함.
- **[Task 4: scripts/check-env.ps1 생성 및 무결성 검증 완료]** 인코딩 및 필수 파일 존재 여부를 실시간으로 검증하는 `scripts/check-env.ps1`을 구현함. 검증 결과, 핵심 SSOT 파일(`AI_GUIDELINES.md`, `CLAUDE.md`, `memory.md`)의 존재를 확인하였으며, 일부 `.ps1` 파일의 UTF-8 BOM 미적용 상태를 식별하여 향후 강제 인코딩 적용 기반을 마련함.
- **[Task 3: .env 보안 검토 완료]** `AI_GUIDELINES.md` Rule 8에 따라 `.env` 파일을 검토함. 현재 `EXPO_PUBLIC_SUPABASE_ANON_KEY`만 포함되어 있으며, `SERVICE_ROLE_KEY` 등 서버 사이드 민감 정보는 유출되지 않았음을 확인함.
- **[AI Behavioral Guidelines 적용 완료]** 프로젝트 루트의 `AI_GUIDELINES.md`를 최상위 지침으로 확립하고, `docs/memory.md`를 SSOT로 동기화함. 모든 작업은 원자적 단위(Atomic Task)로 분해하여 진행하며, `config/paths.ps1` 기반 경로 상수 체계를 도입함.

- **[DB 백업 오류 해결 완료]** 'Tenant or user not found' 오류를 해결함. 원인은 GitHub Actions(IPv4)와 Supabase Direct Connection(IPv6) 간의 통신 불가 및 커넥션 풀러 사용 시 유저네임에 프로젝트 ID(`postgres.[ID]`) 누락이었음. 주소 수정 후 백업 및 Artifact 업로드 정상 작동 확인.
- **[스코어카드 코스명 동적 표시 개선 완료]** `ScoreCardModal.tsx` 및 `HoleSelectorGrid.tsx`에 `courseType` 기반 동적 코스명 표시 로직을 적용하고, 대시보드(`index.tsx`)에서 데이터를 성공적으로 전달함. (Task 1, 2, 3 완료)
- **[TSC 검증 엔진 무결성 확보]** `npx tsc --noEmit` 실행 시 출력이 없던 현상이 설정 오류가 아닌 "에러 없음(정상)" 상태임을 확증함. `--listFiles`와 `--showConfig`를 통해 소스 파일 포함 여부를 확인하고, 의도적 타입 에러 주입 테스트를 통해 컴파일러의 실시간 에러 검출 능력을 최종 검증 완료함. (종료 코드 0 확인)
- **[TSC --quiet 옵션 에러 해결]** `tsc`는 공식적으로 `--quiet` 플래그를 지원하지 않음을 확인(TS5023 에러). 사용자 글로벌 룰 3과 실제 도구 명세 간의 충돌로 판단되어, 향후 타입 체크 시 `--quiet`를 제외하고 PowerShell의 필터링(`Select-Object`)만 사용하도록 프로세스를 정립함.
- **[라운딩 시작 루프 버그 수정 완료]** `app/(tabs)/record.tsx`의 `useFocusEffect`에서 `mode=new` 파라미터를 사용 후 즉시 제거하도록 수정하여, 라운딩 시작 후 세션이 다시 초기화되어 구장 선택 화면으로 튕기는 현상을 해결함.
- **[Vercel 빌드 에러 해결 및 Git 동기화 완료]** 로컬에만 존재하던 `AdminNavButtons.tsx` 등 'untracked' 상태의 신규 컴포넌트 및 훅들을 리포지토리에 추가 및 푸시하여 Vercel 배포 시 모듈 누락 에러(`Unable to resolve module`)를 해결함.
- **[관리자 구장 추가 요청 실시간 알림 구현 완료]** `useAdminRequestToast` 훅을 생성하여 Supabase Realtime을 통해 `course_requests` 테이블의 `INSERT` 이벤트를 구독하고, 전역(`app/_layout.tsx`)에서 관리자에게 즉시 토스트 알림을 제공하도록 구현 완료.
- **[토스트 UI 너비 및 스타일 복구 완료]** `Dimensions`를 사용하여 토스트 너비를 화면 가로 크기에 맞춰 "와이드"하게 고정(`WINDOW_WIDTH - 32`). 애니메이션 및 사용자 입력 상호작용(`Pressable`) 시 너비가 협소화되는 현상을 원천 차단함.
- **[에러 모니터링 구축 완료]** `scripts/error_handler.ps1` 생성, `dev.ps1` 통합, 및 `docs/ERROR_LOGS.md` 가이드 작성 완료.
- **[Surgical Output Guardrail 구축 완료]** `scripts/surgical_guard.ps1` 생성 및 `dev.ps1` 통합. 3,000자 초과 출력 시 강제 중단 및 에이전트의 외과적 탐색(Selective search)을 유도하는 가드레일과 `.antigravity/rules` 행동 강침을 수립함.
- **[스코어카드 공유 디자인 개선 완료]** `ScoreCardModal.tsx`의 캡처 영역 디자인을 대시보드와 일치시키고(패딩 24, 테두리 32), 웹/네이티브 캡처 영역 일원화 및 스크롤 영역 최적화 완료.
- **[네비게이션 UI 불일치 해결 완료]** `_layout.tsx` 중심의 타이틀 SSOT 통합, `Record` 탭 상단 여백 보정 및 하단 푸터 분리(`RecordFooter.tsx`) 완료. (Task 1, 2, 3)
- **[레포지토리 다이어트 완료]** `golf.round.repository.ts`(355) → Aggregator(7) + `golf.round.local.repository.ts`(140) + `golf.round.sync.repository.ts`(197). `golf.club.repository.ts`(350) → Aggregator(7) + `golf.club.query.repository.ts`(174) + `golf.club.mutation.repository.ts`(149). 외부 호출 코드 무변경, TSC 오류 0.
- **[3차 파일 다이어트 완료]** `record.tsx`(341→296): `RoundFinishModal.tsx`(43), `ParSelector.tsx`(44) 추출. TSC 오류 0.
- **[2차 대형 파일 다이어트 완료]** 8개 파일 분리 작업 완료 (TSC 오류 0). `useGolfRecord.ts`(542→193) 3분할, `adminImport.styles.ts`(475→230) 4분할, `admin_users.tsx`·`admin_requests.tsx` UserCard/StatCard 추출, `CourseSelector.tsx`·`AdminFormComponents.tsx`·`history.tsx`·`record.tsx` styles 분리.
- **[관리자 임포트 화면 리팩토링 완료]** 981라인의 `admin_import.tsx`를 180라인으로 경량화.
- **[DDD 구조 점검]** `GolfErrorCode` 및 `GolfDomainError` 정의. 에러 처리 패턴 통일. Orphan Cleanup 완료.
- **[프로젝트 다이어트 완료]** `golf.repository.ts`(938라인)를 3개 마이크로 레포지토리로 분리 (Aggregator 패턴).

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

1. DB 자동 백업 전략(`db_backup_strategy.md`) 실제 구현 및 검증.
2. UI/UX 디자인 고도화 (Ark UI 최우선 적용).

---

### 🔗 Artifacts & Documents

- [CRITICAL_LOGIC.md](./CRITICAL_LOGIC.md) : 비즈니스 로직 SSOT
- [archives/plans/](./archives/plans/) : 완료된 작업 실록

Generated by Antigravity Senior Architect
