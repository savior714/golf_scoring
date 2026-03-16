# 🗺️ Project Blueprint: Lucide Direct Import 경로 오류 수정

> 생성 일시: 2026-03-16 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

Metro 번들러가 `lucide-react-native/dist/icons/file-code` 모듈을 찾지 못하는 오류를 수정한다.

### 근본 원인 분석

| 구분 | 내용 |
|------|------|
| **에러 경로** | `lucide-react-native/dist/icons/file-code` |
| **물리적 실제 경로** | `dist/cjs/icons/file-code.js` 또는 `dist/esm/icons/file-code.js` |
| **문제** | `dist/icons/` 디렉토리가 패키지 루트에 존재하지 않음 (v0.576.0) |
| **package.json exports** | `./icons` 하나만 정의됨, 개별 아이콘 경로(`./dist/icons/*`) 미정의 |
| **2차 의심 원인** | `metro.config.js`의 `blockList: /dist\/.*/` 가 `node_modules` 내 `/dist/` 경로까지 차단 가능 |

### 영향 범위 — 같은 패턴 사용 파일

```
src/modules/admin/components/AdminNavButtons.tsx       ← 에러 발생 지점 (file-code, file-search, message-square, users)
src/modules/admin/components/AdminFormComponents.tsx   ← trash-2
src/modules/admin/components/ClubPreviewCard.tsx       ← chevron-right, chevron-down
src/modules/admin/components/ClubSelectModal.tsx       ← chevron-down, x
src/modules/admin/components/UserCard.tsx              ← activity, database, mail, user, user-plus
src/modules/golf/components/Dashboard/StatGrid.tsx     ← 15개 아이콘
```

### 수정 전략 (채택: Metro Resolver 통합 수정)

`dist/icons/<name>` 요청 시 Metro가 `dist/cjs/icons/<name>`으로 자동 리다이렉트하는
`resolver.resolveRequest` 커스텀 함수를 `metro.config.js`에 추가한다.

- 소스 파일 6개를 개별 수정하지 않아도 됨 (atomic, 단일 파일 수정)
- 향후 같은 패턴의 신규 아이콘 추가 시에도 자동 적용

**단, metro blockList 문제가 1차 원인이라면 이를 먼저 수정한다.**

- **SSOT**: 이 변경은 `docs/CRITICAL_LOGIC.md`의 비즈니스 로직에 영향 없음

---

## 🛠️ Step-by-Step Execution Plan

> ⚠️ **각 Task는 단 하나의 도구 호출(Read / Edit / Write / Bash 중 1개)로 완료되어야 한다.**

### 📦 Task List

- [ ] **Task 1: metro.config.js 읽기 — blockList 및 resolver 현재 상태 파악**
  - **Tool**: `Read`
  - **Target**: `c:/develop/golf_scoring/metro.config.js`
  - **Goal**: `blockList` 정규식이 `node_modules/lucide-react-native/dist/` 경로를 실제로 차단하는지 확인
  - **Dependency**: None

- [ ] **Task 2: metro.config.js 수정 — blockList 범위 제한 + resolveRequest 추가**
  - **Tool**: `Edit`
  - **Target**: `c:/develop/golf_scoring/metro.config.js`
  - **Goal**:
    1. `blockList`를 `node_modules` 외부의 `dist/` 폴더만 차단하도록 수정
    2. `resolver.resolveRequest`로 `lucide-react-native/dist/icons/<name>` → `dist/cjs/icons/<name>` 리다이렉트
  - **Pseudocode**:
    ```js
    // blockList 수정: node_modules 내부 dist는 허용
    blockList: [
      /node_modules\/.*\/node_modules\/.*/,
      /test-results\/.*/,
      /^(?!.*node_modules).*\/dist\/.*/,  // node_modules 외부 dist만 차단
    ],
    // resolveRequest 추가
    config.resolver.resolveRequest = (context, moduleName, platform) => {
      if (moduleName.startsWith('lucide-react-native/dist/icons/')) {
        const iconName = moduleName.replace('lucide-react-native/dist/icons/', '');
        return context.resolveRequest(context, `lucide-react-native/dist/cjs/icons/${iconName}`, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    };
    ```
  - **Dependency**: Task 1

- [ ] **Task 3: Metro 캐시 클리어 및 앱 재기동 검증**
  - **Tool**: `Bash`
  - **Command**: `cd c:/develop/golf_scoring && npx expo start --clear 2>&1 | Select-Object -Last 20`
  - **Goal**: 에러 없이 번들링이 정상 완료되는지 확인
  - **Dependency**: Task 2

---

## ⚠️ 기술적 제약 및 규칙

| 항목 | 내용 |
|------|------|
| **Encoding** | UTF-8 no BOM 고정 |
| **lucide 버전** | `0.576.0` — `dist/cjs/icons/file-code.js` 물리적으로 존재 확인됨 |
| **blockList regex** | Windows 경로를 Metro가 정규화할 때 `/` 구분자로 처리하므로 패턴 재검토 필수 |
| **resolveRequest 우선순위** | `resolver.resolveRequest`는 기본 resolution보다 먼저 실행됨 |
| **Rollback** | `git checkout metro.config.js` 로 즉시 복구 가능 |

## ✅ Definition of Done

1. [ ] `npx expo start --clear` 후 에러 없이 번들 완료
2. [ ] `AdminNavButtons.tsx`의 FileCode 아이콘이 화면에 정상 렌더링
3. [ ] 다른 직접 임포트 파일(StatGrid, ClubPreviewCard 등)도 영향 없이 동작
