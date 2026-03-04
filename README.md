# Antigravity Golf Tracker

Expo Router를 기반으로 동작하는 모바일 타겟 골프 스코어링 애플리케이션입니다.
초기 세팅부터 데이터 모델링 확장, UI/UX 고도화, 미스샷 통계 분석까지 전 과정을 통해 진화하는 프로젝트 관리형 코드베이스입니다.

## 기능 (Features)
1. **홀(Hole) 정보 기입 (app/(tabs)/record.tsx)**
   - 코스 선택, PAR, DISTANCE 명판 지원 (`window.confirm` 웹 호환성)
   - 스트로크(Stroke), 퍼트(Putt), OB, 벌타/해저드 개별 측정
   - 6가지 미스샷 패턴 (슬라이스, 훅, 뒤땅, 생크, 벙커, 쓰리펏) 그리드 분석
2. **리얼타임 리더보드 (app/(tabs)/index.tsx)**
   - 스코어 3x5 그리드 통합 뷰 (진행상황, 이글~더블, 퍼트평균, OB/해저드 분리 수치 제공)
   - 자체 집계 로직 서비스(`golfService.ts`) 연동
3. **Persist Storage**
   - 로컬 `AsyncStorage`를 통한 세션 기반 라운드 영속성 유지 연계 (`roundRepository`)

## 아키텍처 (Architecture)
- **Domain (`src/domains`)**: 데이터 스키마 타입 통일 (e.g. `HoleRecord`, `RoundSummary`)
- **Repository (`src/repositories`)**: 저장소 레이어. (현재 AsyncStorage)
- **Service (`src/services`)**: 도메인 엔티티를 바탕으로 로직 계산 (GIR, 통계, 미스샷 카운팅 등)
- **Page (UI/UX)**: Expo Router (`app/`)
  - Typography 위계 관리를 통해 모바일 가독성 증대 및 폰트 Weight 명세 반영 완료

## 개발 및 구동
현재 이 프로젝트 구조는 Expo Go 앱 내 테스트 및 웹 렌더링 호환성을 갖추고 있습니다.

```bash
# 종속성 설치 (의존성 설치 시)
npm install

# Expo Go(모바일) 또는 Web 서버 구동
npx expo start
```
