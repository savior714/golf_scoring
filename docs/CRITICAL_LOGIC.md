# Golf Scoring Application - Critical Logic (SSOT)

## 1. 스코어 계산 정책 (Scoring Policy)
*   **Total Score:** 모든 홀의 `stroke` 합산값입니다.
*   **Relative Score:** `Total Score - Total Par`로 계산하며, Over(+)는 빨간색, Under(-)는 초록색, Even(E)은 하얀색/회색으로 시각화합니다.
*   **GIR (Green In Regulation):** `(stroke - putt) <= (par - 2)`인 경우 성공으로 판정합니다.
*   **벌타(OB/Penalty) 처리:** OB와 Penalty 버튼은 통계 기록용이며, **타수(Stroke)에 자동으로 합산되지 않습니다.** 사용자가 룰에 따라 최종 타수를 직접 가감해야 합니다.

## 2. 세션 및 데이터 관리 (Session & Data Management)
*   **진실의 원천 (SSOT):** `AsyncStorage`를 기반으로 하며, 로그인 시 사용자 ID 기반 키(`@golf_rounds_data_{userId}`)를 생성하여 서비 간 데이터 혼선을 방지합니다.
*   **데이터 마이그레이션:** 익명 사용자 데이터는 로그인 성공 시 자동으로 계정 전용 스토리지 및 클라우드(Supabase)로 이전됩니다.
*   **고유 세션 ID:** 각 라운딩은 `round_Timestamp` 형식의 고유 ID를 가집니다.
*   **액티브 세션 추적:** `@current_round_id` 키를 통해 현재 진행 중인 라운드를 추적하며, 앱 재시작 시 해당 라운드를 자동으로 복구합니다.
*   **클라우드 동기화 (Supabase):** 라운딩 종료 시 로컬 데이터를 Supabase 클라우드에 자동으로 동기화(Upsert)하며, `rounds`와 `holes` 테이블 간의 RLS(Row Level Security) 정책을 준수합니다.

## 3. 개발 및 성능 표준 (Development & Performance Standards)
*   **비동기 최적화:** 독립적인 비동기 작업(예: 스토리지 저장 + 세션 ID 설정)은 반드시 `Promise.all`을 사용하여 병렬 처리합니다.
*   **계산 최적화:** 요약 통계나 진행률 계산 등 연산 비용이 높은 로직은 `useMemo`를 통해 불필요한 재계산을 방지합니다.
*   **컴포넌트 재사용:** 스코어카드 테이블과 같은 핵심 UI 요소는 `ScoreCardTable`로 공통화하여 데이터 일관성을 유지합니다.

## 4. 아키텍처 (Architecture - DDD & 3-Layer)
*   **도메인 모듈화 (`src/modules/golf`):** 특정 비즈니스 도메인(골프)에 관한 모든 로직을 하위 폴더에 격리하여 캡슐화합니다.
    *   **golf.types.ts**: 데이터 모델 및 인터페이스 정의 (Definition)
    *   **golf.repository.ts**: 데이터 저장소 접근 레이어 (Repository)
    *   **golf.service.ts**: 비즈니스 계산 로직 (Service)
    *   **golf.data.ts**: 도메인 관련 정적 데이터 (Data)
*   **공통 인프라 (`src/shared`):** 프로젝트 전반에서 공유되는 UI(`components`), 설정(`lib`), 테마(`constants`)를 분리 관리합니다.
*   **라우팅 및 뷰 (`app/`):** Expo Router 표준을 따르며, 비즈니스 로직을 배제하고 UI 렌더링에 집중합니다.