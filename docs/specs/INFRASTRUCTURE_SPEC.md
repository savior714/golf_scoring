# 📁 INFRASTRUCTURE_SPEC: Technology & Persistence

> 상태: 정립 (Established) | 기준: 2026-03-19

## 1. Storage & Persistence Policy (저장소 및 영속성 정책)

### 1.1 Multi-Layer Persistence

- **Local Persistence (AsyncStorage)**: 사용자별 고유 세션 키(`@golf_rounds_data_{userId}`)를 사용하여 로컬 데이터를 보존한다.
- **Remote Persistence (Supabase)**: 클라우드 동기화(Upsert)를 통해 다중 기기 간 데이터를 통합한다.
- **In-Memory Caching**: 레포지토리 레이어에 `Map` 기반의 인메모리 캐시를 도입하여 네트워크 및 I/O 부하를 최적화한다.

### 1.2 Data Integrity Protocols

- **Encoding Standard**: PowerShell 스크립트는 **UTF-8 with BOM**, 그 외 소스 코드는 **UTF-8 no BOM**을 엄격히 준수한다.
- **Concurrency Control**: 중복된 동기화나 홀 전환 시 데이터 유실을 방지하기 위해 `KeyedAsyncLock`을 적용한다.
- **Retry Mechanism**: 동기화 실패 라운드는 `@pending_sync_ids`에 대기하며, 앱 포그라운드 전환(AppState 변경) 시 재시도한다.

## 2. Platform & Environment Standards (플랫폼 및 환경 표준)

- **SSR Support (Expo)**: 브라우저 전용 API(Supabase, AsyncStorage)에 접근할 때는 반드시 `window` 존재 여부나 더미 래퍼를 사용하여 Node.js 환경에서의 빌드 오류를 방지한다.
- **Absolute Alias Import**: Vercel(Linux) 등 빌드 환경에서의 경로 해석 오류 방지를 위해 `@/src/` 절대 경로 별칭을 강제하며, 세부 규칙은 `docs/SSOT_PATH_CONVENTION.md`를 따른다.
- **Icon Optimization**: `lucide-react-native` (v0.400+)의 ESM `exports` 지원을 활용하여 패키지 루트에서의 **Named Import**(`{ Icon }`) 방식을 사용하며, Metro Tree Shaking을 통해 번들 크기를 최적화한다.

## 3. Infrastructure & Backup (인프라 및 백업 정책)

- **Database Backup**: 매일 한국 시간 0시(UTC 15:00)에 자동 백업을 수행하며 AES-256 방식으로 암호화한다.
- **Connection Pooling**: 외부 CI/CD 환경(GitHub Actions)에서 Supabase에 접근할 때는 IPv4/IPv6 호환성을 고려하여 반드시 **Connection Pooler**를 통해 접속한다.
- **Graceful Degradation**: 데이터베이스 오류나 네트워크 단절 시에도 빈 배열을 반환하거나 기존 유효 상태를 유지하여 사용자 작업 흐름을 보호한다.

## 4. Performance & Caching (성능 및 캐싱 전략)

- **Interaction Manager**: 화면 진입 시 무거운 비동기 작업은 내비게이션 애니메이션 완료 후 실행(`InteractionManager.runAfterInteractions`)하도록 지연 처리한다.
- **React Query Policy**: AsyncStorage 쿼리는 **`staleTime: Infinity`**를 필수 설정하여 불필요한 리렌더링 버그를 차단한다.
- **Async Optimization**: 독립적인 작업은 `Promise.all`을 사용하여 병렬 처리한다.
- **Memoization**: 고비용 계산(통계 등)은 `useMemo`, 컴포넌트는 `React.memo`를 통해 렌더링 성능을 최적화한다.

## 5. Error Handling & Resilience (에러 핸들링 및 복원력)

- **Domain-Based Schema**: 모든 인프라 에러는 도메인 규격(`GolfErrorCode`)으로 변환하여 상위 계층으로 전달한다.
- **Memory Leak Protection**: 비동기 훅에서는 `isMounted` 참조를 사용하여 언마운트 후의 상태 업데이트를 원천 차단한다.
- **Stable Ref Pattern**: 복잡한 비동기 로직에서는 `useRef`로 최신 상태를 참조하여 클로저 문제(Stale Closure)를 방지한다.
