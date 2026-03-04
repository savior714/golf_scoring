# Golf Scoring Application - Critical Logic (SSOT)

## 1. 스코어 계산 정책 (Scoring Policy)
*   **Total Score:** 모든 홀의 `stroke` 합산값입니다.
*   **Relative Score:** `Total Score - Total Par`로 계산하며, Over(+)는 빨간색, Under(-)는 초록색, Even(E)은 하얀색/회색으로 시각화합니다.
*   **GIR (Green In Regulation):** `(stroke - putt) <= (par - 2)`인 경우 성공으로 판정합니다.
*   **벌타(OB/Penalty) 처리:** OB와 Penalty 버튼은 통계 기록용이며, **타수(Stroke)에 자동으로 합산되지 않습니다.** 사용자가 룰에 따라 최종 타수를 직접 가감해야 합니다.

## 2. 세션 및 데이터 관리 (Session & Data Management)
*   **진실의 원천 (SSOT):** 모든 데이터는 `AsyncStorage`(@golf_rounds_data)에 저장됩니다.
*   **고유 세션 ID:** 각 라운딩은 `round_Timestamp` 형식의 고유 ID를 가집니다.
*   **액티브 세션 추적:** `@current_round_id` 키를 통해 현재 진행 중인 라운드를 추적하며, 앱 재시작 시 해당 라운드를 자동으로 복구합니다.
*   **코스 변경:** 코스 변경 시 현재 진행 중인 데이터(홀 기록, 현재 홀 번호)를 완전히 초기화하며 새로운 세션 ID를 생성합니다.
*   **클라우드 동기화 (Supabase):** 라운딩 종료 시 로컬 데이터를 Supabase 클라우드에 자동으로 동기화(Upsert)합니다. `rounds`와 `holes` 테이블 간의 관계형 구조를 유지합니다.

## 3. 플랫폼 특화 로직 (Platform-Specific Logic)
*   **카카오톡 대응:** 카카오톡 내장 브라우저 감지 시 `kakaotalk://web/openExternal` 스킴을 사용하여 외부 브라우저(Safari/Chrome)로 강제 전환합니다. 이는 세션 유지 및 데이터 유실 방지를 위한 필수 조치입니다.
*   **PWA 지원:** Vercel 배포 시 `vercel.json` 설정을 통해 SPA 라이팅을 지원하며, 모바일 브라우저의 '홈 화면에 추가' 기능을 통해 앱처럼 작동합니다.

## 4. 아키텍처 (Architecture)
*   **3-Layer Pattern:** 
    *   **Domains:** `golf.ts` (데이터 모델)
    *   **Repositories:** `roundRepository.ts` (AsyncStorage 물리 접근)
    *   **Services/Logic:** `golfService.ts` (통계 계산 및 비즈니스 로직)
*   **UI/UX:** Expo Router를 기반으로 한 파일 시스템 라우팅을 따르며, `(tabs)` 그룹으로 메인 기능을 격리합니다.