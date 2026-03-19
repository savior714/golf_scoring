# 🗺️ Project Blueprint: Fix Vercel Deployment Error

> 생성 일시: 2026-03-19 22:15 | 상태: 설계 승인 대기

## 🎯 Architectural Goal

- **Vercel 배포 실패 해결**: SDD 개편 이후 발생한 모듈 참조 오류(`golf.repository`, `golf.service`)를 최종 해결하고 원격 저장소에 반영하여 정상 배포를 재개함.
- **SSOT 정렬**: 로컬에서 이미 수정된 파일들을 원격(github)에 동기화하여 Vercel 빌드 머신이 올바른 경로를 참조하도록 보장함.

## 🔍 Impact Scope (영향 범위)

| 수정 대상 파일 | 현재 라인 수 | 참조하는 파일 | 비고 |
| -------------- | :----------: | ------------- | ---- |
| `app/(tabs)/history.tsx` | 273 | - | (로컬 가결) `infrastructure` 참조 확인 완료 |
| `app/(tabs)/record.tsx` | 222 | - | (로컬 가결) `infrastructure` 참조 확인 완료 |
| `app/(tabs)/index.tsx` | 200 | - | (로컬 가결) `infrastructure` 참조 확인 완료 |
| `app/_layout.tsx` | 202 | - | (로컬 가결) `infrastructure` 참조 확인 완료 |
| `docs/memory.md` | 24 | - | 수정 내역 반영 필요 |

## 🛠️ Step-by-Step Execution Plan

### 📦 Task List

- [ ] **Task 1: 로컬 수정 사항 최종 검증 (`git diff`)**
  - **Action**: 터미널 실행
  - **Target**: `git diff --stat` 및 주요 파일 내용 재확인
  - **Goal**: 잘못된 `golf.repository` 참조가 로컬에 남아있지 않은지 최종 전수 조사
  - **Verify**: `grep -r "golf.repository" .` 결과가 아카이브 제외 "없음"으로 나와야 함
  - **Dependency**: None

- [ ] **Task 2: `docs/memory.md` 현행화**
  - **Action**: 파일 수정
  - **Target**: `docs/memory.md`
  - **Goal**: Vercel 배포 오류 해결 및 최종 동기화 세션 기록
  - **Pseudocode**: `[2026-03-19] Vercel 배포 에러(import path mismatch) 해결 및 최종 Push`
  - **Verify**: 메모리 파일에 해당 라인이 추가됨
  - **Dependency**: Task 1

- [ ] **Task 3: 변경 사항 커밋 및 푸시 (Final Sync)**
  - **Action**: 터미널 실행
  - **Target**: `git add .`, `git commit -m "fix(deploy): resolve import path mismatch after SDD reorganization"`, `git push origin main`
  - **Goal**: 로컬의 올바른 상태를 원격 저장소로 강제 일치(Sync)
  - **Verify**: `git status`가 Clean하게 유지되어야 함
  - **Dependency**: Task 2

## ✅ Definition of Done

1. [ ] 로컬의 모든 `.tsx`/`.ts` 파일에서 구버전 `golf.repository`, `golf.service` 참조가 제거됨.
2. [ ] `git push`가 성공하여 Vercel 빌드가 정상 트리거됨.
3. [ ] `docs/memory.md`에 최종 작업 결과가 박제됨.
