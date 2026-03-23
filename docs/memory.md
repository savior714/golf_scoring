# 🧠 Project Memory: Golf Scoring App

## 📅 Last Updated: 2026-03-23

## 🚀 Active Context
- [2026-03-23] **히스토리 탭 정렬 로직 중앙화**: `RoundRepositoryImpl`에서 항상 정렬(`date`, `updatedAt`, `id` DESC)된 데이터를 반환하도록 수정하여 앱 전반의 정렬 일관성 및 SSOT 확보.
- [2026-03-23] **히스토리 수정 데이터 보호**: `INIT_SESSION` 시 스코어 필드 동기화 누락으로 인한 데이터 초기화 및 오토세이브 오염 버그 해결.
- [2026-03-20] **스코어 입력 유실 방지**: 내비게이션 시 마지막 1-2홀 데이터가 초기화되는 문제 해결. `useGolfRecord`에 디바운스 오토세이브(1.5s) 및 `RecordScreen`에 Save-on-Blur 로직 구현 완료.
- [2026-03-19] `docs/specs/` 하위 5개 핵심 명세(System, Domain, App, Infra, UI) 구축 및 Master SSOT 정립.
- [2026-03-19] Vercel 배포 에러(import path mismatch) 해결.

## 📌 Critical Paths
- `docs/CRITICAL_LOGIC.md`: 통합 진실 원천 (Master Index)
- `docs/specs/APPLICATION_SPEC.md`: 유즈케이스 및 흐름 명세 (Auto-save 프로토콜 포함)
- `docs/specs/DOMAIN_SPEC.md`: 순수 비즈니스 규칙 명세
- `docs/specs/INFRASTRUCTURE_SPEC.md`: 기술 구현 및 성능 명세
- `docs/specs/UI_SPEC.md`: UI/UX 및 인터랙션 명세

## 🏁 Goal State REACHED
- 스코어 입력 중 내비게이션 간 데이터 유실 문제를 시스템 레벨에서 해결.
- SDD 가이드라인에 따른 선 설계 후 구현 원칙 준수 및 문서 최신화 완료.
