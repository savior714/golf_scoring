# 🗺️ Project Blueprint: 글로벌 포커스 리렌더링 및 깜빡임 방지 전수 점검

> 생성 일시: 2026-03-16 11:43 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **JSON Bulk Import**에서 발견된 포커스 기반 깜빡임 이슈가 다른 페이지(특히 관리자 및 입력 폼 페이지)에 남아있는지 점검.
- **SSOT**: `src/shared/contexts/AdminContext.tsx` 및 `app/_layout.tsx`에 적용된 글로벌 최적화의 유효성 검증.
- **Goal**: 사용자가 앱으로 복귀했을 때 불필요한 스피너 노출이나 데이터 유실 없이 부드러운 UI 경험 보장.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: `app/admin_requests.tsx` 및 `app/admin_users.tsx` 점검**
  - **Tool**: `Read`
  - **Target**: 해당 파일들
  - **Goal**: `useIsAdmin` 사용 방식 및 `isLoading` 처리가 깜빡임을 유발하는지 확인.
  - **Dependency**: None

- [ ] **Task 2: `app/(tabs)/record.tsx` 및 `index.tsx` 데이터 유지 점검**
  - **Tool**: `Read`
  - **Target**: 라운딩 기록 및 스코어 입력 페이지
  - **Goal**: React Query의 `refetchOnWindowFocus: false` 적용 후, 포커스 시 데이터가 의도치 않게 리셋되거나 깜빡이는 요소가 있는지 분석.
  - **Dependency**: Task 1

- [ ] **Task 3: 관리자 관련 컴포넌트 (`ClubPreviewCard` 등) 최적화 검사**
  - **Tool**: `Read`
  - **Target**: `src/modules/admin/components/` 내 컴포넌트
  - **Goal**: 상위 컨텍스트 변화가 하위 컴포넌트의 불필요한 리렌더링을 유발하는지 `React.memo` 적용 여부 확인.
  - **Dependency**: Task 2

- [ ] **Task 4: 디버깅 로그 제거 및 성능 확정**
  - **Tool**: `Edit`
  - **Target**: `app/admin_import.tsx`
  - **Goal**: 테스트 완료된 디버깅용 `useEffect` 및 `console.log` 제거.
  - **Dependency**: Task 1, 2, 3 완료 후

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Performance**: 포커스 리페치를 껐으므로, 중요한 데이터는 `Pull-to-Refresh`나 명시적 동기화 버튼을 통해 갱신 가능하도록 설계.
- **UX**: 로딩 상태(`isLoading`) 노출은 실제 초기 데이터 로드 시에만 발생하도록 조건부 렌더링 엄격 관리.

## ✅ Definition of Done

1. [ ] 모든 관리자 페이지에서 알트탭 시 스피너(깜빡임) 발생 Zero 달성.
2. [ ] 입력 중인 폼(Round Record 등)에서 포커스 이동 시 데이터 유실 없음 확인.
3. [ ] `memory.md`에 전수 점검 결과 및 최적화 내역 기록 완료.
