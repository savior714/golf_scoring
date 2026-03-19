# 🗺️ Project Blueprint: Fix Lucide React Native Imports

> 생성 일시: 2026-03-19 14:55 | 상태: 완료 (Completed)

## 🎯 Architectural Goal

- `lucide-react-native`의 직접 파일 참조(Direct Import) 방식을 패키지 루트에서의 명명된 임포트(Named Import) 방식으로 전환하여 Metro 번들러의 `exports` 관련 경고(WARN)를 제거함.
- **SSOT 정렬**: `docs/specs/INFRASTRUCTURE_SPEC.md`의 기술 표준(최신 패키지 사용 규정)에 부합함.

## 🔍 Impact Scope (영향 범위)

| 수정 대상 파일 | 현재 라인 수 | 참조하는 파일 | 비고 |
| -------------- | :----------: | ------------- | ---- |
| `src/shared/lucide-icons.d.ts` | 19줄 | 없음 | **삭제** 예정 |
| `src/modules/golf/components/Dashboard/StatGrid.tsx` | ~40줄 | `Dashboard.tsx` | 임포트 수정 |
| `src/modules/admin/components/AdminNavButtons.tsx` | ~30줄 | `AdminDashboard.tsx` | 임포트 수정 |
| `src/modules/admin/components/ClubPreviewCard.tsx` | ~80줄 | `AdminDashboard.tsx` | 임포트 수정 |
| `src/modules/admin/components/AdminFormComponents.tsx` | ~150줄 | 다수 | 임포트 수정 |
| `src/modules/admin/components/ClubSelectModal.tsx` | ~100줄 | 다수 | 임포트 수정 |
| `src/modules/admin/components/UserCard.tsx` | 206줄 | `UserManagement.tsx` | 임포트 수정 |

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: `src/shared/lucide-icons.d.ts` 삭제**
  - **Action**: 파일 삭제 (터미널)
  - **Target**: `c:\develop\golf_scoring\src\shared\lucide-icons.d.ts`
  - **Goal**: 직접 경로 임포트 허용 설정을 제거하여 표준 패턴 강제
  - **Verify**: 파일이 디렉토리에 더 이상 존재하지 않음
  - **Dependency**: None

- [x] **Task 2: `src/modules/admin/components/UserCard.tsx` 임포트 수정**
  - **Action**: 파일 수정
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\components\UserCard.tsx`
  - **Goal**: 개별 icon import를 `{ Activity, Database, ... }` 형태로 통합
  - **Pseudocode**:
    ```typescript
    // BEFORE
    import User from 'lucide-react-native/dist/icons/user';
    // AFTER
    import { User, Activity, Database, Mail, UserPlus } from 'lucide-react-native';
    ```
  - **Verify**: 컴포넌트 내 아이콘 렌더링 정상 동작 및 경고 소멸
  - **Dependency**: Task 1

- [x] **Task 3: 관리자(Admin) 모듈 나머지 컴포넌트 일괄 수정**
  - **Action**: 파일 수정 (다수)
  - **Target**: `AdminNavButtons.tsx`, `ClubPreviewCard.tsx`, `AdminFormComponents.tsx`, `ClubSelectModal.tsx`
  - **Goal**: 동일한 임포트 패턴 적용
  - **Verify**: 프로젝트 빌드 시 `lucide-react-native` 관련 WARN 미발생
  - **Dependency**: Task 2

- [x] **Task 4: 골프(Golf) 모듈 `StatGrid.tsx` 수정**
  - **Action**: 파일 수정
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\Dashboard\StatGrid.tsx`
  - **Goal**: 직접 경로 임포트 수정
  - **Verify**: 대시보드 아이콘 정상 표시
  - **Dependency**: Task 1

## ⚠️ 기술적 제약 및 규칙

- **Tree Shaking**: `lucide-react-native`는 버전 0.400 이상부터 ESM과 `exports` 필드를 지원하므로, 루트에서 임포트해도 Metro 번들러가 필요한 아이콘만 포함시킴.
- **Icon Name**: 직접 참조 시의 파일명(kebab-case)이 가끔 Named Import(PascalCase)와 다를 수 있으므로 확인 필요 (예: `user-plus` -> `UserPlus`).

## ✅ Definition of Done

1. [x] `lucide-react-native/dist/icons/*` 형태의 임포트가 전체 프로젝트에서 제거됨.
2. [x] Metro 실행 로그에서 `exports` 관련 WARN이 더 이상 관찰되지 않음.
3. [x] 모든 아이콘이 이전과 동일하게 렌더링됨.
4. [x] `docs/memory.md`에 개선 사항 반영 완료.
