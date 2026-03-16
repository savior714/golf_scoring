# 🗺️ Project Blueprint: 랜딩 페이지 UI 완성 (이미지 슬라이더 및 로그인 버튼 개선)

> 생성 일시: 2026-03-17 00:48 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- 랜딩 페이지의 **서비스 인트로 슬라이더**가 모든 이미지를 정상적으로 순환하지 않는 현상을 해결합니다.
- **구글 로그인 버튼**의 폭이 화면을 꽉 채워 디자인 균형을 해치는 문제를 수정하여 더 세련된 UI를 제공합니다.
- **SSOT**: `docs/memory.md` (랜딩 페이지 UI 개선 항목 업데이트)

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다. 우선순위에 따라 원하는 항목을 선택하여 진행을 요청하세요.

### 📦 Task List

- [x] **Task 1: `ServiceIntroSlider.tsx` 안정성 강화 — 슬라이더 논리 및 반응형 수정**
  - **Tool**: `replace_file_content`
  - **Target**: `c:\develop\golf_scoring\src\shared\components\ServiceIntroSlider.tsx`
  - **Goal**: `useWindowDimensions` 적용, `getItemLayout` 추가, 웹 환경에서의 페이징 정확도 향상.
  - **Pseudocode**:
    ```tsx
    const { width: windowWidth } = useWindowDimensions();
    // FlatList 속성 추가
    getItemLayout={(_, index) => ({
      length: windowWidth,
      offset: windowWidth * index,
      index,
    })}
    ```

- [x] **Task 2: `app/(auth)/login.tsx` UI 레이아웃 수정 — 버튼 폭 최적화**
  - **Tool**: `replace_file_content`
  - **Target**: `c:\develop\golf_scoring\app\(auth)\login.tsx`
  - **Goal**: 버튼 컨테이너에 적절한 사이드 패딩을 추가하거나 버튼의 최대 너비를 제한하여 모바일 및 웹에서 조화로운 디자인 제공.
  - **Pseudocode**:
    ```tsx
    form: {
      width: '100%',
      paddingHorizontal: 24, // 좌우 여백 추가
      maxWidth: 480,       // 데스크톱 대비 최대 너비 제한
      alignSelf: 'center',
    }
    ```

- [x] **Task 3: 최종 검토 및 환경 검증**
  - **Tool**: `Bash`
  - **Command**: `scripts/check-env.ps1 && docs/memory.md` 업데이트
  - **Goal**: 수정 사항이 웹/모바일 인터페이스에서 의도대로 작동하는지 확인.
  - **Dependency**: Task 1, 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Pure Presentation**: 비즈니스 로직(Auth)을 건드리지 않고 UI 표현 계층만 수정함.
- **Responsive**: `SCREEN_WIDTH` 하드코딩 대신 반응형 Hook을 사용하여 브라우저 크기 조절에 즉각 대응.

## ✅ Definition of Done

1. [ ] 서비스 인트로 슬라이더가 3개의 이미지를 정상적으로 순환하며 인디케이터와 동기화됨.
2. [ ] 구글 로그인 버튼이 화면 양 끝에 붙지 않고 적절한 여백을 가짐.
3. [ ] `memory.md`에 UI 수정 사항이 기록됨.
