import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { clubRepository, roundRepository } from '../golf.repository';
import { golfService } from '../golf.service';
import { ClubSummary, GolfRound, HoleRecord, ClubCourseInfo } from '../golf.types';
import { DEFAULT_SCORES, MISS_SHOT_PATTERNS, SYNC_STATUS, TEE_COLORS } from '../golf.constants';
import { logger } from '../../../shared/utils/logger';

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
  isFairway: boolean;
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
  syncStatus: typeof SYNC_STATUS[keyof typeof SYNC_STATUS];
  pendingSyncCount: number;
}

type GolfRecordAction =
  | { type: 'SET_UI', payload: Partial<Pick<GolfRecordState, 'showHoleGrid' | 'showScoreCard' | 'selectionStep'>> }
  | { type: 'SET_CLUBS', payload: ClubSummary[] }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_SYNC_STATUS', payload: GolfRecordState['syncStatus'] }
  | { type: 'INIT_SESSION', payload: { roundId: string; roundDate: string; tee: string; records: HoleRecord[]; session: ActiveCourseSession | null } }
  | { type: 'SET_TEE_COLOR', payload: string }
  | { type: 'SET_TEMP_SELECTION', payload: Partial<GolfRecordState['tempSelection']> }
  | { type: 'SET_HOLE', payload: { holeNo: number; data: Partial<HoleRecord> } }
  | { type: 'UPDATE_SCORE_FIELD', payload: Partial<Pick<GolfRecordState, 'par' | 'stroke' | 'putt' | 'ob' | 'penalty' | 'missShot' | 'isParEditing' | 'isFairway'>> }
  | { type: 'SET_HOLE_RECORDS', payload: HoleRecord[] }
  | { type: 'SET_PENDING_SYNC_COUNT', payload: number }
  | { type: 'RESET_SESSION' };

const initialState: GolfRecordState = {
  currentHole: 1,
  showHoleGrid: false,
  showScoreCard: false,
  selectionStep: 'club',
  par: DEFAULT_SCORES.PAR,
  stroke: DEFAULT_SCORES.STROKE,
  putt: DEFAULT_SCORES.PUTT,
  ob: DEFAULT_SCORES.OB,
  penalty: DEFAULT_SCORES.PENALTY,
  missShot: MISS_SHOT_PATTERNS.NONE,
  isParEditing: false,
  isFairway: true,
  clubs: [],
  activeSession: null,
  tempSelection: {},
  selectedTee: TEE_COLORS.WHITE,
  holeRecords: [],
  roundId: "",
  roundDate: new Date().toISOString().split('T')[0],
  isLoadingMaster: true,
  syncStatus: SYNC_STATUS.IDLE,
  pendingSyncCount: 0,
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
        currentHole: action.payload.records.length > 0 
          ? Math.max(...action.payload.records.map(r => r.holeNo))
          : 1,
        roundId: action.payload.roundId,
        roundDate: action.payload.roundDate,
        selectedTee: action.payload.tee,
        holeRecords: action.payload.records,
        activeSession: action.payload.session,
        selectionStep: action.payload.session ? state.selectionStep : 'club',
      };
    case 'SET_TEE_COLOR':
      return { ...state, selectedTee: action.payload };
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
    case 'SET_PENDING_SYNC_COUNT':
      return { ...state, pendingSyncCount: action.payload };
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
      const pendingCount = await roundRepository.getSyncQueueCount();
      dispatch({ type: 'SET_CLUBS', payload: clubList });
      dispatch({ type: 'SET_PENDING_SYNC_COUNT', payload: pendingCount });

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
                combinedPars: golfService.calculateCombinedPars(outData.holes, inData.holes),
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
    } catch (e: unknown) {
      logger.error("Initialization failed", e);
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
      const courseComboName = `${outData.name}-${inData.name}`;

      const session: ActiveCourseSession = {
        clubId: club.id,
        clubName: club.name,
        outCourse: outData,
        inCourse: inData,
        combinedPars: golfService.calculateCombinedPars(outData.holes, inData.holes),
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
      Toast.show({
        type: 'success',
        text1: '라운딩 시작',
        text2: `${club.name}에서 라운딩을 시작합니다.`
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      logger.error("startNewRound failed", e);
      Toast.show({
        type: 'error',
        text1: '오류',
        text2: '라운딩 정보를 불러오지 못했습니다.'
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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


  const handleResetSession = useCallback(async () => {
    dispatch({ type: 'RESET_SESSION' });
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
  }, [queryClient]);

  const handleFinishRound = useCallback(async () => {
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
  }, [queryClient]);

  const setPar = useCallback((v: number | ((p: number) => number)) => {
    const nextValue = typeof v === 'function' ? v(state.par) : v;
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { par: nextValue } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [state.par]);

  const setStroke = useCallback((v: number | ((p: number) => number)) => {
    const nextValue = typeof v === 'function' ? v(state.stroke) : v;
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { stroke: nextValue } });
    Haptics.selectionAsync();
  }, [state.stroke]);

  const setPutt = useCallback((v: number | ((p: number) => number)) => {
    const nextValue = typeof v === 'function' ? v(state.putt) : v;
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { putt: nextValue } });
    Haptics.selectionAsync();
  }, [state.putt]);

  const setOb = useCallback((v: number | ((p: number) => number)) => {
    const nextValue = typeof v === 'function' ? v(state.ob) : v;
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { ob: nextValue } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [state.ob]);

  const setPenalty = useCallback((v: number | ((p: number) => number)) => {
    const nextValue = typeof v === 'function' ? v(state.penalty) : v;
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { penalty: nextValue } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [state.penalty]);

  const setMissShot = useCallback((v: string | ((p: string) => string)) => {
    const nextValue = typeof v === 'function' ? v(state.missShot) : v;
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { missShot: nextValue } });
  }, [state.missShot]);

  const setIsParEditing = useCallback((s: boolean) => 
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { isParEditing: s } }), []);
  
  const setIsFairway = useCallback((s: boolean) => 
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { isFairway: s } }), []);

  const setCurrentHole = useCallback((h: number | ((prev: number) => number)) => {
    const nextHole = typeof h === 'function' ? h(state.currentHole) : h;
    dispatch({ type: 'SET_HOLE', payload: { holeNo: nextHole, data: {} } });
  }, [state.currentHole]);

  const setShowHoleGrid = useCallback((s: boolean) => dispatch({ type: 'SET_UI', payload: { showHoleGrid: s } }), []);
  const setShowScoreCard = useCallback((s: boolean) => dispatch({ type: 'SET_UI', payload: { showScoreCard: s } }), []);

  const setSelectionStep = useCallback((s: SelectionStep) => 
    dispatch({ type: 'SET_UI', payload: { selectionStep: s } }), []);

  const setTempSelection = useCallback((p: Partial<GolfRecordState['tempSelection']> | ((prev: GolfRecordState['tempSelection']) => GolfRecordState['tempSelection'])) => {
    const nextValue = typeof p === 'function' ? p(state.tempSelection) : p;
    dispatch({ type: 'SET_TEMP_SELECTION', payload: nextValue });
  }, [state.tempSelection]);

  const setSelectedTee = useCallback((t: string) => 
    dispatch({ type: 'SET_TEE_COLOR', payload: t }), []);

  const handleSaveCurrentHole = useCallback(async () => {
    if (!state.activeSession) return state.holeRecords;
    const { currentHole, par, stroke, putt, ob, penalty, missShot, isFairway, holeRecords, roundId, roundDate, selectedTee, activeSession } = state;
    
    const currentRecord: HoleRecord = {
      holeNo: currentHole,
      par, stroke, putt,
      isFairway,
      isGIR: golfService.isGIR(stroke, putt, par),
      ob, penalty,
      missShot: (missShot === MISS_SHOT_PATTERNS.NONE || !missShot) ? undefined : missShot
    };
    
    const updatedRecords = [...holeRecords.filter(r => r.holeNo !== currentHole), currentRecord].sort((a, b) => a.holeNo - b.holeNo);
    dispatch({ type: 'SET_HOLE_RECORDS', payload: updatedRecords });

    const currentRound: GolfRound = {
      id: roundId,
      date: roundDate,
      courseName: activeSession.clubName,
      courseType: `${activeSession.outCourse.name}-${activeSession.inCourse.name}`,
      outCourseId: activeSession.outCourse.id,
      inCourseId: activeSession.inCourse.id,
      holes: updatedRecords,
      updatedAt: Date.now(),
      teeColor: selectedTee,
      memo: '',
    };
    await roundRepository.saveRound(currentRound);

    dispatch({ type: 'SET_SYNC_STATUS', payload: SYNC_STATUS.SYNCING });
    roundRepository.syncRoundToSupabase(currentRound)
      .then(async (res) => {
        dispatch({ type: 'SET_SYNC_STATUS', payload: res.success ? SYNC_STATUS.SYNCED : SYNC_STATUS.FAILED });
        const pendingCount = await roundRepository.getSyncQueueCount();
        dispatch({ type: 'SET_PENDING_SYNC_COUNT', payload: pendingCount });
        
        if (!res.success) {
          Toast.show({
            type: 'error',
            text1: '동기화 실패',
            text2: '클라우드 저장을 실패했습니다. 나중에 자동 재시도됩니다.'
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      })
      .catch(async () => {
        dispatch({ type: 'SET_SYNC_STATUS', payload: SYNC_STATUS.FAILED });
        const pendingCount = await roundRepository.getSyncQueueCount();
        dispatch({ type: 'SET_PENDING_SYNC_COUNT', payload: pendingCount });
      });

    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    return updatedRecords;
  }, [state, queryClient]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        logger.info('App returned to foreground, retrying pending syncs...');
        await roundRepository.retryPendingSyncs();
        const pendingCount = await roundRepository.getSyncQueueCount();
        dispatch({ type: 'SET_PENDING_SYNC_COUNT', payload: pendingCount });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const actions = useMemo(() => ({
    setCurrentHole,
    setShowHoleGrid,
    setShowScoreCard,
    setPar,
    setStroke,
    setPutt,
    setOb,
    setPenalty,
    setMissShot,
    setIsParEditing,
    setIsFairway,
    setSelectionStep,
    setTempSelection,
    setSelectedTee,
    loadMasterAndSession,
    startNewRound,
    saveCurrentHole: handleSaveCurrentHole,
    resetSession: handleResetSession,
    finishRound: handleFinishRound,
  }), [
    setCurrentHole, setShowHoleGrid, setShowScoreCard,
    setPar, setStroke, setPutt, setOb, setPenalty, setMissShot,
    setIsParEditing, setIsFairway, setSelectionStep, setTempSelection, setSelectedTee,
    loadMasterAndSession, startNewRound, handleSaveCurrentHole, handleResetSession, handleFinishRound
  ]);

  return {
    ...state,
    ...actions
  };
}