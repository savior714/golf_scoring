# 🗺️ Project Blueprint: Admin 모듈 Lucide Import 최적화

> 생성 일시: 2026-03-16 18:54 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **Metro 부하 감소**: 개발 환경에서 `admin_import` 등 관리자 페이지 진입 시 발생하는 Metro 번들링 및 스캔 시간을 단축함.
- **번들 효율화**: `lucide-react-native` 전체 패키지를 임포트(Destructuring)하는 대신, 필요한 아이콘 파일만 직접 참조(Direct Import)하도록 변경함.
- **SSOT**: `docs/CRITICAL_LOGIC.md`의 성능 최적화 원칙 준수.

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다. 우선순위에 따라 원하는 항목을 선택하여 진행을 요청하세요.

### 📦 Task List

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료됩니다.** 글로벌 룰 1에 따라 단계별 실행 후 승인을 대기합니다.

- [x] **Task 1: `AdminNavButtons.tsx` 최적화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\components\AdminNavButtons.tsx`
  - **Goal**: `FileJson`, `FileSearch`, `MessageSquare`, `Users` 아이콘을 직접 참조 방식으로 변경.
  - **Dependency**: None

- [x] **Task 2: `ClubSelectModal.tsx` 최적화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\components\ClubSelectModal.tsx`
  - **Goal**: `ChevronDown`, `X` 아이콘 직접 참조.
  - **Dependency**: Task 1

- [x] **Task 3: `UserCard.tsx` 최적화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\components\UserCard.tsx`
  - **Goal**: `Activity`, `Database`, `Mail`, `User`, `UserPlus` 아이콘 직접 참조.
  - **Dependency**: Task 2

- [x] **Task 4: `ClubPreviewCard.tsx` 최적화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\components\ClubPreviewCard.tsx`
  - **Goal**: `ChevronRight`, `ChevronDown` 아이콘 직접 참조.
  - **Dependency**: Task 3

- [x] **Task 5: `AdminFormComponents.tsx` 최적화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\components\AdminFormComponents.tsx`
  - **Goal**: `Trash2` 아이콘 직접 참조.
  - **Dependency**: Task 4

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Direct Import Pattern**: `import IconName from 'lucide-react-native/dist/icons/icon-slug'` 형식을 유지함.
- **Icon Slugs**: CamelCase 아이콘명을 kebab-case(예: `FileJson` → `file-json`)로 정확히 매핑해야 함.
- **TS Error**: `dist/icons` 참조 시 발생하는 타입 선언 오류는 성능 최적화를 위한 의도된 사항으로 간주함.

## ✅ Definition of Done

1. [ ] 관리자 페이지(`admin_import`) 진입 시 Metro 로그 상에서 번들링 속도가 개선됨을 확인.
2. [ ] 수정된 5개 컴포넌트에서 아이콘이 정상적으로 렌더링됨.
3. [ ] `npx tsc --noEmit` 실행 시 런타임 오류로 이어질 만한 심각한 위반 사항 없음 확인.
