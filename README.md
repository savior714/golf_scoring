# Antigravity Golf Tracker

Expo Router를 기반으로 동작하는 모바일 타겟 골프 스코어링 애플리케이션입니다.
초기 세팅부터 데이터 모델링 확장, UI/UX 고도화, 미스샷 통계 분석까지 전 과정을 통해 진화하는 프로젝트 관리형 코드베이스입니다.

## 주요 기능 (Features)
1. **홀(Hole) 정보 기입 (app/(tabs)/record.tsx)**
   - 코스 선택, PAR, DISTANCE 명판 지원 (`window.confirm` 웹 호환성)
   - 스트로크(Stroke), 퍼트(Putt), OB, 벌타/해저드 개별 측정
   - 6가지 미스샷 패턴 (슬라이스, 훅, 뒤땅, 생크, 벙커, 쓰리펏) 그리드 분석
2. **리얼타임 리더보드 및 전문 스코어카드 (app/(tabs)/index.tsx)**
   - **전문 스코어카드 테이블**: 9홀 분할 테이블, 스코어별 기호(◎, ○, □, ◇), 합계 자동 계산 지원
   - 스코어 3x5 그리드 통합 뷰 (진행상황, 이글~더블, 퍼트평균, OB/해저드 분리 수치 제공)
   - 자체 집계 로직 서비스(`golfService.ts`) 연동
3. **구장 마스터 데이터 및 27홀/동적 코스 대응**
   - **4계층 구조**: 구장(Club) > 코스(Course, 9홀단위) > 홀(Hole) > 전장(Distance)의 정밀한 데이터 모델링
   - **동적 코스 조합**: 27홀 구장 대응을 위해 전반(Out)과 후반(In) 코스를 각각 선택하여 18홀 라운드를 구성하는 3단계(구장->Out->In) 선택 프로세스 지원
   - **관리자 전용 등록 및 수정**: 관리자 계정('savior714@gmail.com') 전용 구장 정보 등록/수정 화면 제공. 기존 구장 정보를 불러와 코스를 추가하거나 홀별 전장(Distance) 정보를 정밀하게 기입 가능 (`app/(tabs)/admin.tsx`)
   - **AI 자동 불러오기**: 구장 코스 소개 페이지 URL 하나로 홀별 Par·전장을 자동 추출 (Gemini 2.0 Flash, 무료). JS 렌더링 필요 사이트는 텍스트 붙여넣기 모드로 fallback (100% 커버리지). Supabase Edge Function(`course-import`) 기반. (설계 문서: `docs/COURSE_AUTO_IMPORT_PLAN.md`)
4. **다중 사용자 지원 및 클라우드 동기화**
   - **Google OAuth**: 구글 계정을 통한 간편 로그인 (Magic Link & OAuth Pop-up 지원)
   - **데이터 마이그레이션**: 로그인 전 익명 기록을 로그인 후 계정으로 자동 이전 (유실 방지 정책)
   - **Supabase Cloud**: 사용자별 데이터 격리(RLS) 및 실시간 클라우드 백업
5. **Persist Storage**
   - 사용자별 독립적인 `AsyncStorage` 키 관리 (`@golf_rounds_data_{userId}`)

## 아키텍처 (Architecture - DDD & 3-Layer)
- **Modules (`src/modules/golf`)**: 골프 도메인 전용 비즈니스 로직 격리
  - **Definition**: 데이터 타입 및 인터페이스 (`golf.types.ts`)
  - **Repository**: 데이터 저장 레이어 (Local + Remote) (`golf.repository.ts`)
  - **Service**: 통계 계산 및 도메인 로직 (`golf.service.ts`)
  - **Data**: 도메인 고유 정적 데이터 (`golf.data.ts`)
- **Shared (`src/shared`)**: 프로젝트 전반에서 재사용되는 인프라 및 UI
  - **Components**: 공통 UI 컴포넌트 (`src/shared/components`)
  - **Lib**: 외부 라이브러리 설정 (Supabase 등) (`src/shared/lib`)
  - **Constants**: 테마 및 상수 (`src/shared/constants`)
- **Router (`app/`)**: Expo Router 기반 파일 시스템 라우팅 (UI-Only View Layer)
  - Typography 위계 관리를 통해 모바일 가독성 증대 및 폰트 Weight 명세 반영 완료
  - **Premium UI**: 다크 테마 기반의 글래스모피즘 디자인 및 애니메이션 적용

## 최근 업데이트 (Recent Updates)
- **구장 AI 자동 불러오기 (2026-03-05)**: 구장 코스 소개 URL 입력 시 Gemini 2.0 Flash가 홀별 Par·전장을 자동 추출하여 관리자 폼에 채워주는 기능 추가. Supabase Edge Function `course-import` 배포. JS SPA 사이트는 텍스트 붙여넣기 모드로 자동 전환.
- **API 키 보안 강화 (2026-03-05)**: 문서 내 API 키를 플레이스홀더로 교체. 실제 키는 Supabase Secrets에만 보관.
- **초기 렌더링 최적화 (2026-03-05)**: 세션 체크 완료 전까지 스플래시 화면을 유지하여 "대시보드 노출 후 로그인 이동" 현상(Auth Flash) 원천 해결.
- **데이터 정합성 고도화 (2026-03-05)**: 대시보드 리더보드 계산 시 현재 진행 중인 라운드(`current_round_id`)를 최우선으로 산출하도록 `useMemo` 로직 개선.
- **관리자 구장 관리 고도화 (2026-03-05)**: 기존 구장 데이터를 불러와 수정(Upsert)하는 기능 및 홀별 전장(Distance) 입력 기능을 추가하여 마스터 DB의 정밀도 향상.
- **동기화 안정성 강화**: 로그인 직후 다중 비동기 호출 시 발생하는 Race Condition을 해결하기 위해 **Singleton Promise 패턴**을 도입.
- **SSR 빌드 호환성 (Vercel)**: Web 정적 렌더링 시 `window` 객체 부재로 인한 빌드 에러 방지를 위해 Isomorphic Safety Wrapper 적용.
- **구장 마스터 DB 통합**: Club, Course, Hole, Distance 4계층 스키마 설계 및 27홀 구장 대응을 구성 완료.
- **성능 최적화**: `useMemo`를 통한 연산 최적화 및 `Promise.all`을 이용한 비동기 병렬 처리 도입.
- **아키텍처 리팩토링**: DDD(Domain-Driven Design)를 기반으로 비즈니스 로직(src/modules)과 공통 인프라(src/shared)를 엄격히 분리.

## 개발 및 구동
현재 이 프로젝트 구조는 Expo Go 앱 내 테스트 및 웹 렌더링 호환성을 갖추고 있습니다.

```bash
# 의존성 설치
npm install

# Expo Go(모바일) 또는 Web 서버 구동
npx expo start

# Edge Function 배포 (관리자 기능 업데이트 시)
npx supabase functions deploy course-import
```

## 환경변수 설정

`.env` 파일을 프로젝트 루트에 생성 (`.env.example` 참고):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Supabase Edge Function 시크릿 (Supabase 대시보드 → Edge Functions → Manage secrets):

```bash
GOOGLE_AI_API_KEY=<YOUR_GOOGLE_AI_API_KEY>   # Google AI Studio 무료 발급
```
