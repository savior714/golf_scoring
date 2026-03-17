/**
 * @file src/shared/lib/queryKeys.ts
 * @description TanStack Query의 쿼리 키를 중앙에서 관리하는 상수 팩토리.
 * - 하드코딩된 문자열 리터럴로 인한 런타임 오류 방지 및 캐시 일관성 유지.
 * - SSOT (Single Source of Truth) 원칙 준수.
 */

export const QUERY_KEYS = {
  /** [마스터] 전체 골프장 요약 정보 */
  golf_clubs: () => ['golf_clubs'] as const,

  /** [라운드] 전체 라운드 기록 목록 */
  golf_rounds: () => ['golf_rounds'] as const,

  /** [세션] 현재 진행 중인 라운드의 ID */
  current_round_id: () => ['current_round_id'] as const,

  /** [동기화] 로컬 캐시에서 서버로 전송 대기 중인 항목 개수 */
  sync_queue_count: () => ['sync_queue_count'] as const,

  /** [공지사항] 전체 공지사항 목록 */
  notices: () => ['notices'] as const,
} as const;

export type QueryKeys = typeof QUERY_KEYS;
