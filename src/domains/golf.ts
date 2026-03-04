/**
 * @file src/domains/golf.ts
 * @description 골프 라운딩 및 홀 기록에 대한 도메인 모델 정의
 */

export interface HoleRecord {
    holeNo: number;      // 1 ~ 18
    par: number;         // 3, 4, 5
    stroke: number;      // 해당 홀 총 타수
    putt: number;        // 퍼트 수
    isFairway: boolean;  // 페어웨이 안착 여부
    isGIR: boolean;
    ob: number;          // OB 횟수
    penalty: number;     // 해저드/벌타 수
    missShot?: string;   // 주요 미스샷 패턴 (슬라이스, 훅 등)
}

export interface GolfRound {
    id: string;          // UUID 또는 Timestamp
    date: string;        // 라운딩 날짜 (YYYY-MM-DD)
    courseName: string;  // 구장명 (ex: 써닝포인트)
    courseType: string;  // 코스명 (ex: Sun-Point)
    holes: HoleRecord[]; // 18개 홀 기록
    memo?: string;       // 특이사항
}

export interface RoundSummary {
    totalScore: number;
    totalPutt: number;
    girRate: number;     // % 단위
    eagles: number;      // 이글 이상
    birdies: number;
    pars: number;
    bogeys: number;      // 보기
    doubles: number;     // 더블 보기 이하
    obCount: number;
    penaltyCount: number; // 해저드/벌타 합산
    missShots: Record<string, number>; // 미스샷 종류별 카운트 표기
}
