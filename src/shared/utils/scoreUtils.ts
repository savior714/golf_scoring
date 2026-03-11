/**
 * @file src/shared/utils/scoreUtils.ts
 * @description 스코어 관련 공통 유틸리티 (SSOT 준수)
 */

/**
 * 상대 점수에 따른 색상 코드를 반환합니다.
 * SSOT: Over(+) -> Red (#FF6B6B), Under(-) -> Green (#38E54D), Even -> Gray/White
 * 
 * @param relative 상대 스코어 (stroke - par)
 * @param isDarkBackground 배경이 어두운지 여부 (기본값: false)
 * @returns HEX 색상 코드
 */
export const getScoreColor = (relative: number, isDarkBackground = false): string => {
    if (relative > 0) return '#FF6B6B'; // Red
    if (relative < 0) return '#38E54D'; // Green
    
    // Even
    return isDarkBackground ? '#FFFFFF' : '#6c757d';
};

/**
 * 상대 점수에 따른 부드러운 배경색 코드를 반환합니다. (HistoryItem 등 라이트 테마 배지용)
 * 
 * @param relative 상대 스코어
 * @returns HEX 색상 코드
 */
export const getScoreBackgroundColor = (relative: number): string => {
    if (relative > 0) return '#FFF0F0';
    if (relative < 0) return '#E8FBF0';
    return '#F1F3F5';
};

/**
 * 상대 점수를 텍스트로 변환합니다. (예: +1, -2, E)
 *
 * @param relative 상대 스코어
 * @returns 포맷팅된 문자열
 */
export const formatRelativeScore = (relative: number): string => {
    if (relative > 0) return `+${relative}`;
    if (relative < 0) return `${relative}`;
    return 'E';
};

/**
 * 총 타수에 따른 색상 코드를 반환합니다.
 * < 80 → 파랑, 80~89 → 초록, 90~99 → 노랑, 100~109 → 주황, 110+ → 빨강
 *
 * @param totalScore 총 타수
 * @returns HEX 색상 코드
 */
export const getTotalScoreColor = (totalScore: number): string => {
    if (totalScore < 80)  return '#4A9EFF'; // Blue
    if (totalScore < 90)  return '#38E54D'; // Green
    if (totalScore < 100) return '#FFD700'; // Yellow
    if (totalScore < 110) return '#FF8C00'; // Orange
    return '#FF6B6B';                       // Red
};
