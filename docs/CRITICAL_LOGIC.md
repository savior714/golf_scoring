# Golf Scoring Application - Critical Logic (SSOT)

## 0. 구장 마스터 데이터 구조 (Course Master Structure)
*   **4-Layer Hierarchy**: 구장(Club) > 코스(Course) > 홀(Hole) > 전장(Distance) 순으로 계층화되어 관리됩니다.
*   **코스 유닛화**: 모든 코스는 9홀 단위 유닛으로 관리됩니다. (18홀 구장은 2개 코스, 27홀 구장은 3개 코스로 구성)
*   **Out-In 조합 논리**: 18홀 라운드는 전반(Out) 9홀 유닛과 후반(In) 9홀 유닛의 동적 조합으로 정의됩니다.
*   **보안 정책**: 구장 마스터 정보의 생성/수정/삭제는 관리자 권한(`is_admin()`)을 가진 특정 계정으로만 제한됩니다. (DB RLS 적용)

## 1. 스코어 계산 정책 (Scoring Policy)
*   **Total Score:** 모든 홀의 `stroke` 합산값입니다.
*   **Relative Score:** `Total Score - Total Par`로 계산하며, Over(+)는 빨간색, Under(-)는 초록색, Even(E)은 하얀색/회색으로 시각화합니다.
*   **GIR (Green In Regulation):** `(stroke - putt) <= (par - 2)`인 경우 성공으로 판정합니다.
*   **벌타(OB/Penalty) 처리:** OB와 Penalty 버튼은 통계 기록용이며, **타수(Stroke)에 자동으로 합산되지 않습니다.** 사용자가 룰에 따라 최종 타수를 직접 가감해야 합니다.
*   **미스샷 패턴 분석:** 한 홀당 **최대 2개까지 중복 선택**이 가능하며, 콤마(`,`) 구분자로 저장됩니다.
*   **지능형 자동화 (Three-putt):** 퍼트 수가 3타 이상일 경우 시스템이 자동으로 '쓰리펏' 패턴을 추가/제거하며, 기존 선택된 패턴이 2개일 경우 FIFO(First-In, First-Out) 방식으로 최신 상태를 유지합니다.

## 2. 세션 및 데이터 관리 (Session & Data Management)
*   **진실의 원천 (SSOT):** `AsyncStorage`를 기반으로 하며, 로그인 시 사용자 ID 기반 키(`@golf_rounds_data_{userId}`)를 생성하여 서버 간 데이터 혼선을 방지합니다.
*   **스토리지 키 무결성 (Singleton Promise):** 로그인 직후 발생하는 다중 비동기 호출 시 Race Condition을 방지하기 위해, `getStorageKey`는 반드시 Singleton Promise 패턴을 사용해야 합니다. (동시 호출 시에도 단 한 번의 세션 조회를 보장)
*   **인증 상태 변경 처리:** `onAuthStateChange` 콜백에서 데이터를 가져올(Pull/Migrate) 때는 콜백이 제공하는 `session` 객체를 함수 파라미터로 직접 전달하여, 타이밍 차이로 인한 `getSession` 응답 불일치(Race Condition)를 차단합니다.
*   **데이터 마이그레이션:** 익명 사용자 데이터는 로그인 성공 시 자동으로 계정 전용 스토리지 및 클라우드(Supabase)로 이전됩니다.
*   **고유 세션 ID:** 각 라운딩은 `round_Timestamp` 형식의 고유 ID를 가집니다.
*   **액티브 세션 추적:** `@current_round_id` 키를 통해 현재 진행 중인 라운드를 추적하며, 앱 재시작 시 해당 라운드를 자동으로 복구합니다.
*   **클라우드 동기화 (Supabase):** 라운딩 종료 시 로컬 데이터를 Supabase 클라우드에 자동으로 동기화(Upsert)하며, `rounds`와 `holes` 테이블 간의 RLS(Row Level Security) 정책을 준수합니다.
*   **멀티 디바이스 정합성 (Pull-before-Write):** 서로 다른 기기(PC, 모바일)에서의 데이터 덮어쓰기를 방지하기 위해, 대시보드 진입 시 최신 클라우드 데이터를 자동으로 가져오며(Pull), 모든 쓰기 작업 전 최신 상태를 확보하는 것을 원칙으로 합니다.
*   **27홀 지원 명세**: `rounds` 테이블은 `out_course_id`와 `in_course_id`를 통해 실제 사용된 9홀 코스 조합을 추적하며, 통계 및 상세 조회 시 해당 ID를 기반으로 마스터 데이터를 조인합니다.

## 3. 개발 및 성능 표준 (Development & Performance Standards)
*   **환경 호환성 (SSR Safety):** `window`, `localStorage` 등 브라우저 API에 접근하는 모듈(Supabase, AsyncStorage 등)은 빌드 타임(Node.js 환경) 에러를 방지하기 위해 반드시 `typeof window !== 'undefined'` 체크 또는 Dummy Storage Wrapper를 포함해야 합니다.
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