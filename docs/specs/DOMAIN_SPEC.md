# 🏌️ DOMAIN_SPEC: Core Business Rules

> 상태: 정립 (Established) | 기준: 2026-03-19

## 1. Course Master Data Policy (코스 데이터 정책)

구장 및 코스 데이터 관리는 다음 4계층 구조를 따르며, 모든 데이터는 **9홀 단위**로 관리된다.

- **Hierarchy Structure**: `Club` > `Course` > `Hole` > `Distance`.
- **Course Units**: 모든 코스는 반드시 **9홀**로 구성되어야 하며, 18홀 구장은 2개의 9홀 코스로 조합된다.
- **Dynamic Combination**: 18홀 라운드는 '전반(Out)'과 '후반(In)' 코스의 **동적 조합**으로 정의된다.
- **Normalization**: 구장 공식 명칭은 정규화 스크립트를 통해 일관된 포맷으로 변환 및 저장된다.

## 2. Scoring & Analysis Policy (스코어링 및 분석 정책)

### 2.1 Core Scoring Rules

- **Total Score (총점)**: 모든 홀의 `stroke` 값의 단순 합계.
- **Relative Score (상대 스코어)**: `총점 - 총 Par`. 오버(+), 언더(-), 이븐(E)으로 시각화.
- **GIR (Green In Regulation)**: `(stroke - putt) <= (par - 2)`를 만족할 경우 성공으로 판정.
- **Penalty Logic**: OB 및 해저드 버튼은 통계용이며, **총 타수에 자동으로 합산되지 않는다.** 사용자가 직접 조정해야 한다.

### 2.2 Advanced Analysis

- **Estimated Handicap (간이 핸디캡)**:
  - **기준**: 최근 20경기 중 성적이 좋은 상위 25%(최대 5경기) 데이터 기반.
  - **계산**: `(Score - 72) * 0.96` 가중치 평균. (최소 5경기 수렴 요건)
- **Miss Shot Patterns**:
  - 홀당 최대 2개 패턴 선택 가능.
  - **지능형 자동화**: 퍼트 3개 이상 시 '쓰리퍼트' 자동 추가. 선입선출(FIFO) 로직 적용.

## 3. Data Integrity & Validation (데이터 무결성 검증)

모든 구장 데이터는 데이터베이스 진입 전 **검증 엔진(`validateClubData.ts`)**을 100% 통과해야 한다.

- **Validation Rules**:
  - 코스당 정확히 **9홀**.
  - 총 Par 합계는 **정확히 36**.
  - 홀 번호 순차성 (1-9) 엄격 준수.
  - 티별 거리 데이터(양의 정수) 필수 존재.
- **Atomic Bulk Import**: 대량 임포트는 50개 클럽 단위의 청크(Chunk)로 나누어 처리하며, 검증 실패 시 전체 프로세스를 롤백한다.

## 4. Admin & Operational Policy (관리자 및 운영 정책)

- **Authority Policy**: `public.profiles` 테이블의 `role` 컬럼은 권한 관리의 **유일한 진실 원천(SSOT)**이다.
- **Notice Management**: 
  - 인증된 모든 사용자는 공지사항 목록을 조회할 수 있다.
  - 작성/수정/삭제 권한은 오직 `admin` 역할에게만 허용된다.
- **Course Deletion Protocol**: 코스 레코드 삭제 시 참조 무결성을 위해 관련 라운드의 코스 ID를 먼저 `NULL`로 처리한 후 삭제한다.

## 5. Domain Entities (Core Types Overview)

- **Round**: 개별 플레이 기록의 중심 엔티티. (ID, 코스ID, 분석 결과 등)
- **HoleRecord**: 각 홀별 상세 데이터. (HoleIndex, Strokes, Putts, Patterns 등)
- **Club/Course**: 구장 및 코스 마스터 데이터 엔티티.
- **GolfError**: 도메인 수준의 비즈니스 에러 타입 (AUTH_REQUIRED, VALIDATION_FAILED, SYNC_CONFLICT 등).
