# 코드 리뷰 및 개선 계획 (2026-03-10)

최근 진행된 **Phase 4 리팩토링 및 3-Layer 아키텍처 적용**에 대한 코드 리뷰 결과입니다. 전반적으로 로직 분석과 UI 분리가 잘 이루어졌으나, 안정성과 확장성 측면에서 개선이 필요한 포인트들이 발견되었습니다.

## 1. 주요 발견 사항 및 문제점 (Current Issues)

### A. 상태 관리 정밀도 부족 (`useGolfRecord.ts`)
- **Tee 선택 로직 오류**: `setSelectedTee` 함수가 `INIT_SESSION` 액션을 호출하고 있습니다. 이 액션은 세션 전체를 초기화하는 성격이 강해, 티(Tee)만 변경하고 싶을 때 다른 로직(날짜, ID 등)이 초기값으로 덮어씌워질 위험이 있습니다.
- **파생 상태의 중복 저장**: `par`, `stroke` 등은 `holeRecords`에서 유도될 수 있는 값임에도 `useState` 기반의 `dispatch`로 중복 관리되고 있어 싱크가 틀어질 가능성이 있습니다.

### B. 데이터 동기화 및 오프라인 회복 탄력성 (`golf.repository.ts`)
- **동기화 경합 조건 (Race Condition)**: `syncRoundToSupabase`가 비동기로 실행되지만, 동일한 라운드에 대해 짧은 간격으로 여러 번 호출될 경우 마지막 데이터가 정상적으로 반영되지 않거나 중복 요청이 발생할 수 있습니다.
- **인증 의존성 리스크**: `getStorageKey`가 Supabase 세션에 강하게 결합되어 있습니다. 오프라인 상태에서 세션이 유효하지 않을 경우 로컬 스토리지 접근마저 차단될 위험이 있습니다.

### C. 코드 무결성 및 매직 스트링
- **"없음" (Magic String)**: '없음'이라는 문자열이 서비스와 UI 곳곳에 하드코딩되어 있습니다. `CONSTANTS` 또는 `Enum`으로 관리되어야 합니다.
- **타입 안정성**: `p: any`와 같이 `any` 타입을 사용하는 구간이 존재하여 런타임 에러의 잠재적 원인이 됩니다.

## 2. 개선 제안 (Proposed Improvements)

### Phase 5-A: 아키텍처 고도화
1. **Sync Queue 시각화**: 현재 백그라운드에서만 도는 싱크 상태를 사용자에게 명확히 알리고, 실패 시 수동 재시도 버튼을 UI에 노출합니다.
2. **Global Toast System**: `Alert.alert`를 대체하여 비동기 작업 결과를 부드럽게 알리는 토스트 시스템을 연동합니다.

### Phase 5-B: 성능 최적화
1. **클럽 마스터 데이터 캐싱**: `getAllClubsSummary`를 호출할 때마다 Supabase로 직접 쿼리하는 대신, React Query의 캐시를 적극 활용하거나 로컬에 1차 저장합니다.
2. **Atomic State Update**: `useGolfRecord`의 리듀서를 좀 더 세분화하여, 특정 필드만 부분 수정할 때 부수 효과가 없도록 개선합니다.

## 3. 실행 계획 (Action Plan)

1. **[src/modules/golf/golf.constants.ts]** 생성: 매직 스트링 및 미스샷 패턴 상수화.
2. **[src/modules/golf/hooks/useGolfRecord.ts]** 수정: `SET_TEE_COLOR` 전용 액션 추가 및 `any` 타입 제거.
3. **[src/modules/golf/golf.repository.ts]** 수정: `syncRoundToSupabase`에 실행 중 플래그(Queue/Lock) 도입하여 경합 방지.
4. **[app/(tabs)/index.tsx]** 수정: 동기화 실패 목록 확인 및 일괄 재시도 UI 추가.

---
위 내용을 바탕으로 수정을 진행할 예정입니다. 승인 시 첫 번째 단계인 상수화 및 리듀서 개선부터 착수하겠습니다.