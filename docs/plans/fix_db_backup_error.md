# 🗺️ Project Blueprint: DB 백업 'Tenant or user not found' 오류 해결

> 생성 일시: 2026-03-13 11:27 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- GitHub Actions에서 발생한 `pg_dump: error: connection to server... failed: FATAL: Tenant or user not found` 오류를 해결합니다.
- 이 오류는 Supabase의 **Connection Pooler (Supavisor)**를 사용할 때 사용자 이름에 프로젝트 참조(Project Ref)가 누락되었거나, `pg_dump`에 권장되지 않는 풀러 연결을 사용하고 있을 때 발생합니다.
- 안정적인 백업을 위해 **Direct Connection** 사용으로 전환하거나, 수동으로 **Tenant ID**가 포함된 연결 공식을 적용합니다.

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [x] **Task 1: .github/workflows/db_backup.yml 분석 및 개선안 도출**
  - **Tool**: `Read`
  - **Target**: `c:\develop\golf_scoring\.github\workflows\db_backup.yml`
  - **Goal**: 현재 연결 방식 확인 및 `pg_dump` 옵션 최적화 가능성 검토.
  - **Dependency**: None

- [x] **Task 2: Supabase 연결 설정 가이드 제공 (사용자 수동 조치 필요)**
  - **Goal**: GitHub Secrets에 저장된 `SUPABASE_DB_URL`의 형식을 올바르게 수정하도록 가이드.
  - **Action**: 
    1. **권장**: Direct Connection 사용 (`db.[PROJECT_REF].supabase.co` 또는 IPv4 직접 주소).
    2. **우회**: 풀러 사용 시 유저네임을 `postgres.[PROJECT_ID]` 형식으로 변경.
  - **Dependency**: Task 1

- [x] **Task 3: db_backup.yml 수정 및 테스트 실행 안내**
  - **Tool**: `Edit`
  - **Target**: `c:\develop\golf_scoring\.github\workflows\db_backup.yml`
  - **Goal**: `pg_dump` 실행 시 발생할 수 있는 잠재적 환경 변수 문제(예: PGPASSWORD 처리) 보완.
  - **Dependency**: Task 2

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Security**: DB 접속 URL에는 비밀번호가 포함되어 있으므로 로그에 노출되지 않도록 주의합니다.
- **Reference**: Supabase 공식 문서는 `pg_dump` 사용 시 **Direct Connection** 사용을 강력히 권장합니다.
- **Environment**: GitHub Actions (Ubuntu-latest) 환경에서 동작 보장.

## ✅ Definition of Done

1. [x] GitHub Actions 수동 실행(Workflow Dispatch) 시 `pg_dump` 단계 성공.
2. [x] 생성된 백업 파일(.7z)이 정상적으로 Artifact에 업로드됨.
3. [x] `memory.md`에 이슈 원인 및 해결 방법 기록.

---

## [BLUEPRINT CHECKLIST]

- [x] Task 1: .github/workflows/db_backup.yml 분석
- [x] Task 2: Supabase 연결 설정 가이드 확인
- [x] Task 3: 워크플로우 보완 및 검증
