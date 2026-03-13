# 🗺️ Project Blueprint: 토스트 너비 복구 및 스타일 안정화

> 생성 일시: 2026-03-13 10:55 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- 최근 발생한 토스트 너비 협소화 문제를 해결하고, 디바이스 너비에 맞게 적절한 여백을 가진 "와이드" 스타일로 복구한다.
- **SSOT**: `src/shared/components/ToastConfig.tsx`의 스타일 정의를 강화하여 래퍼 컴포넌트(`FadeToast`, `Pressable`)의 너비 영향을 배제한다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: ToastConfig.tsx 수정 — 너비 및 스타일 명시화**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\shared\components\ToastConfig.tsx`
  - **Goal**: `Dimensions`를 임포트하고, `FadeToast`, `Pressable`, `customToast`에 너비 관련 설정을 명시적으로 추가한다.
  - **Pseudocode**:
    ```typescript
    import { Dimensions, ... } from 'react-native';
    const { width: WINDOW_WIDTH } = Dimensions.get('window');

    // FadeToast: width: '100%', alignItems: 'center'
    // Pressable: width: '100%', alignItems: 'center'
    // customToast: width: WINDOW_WIDTH - 32 (약 92%)
    ```
  - **Dependency**: None

- [x] **Task 2: 검증 및 린트 체크**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 타입 오류 확인 및 스타일 적용 확인
  - **Dependency**: Task 1

- [x] **Task 3: memory.md 업데이트**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\docs\memory.md`
  - **Goal**: 토스트 스타일 복구 내역 기록
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Dimensions**: React Native의 `Dimensions`를 사용하여 화면 크기에 동적으로 대응한다.
- **Consistency**: Success, Error, Info 모든 타입에 동일한 너비 정책을 적용한다.

## ✅ Definition of Done

1. [ ] 토스트가 화면 중앙에서 적절한 너비(화면 너비 - 여백)를 차지함.
2. [ ] 페이드 인/아웃 애니메이션 시 너비가 변하지 않고 안정적으로 유지됨.
3. [ ] `memory.md` 및 `README.md`에 변경 사항 반영 완료.
