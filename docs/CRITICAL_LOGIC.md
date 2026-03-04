# Golf Scoring Logic

- **Total Score:** 모든 홀의 `stroke` 합산.
- **GIR (Green In Regulation):** `(stroke - putt) <= (par - 2)` 일 때 true로 판정.
- **Birdie:** `stroke == par - 1`
- **Par:** `stroke == par`
- **Double Par:** `stroke >= par * 2` (양파)
- **OB (Out of Bounds):** OB 횟수 기록.
- **Penalty Area:** OB를 제외한 해저드 등 벌타 기록.
- **Miss Shot:** 사용자 정의 미스샷 패턴 카운트 ('슬라이스', '훅', '탑볼', '뒤땅', '뽕샷', '생크').
- **GIR Rate:** `(GIR 성공 홀 수 / 전체 기록 홀 수) * 100` (%)
- **Average Putt:** `putt` 평균

## UI/UX Standards
- **Typography Hierarchy**:
  - Scores: 56px (900 Weight)
  - Titles/Headers: 24px/18px (900/800 Weight)
  - Grid Labels: 12px~14px (700/500 Weight)
  - Micro-copy: 명확한 대비를 통한 심미성 확보
- **Grid Layout**: 3열 기반의 대시보드 통계 및 미스샷 분석 그리드 (3x5)
- **Alert/Interactive**: Web 브라우저(Expo Go web) 호환성을 위한 `window.confirm`과 Native `Alert` 분기 처리.