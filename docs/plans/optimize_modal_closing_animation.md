# 🗺️ Project Blueprint: 스코어카드 모달 닫기 고스팅(Ghosting) 해결 및 최적화

> 생성 일시: 2026-03-15 17:35 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **목적**: 모달을 닫은 직후 다시 나타났다가 사라지는 '고스팅' 현상을 제거하고, 시각적으로 끊김 없는 프리미엄 종료 UX 구현.
- **핵심 전략**:
  - **Native-JS Animation Collision 제거**: `Modal`의 `animationType="fade"`와 `Reanimated`의 `exiting` 속성 간의 라이프사이클 충돌 해결.
  - **Single Transition Source**: 닫기 애니메이션을 Native `Modal`의 통제하에 두어, JS 스레드 부하에 관계없이 안정적인 종료 보장.
  - **State Guard**: 네비게이션 이동 시 모달의 즉각적인 언마운트와 상태 동기화 정밀 제어.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: ScoreCardModal.tsx 수정 — 애니메이션 정책 단순화 및 무결성 확보**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\ScoreCardModal.tsx`
  - **Goal**: '고스팅'의 원인인 `exiting` 속성을 제거하고, Native `Modal`의 `animationType`을 통한 안정적인 종료 트리거.
  - **Pseudocode**:
    ```tsx
    // exiting 속성 제거 (Native Modal의 fade와 충돌 방지)
    <Animated.View 
      entering={FadeInUp.duration(400)} 
      // exiting={FadeOutDown...} <- 삭제
      style={styles.scoreCardContainer}
    >
    ```
  - **Dependency**: None

- [x] **Task 2: ScoreCardModal.styles.ts 스타일 보정**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\styles\ScoreCardModal.styles.ts`
  - **Goal**: `modalOverlay`의 배경색 투명도를 미세 조정하여 페이드 아웃 시 잔상이 남지 않도록 처리.
  - **Dependency**: Task 1

- [x] **Task 3: 최종 검증 및 SSOT 반영**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 타입 체크 및 `memory.md` 최신화.
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Pure Native Exit**: React Native `Modal`은 `visible={false}` 시점에 내부 컴포넌트를 즉시 언마운트하거나 Native 스택에서 제거하므로, 내부 JS 애니메이션(`exiting`)은 완료를 보장받지 못해 고스팅을 유발할 수 있음.
- **Navigation Safety**: `router.replace` 등 페이지 전환과 모달 닫기가 겹칠 때의 레이아웃 안정성 최우선.

## ✅ Definition of Done

1. [x] 모달 닫기 시 배경과 콘텐츠가 고스팅 없이 깔끔하게 페이드 아웃됨.
2. [x] 홀 클릭을 통한 페이지 이동 시에도 잔상 현상 발생하지 않음.
3. [x] `tsc --noEmit` 결과 오류 0.
4. [x] `docs/memory.md` 업데이트 완료.

[BLUEPRINT CHECKLIST]
- [x] Task 1: 애니메이션 정책 수정 (exiting 제거)
- [x] Task 2: 스타일 보정
- [x] Task 3: 무결성 검증
