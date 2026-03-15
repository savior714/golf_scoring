/**
 * @file src/modules/golf/golf.types.ts
 * @description Golf domain data types and interface definitions.
 */

export interface HoleRecord {
    holeNo: number;      // 1 ~ 18
    par: number;         // 3, 4, 5, 6, 7
    stroke: number;      // Total strokes for the hole
    putt: number;        // Putt count
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
    obCount: number;
    penaltyCount: number; // Total hazard/penalty count
    missShots: Record<string, number>; // Total miss shot type count
    ironMissShots: Record<string, number>; // Par 3 (Iron)
    driverMissShots: Record<string, number>; // Par 4/5/6/7 (Driver/Wood)
}

/**
 * Advanced statistics for trend analysis
 */
export interface AdvancedStats {
    date: string;
    totalScore: number;
    avgPutt: number;
    girRate: number;
    missShots: Record<string, number>;
    ironMissShots: Record<string, number>;
    driverMissShots: Record<string, number>;
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
    isVerified?: boolean;
}

/** Lightweight summary for club selection (list display) */
export interface ClubSummary {
    id: string;
    name: string;
    courseCount: number;
    courses: { id: string; name: string; holeCount: number }[];
    isVerified?: boolean;
}

// ============================================================
// [ERROR SCHEMA] Domain error definitions
// ============================================================

// ============================================================
// [UI & STATE] App state and UI control types
// ============================================================

export interface ActiveCourseSession {
    clubId: string;
    clubName: string;
    outCourse: ClubCourseInfo;
    inCourse: ClubCourseInfo;
    combinedPars: number[];
    availableTees: string[];
}

export type SelectionStep = 'club' | 'out' | 'in' | 'tee';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

export interface GolfRecordState {
    currentHole: number;
    showHoleGrid: boolean;
    showScoreCard: boolean;
    selectionStep: SelectionStep;
    par: number;
    stroke: number;
    putt: number;
    ob: number;
    penalty: number;
    missShot: string;
    isParEditing: boolean;
    activeSession: ActiveCourseSession | null;
    tempSelection: {
        club?: ClubSummary;
        outCourse?: { id: string; name: string };
        inCourse?: { id: string; name: string };
    };
    selectedTee: string;
    holeRecords: HoleRecord[];
    roundId: string;
    roundDate: string;
    isManualLoading: boolean;
    syncStatus: SyncStatus;
}

export interface GolfState extends GolfRecordState {
    clubs: ClubSummary[];
    isLoadingMaster: boolean;
    pendingSyncCount: number;
}

export interface GolfActions {
    setCurrentHole: (h: number | ((prev: number) => number)) => void;
    setShowHoleGrid: (s: boolean) => void;
    setShowScoreCard: (s: boolean) => void;
    setPar: (v: number | ((p: number) => number)) => void;
    setStroke: (v: number | ((p: number) => number)) => void;
    setPutt: (v: number | ((p: number) => number)) => void;
    setOb: (v: number | ((p: number) => number)) => void;
    setPenalty: (v: number | ((p: number) => number)) => void;
    setMissShot: (v: string | ((p: string) => string)) => void;
    setIsParEditing: (s: boolean) => void;
    setSelectionStep: (s: SelectionStep) => void;
    setTempSelection: (p: Partial<GolfRecordState['tempSelection']> | ((prev: GolfRecordState['tempSelection']) => GolfRecordState['tempSelection'])) => void;
    setSelectedTee: (t: string) => void;
    loadMasterAndSession: () => Promise<void>;
    startNewRound: (tee: string) => Promise<void>;
    saveCurrentHole: () => Promise<HoleRecord[]>;
    resetSession: () => void;
    finishRound: () => Promise<void>;
}

export type GolfErrorCode =
    | 'AUTH_REQUIRED'
    | 'VALIDATION_FAILED'
    | 'SYNC_CONFLICT'
    | 'STORAGE_ERROR';

export interface GolfDomainError {
    code: GolfErrorCode;
    message: string;
    details?: unknown;
}
