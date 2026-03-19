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
- **개인 핸디캡 추정**: 최근 20경기 기반 **USGA 방식 간이 핸디캡** 자동 산출 및 배너 표시
- **최근 5경기 트렌드 차트** 및 **미스 패턴 히트맵** (파3 vs 파4/5 상황별 빈도 분리 표시)
- 상대 스코어 색상 코딩: Over(Red) / Under(Green) / Even(White)

### 3. 클라우드 동기화 (Supabase)

- **Sync Throttling (30m)** & **Silent Sync**: 성능 최적화 및 UX 간소화
- **Safe Sync Protocol**: 업데이트 타임스탬프 + 데이터 완전성 비교로 유실 방지
- **Offline Sync Queue**: 실패 시 자동 재시도 예약 (최신순)

### 4. 공지사항 (Notice)

- **전체 사용자 공지**: 중요 시스템 업데이트 및 구장 안내 사항 전달
- **관리자 전용 관리**: 바텀 시트 기반의 공지사항 작성, 수정, 삭제 인터페이스
- **실시간 반영**: React Query 캐시 동기화를 통한 즉각적인 UI 상태 업데이트

### 5. 관리자 기능 (Admin & Bulk Import)

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

### 6. SDD 아키텍처 (Domain Driven 3-Layer)

골프 모듈은 **Spec-Driven Design**을 기반으로 로직의 성격에 따라 3개 계층으로 엄격히 분리되어 있습니다.

```text
src/modules/golf/
  domain/                 # 1. 도메인 계층 (Pure Business Logic)
    golf.types.ts           # 데이터 타입 및 인터페이스
    golf.constants.ts       # 도메인 상수
    repositories/           # 도메인 레포지토리 인터페이스
    services/               # 순수 비즈니스 계산 및 분석 (GolfDomainService)
  application/            # 2. 어플리케이션 계층 (Use Case Orchestration)
    golf.application.service.ts  # 라운드 시작/저장/종료, 세션 복구 및 동기화 조율
  infrastructure/         # 3. 인프라 계층 (Implementation Details)
    repositories/           # 통합 레포지토리 구현체 (Round, Club, Match)

src/modules/admin/
  domain/                 # 1. 도메인 계층 (Pure Business Logic)
    admin.types.ts          # 관리자 폼 및 임포트용 타입
    services/               # JSON 정규화, 야드-미터 변환 (AdminDomainService)
  application/            # 2. 어플리케이션 계층 (Use Case Orchestration)
    admin.application.service.ts # 구장 CRUD, 대량 임포트 유즈케이스 조율
  infrastructure/         # 3. 인프라 계층 (Implementation Details)
    # golf 모듈의 ClubRepository를 재사용하며, 필요 시 관리자 전용 레포지토리 추가
  hooks/                  # UI 훅 (UI State & Logic Breakdown)
    useAdminForm.ts         # 구장 상세 정보 편집 핸들러
    useBulkImport.ts        # 대량 JSON 임포트 핸들러
  components/             # UI 컴포넌트 (AdminFormComponents)
```

---

- [AI_GUIDELINES.md](./AI_GUIDELINES.md): AI 행동 지침 및 인코딩/환경 표준 (최상위 규정)
- [CRITICAL_LOGIC.md](./docs/CRITICAL_LOGIC.md): 핵심 비즈니스 로직 및 아키텍처 규칙
- [memory.md](./docs/memory.md): 개발 히스토리 및 전체 요약
- [archives/plans/](./archives/plans/): 완료된 작업 실록 및 설계 문서
