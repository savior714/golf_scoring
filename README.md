# Antigravity Golf Tracker

Expo Router 기반의 모바일 중심 골프 스코어링 애플리케이션입니다.
초기 설정부터 데이터 모델 확장, UI/UX 개선, 그리고 미스샷 분석까지 지속적으로 진화하고 관리되는 프로젝트 코드베이스입니다.

## 주요 기능 제한 및 특징

1. **홀(Hole) 기록 (`app/(tabs)/record.tsx`)**
   - 구장 선택, PAR 및 거리 표출 (웹 환경 호환 `window.confirm` 적용)
   - 타수(Stroke), 퍼트(Putt), OB, 페널티/해저드 개별 트래킹 기능
   - 6가지 미스샷 패턴 (슬라이스, 훅, 뒤땅, 생크, 벙커, 쓰리펏) 분석 지원 및 그리드 레이아웃

2. **실시간 리더보드 및 프로페셔널 스코어카드 (`app/(tabs)/index.tsx`)**
   - **프로페셔널 스코어카드 테이블**: 9홀 분할 테이블, 점수별 심볼(◎, ○, □, ◇) 표기 및 자동 합산 기능
   - 3x5 통계 그리드 뷰 (진행률, 이글~더블보기+, 평균 퍼트, OB/해저드 별도 통계)
   - 고유 통계 분석 서비스 연동 (`golfService.ts`)

3. **클럽 마스터 데이터 및 27홀 동적 코스 지원**
   - **4계층 구조**: 클럽 > 코스 (9홀 단위) > 홀 > 거리
   - **동적 코스 조합**: 27홀 구장을 위해 3단계 선택(클럽 → 전반 코스 → 후반 코스)으로 18홀 라운딩 구성
   - **관리자 전용 기능**: `savior714@gmail.com` 계정 전용 클럽 데이터 등록 및 수정 기능 (`app/(tabs)/admin.tsx`)
   - *참고: Gemini 기반 코스 자동 임포트 기능은 사용자 요청에 의해 안전하게 제거되었습니다.*

4. **멀티 유저 지원 및 클라우드 동기화 (안전 동기화 프로토콜)**
   - **Google OAuth**: 구글 계정을 통한 간편 로그인 (매직 링크 및 OAuth 팝업)
   - **안전 동기화(Safe Sync)**: 타임스탬프(`updatedAt`)와 홀 데이터 길이를 교차 검증하여, 로컬 데이터가 네트워크 오류로 인해 부분적으로 동기화된 클라우드 데이터에 의해 덮어씌워지는 현상(Data Loss) 완벽 차단.
   - **Supabase Cloud**: 사용자별 데이터 격리(RLS 정책) 및 실시간 클라우드 백업

5. **안정적인 데이터 영속성 (Persistence)**
   - 사용자별 독립적인 `AsyncStorage` 키 관리 (`@golf_rounds_data_{userId}`)
   - **AsyncLock (Mutex)**: 스토리지 읽기-병합-쓰기 과정에서의 Race Condition을 원천 차단하는 자체 잠금 메커니즘 탑재

## 아키텍처 (DDD & 3-Layer)

- **도메인 모듈 (`src/modules/golf`)**: 골프 도메인에 특화된 비즈니스 로직 격리
  - **Definition**: 데이터 타입 및 인터페이스 (`golf.types.ts`)
  - **Repository**: 데이터 접근 계층 (Local + Remote) (`golf.repository.ts`)
  - **Service**: 통계 계산 및 도메인 로직 (`golf.service.ts`)
- **공유 인프라 (`src/shared`)**: 프로젝트 전반에서 재사용되는 UI 및 설정
  - **Components**: 공통 UI 컴포넌트 (`src/shared/components`)
  - **Lib**: 외부 라이브러리 설정 (Supabase 등) (`src/shared/lib`)
- **라우터 (`app/`)**: Expo Router 기반의 파일 시스템 라우팅 (비즈니스 로직 배제)
  - **Premium UI**: 다크 테마 방식의 글래스모피즘 디자인 및 자연스러운 마이크로 인터랙션

## 최근 핵심 업데이트

- **최대 수준의 메모리 누수 감사 (2026-03-06)**: `setInterval`, `setTimeout`, 미해제된 `BackHandler`, 고아(Orphan) Promise 등 주요 React 누수 벡터를 전면 감사하고, AsyncLock과 `onAuthStateChange` 구독 해제 로직의 완결성을 검증했습니다.
- **안전 동기화 프로토콜(Safe Sync) 적용 (2026-03-06)**: 멀티 디바이스 환경에서 불완전한 클라우드 데이터가 로컬 스코어를 덮어쓰는 동기화 충돌 문제를 타임스탬프 및 홀 카운팅 기반 검증 로직으로 해결했습니다.
- **개발 환경 Watchdog 도입 (2026-03-06)**: 개발자 터미널(`dev.ps1`) 강제 종료 시 남겨지는 고아 브라우저 프로세스를 완벽히 정리하기 위해, Chrome 프로세스에 태그를 달아 추적하는 백그라운드 Watchdog 모니터링 시스템을 구축했습니다.
- **Extreme Silent Protocol 기반 SSOT (2026-03-06)**: AI 터미널 화면 깜빡임 현상을 방지하기 위해 파일 열람 시 쉘 명령어 활용을 0%로 제한하고 네이티브 도구만을 사용하도록 DX 정책을 고도화했습니다. (문서 영문화 완료)
- **UI 및 통계 직관성 개선 (2026-03-06)**: '트리플 보기 이상' 단계를 '더블 보기+'로 통합하여 대시보드 그리드 UI를 3x5 규격으로 시인성 높게 개편하였습니다.

## 개발 및 실행 방법

```bash
# 패키지 설치
npm install

# Expo 모바일 / 웹 개발 서버 실행
npm run dev
```

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하여 아래 값을 입력하세요 (`.env.example` 참고):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```
