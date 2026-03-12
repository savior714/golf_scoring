# 🗺️ Project Blueprint: 라운딩 기록 생성 제한 (Daily Limit & Date Guard)

> 생성 일시: 2026-03-12 15:15 | 상태: 구현 완료

## 🎯 Architectural Goal

- 사용자의 남용 방지 및 데이터 정합성을 위해 **하루 최대 10건**의 라운딩 기록만 생성 허용.
- 삭제 후 재작성하는 경우(Net Count) 10건까지는 허용하여 사용자 편의성 유지.
- **과거 날짜의 기록 생성**을 차단하여 신규 유저의 대량 데이터 입력을 방지 (추후 검토).

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: Repository 도메인 로직 추가**
  - **Goal**: 특정 날짜의 라운딩 개수를 조회하는 기능 구현.
  - **Context**: `src/modules/golf/golf.repository.ts`
  - **Implementation**:
    - [x] `roundRepository.getRoundsCountByDate(date: string)` 메서드 추가.
    - [x] 로컬 스토리지 데이터에서 해당 날짜와 일치하는 레코드 필터링 후 카운트 반환.
  - **Pseudocode**:
    ```typescript
    async getRoundsCountByDate(date: string): Promise<number> {
      const all = await this.getAllRounds();
      return all.filter(r => r.date === date).length;
    }
    ```
  - **Dependency**: None
  - **Verification**: `getAllRounds`의 결과 중 오늘 날짜 데이터 개수와 일치하는지 확인.

- [x] **Task 2: `useGolfRecord` 생성 로직 가드 적용**
  - **Goal**: 라운딩 시작(`startNewRound`) 시 횟수 및 날짜 제한 로직 구현.
  - **Context**: `src/modules/golf/hooks/useGolfRecord.ts`
  - **Implementation**:
    - [x] `startNewRound` 진입점 상단에 제한 체크 추가.
    - [x] **제한 1 (개수)**: 오늘 날짜 기록이 `MAX_DAILY_ROUNDS` 이상이면 차단.
    - [x] **제한 2 (날짜)**: 선택된 날짜가 오늘보다 이전이면 차단.
    - [x] 에러 발생 시 `Toast.show` 및 `Haptics` 피드백 제공.

- [x] **Task 3: UX 보완 및 상수화**
  - **Goal**: 하드코딩된 값을 상수화하고 문구 정리.
  - **Context**: `src/modules/golf/golf.constants.ts`
  - **Implementation**:
    - [x] `GOLF_LIMITS.MAX_DAILY_ROUNDS = 10` 추가 및 적용.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Net Count**: 삭제된 기록은 개수 산정에서 제외됨 (Repository의 `getAllRounds`가 최신 상태임을 보장).
- **Timezone**: `new Date().toISOString().split('T')[0]` 형식을 사용하여 KST 등 로컬 타임존 이슈 최소화 (클라이언트 기준 오늘 날짜).
- **Error Feedback**: 사용자가 왜 기록이 안 되는지 명확히 알 수 있도록 구체적인 Toast 메시지 노출.

## ✅ Definition of Done

1. [x] 하루 10건 초과 생성 시 Toast 메시지와 함께 프로세스 중단됨.
2. [x] 과거 날짜 기록 생성 시도 시 차단됨.
3. [x] 기록 삭제 후 10건 미만이 되면 다시 생성이 가능함.
4. [x] 모든 매직 넘버가 `golf.constants.ts`로 상수화됨.
5. [x] `memory.md`에 정책 반영 완료.
