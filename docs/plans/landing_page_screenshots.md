# 🗺️ Project Blueprint: 랜딩 페이지 스크린샷 고도화 (Actual UI Mockups)

> 생성 일시: 2026-03-16 23:45 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- 랜딩 페이지의 `ServiceIntroSlider`에 사용되는 이미지들이 현재 '데이터가 없는 초기 상태'로 설정되어 있어 서비스의 핵심 가치를 전달하지 못함.
- 실제 데이터(스코어 입력 중, 히스토리 목록, 통계 대시보드)가 포함된 **프리미엄 UI Mockup**으로 교체하여 첫 사용자의 기대감을 높이고 서비스 아이덴티티를 강화함.
- **SSOT**: `docs/memory.md` (랜딩 페이지 고도화 항목 업데이트 필요)

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 **독립적인 기능 단위**로 설계되었습니다. 우선순위에 따라 원하는 항목을 선택하여 진행을 요청하세요.

### 📦 Task List

- [x] **Task 1: 스코어 입력 화면(Score Entry) 이미지 생성 및 교체**
  - **Tool**: `browser_subagent` (Actual UI Capture)
  - **Target**: `assets/images/landing_record.png`
  - **Goal**: 실제 골프 스코어(홀 번호, 파, 스트로크, 퍼트)를 입력 중인 역동적이고 세련된 앱 인터페이스 이미지 생성.
  - **Status**: 완료 (2026-03-16)

- [x] **Task 2: 히스토리 기록(History) 이미지 생성 및 교체**
  - **Tool**: `browser_subagent` (Actual UI Capture)
  - **Target**: `assets/images/landing_history.png`
  - **Goal**: 여러 건의 라운딩 기록(구장명, 날짜, 스코어)이 리스트 형태로 나열된 히스토리 탭 이미지 생성.
  - **Status**: 완료 (2026-03-16)

- [x] **Task 3: 통계 대시보드(Stats/Dashboard) 이미지 생성 및 교체**
  - **Tool**: `browser_subagent` (Actual UI Capture)
  - **Target**: `assets/images/landing_stats.png`
  - **Goal**: 버디/파 비율, 평균 퍼트 수 등 통계 그래프와 결과 데이터가 입체적으로 표현된 대시보드 이미지 생성.
  - **Status**: 완료 (2026-03-16)

- [ ] **Task 4: ServiceIntroSlider 텍스트 최적화 및 검증**
  - **Tool**: `replace_file_content`
  - **Target**: `src/shared/components/ServiceIntroSlider.tsx`
  - **Goal**: 새 이미지의 컨셉에 맞추어 슬라이드 텍스트(설명)를 더 매력적으로 다듬고 인덱싱 확인.
  - **Dependency**: Task 1, 2, 3

- [ ] **Task 5: 환경 검증 및 메모리 동기화**
  - **Tool**: `Bash`
  - **Command**: `scripts/check-env.ps1` 및 `docs/memory.md` 업데이트
  - **Goal**: 전체 시스템 일관성 확인 및 작업 완료 기록.
  - **Dependency**: Task 4

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Aesthetics**: `generate_image` 사용 시 "Premium", "Modern", "Clean UI", "Golf App" 키워드를 활용하여 고품질 에셋 확보.
- **Consistency**: 세 이미지 모두 동일한 색상 팔레트(Score Note의 테마 색상)와 타이포그래피 스타일을 유지해야 함.
- **Overwrite**: 기존 `landing_*.png` 파일을 덮어쓰기하여 코드 변경 최소화.

## ✅ Definition of Done

1. [ ] 각 슬라이드가 실제 데이터가 채워진 상태를 시각적으로 잘 보여줌.
2. [ ] 랜딩 페이지 슬라이더가 의도한 데이터 매칭으로 자연스럽게 작동함.
3. [ ] `memory.md`에 '랜딩 페이지 에셋 고도화' 내용이 반영됨.
