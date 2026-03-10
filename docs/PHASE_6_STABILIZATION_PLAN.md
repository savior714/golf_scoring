# Phase 6: 최종 시스템 안정화 및 관측성(Observability) 고도화 계획

본 문서는 골프 스코어링 앱의 **Phase 6 최종 단계**를 완수하기 위한 세부 로드맵입니다. 단순한 기능 구현을 넘어, 운영 환경에서의 안정성과 데이터 무결성을 보장하는 데 초점을 맞춥니다.

---

## 1. 개요 (Objective)
- **에러 격리**: 한 부분의 오류가 앱 전체로 번지지 않게 차단 (Fault Tolerance).
- **데이터 무결성**: 오프라인 상황에서도 단 1야드의 기록도 누락되지 않도록 보장 (Data Integrity).
- **타입 안정성**: ny 타입을 제거하여 런타임 에러 가능성을 원천 봉쇄 (Type Safety).

---

## 2. 세부 실행 단계 (Action Items)

### Step 1: 전역 및 국소 에러 바운더리 구축 (Task 4.1)
- **Global Error Boundary**: pp/_layout.tsx 최상단에 배치하여 화이트 스크린 방지.
- **Local Error Boundary**: ecord.tsx 내 입력 섹션에 배치하여 에러 시 해당 홀만 초기화 유도.
- **Recovery UI**: "앱 재시작" 또는 "데이터 복구 후 대시보드 이동" 등 구체적인 복구 시나리오 제공.

### Step 2: 오프라인 동기화 엔진 및 정합성 검증 (Task 4.2)
- **Sync Resilience**: 네트워크 단절/복구 시 동기화 큐(AsyncStorage)의 순차적 처리 보장.
- **Conflict Strategy**: 서버와 로컬의 updated_at 비교를 통한 Last-Write-Wins 전략 재점검.
- **Stress Test**: 비행기 모드 전환 -> 다수 홀 기록 -> 복구 시 데이터 유실 여부 수동 검증.

### Step 3: 기술 부채 및 타입 고도화 (Task 4.3)
- **Zero Any Policy**: useGolfRecord.ts, golf.service.ts 등에 남은 ny 타입을 인터페이스로 치환.
- **Tree Shaking**: 사용하지 않는 Import, 변수, 유틸리티 함수(Dead Code) 전치 제거.
- **Audit**: useEffect 의존성 배열 최적화 및 불필요한 리렌더링 유발 요소 최종 제거.

### Step 4: 최종 프로덕션 가이드라인 준수 (Final Polish)
- **Environment**: Supabase API Key 및 URL 관리 체계 최종 확인.
- **Asset Audit**: 이미지 및 폰트 파일 용량 확인.
- **Happy Path Walkthrough**: 로그인부터 18홀 종료까지의 사용자 여정 최종 점검.

---

## 3. 타임라인 (Timeline)
1. **[진행 예정]** Step 1: 에러 바운더리 구현
2. **[진행 예정]** Step 2: 오프라인 정합성 테스트
3. **[진행 예정]** Step 3: 타입 클리닝 및 데드 코드 정리
4. **[진행 예정]** Step 4: 최종 결과 보고 및 Phase 6 종료

---

## 4. 성공 지표 (Success Metrics)
- 앱 전체 크래시 발생율 0% (에러 바운더리에 의한 우아한 종료).
- 오프라인 기록 데이터 복구 성공률 100%.
- TypeScript 컴파일 에러 Zero 및 ny 타입 사용 0%.