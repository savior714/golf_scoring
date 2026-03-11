# Antigravity Golf Tracker

Expo Router 기반 모바일 골프 스코어링 애플리케이션.
구장 마스터 데이터부터 홀별 기록, 통계 분석, 클라우드 동기화까지 완결된 사이클을 제공한다.

---

## 주요 기능

### 1. 홀별 기록 (Record)
- **타수 / 퍼트 / OB / 페널티** 트래킹
- **6가지 미스샷 패턴** 선택 (홀당 최대 2가지)
- **GIR 자동 산출**: `(stroke - putt) <= (par - 2)` 기준
- **쓰리퍼트 자동 부여**: 퍼트 3개 이상 시 자동 태깅 / FIFO 방식 관리
- **코스 선택 → 티 선택 → 기록** 순서의 명확한 단계별 워크플로우
- **이어하기 지원**: 앱 재시작 시 `@current_round_id`로 세션 자동 복구

### 2. 대시보드 & 통계 (Dashboard)
- 9홀 분할 스코어카드 테이블 (`ScoreCardTable`)
- **3×5 통계 그리드**: 평균 타수, 퍼트, GIR, OB 등
- **최근 5경기 트렌드 차트** (Animated Line Chart)
- **미스 패턴 히트맵**: 파3 vs 파4/5 상황별 빈도 분리 표시
- 상대 스코어 색상 코딩: Over(Red) / Under(Green) / Even(White)

### 3. 기록 내역 (History)
- 전체 라운드 목록 조회 및 "보기 / 수정" 단일 진입점
- 스코어카드 상세 + 수정 통합 뷰

### 4. 클라우드 동기화 (Supabase)
- 라운드 종료 시 자동 Upsert (RLS 정책 적용)
- **Safe Sync Protocol**: `updatedAt` 타임스탬프 + 홀 레코드 수 비교로 데이터 유실 방지
- **Offline Sync Queue**: 실패 시 `@pending_sync_ids` 큐잉 → 포어그라운드 복귀 / 세션 초기화 시 자동 재시도 (최신순)
- **KeyedAsyncLock**: 동시 sync 호출 직렬화로 race condition 방지
- 대시보드 진입 시 최신 클라우드 데이터 자동 Pull

### 5. 관리자 기능 (Admin)
- 구장(Club) / 코스(Course) / 홀(Hole) / 전장(Distance) 4단계 계층 데이터 직접 입력
- **데이터 무결성 검증**: 9홀 고정, Par 합계 36, 전장 미입력 감지
- `is_verified` 플래그로 검수 상태 관리 (미검수 구장 우선 노출 억제)
- 어드민 탭은 `is_admin()` RLS 기반으로 조건부 노출 (`tabBarButton` 패턴 사용)

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Framework** | React Native (Expo SDK), Expo Router v3 |
| **State** | `useReducer` (Atomic State Orchestration) + React Query |
| **Backend** | Supabase (PostgreSQL + RLS + Auth) |
| **Auth** | Google OAuth via Supabase |
| **Storage** | AsyncStorage (user-keyed, `@golf_rounds_data_{userId}`) |
| **Resilience** | GlobalErrorBoundary + HoleErrorBoundary |
| **UI/Animation** | react-native-reanimated, react-native-toast-message, Haptics |
| **Typing** | TypeScript strict (`any` 금지, `unknown` + Type Guard) |

---

## 아키텍처 (DDD 3-Layer)

```
app/
  (auth)/          # 로그인 화면
  (tabs)/
    index.tsx      # Dashboard
    record.tsx     # 홀 기록 (세션 핵심)
    history.tsx    # 기록 내역
    admin.tsx      # 관리자 전용
    _layout.tsx    # Tab Navigator

src/modules/golf/
  golf.types.ts       # 도메인 모델 & 인터페이스 (Definition)
  golf.repository.ts  # AsyncStorage + Supabase I/O (Repository)
  golf.service.ts     # 비즈니스 로직 & 통계 엔진 (Service)
  golf.data.ts        # 정적 도메인 데이터
  golf.constants.ts   # 상수
  components/         # UI 컴포넌트 (ScoreCardTable 등)
  hooks/              # useGolfRecord 등 커스텀 훅

src/shared/
  components/         # 공통 UI
  lib/                # Supabase 클라이언트, 유틸
  constants/          # 테마

supabase/
  functions/          # Edge Functions (예약)
  migrations/         # DB 마이그레이션 SQL
```

---

## 핵심 설계 원칙

- **SSOT**: `AsyncStorage` 로컬 저장소가 진실의 원천. 파생 데이터는 `useMemo`로만 계산.
- **Stale Closure 방지**: async 콜백에서 `useRef` + `useEffect` 패턴으로 최신 state 참조.
- **Atomic 상태 전환**: `useReducer`로 다수 필드 동시 갱신 시 불법 상태 전환 방지.
- **OB/페널티 비자동 합산**: 통계 트래킹 전용 — 최종 타수는 사용자가 직접 반영.
- **Hook 안정성**: `actions` 객체는 `useMemo`, 내부 함수는 `useCallback([dispatch])`로 고정.

---

## 개발 실행

```bash
npm install
npm run dev
```

---

## 프로젝트 문서 (SSOT)

| 문서 | 설명 |
|------|------|
| [CRITICAL_LOGIC.md](./docs/CRITICAL_LOGIC.md) | 핵심 비즈니스 로직 및 아키텍처 규칙 (최종 권위) |
| [memory.md](./docs/memory.md) | 개발 히스토리 및 전체 요약 |
| [IMPROVEMENT_PLAN.md](./docs/IMPROVEMENT_PLAN.md) | 기능 고도화 로드맵 |
