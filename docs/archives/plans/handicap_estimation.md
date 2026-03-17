# 🗺️ Project Blueprint: 개인 핸디캡 추정치 계산 (C-3)

> 생성 일시: 2026-03-17 10:43 | 상태: 전체 완료 (Task 1~4)

## 🎯 Architectural Goal

- 사용자의 최근 라운드 데이터를 기반으로 USGA 방식의 간이 핸디캡을 계산하여 제공함으로써 서비스의 전문성을 강화한다.
- **SSOT**: `golf.service.ts`를 핸디캡 계산 로직의 유일한 처소로 정의한다.

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다.

### 📦 Task List

- [x] **Task 1: `golf.service.ts`에 핸디캡 계산 로직 추가**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\services\golf.service.ts`
  - **Goal**: 최근 20경기 중 성적이 좋은 8경기의 평균 차분을 계산하는 함수 구현
  - **Pseudocode**:
    ```typescript
    export const estimateHandicap = (rounds: GolfRound[]): number | null => {
      if (rounds.length < 5) return null; // 최소 데이터 기준
      const differentials = rounds.map(r => r.totalScore - 72).sort((a, b) => a - b);
      const bestN = Math.min(8, Math.ceil(differentials.length * 0.4));
      const avg = differentials.slice(0, bestN).reduce((a, b) => a + b, 0) / bestN;
      return Math.floor(avg * 0.96 * 10) / 10;
    };
    ```
  - **Dependency**: None

- [x] **Task 2: Dashboard 및 History UI에 핸디캡 표시**
  - **Tool**: `Edit`
  - **Target**: 
    - `c:\develop\golf_scoring\app/(tabs)/index.tsx`
    - `c:\develop\golf_scoring\app/(tabs)/history.tsx`
  - **Goal**: 
    - 대시보드 프로필 또는 통계 요약 영역에 핸디캡 정보 추가
    - **히스토리 기록 리스트 최상단**에 현재 추정 핸디캡을 보여주는 요약 섹션 구현
  - **Pseudocode**:
    ```tsx
    const hc = useMemo(() => golfService.estimateHandicap(rounds), [rounds]);
    // History 페이지 상단 적용 예시
    return (
      <View>
        <HandicapBanner value={hc} /> 
        <FlatList data={rounds} ... />
      </View>
    );
    ```
  - **Dependency**: Task 1

- [x] **Task 3: 단위 테스트 코드 작성**
  - **Tool**: `Write`
  - **Target**: `c:\develop\golf_scoring\src\modules\golf\services\__tests__\handicap.test.ts`
  - **Goal**: 다양한 라운드 데이터 세트에 대해 계산식이 정확한 결과(null 또는 숫자)를 반환하는지 검증
  - **Dependency**: Task 1

- [x] **Task 4: 정적 검증 및 SSOT 반영**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit`
  - **Goal**: 타입 무결성 확인 및 `memory.md` 갱신
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Encoding**: UTF-8 no BOM 고정.
- **Data Integrity**: 코스 레이팅(Course Rating) 데이터가 없는 현재 시스템의 한계를 고려하여 Standard Par(72) 기준 차분 방식을 채택함.
- **UI UX**: 데이터가 부족한 경우(예: 5경기 미만) "기록 수집 중" 등 친절한 메시지 제공.

## ✅ Definition of Done

1. [x] 최근 라운드 데이터를 기반으로 신뢰할 수 있는 핸디캡 수치가 출력됨.
2. [x] 대시보드 및 **히스토리 최상단** UI에서 레이아웃 깨짐 없이 정보가 노출됨.
3. [x] `memory.md`의 통계 고도화 섹션에 기능 구현 완료 기록.
