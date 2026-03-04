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
3. **다중 사용자 지원 및 클라우드 동기화**
   - **Google OAuth**: 구글 계정을 통한 간편 로그인 (Magic Link & OAuth Pop-up 지원)
   - **데이터 마이그레이션**: 로그인 전 익명 기록을 로그인 후 계정으로 자동 이전 (유실 방지 정책)
   - **Supabase Cloud**: 사용자별 데이터 격리(RLS) 및 실시간 클라우드 백업
4. **Persist Storage**
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

## 개발 및 구동
현재 이 프로젝트 구조는 Expo Go 앱 내 테스트 및 웹 렌더링 호환성을 갖추고 있습니다.

```bash
# 종속성 설치 (의존성 설치 시)
npm install

# Expo Go(모바일) 또는 Web 서버 구동
npx expo start
```
