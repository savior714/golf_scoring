# Antigravity Golf Tracker

Expo Router 기반 모바일 골프 스코어링 애플리케이션.
구장 마스터 데이터부터 홀별 기록, 통계 분석, 라운드 동기화까지 전과정의 라이프사이클을 제공한다.

---

## 주요 기능

### 1. 홀별 기록 (Record)

- **타수 / 퍼트 / OB / 페널티** 트래커
- **6가지 미스 샷 패턴** 선택 (홀당 최대 2가지)
- **GIR 자동 산출**: `(stroke - putt) <= (par - 2)` 기준
- **쓰리퍼트 자동 부여**: 퍼트 3개 이상 시 자동 체킹 / FIFO 관리
- **코스 선택 → 티 선택 → 기록** 순서의 명확한 단계별 워크플로우
- **이어하기 지원**: 앱 재시작 시 `@current_round_id`로 세션 자동 복구

### 2. 대시보드 & 통계 (Dashboard)

- 9홀 분할 스코어카드 테이블 (`ScoreCardTable`)
- **3x5 통계 그리드**: 평균 타수, 퍼트, GIR, OB 등
- **최근 5경기 트렌드 차트** 및 **미스 패턴 히트맵** (파3 vs 파4/5 상황별 빈도 분리 표시)
- 상대 스코어 색상 코딩: Over(Red) / Under(Green) / Even(White)

### 3. 클라우드 동기화 (Supabase)

- **Sync Throttling (30m)** & **Silent Sync**: 성능 최적화 및 UX 간소화
- **Safe Sync Protocol**: 업데이트 타임스탬프 + 데이터 완전성 비교로 유실 방지
- **Offline Sync Queue**: 실패 시 자동 재시도 예약 (최신순)

### 4. 관리자 기능 (Admin & Bulk Import)

- **Zero-Tolerance Validator**: 9홀 고정, Par 36, 전장 필수 등 엄격한 검증 (진입 차단)
- **Atomic Bulk Import**: JSON 기반 대량 구장 데이터 동시 적재 (Supabase RPC)
- **Admin-Only Access**: `isAdmin` 상태 및 RLS 기반 보안 안정성 확보

### 5. DB 자동 백업 (Infrastructure)

- **Daily AES-256 Backup**: 매일 한국 시간 오전 0시 자동 실행 및 GitHub Artifacts 업로드
- **90일 Retention**: 최근 90일간의 백업 로그 및 파일 보관

---

## 기술 스택

| 레이어 | 기술 |
| --- | --- |
| **Framework** | React Native (Expo SDK), Expo Router v3 |
| **State** | `useReducer` (Atomic Orchestration) + React Query |
| **Backend** | Supabase (PostgreSQL + RLS + Auth + RPC) |
| **Storage** | AsyncStorage (user-keyed, `@golf_rounds_data_{userId}`) |
| **UI/Animation** | react-native-reanimated, Toast, Haptics |

---

## 아키텍처 (DDD 3-Layer)

```text
app/
  (auth)/              # 로그인 화면
  (tabs)/              # Dashboard, Record, History, Admin
  admin_users.tsx      # 사용자 관리 (관리자 전용)
  admin_requests.tsx   # 구장 요청 관리 (관리자 전용)
  admin_import.tsx     # JSON 대량 임포트 (관리자 전용)
src/modules/golf/
  golf.types.ts          # 정의 (Definition)
  golf.constants.ts      # 상수
  golf.service.ts        # 로직 (Service)
  golf.repository.ts     # Aggregator (backward compat)
  repository/
    golf.round.repository.ts   # 라운드 I/O
    golf.club.repository.ts    # 구장/코스 I/O
  hooks/
    useGolfRecord.ts     # 오케스트레이터 훅
    useGolfSession.ts    # 세션 복원 로직
    useRoundActions.ts   # 라운드 액션(시작/저장/종료)
    golfRecord.state.ts  # reducer + 초기 상태
  components/            # UI 컴포넌트
  styles/                # 분리된 StyleSheet 파일들
src/modules/admin/
  admin.repository.ts    # 관리자 I/O
  components/            # UserCard, AdminFormComponents 등
  hooks/                 # useAdminForm, useBulkImport 등
  styles/                # adminImport.*.styles.ts 등
src/shared/              # 공통 UI, Lib, Utils
```

---

## 프로젝트 문서 (SSOT)

- [CRITICAL_LOGIC.md](./docs/CRITICAL_LOGIC.md): 핵심 비즈니스 로직 및 아키텍처 규칙
- [memory.md](./docs/memory.md): 개발 히스토리 및 전체 요약
- [docs/plans/](./docs/plans/): 진행 중인 작업 플랜 디렉토리
