import {
    DEFAULT_SCORES,
    MISS_SHOT_PATTERNS,
    SYNC_STATUS,
    TEE_COLORS,
    ClubCourseInfo,
    ClubSummary,
    HoleRecord,
} from "@/src/modules/golf/domain";

// ── 타입 정의 ────────────────────────────────────────────────

export interface ActiveCourseSession {
  clubId: string;
  clubName: string;
  outCourse: ClubCourseInfo;
  inCourse: ClubCourseInfo;
  combinedPars: number[];
  availableTees: string[];
}

export type SelectionStep = "club" | "out" | "in" | "tee";

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
  syncStatus: (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];
}

export type GolfRecordAction =
  | {
      type: "SET_UI";
      payload: Partial<
        Pick<
          GolfRecordState,
          "showHoleGrid" | "showScoreCard" | "selectionStep"
        >
      >;
    }
  | { type: "SET_MANUAL_LOADING"; payload: boolean }
  | { type: "SET_SYNC_STATUS"; payload: GolfRecordState["syncStatus"] }
  | {
      type: "INIT_SESSION";
      payload: {
        roundId: string;
        roundDate: string;
        tee: string;
        records: HoleRecord[];
        session: ActiveCourseSession | null;
      };
    }
  | { type: "SET_TEE_COLOR"; payload: string }
  | {
      type: "SET_TEMP_SELECTION";
      payload:
        | Partial<GolfRecordState["tempSelection"]>
        | ((
            prev: GolfRecordState["tempSelection"],
          ) => GolfRecordState["tempSelection"]);
    }
  | { type: "SET_HOLE"; payload: { holeNo: number; data: Partial<HoleRecord> } }
  | { type: "SET_HOLE_RECORDS"; payload: HoleRecord[] }
  | {
      type: "UPDATE_SCORE_FIELD";
      payload: Partial<{
        [K in keyof GolfRecordState]:
          | GolfRecordState[K]
          | ((prev: GolfRecordState[K]) => GolfRecordState[K]);
      }>;
    }
  | { type: "RESET_SESSION" };

// ── 초기 상태 ────────────────────────────────────────────────

export const initialState: GolfRecordState = {
  currentHole: 1,
  showHoleGrid: false,
  showScoreCard: false,
  selectionStep: "club",
  par: DEFAULT_SCORES.PAR,
  stroke: DEFAULT_SCORES.STROKE,
  putt: DEFAULT_SCORES.PUTT,
  ob: DEFAULT_SCORES.OB,
  penalty: DEFAULT_SCORES.PENALTY,
  missShot: MISS_SHOT_PATTERNS.NONE,
  isParEditing: false,
  activeSession: null,
  tempSelection: {},
  selectedTee: TEE_COLORS.WHITE,
  holeRecords: [],
  roundId: "",
  roundDate: new Date().toISOString().split("T")[0],
  isManualLoading: true,
  syncStatus: SYNC_STATUS.IDLE,
};

// ── Reducer ──────────────────────────────────────────────────

export function golfRecordReducer(
  state: GolfRecordState,
  action: GolfRecordAction,
): GolfRecordState {
  switch (action.type) {
    case "SET_UI":
      return { ...state, ...action.payload };
    case "SET_MANUAL_LOADING":
      return { ...state, isManualLoading: action.payload };
    case "SET_SYNC_STATUS":
      return { ...state, syncStatus: action.payload };
    case "INIT_SESSION":
      return {
        ...state,
        currentHole:
          action.payload.records.length > 0
            ? Math.max(...action.payload.records.map((r) => r.holeNo))
            : 1,
        roundId: action.payload.roundId,
        roundDate: action.payload.roundDate,
        selectedTee: action.payload.tee,
        holeRecords: action.payload.records,
        activeSession: action.payload.session,
        selectionStep: action.payload.session ? "club" : state.selectionStep,
        isManualLoading: false,
      };
    case "SET_TEE_COLOR":
      return { ...state, selectedTee: action.payload };
    case "SET_TEMP_SELECTION":
      return {
        ...state,
        tempSelection:
          typeof action.payload === "function"
            ? (
                action.payload as (
                  prev: GolfRecordState["tempSelection"],
                ) => GolfRecordState["tempSelection"]
              )(state.tempSelection)
            : { ...state.tempSelection, ...action.payload },
      };
    case "SET_HOLE":
      return {
        ...state,
        currentHole: action.payload.holeNo,
        ...action.payload.data,
        isParEditing: false,
      };
    case "UPDATE_SCORE_FIELD": {
      const mutable = { ...state } as unknown as Record<string, unknown>;
      const current = state as unknown as Record<string, unknown>;
      Object.entries(action.payload).forEach(([key, value]) => {
        mutable[key] =
          typeof value === "function"
            ? (value as (prev: unknown) => unknown)(current[key])
            : value;
      });
      return mutable as unknown as GolfRecordState;
    }
    case "SET_HOLE_RECORDS":
      return { ...state, holeRecords: action.payload };
    case "RESET_SESSION":
      return { ...initialState, isManualLoading: false };
    default:
      return state;
  }
}
