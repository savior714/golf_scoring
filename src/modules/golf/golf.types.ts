/**
 * @file src/modules/golf/golf.types.ts
 * @description Golf domain data types and interface definitions.
 */

export interface HoleRecord {
    holeNo: number;      // 1 ~ 18
    par: number;         // 3, 4, 5, 6, 7
    stroke: number;      // Total strokes for the hole
    putt: number;        // Putt count
    isFairway: boolean;  // Whether the fairway was hit
    isGIR: boolean;
    ob: number;          // OB count
    penalty: number;     // Hazard/Penalty count
    missShot?: string;   // Miss shot pattern (e.g., Slice, Hook)
}

export interface GolfRound {
    id: string;          // UUID or Timestamp
    date: string;        // Round date (YYYY-MM-DD)
    courseName: string;  // Club name
    courseType: string;  // Course name (e.g., Sun-Point)
    teeColor?: string;   // Tee color (Black, Blue, White, Red, Gold, Green)
    outCourseId?: string; // Front 9 course UUID (linked to master data)
    inCourseId?: string;  // Back 9 course UUID (linked to master data)
    holes: HoleRecord[]; // 18 hole records
    memo?: string;       // Notes
    updatedAt: number;   // Last modified timestamp (Unix Timestamp)
}

export interface RoundSummary {
    totalScore: number;
    totalPar: number;
    totalPutt: number;
    girRate: number;     // In percentage (%)
    eagles: number;      // Eagle or better
    birdies: number;
    pars: number;
    bogeys: number;      // Bogey
    doubleBogeys: number;
    tripleBogeysOrWorse: number;
    obCount: number;
    penaltyCount: number; // Total hazard/penalty count
    missShots: Record<string, number>; // Miss shot type count
}

// ============================================================
// [CLUB MASTER] Course master hierarchy types (1:1 mapping with DB schema)
// ============================================================

/** Distance info per tee box (hole_distances table) */
export interface TeeDistance {
    teeColor: string;      // White, Blue, Black, Red, etc.
    distanceMeter: number;
}

/** Hole details (golf_holes table) */
export interface ClubHoleInfo {
    id: string;
    courseId: string;
    holeNumber: number;    // Sequence within course (1~9)
    par: number;
    handicapIdx?: number;
    distances: TeeDistance[];
}

/** Course info (golf_courses table) */
export interface ClubCourseInfo {
    id: string;
    clubId: string;
    name: string;          // e.g., Lake Course, Mountain Course
    holeCount: number;
    holes: ClubHoleInfo[];
}

/** Club master (golf_clubs table) */
export interface ClubInfo {
    id: string;
    name: string;          // e.g., Arista CC
    address?: string;
    courses: ClubCourseInfo[];
}

/** Lightweight summary for club selection (list display) */
export interface ClubSummary {
    id: string;
    name: string;
    courseCount: number;
    courses: { id: string; name: string; holeCount: number }[];
}
