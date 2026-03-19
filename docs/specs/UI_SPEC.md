# 🎨 UI_SPEC: User Interface Standards

> 상태: 정립 (Established) | 기준: 2026-03-19

## 1. Visual & Interaction Standards (시각적 및 인터랙션 표준)

### 1.1 Responsive Design

- **Grid System**: 기록 화면(18홀 이동용 `HoleSelectorGrid`) 및 아이템 목록은 기기 너비에 상관없이 일관된 사용자 경험을 제공하도록 표준 여백 스타일을 강제 적용한다.
- **Icon Library**: Lucide 아이콘(`lucide-react-native`)을 사용하며, 라이브러리 업데이트 규격(`edit-3` → `pen-line`)을 준수한다.
- **Color Palettes**: 스코어 시각화는 오버(+) - **빨간색**, 언더(-) - **초록색**, 이븐(E) - **흰색/회색**으로 통일한다.

### 1.2 UX Workflow

- **Navigation Title & Header**: 모든 탭의 라벨과 헤더 타이틀은 `app/(tabs)/_layout.tsx`에서 **진실 원천(SSOT)**으로 관리한다.
- **Flicker Protection**: 데이터 로딩 중에는 '확인 중...'과 같은 대기 상태 표시나 캐시 사전 검증(`useFocusEffect`)을 통해 UI가 깜빡이거나 튀는 현상을 차단한다.
- **Interaction Feedback**: 모든 주요 데이터 작업(임포트, 수정 등) 성공 후에는 적절한 시각적 피드백(토스트)을 제공하되, 무의미한 반복 알림은 지양한다.

## 2. Component Reusability (컴포넌트 재사용 규칙)

- **Standardization**: 스코어카드 테이블은 데이터 일관성을 위해 반드시 `ScoreCardTable` 공통 컴포넌트를 사용한다.
- **Modularity**: 복잡한 기록 화면은 `HoleSelectorGrid`, `ScoreAdjuster`, `MissShotPatternGrid`, `CourseHeader` 등 전문 하위 컴포넌트로 분리하여 유지보수성을 극대화한다.
- **Memoization**: 대량의 데이터를 표시하는 리스트 아이템은 반드시 `React.memo`로 래핑하여 렌더링 성능을 보장한다.

## 3. UI Animation & Lifecycle (애니메이션 및 생명주기)

- **Modal Strategy**: `Modal` 컴포넌트 종료 애니메이션은 네이티브 기능(`animationType="fade"`)에 위임하여 자바스크립트 스레드와 생명주기 사이의 충돌을 방지한다.
- **Layout Stability**: 모달이 완전히 닫힌 후 페이지 전환이 수행되도록 상태 가드를 설정하여 레이아웃 안정성을 확보한다.
- **Loading UI Protection**: 이미 중요 데이터가 인메모리에 존재한다면 전체 화면 스피너 대신 기존 UI를 유지하면서 백그라운드 갱신(Silent Refresh)을 수행하여 사용자 컨텍스트를 보호한다.

## 4. Navigation & Routing Policies (내비게이션 및 라우팅 정책)

- **Explicit Navigation Protocol**: 기록 화면으로의 모든 이동은 명시적인 `mode` 파라미터를 동반해야 한다.
- **Navigation Hijacking Guard**: 비동기 파라미터 소비(`router.setParams`) 중 탭을 전환하는 레이스 컨디션을 방지하기 위해, `useIsFocused` 훅을 사용하여 현재 활성 탭 여부를 확인하는 가드를 필수 적용한다.
- **Dynamic Tab Labels**: 활성 세션(`currentRoundId`) 존재 여부에 따라 탭 이름을 '기록 수정' 또는 '신규 라운드'로 동적으로 변경하여 상태를 직관적으로 전달한다.
