# 🗺️ Project Blueprint: Database automated Backup Strategy

> 생성 일시: 2026-03-12 15:15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- 유저 데이터 증가 및 해킹/환경적 장애에 대비하여 **Supabase DB의 오프사이트(Off-site) 백업 자동화**를 구축합니다.
- 결제의 번거로움이 없는 **GitHub Actions Artifacts**를 우선 사용하여 데이터를 격리 보관(90일)합니다.

## 🛠️ Step-by-Step Execution Plan

> 아래 목록은 독립적인 기능 단위로 설계되었습니다.

### 📦 Task List

- [x] **Task 1: GitHub Actions 기반 pg_dump 워크플로우 설계 (GitHub Artifacts)**
  - **Goal**: 매일 정해진 시간에 DB를 덤프하여 GitHub 서버에 안전하게 보관하는 파이프라인 구축.
  - **Context**: `.github/workflows/db_backup.yml` 생성 (완료).
  - **Implementation**:
    - [x] `postgres-client` 설치 및 `pg_dump` 실행 스크립트 작성.
    - [x] 백업 파일 압축 및 날짜 기반 네이밍 적용.
    - [x] GitHub Actions Artifacts 저장 로직 적용 (90일 보관).
  - **Pseudocode**:

    ```yaml
    cron: "0 15 * * *" # 매일 자정(KST 기준 오전 0시)
    run: pg_dump $SDB_URL | gzip > backup_$(date +%Y%m%d).sql.gz
    upload: aws s3 cp ... --endpoint-url $R2_ENDPOINT
    ```

  - **Dependency**: None
  - **Verification**: GitHub Actions 수동 실행(Workflow Dispatch) 후 Cloudflare R2 버킷 확인.

- [ ] **Task 2: 보안 비밀번호(Secrets) 관리 및 활성화**
  - **Goal**: DB 접속 정보를 외부 노출 없이 안전하게 관리.
  - **Context**: GitHub Repository -> Settings -> Secrets and Variables -> Actions.
  - **Implementation**:
    - [ ] `SUPABASE_DB_URL` (Direct Connection String) 등록.
  - **Dependency**: Task 1
  - **Verification**: 워크플로우를 수동 실행하여 Actions 탭에 백업 파일이 생성되는지 확인.

- [ ] **Task 3: 오프사이트 영구 저장소(S3/Cloudflare R2) 연동**
  - **Goal**: GitHub에만 의존하지 않고 독립적인 저장소에 백업본 영구 보존.
  - **Context**: `db_backup.yml` 수정 및 AWS/Cloudflare API 연동.
  - **Implementation**:
    - [ ] 무료 티어로 충분한 Cloudflare R2 또는 AWS S3 버킷 설정 가이드.
    - [ ] `aws s3 cp` 또는 `rClone`을 사용하여 덤프 파일 업로드.
    - [ ] 30일 경과 백업 자동 삭제(Retention Policy) 설정.
  - **Dependency**: Task 2
  - **Verification**: S3 버킷 내에 업로드된 파일 물리적 확인.

- [ ] **Task 4: 재해 복구(Disaster Recovery) 가이드라인 작성**
  - **Goal**: 실제 장애 시 백업본으로부터 DB를 복원하는 절차 문서화.
  - **Context**: `docs/DR_GUIDE.md` (신규).
  - **Implementation**:
    - [ ] `psql`을 사용한 덤프 데이터 복원 명령어 정리.
    - [ ] 특정 시점 복구(Point-in-Time) 가이드 포함.
  - **Dependency**: None (문서화 작업)
  - **Verification**: 로컬 DB에서 샘플 백업 데이터 복원 테스트 성공 여부.

## ⚠️ 기술적 제약 및 규칙 (SSOT)

- **Security**: DB Password는 절대 로그에 노출하지 않음 (`set -x` 금지).
- **Format**: 백업 파일은 `gzip` 압축 필수 (용량 절감).
- **Location**: 백업은 Supabase가 위치한 리전과 지리적으로 다른 곳(예: AWS Tokyo -> Cloudflare North America 등)에 보관하는 것을 권장 (선택).

## ✅ Definition of Done

1. [ ] 매일 자동화된 백업이 실행되고 결과가 외부(GitHub/S3)에 저장됨.
2. [ ] 관리자가 필요할 때 언제든지 백업된 SQL 파일을 다운로드하여 구조/데이터를 확인할 수 있음.
3. [ ] `memory.md`에 백업 주기 및 보관 위치 기록 완료.
