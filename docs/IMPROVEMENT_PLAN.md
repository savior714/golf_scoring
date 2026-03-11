# Golf Scoring Application — Improvement Plan (향후 개선 계획)

**이 문서는 프로젝트의 기능 고도화, 사용자 경험 개선, 그리고 기술적 안정성을 강화하기 위한 단계별 실행 계획을 담고 있습니다.**
모든 항목은 독립적인 기능 단위로 설계되어 있으며, 취합·선택하여 지시할 수 있도록 작성되었습니다.

> **현재 완료 기준선**: Phase 6.2 (코스 선택 리셋 버그 해결 / TSC EXIT:0 / BOM=False)

---

## 목차 (Index)

- [Phase A — UX·UI 고도화](#phase-a--uxui-고도화)
- [Phase B — 스코어카드 & 기록 기능 확장](#phase-b--스코어카드--기록-기능-확장)
- [Phase C — 통계·분석 고도화](#phase-c--통계분석-고도화)
- [Phase D — 클라우드·동기화 고도화](#phase-d--클라우드동기화-고도화)
- [Phase E — 관리자(Admin) 기능 강화](#phase-e--관리자admin-기능-강화)
- [Phase F — 성능·코드 체계 개선](#phase-f--성능코드-체계-개선)
- [Phase G — 신규 대형 기능](#phase-g--신규-대형-기능)

---

## Phase A — UX·UI 고도화

> 목표: 기존 화면을 더 직관적·매력적으로 만드는 소규모 개선

### A-1. 스코어 상대 점수 색상 일관성 보장 (완료)

- **배경**: CRITICAL_LOGIC §1 — 상대 점수는 Over(+) →Red, Under(-) →Green, Even →White/Gray로 정의했으나, 일부 컴포넌트(ScoreCardTable, HistoryItem 등)에서 색상 적용이 누락됐을 가능성
- **작업**:
  1. `ScoreCardTable.tsx`, `HistoryItem`, `index.tsx`(대시보드) 의 상대 점수 렌더링 코드 전수 조사
  2. 공통 유틸 `getScoreColor(relative: number): string` 함수를 `src/shared/utils/` 에 추출
  3. 모든 사용 지점을 해당 유틸로 교체
- **예상 소요**: ~1시간 / 리스크: Low

---

### A-2. 홀별 기록 입력 — 스와이프 네비게이션

- **배경**: 현재 `HoleSelectorGrid`(그리드 탭)로만 홀 이동 가능 → 화면 상의 좌우 스와이프로도 이동 가능하면 UX 향상
- **작업**:
  1. `record.tsx`에 `react-native-gesture-handler`의 `Swipeable` 또는 `PanGestureHandler` 적용
  2. 스와이프 임계값(threshold) 설정 — 기존 ScoreAdjuster 슬라이더와 충돌 방지 검토
  3. 스와이프 방향에 따라 `dispatch({ type: 'SET_CURRENT_HOLE', ... })` 호출
- **예상 소요**: ~2시간 / 리스크: Medium (제스처 충돌)

---

### A-3. 라운드 기록 중 진행률(Progress) 표시 (완료)

- **배경**: 현재 기록 화면에 "몇 홀을 완료했는지" 시각 정보 없음
- **작업**:
  1. `useGolfRecord`의 `state`에서 `filledHoles = holes.filter(h => h.stroke > 0).length` 파생값 계산 (useMemo)
  2. `record.tsx` 상단에 `ProgressBar` 컴포넌트 추가 (`filledHoles / 18 * 100`)
  3. Reanimated `withTiming` 으로 부드러운 애니메이션 적용
- **예상 소요**: ~1.5시간 / 리스크: Low

---

### A-4. 다크모드 / 라이트모드 테마 토글

- **배경**: 현재 테마는 `useColorScheme`을 읽어 OS 설정 따름. 사용자가 앱 내에서 수동 전환 불가
- **작업**:
  1. `src/shared/lib/themeStore.ts` — Zustand 기반 `themeMode: 'system' | 'light' | 'dark'` 상태 관리
  2. AsyncStorage에 선택값 영속화
  3. `_layout.tsx` 에서 선택값 기반으로 테마 주입 (override `useColorScheme`)
  4. 설정 화면(또는 헤더 버튼)에 토글 UI 추가
- **예상 소요**: ~3시간 / 리스크: Low-Medium

---

### A-5. 홀 메모(Hole Memo) 입력 UI 개선

- **배경**: `HoleRecord.memo` 필드는 타입에 정의되어 있으나 UI 미구현 (데이터는 저장 안 됨)
- **작업**:
  1. `record.tsx` 하단에 텍스트 입력 필드 추가 (Keyboard avoid 처리)
  2. `dispatch({ type: 'SET_HOLE_MEMO', payload: text })`로 reducer 연동
  3. `useGolfRecord`의 `handleSaveCurrentHole`에서 memo 포함하여 저장 확인
- **예상 소요**: ~2시간 / 리스크: Low

---

### A-6. 라운드 메모(Round Memo) 입력 기능

- **배경**: `GolfRound.memo` 필드 타입 정의 있음. 라운드 종료 모달에서 한 줄 메모 입력 가능하면 유용
- **작업**:
  1. `FinishRoundModal` 내부에 `TextInput` (optional) 추가
  2. `finishRound` 함수 파라미터에 `memo?: string` 추가
  3. Repository의 `saveRound` 에서 memo 포함 저장 확인
- **예상 소요**: ~1.5시간 / 리스크: Low

---

### A-7. 스코어 입력 시 햅틱 패턴 세분화

- **배경**: 현재 모든 중요 액션에 단일 햅틱 피드백 → 타수 증가/감소, OB, 퍼트를 구분하는 강도 차등 가능
- **작업**:
  1. `expo-haptics`의 `ImpactFeedbackStyle` (Light / Medium / Heavy) 세분화 적용
  2. 타수 +/- → `Light`, OB/Penalty → `Heavy`, 저장 완료 → `Medium`
- **예상 소요**: ~1시간 / 리스크: Low

---

## Phase B — 스코어카드 & 기록 기능 확장

> 목표: 기록의 완결성과 실용성을 높이는 기능 추가

### B-1. 전반·후반 각 9홀 합계 소계(Sub-total) 표시

- **배경**: `ScoreCardTable`은 18홀을 나열하지만 전반(1~9홀) / 후반(10~18홀) 소계 행이 없음
- **작업**:
  1. `ScoreCardTable` 내부에서 `holes.slice(0,9)` 합산 행 삽입 (`OUT` 레이블)
  2. `holes.slice(9,18)` 합산 행 삽입 (`IN` 레이블)
  3. 최하단에 `TOTAL` 합계 행 유지
- **예상 소요**: ~1.5시간 / 리스크: Low

---

### B-2. FIR(Fairway In Regulation) 기록 UI 복구

- **배경**: `HoleRecord.isFairway` 는 "deprecated — UI removed, kept for data compatibility" 상태 (§1). 기록은 되나 입력 UI 없음. 필요 시 복구 가능
- **작업**:
  1. `record.tsx`의 Par 4/5/6/7 홀에서만 페어웨이 히트 토글 버튼 표시 (Par 3 제외 — CRITICAL_LOGIC §1 준수)
  2. `dispatch({ type: 'SET_FAIRWAY', payload: boolean })` 로 reducer 연동
  3. `ScoreCardTable`에 FIR 행 표시 복구
- **예상 소요**: ~2시간 / 리스크: Low

---

### B-3. 홀별 티 거리(Tee Distance) 표시

- **배경**: 티 선택(Tee Selection Step — §6) 기능이 있으나 기록 화면에서 해당 홀의 실제 전장(m) 표시 없음
- **작업**:
  1. `useGolfRecord`의 `state`에 `selectedTeeColor`와 코스 마스터 데이터 포함
  2. `CourseHeader` 컴포넌트에 현재 홀의 티 거리 표시 (`{distance}m`)
  3. 마스터 데이터 없을 경우 `--m` fallback
- **예상 소요**: ~2시간 / 리스크: Low-Medium

---

### B-4. 이전 라운드 같은 홀 성적 비교 표시

- **배경**: 동일 코스에서 재라운딩 시 이전 방문 시 해당 홀 성적을 참고하면 유용
- **작업**:
  1. 라운드 시작 시 `outCourseId` / `inCourseId` 일치하는 최근 라운드 조회
  2. 기록 화면 홀마다 소형 배지로 이전 성적 표시 (예: `前 5▲`)
  3. 데이터 없으면 배지 숨김
- **예상 소요**: ~3시간 / 리스크: Medium

---

### B-5. 사진 첨부 기능 (홀별 메모 사진)

- **배경**: 현재 memo는 텍스트 전용 — 아이콘 사진, 사고 구역 사진 등 이미지 첨부 필요성 있음
- **작업**:
  1. `expo-image-picker` 연동
  2. 선택된 이미지를 Supabase Storage에 업로드 (`rounds/{roundId}/hole{n}.jpg`)
  3. `HoleRecord`에 `photoUrl?: string` 필드 추가 (DB 마이그레이션 필요)
  4. `ScoreCardTable`에 사진 썸네일 행 표시 (optional)
- **예상 소요**: ~6시간 / 리스크: Medium-High (Storage 정책 설정 필요)

---

### B-6. 라운드 복사(Round Duplication) 기능

- **배경**: 같은 코스에서 재라운딩 시 코스 선택 단계를 건너뛰고 이전 설정 그대로 새 라운드 시작
- **작업**:
  1. History 화면 아이템에 "이 코스로 새 라운드" 버튼 추가
  2. 해당 라운드의 `outCourseId`, `inCourseId`, `teeColor`, `courseName` 복사하여 `startNewRound` 호출
  3. 홀 기록은 빈 값으로 초기화
- **예상 소요**: ~2시간 / 리스크: Low

---

## Phase C — 통계·분석 고도화

> 목표: `golf.service.ts`의 `calculateAdvancedStats` 엔진을 더 풍부하게 확장

### C-1. 홀별 평균 성적 레이더 차트 (파별)

- **배경**: 현재 통계는 전체 집계 위주 — Par 3/4/5별 평균 타수와 평균 퍼트를 레이더(Spider) 차트로 표시하면 강점/약점 파악에 유리
- **작업**:
  1. `calculateAdvancedStats`에 `parBreakdown: { par3Avg, par4Avg, par5Avg, par3PuttAvg, par4PuttAvg }` 추가
  2. `react-native-svg` 기반 레이더 차트 컴포넌트 (`RadarChart.tsx`) 구현
  3. Dashboard Stats 탭에 추가
- **예상 소요**: ~5시간 / 리스크: Medium

---

### C-2. 클럽(코스)별 베스트 스코어 및 평균 추적

- **배경**: 동일 클럽의 여러 라운드를 집계하여 해당 클럽 최고/평균 점수를 표시
- **작업**:
  1. `golf.service.ts`에 `calculateClubStats(rounds, clubId): ClubStats` 함수 추가
  2. History 화면 또는 신규 "코스 통계" 탭에 클럽별 집계 표시
  3. `ClubStats` 타입 `golf.types.ts`에 추가
- **예상 소요**: ~3시간 / 리스크: Low

---

### C-3. 개인 핸디캡 추정치 계산

- **배경**: USGA 방식 간이 핸디캡(최근 20경기 중 하위 8개 평균 차분) 제공 가능
- **작업**:
  1. `golf.service.ts`에 `estimateHandicap(rounds: GolfRound[]): number` 추가
  2. 계산식: 최근 20경기 (course rating 없으므로 par 기준 차분) → 하위 8 평균 × 0.96
  3. 대시보드 상단 또는 프로필 화면에 `HC: +2.4` 형태로 표시
  4. 경기 수 부족 시 `데이터 부족` 안내
- **예상 소요**: ~3시간 / 리스크: Low-Medium (핸디캡 공식 단순화 필요)

---

### C-4. 미스샷 시계열 히트맵 (주차별 패턴 추적)

- **배경**: 현재 `PatternHeatmap`은 최근 5경기 누적 집계만 — 주차별로 어떤 패턴이 늘었나 추적 가능하면 연습 효과 측정 가능
- **작업**:
  1. `calculateAdvancedStats`가 반환하는 `AdvancedStats[]`를 주차(ISO week)로 그루핑
  2. x축: 주차, y축: 미스샷 패턴, 셀 색상: 빈도
  3. `WeeklyHeatmap.tsx` 신규 컴포넌트 구현
- **예상 소요**: ~4시간 / 리스크: Medium

---

### C-5. 드라이빙 거리 추적 (선택적 입력)

- **배경**: 현재 `HoleRecord`에 드라이빙 거리 입력 필드 없음 — 선택적으로 입력 시 평균 추적 가능
- **작업**:
  1. `HoleRecord`에 `drivingDistance?: number` 필드 추가
  2. Par 4/5 홀에서만 거리 입력 옵션 표시 (숫자 패드)
  3. `RoundSummary`에 `avgDrivingDistance?: number` 집계 추가
  4. DB `holes` 테이블 `driving_distance` 칼럼 추가 (마이그레이션)
- **예상 소요**: ~4시간 / 리스크: Medium

---

### C-6. 목표 스코어 설정 및 달성률 추적

- **배경**: 사용자가 이번 시즌 목표 스코어(예: 80타 이하)를 설정하고 달성 라운드 비율을 표시
- **작업**:
  1. 설정 화면에 `targetScore: number` 입력 UI (AsyncStorage 저장)
  2. 대시보드에 `{달성 라운드}/{전체 라운드} 목표 달성` 카드 추가
  3. 최근 5경기 TrendChart에 목표선(dashed line) 표시
- **예상 소요**: ~2.5시간 / 리스크: Low

---

## Phase D — 클라우드·동기화 고도화

> 목표: CRITICAL_LOGIC §1(Sync Queue, Safe Sync Protocol) 기반의 안정성 추가 강화

### D-1. 동기화 상태 상세 알림 (SyncStatusBanner)

- **배경**: 현재 sync 상태는 Toast로만 알림 — 오프라인 중 `pending_sync_ids` 개수를 상단 배너로 표시하면 사용자 투명성 향상
- **작업**:
  1. `useSyncStatus` 훅: `pendingCount`, `isOnline`, `lastSyncAt` 값 노출
  2. Dashboard 상단에 `SyncStatusBanner` 컴포넌트 조건부 표시
  3. 배너 탭 시 수동 동기화 트리거
- **예상 소요**: ~2.5시간 / 리스크: Low

---

### D-2. 동기화 히스토리 로그 (Admin 전용)

- **배경**: 동기화 실패/성공 이력을 Admin 화면에서 조회 가능하면 디버깅에 유용
- **작업**:
  1. AsyncStorage에 `@sync_log` 키로 최근 20건 이력 저장 (timestamp, status, roundId, error)
  2. Admin 탭에 "동기화 로그" 섹션 추가 (접힘/펼침 Accordion)
- **예상 소요**: ~2시간 / 리스크: Low

---

### D-3. 멀티 디바이스 — 충돌 병합 UI

- **배경**: 현재 `updatedAt` 기반 클라우드 우선 병합(§1 §28) — 타임스탬프가 동일하고 홀 수도 같을 때는 로컬을 유지하나, 사용자 확인 없이 자동 결정
- **작업**:
  1. 충돌 감지 시 (동일 `updatedAt`, 다른 홀 데이터) `ConflictResolutionModal` 노출
  2. 로컬 vs 클라우드 요약 비교 표 제공
  3. 사용자가 선택 → 선택된 버전을 SSOT로 저장
- **예상 소요**: ~5시간 / 리스크: High (edge case 많음)

---

### D-4. 라운드 데이터 CSV 내보내기 (Export)

- **배경**: 사용자가 자신의 데이터를 직접 분석하고 싶을 때 CSV 파일로 내보내기
- **작업**:
  1. `golf.service.ts`에 `exportRoundsToCSV(rounds: GolfRound[]): string` 추가
  2. `expo-sharing` + `expo-file-system`으로 파일 저장 및 공유
  3. History 화면 또는 설정 화면에 "데이터 내보내기" 버튼 추가
- **예상 소요**: ~3시간 / 리스크: Low-Medium

---

### D-5. iCloud / Google Drive 백업 (선택적)

- **배경**: Supabase 외에 네이티브 클라우드 스토리지에도 백업 가능 → Supabase 장애 대비
- **작업**:
  1. iOS: `expo-document-picker` + iCloud 연동 조사
  2. Android: Google Drive REST API 또는 `react-native-google-drive-api-wrapper` 검토
  3. MVP: JSON 파일 내보내기 → iCloud/Drive 에 수동 저장
- **예상 소요**: ~8시간 / 리스크: High (플랫폼 별 구현 상이)

---

## Phase E — 관리자(Admin) 기능 강화

> 목표: 구장 마스터 데이터 관리의 완결성 및 사용성 향상

### E-1. 구장 검색 및 필터링 (검증 여부 / 지역)

- **배경**: 구장 수가 늘어날수록 목록 탐색이 어려워짐 — 검색 바 및 필터(검증됨/미검증, 지역) 필요
- **작업**:
  1. `admin.tsx`의 클럽 목록에 `SearchBar` 컴포넌트 추가
  2. `FilterChipRow`: 검증됨 / 미검증 토글
  3. 프론트엔드 필터링 (`useMemo`)
- **예상 소요**: ~2시간 / 리스크: Low

---

### E-2. 구장 데이터 일괄 검증(Bulk Verify) 기능

- **배경**: 현재 `is_verified` 토글이 건별 — 여러 구장을 한 번에 검증 처리할 수 있으면 편리
- **작업**:
  1. 멀티 선택 모드 UI (체크박스 또는 Long-press 선택)
  2. "선택 항목 검증 처리" FAB 버튼
  3. Supabase `update ... where id in (...)` 배치 처리
- **예상 소요**: ~3시간 / 리스크: Low-Medium

---

### E-3. 구장 입력 데이터 Validation 실시간 표시

- **배경**: `validateClubData`(§10) 검증 로직이 있으나, Admin 화면에서 입력 중 실시간 피드백 없음 — 저장 시에만 오류 확인
- **작업**:
  1. 홀 수(9개 고정), Par 합계(36 고정) 실시간 카운터 표시
  2. 전장 누락 홀 강조 표시 (빨간 테두리)
  3. 저장 버튼 비활성화 조건 명확화
- **예상 소요**: ~2.5시간 / 리스크: Low

---

### E-4. 구장 마스터 데이터 JSON 가져오기 (Import)

- **배경**: 여러 홀 데이터를 UI로 수작업 입력하는 것은 비효율 — 사전 정의된 JSON 포맷으로 일괄 등록
- **작업**:
  1. 가져오기 JSON 스키마 정의 (`ClubInfo` 타입 기반)
  2. `expo-document-picker`로 JSON 파일 선택
  3. `validateClubData` 통과 후 Supabase `insert` 실행
  4. 오류 발생 항목 목록 표시
- **예상 소요**: ~4시간 / 리스크: Medium

---

### E-5. 관리자 전용 대시보드 (사용 통계)

- **배경**: 전체 사용자의 라운드 수, 최다 방문 구장 등 Supabase에서 집계 가능
- **작업**:
  1. Supabase SQL 집계 쿼리 (Edge Function 또는 RPC)
  2. Admin 탭에 "시스템 통계" 섹션 추가: 총 라운드 수, 오늘 신규 라운드, 인기 구장 TOP 5
- **예상 소요**: ~4시간 / 리스크: Medium (RLS 정책 검토 필요)

---

## Phase F — 성능·코드 체계 개선

> 목표: 기존 아키텍처의 기술 부채 해소 및 장기 유지보수성 향상

### F-1. `golf.repository.ts` 분할 (파일 크기 26KB → 모듈화)

- **배경**: 현재 `golf.repository.ts` 단일 파일 26KB (~700줄 추정) — 로컬 스토리지, 클라우드 동기화, 마스터 데이터를 분리하면 유지보수 용이
- **작업**:
  1. `golf.localRepository.ts`: AsyncStorage CRUD
  2. `golf.cloudRepository.ts`: Supabase 연동
  3. `golf.masterRepository.ts`: 클럽 마스터 데이터 조회
  4. `golf.repository.ts`를 facade로 유지하여 기존 import 경로 보존
- **예상 소요**: ~4시간 / 리스크: Medium (import 경로 영향)

---

### F-2. `useGolfRecord.ts` 훅 — 도메인별 서브훅 분리

- **배경**: `useGolfRecord.ts` 단일 파일 19KB (~550줄) — 기록, 코스 선택, 라운드 종료 로직이 혼재
- **작업**:
  1. `useCourseSelection.ts`: 코스 선택 단계 로직 분리
  2. `useRoundFinish.ts`: 라운드 종료 + 동기화 로직 분리
  3. `useGolfRecord.ts`를 조합 훅(composition hook)으로 리팩토링
- **예상 소요**: ~4시간 / 리스크: Medium

---

### F-3. TanStack Query 캐시 키 상수화

- **배경**: 쿼리 키가 `['golf_rounds', userId]` 등 문자열 리터럴로 흩어져 있어 오타 위험
- **작업**:
  1. `src/shared/lib/queryKeys.ts` 파일 생성
  2. `QUERY_KEYS = { golfRounds: (userId) => [...], currentRoundId: (userId) => [...] }` 정의
  3. 모든 사용 지점 교체
- **예상 소요**: ~1시간 / 리스크: Low

---

### F-4. Supabase 클라이언트 싱글톤 확인 및 SSR Safety 강화

- **배경**: CRITICAL_LOGIC §3 — `typeof window !== 'undefined'` 체크 또는 Dummy Storage Wrapper 권장. 현재 적용 여부 재확인
- **작업**:
  1. `src/shared/lib/supabase.ts` 전수 확인
  2. Next.js/Web 빌드 시 누수 여부 `expo export` 로 검증
  3. 누락 시 조건부 초기화 추가
- **예상 소요**: ~1.5시간 / 리스크: Low

---

### F-5. 단위 테스트 커버리지 확장

- **배경**: 현재 `golf.service.ts` 단위 테스트 존재 (§9 §3.2) — Repository 레이어 및 커스텀 훅 테스트 추가
- **작업**:
  1. `golf.repository.ts` 모킹 테스트: AsyncStorage mock 활용 저장/읽기 검증
  2. `useGolfRecord` 훅 테스트: `@testing-library/react-hooks` 활용
  3. 이상 탐지 규칙(§10) 단위 테스트: `stroke > 15` 경고, `stroke < putt` 검증
- **예상 소요**: ~6시간 / 리스크: Low

---

### F-6. E2E 테스트 프레임워크 도입 (Maestro)

- **배경**: 현재 E2E 테스트 없음 — 핵심 플로우(라운드 시작→기록→종료→대시보드 확인) 자동화
- **작업**:
  1. `maestro` CLI 설치 및 시뮬레이터 연동
  2. `new_round_flow.yaml`: 새 라운드 시작 → 1홀 기록 → 종료 E2E 시나리오
  3. CI/CD (GitHub Actions) 연동 (선택)
- **예상 소요**: ~8시간 / 리스크: Medium

---

### F-7. Storybook 도입 (UI 컴포넌트 문서화)

- **배경**: `ScoreCardTable`, `ToastConfig`, `ScoreAdjuster` 등 재사용 컴포넌트가 늘어남에 따라 독립 렌더링·문서화 필요
- **작업**:
  1. `@storybook/react-native` 설치 및 기본 설정
  2. `ScoreCardTable.stories.tsx`, `ScoreAdjuster.stories.tsx` 등 핵심 컴포넌트 Story 작성
- **예상 소요**: ~5시간 / 리스크: Low-Medium

---

## Phase G — 신규 대형 기능

> 목표: 애플리케이션의 가치를 근본적으로 확장하는 장기 기능

### G-1. 소셜 / 멀티플레이어 스코어카드

- **배경**: 동반 플레이어의 스코어를 함께 기록하고 실시간으로 공유 (파티 스코어)
- **작업**:
  1. `GolfRound`에 `players: PlayerRecord[]` 배열 추가
  2. Supabase Realtime 채널 활용 공유 세션 구현
  3. 라운드 시작 시 "같이 기록" 모드 선택 → QR 코드 / 딥링크 초대
  4. 각 플레이어의 홀별 스코어를 동시에 기록 가능
- **예상 소요**: ~20시간 / 리스크: High

---

### G-2. AI 기반 약점 분석 및 연습 추천

- **배경**: 미스샷 패턴 + 파별 성적 기반 GPT(Gemini) API를 통해 개인화된 연습 드릴 추천
- **작업**:
  1. `calculateAdvancedStats` 결과를 Gemini API에 프롬프트로 전송
  2. 응답으로 받은 연습 추천을 카드 형태로 표시
  3. API 429 Rate Limit 대비 캐싱 전략 (staleTime: 24h)
  4. 스켈레톤 로딩 UI 제공
- **예상 소요**: ~8시간 / 리스크: Medium-High (API 비용 / 429 이슈)

---

### G-3. 날씨 정보 연동 (라운드 당일 날씨 자동 기록)

- **배경**: 라운드 날씨(기온, 풍속, 강수)는 스코어에 직접 영향 — 라운드 시작 시 자동 기록
- **작업**:
  1. `expo-location`으로 현재 위치 취득
  2. OpenWeatherMap API 연동 (무료 티어)
  3. `GolfRound`에 `weather?: WeatherSnapshot` 필드 추가
  4. 통계 분석 시 날씨 조건별 성적 비교 가능
- **예상 소요**: ~5시간 / 리스크: Medium (위치 권한)

---

### G-4. 구장 지도 시각화 (코스 레이아웃)

- **배경**: 구장별 홀 배치를 지도 위에 시각화하여 전략 수립 지원
- **작업**:
  1. Supabase `golf_holes` 테이블에 `lat`, `lng` 좌표 필드 추가
  2. `react-native-maps`로 코스 레이아웃 표시
  3. 각 홀 마커 탭 시 거리·파 정보 표시
- **예상 소요**: ~10시간 / 리스크: High (지도 데이터 수집 난이도)

---

### G-5. 캐디 모드 (실시간 거리 계산)

- **배경**: GPS 기반으로 핀(홀 중심)까지 남은 거리를 실시간 계산하여 클럽 선택 지원
- **작업**:
  1. `expo-location` 고정밀 위치 추적 (`accuracy: high`)
  2. 구장 G-4 좌표 데이터 기반 핀까지 거리 계산 (Haversine)
  3. 기록 화면에 "남은 거리" 실시간 표시 위젯
  4. 배터리 소모 최적화 (위치 업데이트 간격 조절)
- **예상 소요**: ~12시간 / 리스크: High (G-4 선행 필요)

---

## 우선순위 매트릭스 요약

| 코드 | 항목 | 영향도 | 난이도 | 추천순위 |
|------|------|--------|--------|----------|
| A-3 | 진행률 표시 | ★★★ | ★☆☆ | ⭐⭐⭐ |
| A-5 | 홀 메모 UI | ★★★ | ★☆☆ | ⭐⭐⭐ |
| B-1 | 전반/후반 소계 | ★★★ | ★☆☆ | ⭐⭐⭐ |
| C-6 | 목표 스코어 달성률 | ★★★ | ★★☆ | ⭐⭐⭐ |
| F-3 | 쿼리 키 상수화 | ★★☆ | ★☆☆ | ⭐⭐⭐ |
| A-1 | 상대 점수 색상 통일 | ★★★ | ★☆☆ | ⭐⭐⭐ |
| D-1 | 동기화 상태 배너 | ★★★ | ★★☆ | ⭐⭐⭐ |
| C-2 | 클럽별 베스트/평균 | ★★★ | ★★☆ | ⭐⭐☆ |
| C-3 | 핸디캡 추정 | ★★★ | ★★☆ | ⭐⭐☆ |
| B-2 | FIR 기록 복구 | ★★☆ | ★☆☆ | ⭐⭐☆ |
| B-3 | 티 거리 표시 | ★★☆ | ★★☆ | ⭐⭐☆ |
| F-1 | repository 분할 | ★★☆ | ★★☆ | ⭐⭐☆ |
| F-5 | 단위 테스트 확장 | ★★☆ | ★★☆ | ⭐⭐☆ |
| G-2 | AI 약점 분석 | ★★★★ | ★★★ | ⭐☆☆ (장기) |
| G-1 | 멀티플레이어 | ★★★★ | ★★★★ | ⭐☆☆ (장기) |

---

*최종 업데이트: 2026-03-11 | 기준선: Phase 6.2 완료*
