# 🗺️ Project Blueprint: Vercel 배포 경로 해석 무결성 확보

> 생성 일시: 2026-03-17 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **현상**: Vercel(Linux) 배포 시 Metro 번들러가 `@/` 별칭(Alias)을 해석하지 못하는 간헐적/지속적 오류 해결.
- **근본 원인**: Expo Web 빌드 프로세스에서 `tsconfig.json`의 `paths` 설정이 Metro 인프라에 완벽히 전파되지 않는 문제.
- **해결 전략**: `babel-plugin-module-resolver`를 도입하여 빌드 시점에 경로가 물리적 파일 경로로 변환되도록 강제함.
- **SSOT**: `docs/SSOT_PATH_CONVENTION.md`를 생성하여 향후 모든 경로 규칙을 정의하고 자동화 도구에 반영함.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: 모듈 리졸버 플러그인 설치**
  - **Tool**: `Bash`
  - **Command**: `npm install --save-dev babel-plugin-module-resolver`
  - **Goal**: 경로 별칭 해석을 위한 의존성 추가

- [x] **Task 2: `babel.config.js` 수정**
  - **Tool**: `Edit`
  - **Target**: `babel.config.js`
  - **Goal**: `@/*` 별칭을 `./*`로 매핑하는 설정 추가
  - **Pseudocode**:
    ```javascript
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: { '@': './' }
      }]
    ]
    ```

- [x] **Task 3: `app/(tabs)/_layout.tsx` 임포트 정합성 확인**
  - **Tool**: `Read`
  - **Target**: `app/(tabs)/_layout.tsx`
  - **Goal**: 이중 공백이나 오타 등 모듈 해석을 방해하는 요소가 없는지 정밀 검사

- [x] **Task 4: `docs/SSOT_PATH_CONVENTION.md` 작성**
  - **Tool**: `Write`
  - **Target**: `docs/SSOT_PATH_CONVENTION.md`
  - **Goal**: 프로젝트 내 경로 사용 규칙을 SSOT로 박제 (Babel 설정과 동기화 강조)

- [x] **Task 5: 최종 환경 검증**
  - **Tool**: `Bash`
  - **Command**: `npx tsc --noEmit` 및 로컬 웹 빌드 테스트(`npx expo export -p web`)
  - **Goal**: 모든 변경 후 무결성 입증

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Sync Check**: `babel.config.js`의 별칭과 `tsconfig.json`의 `paths`는 항상 일치해야 함.
- **Case Strictness**: Linux 배포 환경을 고려하여 모든 경로 참조는 실제 파일 시스템의 대소문자를 100% 준수함.

## ✅ Definition of Done

1. [x] `babel-plugin-module-resolver`가 성공적으로 설정됨.
2. [x] 로컬 환경에서 `npx expo export -p web` 명령어가 에러 없이 완료됨.
3. [x] `docs/SSOT_PATH_CONVENTION.md`가 생성되고 가이드라인이 명시됨.
4. [x] `memory.md`에 결함 해결 내역 기록 완료.
