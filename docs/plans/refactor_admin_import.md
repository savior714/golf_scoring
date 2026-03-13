# 🗺️ Project Blueprint: admin_import.tsx 다이어트 및 모듈화

> 생성 일시: 2026-03-12 20:35 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **글로벌 룰 0 준수**: 981라인인 `admin_import.tsx` 파일을 300라인 이하로 줄여 유지보수성을 확보한다.
- **관심사 분리 (SoC)**: 스타일, 비즈니스 로직, UI 컴포넌트를 분리하여 재사용성과 가독성을 높인다.
- **SSOT**: `docs/CRITICAL_LOGIC.md`의 데이터 무결성 규칙(9홀, Par 36 등)을 유지한다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: 스타일 분리 — adminImport.styles.ts 생성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\styles\adminImport.styles.ts`
  - **Goal**: `app/admin_import.tsx`에 있는 모든 `StyleSheet` 코드를 이동.
  - **Dependency**: None

- [x] **Task 2: 비즈니스 로직 분리 — useBulkImport.ts 생성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\hooks\useBulkImport.ts`
  - **Goal**: JSON 정규화, 파싱, DB 저장 로직 및 관련 상태를 커스텀 훅으로 이동.
  - **Pseudocode**:

    ```typescript
    export function useBulkImport() {
      const [jsonText, setJsonText] = useState('');
      const handleParse = () => { ... };
      const handleConfirmSave = async () => { ... };
      return { jsonText, setJsonText, handleParse, ... };
    }
    ```

  - **Dependency**: Task 1

- [x] **Task 3: 컴포넌트 분리 — ClubPreviewCard.tsx 생성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\modules\admin\components\ClubPreviewCard.tsx`
  - **Goal**: `ClubPreviewCard` 및 하위 홀 테이블 컴포넌트 이동.
  - **Dependency**: Task 2

- [x] **Task 4: app/admin_import.tsx 리팩토링 및 다이어트**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\app\admin_import.tsx`
  - **Goal**: 분리된 훅, 컴포넌트, 스타일을 import하여 메인 화면을 간결하게 재구성 (981라인 → 180라인).
  - **Dependency**: Task 3

- [x] **Task 5: 린트 체크 및 검증**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 변경 사항 검증 및 린트 Zero 달성 (Exit Code 0 확인 완료).
  - **Dependency**: Task 4

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Refactoring**: 기능 변경 없이 순수하게 물리적 위치만 이동하여 사이드 이펙트 최소화.
- **Performance**: `useMemo`, `useCallback`을 적절히 사용하여 리렌더링 최적화 유지.

## ✅ Definition of Done

1. [x] `app/admin_import.tsx` 파일이 300라인 이하로 감소함 (981라인 → 180라인).
2. [x] 대량 데이터 임포트 기능(파싱, 프리뷰, 저장)이 기존과 동일하게 동작함.
3. [x] `src/modules/admin` 폴더 구조가 체계적으로 정돈됨.
4. [x] `memory.md` 및 `README.md`에 리팩토링 완료 사항 반영.
