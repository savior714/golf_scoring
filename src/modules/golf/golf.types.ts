/**
 * @file src/modules/golf/golf.types.ts
 * @description 골프 도메인 데이터 타입 및 인터페이스 정의
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
    outCourseId?: string; // 전반 코스 UUID (마스터 데이터 연동 시)
    inCourseId?: string;  // 후반 코스 UUID (마스터 데이터 연동 시)
    holes: HoleRecord[]; // 18개 홀 기록
    memo?: string;       // 특이사항
    updatedAt: number;   // 마지막 수정 시간 (Unix Timestamp)
}

export interface RoundSummary {
    totalScore: number;
    totalPar: number;
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

// ============================================================
// [CLUB MASTER] 구장 마스터 계층 타입 (DB 스키마와 1:1 매핑)
// ============================================================

/** 티박스별 전장 정보 (hole_distances 테이블) */
export interface TeeDistance {
    teeColor: string;      // White, Blue, Black, Red 등
    distanceMeter: number;
}

/** 홀 상세 정보 (golf_holes 테이블) */
export interface ClubHoleInfo {
    id: string;
    courseId: string;
    holeNumber: number;    // 코스 내 순서 (1~9)
    par: number;
    handicapIdx?: number;
    distances: TeeDistance[];
}

/** 코스 정보 (golf_courses 테이블) */
export interface ClubCourseInfo {
    id: string;
    clubId: string;
    name: string;          // 예: Lake Course, Mountain Course
    holeCount: number;
    holes: ClubHoleInfo[];
}

/** 구장 마스터 (golf_clubs 테이블) */
export interface ClubInfo {
    id: string;
    name: string;          // 예: 아리스타CC
    address?: string;
    courses: ClubCourseInfo[];
}

/** 구장 선택용 경량 요약 (목록 표시용) */
export interface ClubSummary {
    id: string;
    name: string;
    courseCount: number;
    courses: { id: string; name: string; holeCount: number }[];
}
