# Antigravity Golf Tracker

Expo Router 기반의 모바일 중심 골프 스코어링 애플리케이션입니다.
초기 설정부터 데이터 모델 확장, UI/UX 개선, 그리고 미스샷 분석까지 지속적으로 진화하고 관리되는 프로젝트 코드베이스입니다.

## 주요 기능 및 최신 고도화 사항

1. **지능형 홀 기록 및 분석**
   - 타수, 퍼트, OB, 페널티 트래킹 및 6가지 미스샷 패턴 분석.
   - **자동화**: 퍼트 수 3개 이상 시 '쓰리퍼트' 패턴 자동 부여 및 FIR(페어웨이 안착) 기능 탑재.

2. **프로페셔널 통계 및 대시보드**
   - 9홀 분할 스코어카드 테이블 및 3x5 통계 그리드 뷰.
   - **Trend Analysis**: Dashboard 내 **최근 5경기 스코어 추세선(Animated Chart)** 및
     **빈번한 미스 패턴 분석(Heatmap)** 제공.
   - **인터랙션**: `Toast` 알림 시스템 및 `Haptic` 피드백 연동으로 높은 사용자 경험(UX) 제공.

3. **강력한 데이터 영속성 및 동기화**
   - **Sync Engine**: `KeyedAsyncLock`을 이용한 동시성 제어 및 오프라인 Sync Queue 지원.
   - **Safe Sync Protocol**: 타임스탬프와 레코드 정합성을 검증하여 클라우드-로컬 간 데이터 유실 방지.

4. **안정적인 아키텍처 (DDD & 3-Layer)**
   - **상태 관리**: `useReducer`를 이용한 원자적 상태 변환 (Atomic State Orchestration).
   - **회복 탄력성**: `GlobalErrorBoundary` 및 `HoleErrorBoundary`를 통한 결함 격리.

## 기술 스택 (Tech Stack)

- **Frontend**: React Native (Expo Router), Ark UI (Web/Native pattern)
- **State/Cache**: React Query, useReducer
- **Backend/Auth**: Supabase (PostgreSQL, RLS), Google OAuth
- **Style**: Vanilla CSS (Premium Dark Mode Aesthetics)

## 프로젝트 문서 (SSOT)

- [CRITICAL_LOGIC.md](./docs/CRITICAL_LOGIC.md): 핵심 비즈니스 로직 및 아키텍처 규칙 (최종 권위)
- [memory.md](./docs/memory.md): 프로젝트 개발 역사 및 전체 요약
- [IMPROVEMENT_PLAN.md](./docs/IMPROVEMENT_PLAN.md): 향후 기능 고도화 로드맵 (단계별 실행 계획)

## 개발 및 실행 방법

```bash
# 패키지 설치
npm install

# Expo 개발 서버 실행
npm run dev
```
