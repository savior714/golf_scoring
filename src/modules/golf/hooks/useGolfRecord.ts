import { useCallback, useEffect, useReducer } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { clubRepository, roundRepository } from '../golf.repository';
import { golfService } from '../golf.service';
import { ClubSummary, GolfRound, HoleRecord, ClubCourseInfo } from '../golf.types';

export interface ActiveCourseSession {
  clubId: string;
  clubName: string;
  outCourse: ClubCourseInfo;
  inCourse: ClubCourseInfo;
  combinedPars: number[];
  availableTees: string[];
}

export type SelectionStep = 'club' | 'out' | 'in' | 'tee';

interface GolfRecordState {
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
  clubs: ClubSummary[];
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
  isLoadingMaster: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'failed';
}

type GolfRecordAction =
  | { type: 'SET_UI', payload: Partial<Pick<GolfRecordState, 'showHoleGrid' | 'showScoreCard' | 'selectionStep'>> }
  | { type: 'SET_CLUBS', payload: ClubSummary[] }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_SYNC_STATUS', payload: GolfRecordState['syncStatus'] }
  | { type: 'INIT_SESSION', payload: { roundId: string; roundDate: string; tee: string; records: HoleRecord[]; session: ActiveCourseSession | null } }
  | { type: 'SET_TEMP_SELECTION', payload: Partial<GolfRecordState['tempSelection']> }
  | { type: 'SET_HOLE', payload: { holeNo: number; data: Partial<HoleRecord> } }
  | { type: 'UPDATE_SCORE_FIELD', payload: Partial<Pick<GolfRecordState, 'par' | 'stroke' | 'putt' | 'ob' | 'penalty' | 'missShot' | 'isParEditing'>> }
  | { type: 'SET_HOLE_RECORDS', payload: HoleRecord[] }
  | { type: 'RESET_SESSION' };

const initialState: GolfRecordState = {
  currentHole: 1,
  showHoleGrid: false,
  showScoreCard: false,
  selectionStep: 'club',
  par: 4,
  stroke: 4,
  putt: 2,
  ob: 0,
  penalty: 0,
  missShot: '없음',
  isParEditing: false,
  clubs: [],
  activeSession: null,
  tempSelection: {},
  selectedTee: 'White',
  holeRecords: [],
  roundId: "",
  roundDate: new Date().toISOString().split('T')[0],
  isLoadingMaster: true,
  syncStatus: 'idle',
};

function golfRecordReducer(state: GolfRecordState, action: GolfRecordAction): GolfRecordState {
  switch (action.type) {
    case 'SET_UI':
      return { ...state, ...action.payload };
    case 'SET_CLUBS':
      return { ...state, clubs: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoadingMaster: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'INIT_SESSION':
      return {
        ...state,
        roundId: action.payload.roundId,
        roundDate: action.payload.roundDate,
        selectedTee: action.payload.tee,
        holeRecords: action.payload.records,
        activeSession: action.payload.session,
        selectionStep: action.payload.session ? state.selectionStep : 'club',
      };
    case 'SET_TEMP_SELECTION':
      return { ...state, tempSelection: { ...state.tempSelection, ...action.payload } };
    case 'SET_HOLE':
      return {
        ...state,
        currentHole: action.payload.holeNo,
        ...action.payload.data,
        isParEditing: false,
      };
    case 'UPDATE_SCORE_FIELD':
      return { ...state, ...action.payload };
    case 'SET_HOLE_RECORDS':
      return { ...state, holeRecords: action.payload };
    case 'RESET_SESSION':
      return { ...initialState, clubs: state.clubs, isLoadingMaster: false };
    default:
      return state;
  }
}

export function useGolfRecord(mode?: string) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(golfRecordReducer, initialState);

  // Load Initial Data
  const loadMasterAndSession = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const clubList = await clubRepository.getAllClubsSummary();
      await roundRepository.retryPendingSyncs();
      dispatch({ type: 'SET_CLUBS', payload: clubList });

      const savedId = await roundRepository.getCurrentRoundId();
      if (savedId && mode !== 'new') {
        const rounds = await roundRepository.getAllRounds();
        const currentRound = rounds.find(r => r.id === savedId);

        if (currentRound) {
          let session: ActiveCourseSession | null = null;
          if (currentRound.outCourseId && currentRound.inCourseId) {
            const [outData, inData] = await Promise.all([
              clubRepository.getCourseWithHoles(currentRound.outCourseId),
              clubRepository.getCourseWithHoles(currentRound.inCourseId)
            ]);

            if (outData && inData) {
              const outTees = outData.holes[0]?.distances.map(d => d.teeColor) || [];
              const inTees = inData.holes[0]?.distances.map(d => d.teeColor) || [];
              const commonTees = outTees.filter(t => inTees.includes(t));

              session = {
                clubId: outData.clubId,
                clubName: currentRound.courseName,
                outCourse: outData,
                inCourse: inData,
                combinedPars: [...outData.holes.map(h => h.par), ...inData.holes.map(h => h.par)],
                availableTees: commonTees.length > 0 ? commonTees : ['White'],
              };
            }
          }
          dispatch({
            type: 'INIT_SESSION',
            payload: {
              roundId: savedId,
              roundDate: currentRound.date,
              tee: currentRound.teeColor || 'White',
              records: currentRound.holes || [],
              session
            }
          });
        } else {
          dispatch({ type: 'RESET_SESSION' });
        }
      } else {
        dispatch({ type: 'RESET_SESSION' });
      }
    } catch (e) {
      console.error("Initialization failed", e);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [mode]);

  // Start New Round
  const startNewRound = async (tee: string) => {
    const { tempSelection, roundId, roundDate, holeRecords } = state;
    if (!tempSelection.club || !tempSelection.outCourse || !tempSelection.inCourse) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { club, outCourse, inCourse } = tempSelection;
      const [outData, inData] = await Promise.all([
        clubRepository.getCourseWithHoles(outCourse.id),
        clubRepository.getCourseWithHoles(inCourse.id)
      ]);

      if (!outData || !inData) throw new Error("Course load failed");

      const targetId = roundId || "round_" + Date.now();
      const courseComboName = ${outData.name}-;

      const session: ActiveCourseSession = {
        clubId: club.id,
        clubName: club.name,
        outCourse: outData,
        inCourse: inData,
        combinedPars: [...outData.holes.map(h => h.par), ...inData.holes.map(h => h.par)],
        availableTees: tee ? [tee] : ['White'],
      };

      const initialRound: GolfRound = {
        id: targetId,
        date: roundId ? roundDate : new Date().toISOString().split('T')[0],
        courseName: club.name,
        courseType: courseComboName,
        outCourseId: outCourse.id,
        inCourseId: inCourse.id,
        holes: roundId ? holeRecords : [],
        updatedAt: Date.now(),
        teeColor: tee,
        memo: '',
      };

      await Promise.all([
        roundRepository.setCurrentRoundId(targetId),
        roundRepository.saveRound(initialRound)
      ]);

      dispatch({
        type: 'INIT_SESSION',
        payload: {
          roundId: targetId,
          roundDate: initialRound.date,
          tee: tee,
          records: initialRound.holes,
          session
        }
      });
      queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
      queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    } catch (e) {
      Alert.alert("Error", "Failed to start round.");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sync hole data when switching holes
  useEffect(() => {
    if (state.activeSession) {
      const data = golfService.getHoleData(state.currentHole, state.holeRecords, state.activeSession.combinedPars);
      dispatch({ type: 'SET_HOLE', payload: { holeNo: state.currentHole, data } });
    }
  }, [state.currentHole, state.activeSession, state.holeRecords]);

  // Auto Three-putt logic
  useEffect(() => {
    if (!state.activeSession) return;
    const nextMissShot = golfService.updateMissShotPatterns(state.missShot, state.putt);
    if (nextMissShot !== state.missShot) {
      dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { missShot: nextMissShot } });
    }
  }, [state.putt, state.activeSession, state.missShot]);

  const saveCurrentHole = async () => {
    if (!state.activeSession) return state.holeRecords;
    const { currentHole, par, stroke, putt, ob, penalty, missShot, holeRecords, roundId, roundDate, selectedTee, activeSession } = state;
    
    const currentRecord: HoleRecord = {
      holeNo: currentHole,
      par, stroke, putt,
      isFairway: true,
      isGIR: golfService.isGIR(stroke, putt, par),
      ob, penalty,
      missShot: (missShot === '없음' || !missShot) ? undefined : missShot
    };
    
    const updatedRecords = [...holeRecords.filter(r => r.holeNo !== currentHole), currentRecord].sort((a, b) => a.holeNo - b.holeNo);
    dispatch({ type: 'SET_HOLE_RECORDS', payload: updatedRecords });

    const currentRound: GolfRound = {
      id: roundId,
      date: roundDate,
      courseName: activeSession.clubName,
      courseType: ${activeSession.outCourse.name}-,
      outCourseId: activeSession.outCourse.id,
      inCourseId: activeSession.inCourse.id,
      holes: updatedRecords,
      updatedAt: Date.now(),
      teeColor: selectedTee,
      memo: '',
    };
    await roundRepository.saveRound(currentRound);

    // Background Sync
    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    roundRepository.syncRoundToSupabase(currentRound)
      .then(res => {
        dispatch({ type: 'SET_SYNC_STATUS', payload: res.success ? 'synced' : 'failed' });
        if (!res.success) console.error('[Sync Failed]', res.error);
      })
      .catch(e => {
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'failed' });
        console.error('[Sync Error]', e);
      });

    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    return updatedRecords;
  };

  const resetSession = async () => {
    dispatch({ type: 'RESET_SESSION' });
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
  };

  const finishRound = async () => {
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
  };

  return {
    ...state,
    // Dispatch Wrappers
    setCurrentHole: (h: number) => dispatch({ type: 'SET_HOLE', payload: { holeNo: h, data: {} } }),
    setShowHoleGrid: (s: boolean) => dispatch({ type: 'SET_UI', payload: { showHoleGrid: s } }),
    setShowScoreCard: (s: boolean) => dispatch({ type: 'SET_UI', payload: { showScoreCard: s } }),
    setPar: (v: number) => dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { par: v } }),
    setStroke: (v: number) => dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { stroke: v } }),
    setPutt: (v: number) => dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { putt: v } }),
    setOb: (v: number) => dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { ob: v } }),
    setPenalty: (v: number) => dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { penalty: v } }),
    setMissShot: (v: string) => dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { missShot: v } }),
    setIsParEditing: (s: boolean) => dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { isParEditing: s } }),
    setSelectionStep: (s: SelectionStep) => dispatch({ type: 'SET_UI', payload: { selectionStep: s } }),
    setTempSelection: (p: any) => dispatch({ type: 'SET_TEMP_SELECTION', payload: p }),
    setSelectedTee: (t: string) => dispatch({ type: 'INIT_SESSION', payload: { ...state, tee: t, session: state.activeSession, records: state.holeRecords } }),
    
    // Actions
    loadMasterAndSession,
    startNewRound,
    saveCurrentHole,
    resetSession,
    finishRound,
  };
}