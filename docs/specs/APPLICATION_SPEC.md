# 🏗️ APPLICATION_SPEC: Use Cases & Orchestration

> 상태: 정립 (Established) | 기준: 2026-03-19

## 1. Round Lifecycle Management (라운드 생명주기 관리)

어플리케이션 서비스(`GolfApplicationService`)는 다음 유즈케이스 시네리오를 오케스트레이션한다.

### 1.1 Start New Round
- 기존 활성 세션을 종료하고 `mode: 'new'` 파라미터와 함께 기록 화면으로 진입한다.
- **Action**: `RESET_SESSION` 및 새로운 라운드 ID 할당.
- **Guard**: 하루 최대 10건(`GOLF_LIMITS.MAX_DAILY_ROUNDS`) 생성으로 제한. 과거 날짜 생성 차단.

### 1.2 Save & Finish Round
- 로컬 데이터 저장 후 Supabase 클라우드에 자동으로 동기화(Upsert)를 시도한다.
- **Protocol**: `rounds` 및 `holes` 테이블의 RLS 정책을 준수하며 동기화.
- **Failover**: 동기화 실패 시 `@pending_sync_ids` 대기열에 추가.

## 2. Session Management & Recovery (세션 및 자동 복구)

- **Active Session Tracking**: `@current_round_id`를 통해 진행 중인 라운드를 추적하며, 앱 재시작 시 최종 상태를 자동 복구한다.
- **Auto-Repair**: 세션 로딩 중 데이터 불일치(Course ID 누락 등) 발견 시, 원격 DB를 재조회하여 올바른 정보를 보충하고 로컬 데이터를 리페치한다.
- **Navigation Protocols**:
  - `mode: 'new'`: 세션을 완전히 초기화하고 새로 시작.
  - `mode: 'edit'`: 특정 ID의 라운드 데이터를 로드하여 편집 모드로 진입.
  - **Parameter Consumption**: 파라미터(`mode`, `id`, `hole`)는 로드 성공 즉시 소비(`router.setParams`)하여 무한 루프를 방지한다.

## 3. Data Synchronization Protocol (데이터 동기화 프로토콜)

다중 기기 간 데이터 정합성을 위해 다음 규칙을 따른다.

- **Locking Logic**: 특정 라운드 ID에 대한 작업은 `KeyedAsyncLock`을 통해 **직렬화**하여 처리한다.
- **Conflict Resolution (LWW - Last Write Wins)**:
  - `updatedAt`이 더 큰(최신) 데이터를 우선한다.
  - 타임스탬프가 동일한 경우, **더 많은 홀 기록**을 보유한 데이터를 승자로 결정한다 (데이터 유실 방지).
- **Throttling**: 자동 동기화(`pullRoundsFromSupabase`)는 **30분 간격**으로 제한한다. 수동 새로고침은 무시 가능하다.
- **Silent Sync**: 백그라운드 동기화는 데이터 변경이나 오류가 없는 한 UI 알림/토스트 없이 무음으로 처리한다.

## 4. Auth & Session Stability (인증 및 세션 정합성)

- **Atomic Logout**: 로그아웃 시 진행 중인 비동기 작업을 완료 대기하며 세션 조회를 차단하는 상태 정보를 동기화한다.
- **Session Singleton**: `getStorageKey`는 싱글톤 프로미스를 사용하여 동시 호출 시에도 단 한 번의 세션 조회만 수행하도록 보장한다.
- **Auth Change Handling**: `onAuthStateChange` 콜백에서 제공하는 `session` 객체를 직접 파라미터로 전달하여 경쟁 상태를 차인한다.
