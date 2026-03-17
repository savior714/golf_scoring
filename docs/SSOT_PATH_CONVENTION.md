# 🗺️ SSOT: Project Path Convention (경로 사용 규약)

> **최종 갱신**: 2026-03-17 | **상태**: 승인됨 | **진실의 단일 공급원 (SSOT)**

## 1. 개요 (Overview)

본 문서는 프로젝트 내에서 사용되는 모든 파일 경로 및 모듈 참조에 대한 **표준 규칙**을 정의합니다. 특히 Vercel(Linux) 환경에서 발생할 수 있는 **Case-sensitivity(대소문자 구분)** 문제와 **Alias resolution(별칭 해석)** 실패를 원천 차단하는 것을 목적으로 합니다.

## 2. 절대 경로 별칭 (Root Alias: `@/`)

프로젝트의 모든 내부 모듈 참조는 상대 경로(`../../`) 대신 **절대 경로 별칭**인 `@/`를 사용하는 것을 원칙으로 합니다.

- **규정**: `@/`는 프로젝트 루트 디렉토리를 가리킵니다.
- **예시**:
  - `import { ... } from '@/src/shared/lib/queryKeys';` (O)
  - `import { ... } from '../../../shared/lib/queryKeys';` (X)

## 3. 설정 동기화 (Configuration Synchronization)

경로 별칭의 정합성을 유지하기 위해 아래 세 곳의 설정은 항상 **상호 동기화**된 상태여야 합니다.

| 설정 파일 | 역할 | 항목 |
| :--- | :--- | :--- |
| `tsconfig.json` | IDE 지원 및 타입 체크 | `"paths": { "@/*": ["./*"] }` |
| `babel.config.js` | 런타임/빌드 시 물리 경로 변환 | `module-resolver` 플러그인 설정 |
| `package.json` | 의존성 관리 | `babel-plugin-module-resolver` 포함 |

> [!IMPORTANT]
> 설정을 변경할 경우 반드시 세 파일을 동시에 업데이트하여 개발 환경과 배포 환경 간의 간극을 없애야 합니다.

## 4. 대소문자 엄격 준수 (Case Strictness)

Windows 개발 환경에서의 관용적인 경로 해석은 배포 환경(Linux)에서 치명적인 **Module Not Found** 에러를 유발합니다.

- **규칙**: 파일명과 디렉토리명의 **대소문자를 100% 동일하게** 기술해야 합니다.
- **금지 사항**: `src/Modules/...` (실제 `src/modules/...` 인 경우 에러 발생)

## 5. Lucide-React-Native 최적화

아이콘 라이브러리 참조 시 번들 크기 최적화 및 해석 속도를 위해 **Direct Import** 방식을 강제합니다.

- **권장**: `import { CircleCheck } from 'lucide-react-native/dist/icons/circle-check';`
- **지양**: `import { CircleCheck } from 'lucide-react-native';`

## 6. 유지보수 및 검증

새로운 하위 경로를 추가하거나 별칭을 확장할 경우, 이 문서를 먼저 갱신한 후 설정을 반영합니다. 정기적으로 `npx tsc --noEmit`을 실행하여 경로 무결성을 검증하십시오.
