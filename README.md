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
   - **관리자 전용 등록**: 관리자 계정('savior714@gmail.com') 전용 구장 정보 등록 화면 제공 (`app/(tabs)/admin.tsx`)
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
- **구장 마스터 DB 통합**: Club, Course, Hole, Distance 4계층 스키마 설계 및 27홀 구장 대응을 위한 전/후반 코스 개별 선택 로직 구현.
- **관리자 기능**: 특정 이메일 권한 기반의 구장 마스터 데이터 등록/관리 UI 및 RLS 보안 강화.
- **성능 최적화**: `useMemo`를 통한 연산 최적화 및 `Promise.all`을 이용한 비동기 병렬 처리 도입.
- **아키텍처 리팩토링**: DDD(Domain-Driven Design)를 기반으로 비즈니스 로직(src/modules)과 공통 인프라(src/shared)를 엄격히 분리.
- **데이터 안정성**: 로그인 세션 기반 스토리지 키 캐싱 및 익명 데이터 자동 마이그레이션 로직 고도화.
- **UI 일관성**: `ScoreCardTable` 컴포넌트 추출을 통해 대시보드와 기록기 간 스코어 표시 로직 통합.

## 개발 및 구동
현재 이 프로젝트 구조는 Expo Go 앱 내 테스트 및 웹 렌더링 호환성을 갖추고 있습니다.

```bash
# 종속성 설치 (의존성 설치 시)
npm install

# Expo Go(모바일) 또는 Web 서버 구동
npx expo start
```
