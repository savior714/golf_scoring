# 🗺️ Project Blueprint: Expo Web 번들링 및 렌더링 성능 최적화

> 생성 일시: 2026-03-16 18:53 | 상태: 설계 승인 완료

## 🎯 Architectural Goal

- **DX 최적화**: 개발 모드(`dev`)에서 `app/(tabs)/record.tsx` 진입 시 발생하는 Metro 번들링 지연 시간을 **50% 이상 단축**함.
- **번들 효율화**: 불필요한 모듈 재계산을 방지하고, **Metro Persistent Cache**를 강화하여 Windows 환경의 I/O 병목을 해소함.
- **UX 개선**: 화면 전환 시의 물리적 렌더링 렉을 줄이기 위해 **Import 전략** 및 **Pre-fetching**을 도입함.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

> ⚠️ **각 Task는 단 하나의 도구 호출로 완료됩니다.** 글로벌 룰 1에 따라 단계별 실행 후 승인을 대기합니다.

- [x] **Task 1: `metro.config.js` 최적화 설정 적용**
  - **Tool**: `replace_file_content`
  - **Target**: `c:\develop\golf_scoring\metro.config.js`
  - **Goal**: Metro 번들러의 캐시 전략을 강화하고 Web 환경 분석 속도를 개선함.
  - **Dependency**: None

- [x] **Task 2: `app/(tabs)/_layout.tsx` 내비게이션 프리로드 강화**
  - **Tool**: `replace_file_content`
  - **Target**: `c:\develop\golf_scoring\app\(tabs)\_layout.tsx`
  - **Goal**: 사용자가 `record` 탭을 클릭하기 전 배경에서 번들링이 완료되도록 프리로딩 옵션 적용.
  - **Dependency**: Task 1

- [x] **Task 3: 무거운 라이브러리(Lucide 등) Import 최적화**
  - **Tool**: `replace_file_content`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\components\Record\RecordMainContent.tsx`
  - **Goal**: 전체 패키지 로드를 방지하고 필요한 아이콘만 직접 참조하도록 수정하여 Metro 부하 감소.
  - **Dependency**: Task 2

- [x] **Task 4: 최적화 환경 변수 적용 및 최종 검증**
  - **Tool**: `run_command`
  - **Command**: `$env:EXPO_USE_METRO_WORKSPACE_ROOT=1; npx expo start --web`
  - **Goal**: 번들링 로그를 통해 단축된 시간(ms) 확인 및 `docs/memory.md` 업데이트.
  - **Dependency**: Task 3

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Metro Cache**: Windows에서 캐시 충돌 방지를 위해 `clear-cache`가 필요한 상황을 사전에 방지하도록 설정함.
- **Rendering Priority**: `InteractionManager`를 통해 무거운 렌더링이 번들링 직후 발생하지 않도록 조율함.

## ✅ Definition of Done

1. [x] `record` 탭 진입 시 Metro 번들링 로그 시간이 눈에 띄게 단축됨.
2. [x] 화면 전환 시 발생하는 프레임 드랍(렉)이 현저히 감소함.
3. [x] `npx tsc --noEmit`을 통해 최적화 과정에서 발생할 수 있는 타입 오류 없음 확인.
