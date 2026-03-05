## Project Memory
- Date: 2026-03-04
- Task: Initializing Golf Tracker with Expo Router
- [2026-03-04 10:25] Service Layer 계산 로직 및 퀵 입력 UI 초안 작성 완료
- [2026-03-04 10:27] 입장 화면(index.tsx) 구현 완료: 방 코드 및 플레이어 이름 입력 기능 추가
- [2026-03-04 10:29] 개인용 실시간 리더보드 UI 구현 완료 (공유 기능 제거)
- [2026-03-04 10:33] Web 개발 서버 실행용 dev.bat 생성 완료
- [2026-03-04 10:36] Par(3,4,5) 선택 기능 및 코스 데이터 기반 자동 설정 구현 완료
- [2026-03-04 10:38] 리더보드 및 입력 화면에 OB/벌타(Penalty Area) 기록 기능 추가 완료
- [2026-03-04 10:39] 아리스타CC (레이크-마운틴) 코스 데이터 업데이트 완료
- [2026-03-04 10:40] OB와 Penalty Area(해저드) 항목 분리 및 UI 반영 완료
- [2026-03-04 10:42] AsyncStorage 기반 데이터 영속성 로직 및 대시보드 실데이터 연동 완료

- [2026-03-04 10:55] 개별 홀 기록 화면 UI 개선: Par 입력 방식을 기본값 표시 및 수정 모드 토글 방식으로 변경하여 입력 편의성 증대

- [2026-03-04 11:03] Par 섹션 UI 고도화: 수정 텍스트를 연필 아이콘으로 교체하고, 우측에 전장 거리(m) 표시 기능을 추가하여 실제 코스 데이터와 연동함.

- [2026-03-04 11:08] 데이터 정합성 강화: 스크린샷 기반으로 아리스타CC 및 써닝포인트CC의 18홀 전장 거리(m) 및 Par 데이터를 전수 입력 완료

- [2026-03-04 11:13] 코스 데이터 정제: 요청에 따라 불필요한 써닝포인트 CC 데이터를 전량 삭제하고 아리스타 CC를 기본 코스로 재배치함.

- [2026-03-04 11:15] 코스 데이터 간소화: 표준 18홀 구성을 삭제하고 아리스타 CC와 직접 입력 옵션으로만 구성 완료.

- [2026-03-04 11:20] 홀 이동 기능 강화: 이전/다음 홀 이동 기능을 구현하고, 홀 변경 시 기존 기록을 자동으로 불러오도록 로직을 개선함. 1번홀/18번홀 예외 처리 포함.

- [2026-03-04 11:32] UI 레이아웃 최적화: 하단 네비게이션 버튼(이전/다음 홀)의 너비를 1:1로 통일하여 균형 잡힌 레이아웃 구현.

- [2026-03-04 11:38] 대시보드 통계 고도화: 이글 이상, 버디, 파, 보기, 더블 보기 이하로 스코어 분포를 세분화하여 분석하는 로직 및 UI 구현 완료.

- [2026-03-04 11:42] 대시보드 레이아웃 최적화: 홀별 진행 상황을 메인 스코어 카드 우측으로 재배치하여 정보 집약도 향상.

- [2026-03-04 11:45] 대시보드 진행 상황 UI 개선: 메인 카드 내 진행 상황 영역을 70% 비중으로 확대하고 프로그레스 바를 확장하여 시인성 극대화.

- [2026-03-04 12:03] 홀별 미스샷 패턴 기록 기능 추가: 주요 미스샷 패턴(슬라이스, 훅, 탑볼, 뒤땅, 뽕샷, 생크)을 기록할 수 있는 가로 스크롤 선택기를 벌타 섹션 하단에 구현.

- [2026-03-04 12:05] 미스샷 패턴 UI 고도화: 가로 스크롤 대신 중앙 정렬 그리드 레이아웃을 적용하고, 프리미엄 카드 스타일과 아이콘을 추가하여 시각적 완성도 향상.

- [2026-03-04 12:10] 홀 기록 화면 헤더 개편: '코스 변경' 텍스트를 설정 아이콘으로 변경하고, 현재 코스명을 화면 중앙 상단에 배치하여 정보의 위계와 디자인 완성도 향상.

- [2026-03-04 12:08] 미스샷 패턴 섹션 레이아웃 수정: 텍스트 세로 깨짐 현상을 해결하기 위해 flex 속성을 조정하고 가로 공간을 충분히 확보함.

- [2026-03-04 12:15] 코스 변경 버튼 안정성 강화: 설정 아이콘 대신 골프 깃발 아이콘(flag-outline)으로 교체하고, 클릭 시 변경 확인 팝업을 추가하여 데이터 유실 방지.

- [2026-03-04 12:20] 미스샷 분석 UI 최종 최적화: 타이틀을 중앙 정렬하고, 패턴 버튼들을 수평 스크롤(한 행) 방식으로 변경하여 모바일 가독성 및 조작성 개선.
- [2026-03-04 11:08] record.tsx 미스샷 패턴 분석 헤더 텍스트의 세로 렌더링(깨짐) 버그 수정 (flex 오버라이드 제거)
- [2026-03-04 11:10] record.tsx 미스샷 패턴 분석 버튼 목록을 화면 가운데로 정렬하도록 ScrollView contentContainerStyle 수정 (justifyContent, flexGrow 적용)
- [2026-03-04 11:11] record.tsx 코스 변경 경고 문구 수정 및 Web 브라우저 환경 팝업 호환성 추가(window.confirm), Course Name Box 터치 시에도 코스 변경 가능하도록 구현
- [2026-03-04 11:13] index.tsx 대시보드 구조 변경 (통계 및 미스샷 3x5 그리드 통합), golfService 계산 로직 업데이트
- [2026-03-04 11:18] index.tsx 및 record.tsx 폰트 Typography 위계(사이즈 및 weight) 전역 점검 수정, README.md 생성, CRITICAL_LOGIC 갱신
- [2026-03-04 11:22] index.tsx 대시보드 리더보드 상대 스코어 표시 추가 및 3x5 그리드 Lucide 아이콘 직관적 교체 완료

- [2026-03-04 11:27] Vercel 배포 환경 구성 (vercel.json 추가 및 package.json build 스크립트 등록)

- [2026-03-04 11:28] Git push 완료: Vercel 배포 설정 반영

- [2026-03-04 11:32] 코스 변경 시 이전 기록 초기화 로직 수정 및 Git Push

- [2026-03-04 11:42] 카카오톡 외부 브라우저 리다이렉트, 세션 고유 ID 처리, 벌타 자동 합산 로직 배포

- [2026-03-04 11:43] 미스샷 패턴 분석 레이아웃 최적화 (가로 스크롤 -> 래핑 그리드)

- [2026-03-04 11:48] 전체 프로젝트 문서화 및 요약 업데이트 완료 (SSOT 및 Memory 동기화)

- [2026-03-04 11:58] 코스명 헤더 정적 표시 전환 및 코스 변경 시 대시보드 강제 초기화(Query Invalidation & Initial Save) 적용

- [2026-03-04 12:00] 코스명 헤더 수정 및 대시보드 초기화 로직 Git Push 완료

- [2026-03-04 21:30] 미스샷 유형 개편: '뽕샷', '탑볼'을 삭제하고 '벙커', '쓰리펏'을 추가하여 현장 피드백 반영 및 대시보드 아이콘 최적화 시킴

- [2026-03-04 21:35] 대시보드 라운딩 종료 기능: 18홀 완료 시 '라운딩 종료 및 결과 저장' 버튼 활성화 및 세션 초기화 로직 구현

- [2026-03-04 21:40] 대시보드 시각화 개선: 해저드(Water -> Droplets), 벙커(Sand -> Waves), 퍼트/쓰리펏(Putter -> CornerRightDown) 아이콘으로 교체하여 직관성 강화

- [2026-03-04 21:45] Supabase 연동 완료: 클라이언트 설정, SQL 스키마 정의, 라운딩 종료 시 클라우드 자동 동기화(Upsert) 로직 구현 및 .env.example 제공

- [2026-03-05 21:50] 히스토리 연동 및 UI 구현: '히스토리' 탭 추가 및 과거 라운딩 기록 리스트(FlatList) 구현 완료, 각 라운드별 요약 카드(스코어, 버디, GIR 등) 시각화

- [2026-03-04 22:00] 저장 및 종료 사용자 경험 개선: 웹 브라우저 호환 알림(window.alert/confirm) 적용, 저장 중 로딩 상태 표시, 18홀 완료 시 대시보드 자동 이동 로직 추가

- [2026-03-04 11:45] 로컬 스코어 Supabase 동기화 기능 추가 (roundRepository.syncAllLocalRounds, 히스토리 화면 동기화 버튼)

- [2026-03-04 11:55] 18홀 완료 시 스코어카드 모달 및 애니메이션 추가 (record.tsx, 3x6 그리드)

- [2026-03-04 11:58] 벙커/쓰리펏 아이콘 개선 (Mountain, CircleDot) 및 히스토리 항목 클릭 시 상세 대시보드 이동 기능 추가

- [2026-03-05 00:55] 스코어카드 테이블 UI 전면 개편: 9홀 분할, 홀별 기호(◎, ○, □, ◇), 합계 자동 계산 기능 추가
- [2026-03-05 01:05] 스코어카드 패널티 행 제거: 사용자 요청에 따른 데이터 표시 간소화
- [2026-03-05 01:15] 다중 사용자 기반 인프라 구축: Supabase Auth 연동 및 user_id 기반 RLS 보안 정책 적용
- [2026-03-05 01:25] 데이터 유실 방지 마이그레이션 엔진: 로그인 전 익명 데이터를 로그인 후 사용자 계정으로 자동 이전하는 로직 구현
- [2026-03-05 01:35] 구글 OAuth(팝업 방식) 도입: 단순 Magic Link에서 계정 선택형 브라우저 팝업 인증으로 UI/UX 고도화
- [2026-03-05 01:45] 프로젝트 문서화 및 Git 동기화: README.md 갱신 및 주요 변경 사항 리포징 완료

### 2026-03-05: 라운딩 히스토리 관리 및 로그인 안정화
- **히스토리 관리**: 과거 라운딩 카드 길게 누르기(longPress)를 통한 수정(이어하기) 및 삭제 기능 구현
- **대시보드 개선**: 종료된 라운드 대시보드 하단에 수정/삭제 액션 버튼 추가
- **삭제 무결성**: Supabase와 AsyncStorage 양방향 삭제 로직 및 정합성 체크 강화
- **로그인 이슈 해결**: 모바일 웹 브라우저에서 리다이렉트 시 localhost로 튕기는 문제 해결 (window.location.origin 사용)
- **문서 업데이트**: README.md 및 memory.md에 최신 변경점 기록

- [2026-03-05 02:00] TypeScript/Syntax 오류 전수 조사 및 해결: ExternalLink.tsx (Href 타입 적용), index.tsx (import 문법 수정 및 any 타입 제거)
- [2026-03-05 02:10] TS2322 최종 해결: ExternalLink.tsx에서 Href import 제거, href prop 타입을 string으로 변경, Link 컴포넌트에 @ts-ignore 단언 추가 (Typed Routes 대응)
- [2026-03-05 02:30] 전체 코드 품질 점검 7개 파일 수정: _layout.tsx(중복 import 통합/불필요 loaded prop), index.tsx(MOCK_SUMMARY dead code/icon ReactNode/penalty 타입), golfService.ts(isGIR 중복 재계산 제거), record.tsx(스코어카드 putt 0 고정 버그), history.tsx(중복 refetch), roundRepository.ts(getStorageKey 이중 호출/Promise.all 병렬화/any→unknown), login.tsx(미사용 스타일 7종/민감 console.log 제거)
- [2026-03-05 08:10] React/Expo 성능 최적화: ScoreCardTable 컴포넌트 추출(중복 제거), index.tsx/record.tsx 내 Promise.all 병렬화 및 useMemo 적용, roundRepository 내 세션 기반 스토리지 키 캐싱 구현
- [2026-03-05 08:25] 아키텍처 리팩토링 (DDD & 3-Layer 전면 도입): `src/modules/golf` 내 도메인 로직(types, repo, service, data) 격리, `src/shared` 내 공통 요소(components, lib, constants) 통합, 전체 파일 임포트 경로 업데이트 완료

- [2026-03-05 08:15] 구장 마스터 DB 통합 (Club > Course > Hole > Distance 4계층) 완료
  - docs/supabase_schema.sql: golf_clubs/golf_courses/golf_holes/hole_distances 테이블 + RLS 정책 추가
  - 아리스타CC(Lake+Mountain) 시드 데이터 포함 (IF NOT EXISTS 멱등성 보장)
  - golf.types.ts: TeeDistance/ClubHoleInfo/ClubCourseInfo/ClubInfo/ClubSummary 타입 추가
  - golf.repository.ts: clubRepository 추가 (getAllClubsSummary, getCourseWithHoles, registerClub)
  - registerClub에 Par 합계 검증 로직 내장 (9홀=36, 18홀=72)
- [2026-03-05 12:43] 관리자 전용 구장 등록 기능 구현
  - useIsAdmin.ts 훅 생성 (src/shared/components/) — ADMIN_EMAILS 배열 비교, onAuthStateChange 실시간 재판정
  - supabase_schema.sql: is_admin() SECURITY DEFINER 함수 + 4개 테이블 INSERT/UPDATE/DELETE 정책을 관리자 이메일 한정으로 강화
  - admin.tsx 생성 (app/(tabs)/) — 구장명/코스/홀 Par 입력 폼, Par 합계 실시간 검증 뱃지, clubRepository.registerClub 연동
  - _layout.tsx: href: isAdmin ? '/(tabs)/admin' : null 패턴으로 비관리자에게 탭 완전 숨김- [2026-03-05 13:00] 라운드 데이터 마이그레이션 동기화 로직 개선 및 스토리지 키 캐싱 수정 (git push 완료)

- [2026-03-05 14:35] 과거 라운딩 수정 시 구장 재선택 후 기존 기록 유실 및 신규 생성 버그 수정 (git push 완료)
  - app/(tabs)/record.tsx: startNewRoundWithCourses에 existingRoundId 인자 추가 및 ID/기록 계승 로직 구현
  - loadMasterAndSession: 구장 ID 미지정 상태에서도 currentRound 존재 시 holeRecords 선로딩 적용

- [2026-03-05 14:45] 대시보드 메인 스코어 카드 UI 개선: 진행률 바 겹침 현상 해결
  - app/(tabs)/index.tsx: 점수(좌)-액션(우) 배치 및 진행률 바를 하단 레이어로 완전 분리하여 가독성 강화

- [2026-03-05 14:48] 미스샷 패턴 분석 중복 선택 기능 구현
  - app/(tabs)/record.tsx: 최대 2개까지 중복 선택 가능 (콤마 구분자 방식)
  - '없음' 선택 시 전체 초기화 로직 및 선택 해제 토글 기능 추가

- [2026-03-05 14:52] '쓰리펏' 자동 선택 및 해제 자동화 구현
  - app/(tabs)/record.tsx: 퍼트 수 3타 이상 기록 시 미스샷 패턴에 '쓰리펏' 자동 추가 로직 구현
  - 퍼트 수 조정에 따라 missShot 상태가 실시간으로 동기화되도록 useEffect 최적화

- [2026-03-05 14:58] 데이터 유실 방지 및 날짜 보존 로직 강화 (Critical Bug Fix)
  - app/(tabs)/index.tsx: useFocusEffect를 통한 실시간 데이터 리프레시 도입 (수정 후 stale 데이터가 서버를 덮어씌우는 현상 방지)
  - app/(tabs)/record.tsx: roundDate 상태를 통한 과거 라운딩 날짜 보존 로직 구현 (수정 시 오늘 날짜로 바뀌는 버그 해결)

- [2026-03-05 15:05] 멀티 디바이스 데이터 정합성 강화
  - app/(tabs)/index.tsx: 대시보드 진입 시 pullRoundsFromSupabase 자동 호출 추가 (PC-모바일 교차 사용 시 데이터 유실 방지)
  - Last-Write-Wins 문제 해결을 위해 Write 전 최신 데이터로 Pull 수행 로직 내재화

- [2026-03-05 15:20] 대시보드 메인 카드 디자인 고도화: 점수-버튼 중첩 문제 해결 및 진행 바를 카드 하단에 우아하게 통합하여 프리미엄 UI로 개편함. 글래스모피즘 스타일의 버튼과 세련된 타이포그래피 적용 완료.

- [2026-03-05 16:00] 글로벌 룰 프롬프트 최적화 및 전파: 모든 파일 UTF-8 인코딩 통일 및 배치 파일 코드페이지(@chcp 65001) 선언 원칙을 수립함. 수정된 CLAUDE.md 파일을 c:/develop/ 하위의 다른 9개 프로젝트 폴더로 일괄 복사(Copy-Item) 완료.

- [2026-03-05 16:15] dev.bat 실행 시 'tokens=*' 구문 오류 해결을 위해 dev.ps1 기반으로 현대화 및 chcp 65001 적용 완료.
- [2026-03-05 17:25] Fix: Added updatedAt and improved sync merge logic. Fixed missShot stat counting bug.
- [2026-03-05 17:53] c:\develop 하위 9개 프로젝트 전역에 갱신된 CLAUDE.md 배포 및 Git push 완료

### 2026-03-05: 구장 AI 자동 입력 시스템 구축
- **보안 처리**: docs/COURSE_AUTO_IMPORT_PLAN.md 내 GOOGLE_AI_API_KEY 실제값 → 플레이스홀더로 교체. 실제 키는 Supabase Secrets에만 등록.
- **Edge Function 신규 생성**: `supabase/functions/course-import/index.ts` — Gemini 2.0 Flash 기반 파싱. URL 모드(Deno fetch + stripHtml) / 텍스트 모드 지원. JS_RENDER_REQUIRED(422) 감지. 프로젝트 `eqzobqeotfxvsllforew`에 배포 완료.
- **Admin UI 추가**: `app/(tabs)/admin.tsx` — "구장 자동 불러오기 (AI)" 카드. URL 실패 시 텍스트 붙여넣기 모드 자동 전환 → 폼 자동 채우기 → 신뢰도 Alert.
- **문서 갱신**: README.md 최근 업데이트·환경변수 섹션 추가, CRITICAL_LOGIC.md 섹션 5(구장 자동 입력 시스템) 추가.
- **Git push 완료**: commit `00a8838` — 4파일 변경 (admin.tsx, index.tsx, supabase/functions/course-import/index.ts, docs/COURSE_AUTO_IMPORT_PLAN.md)
