import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clubRepository, roundRepository } from '../golf.repository';
import { golfService } from '../golf.service';
import { logger } from '../../../shared/utils/logger';
import {
  ActiveCourseSession,
  GolfRecordState,
  SelectionStep,
  golfRecordReducer,
  initialState,
} from './golfRecord.state';
import { useGolfSession } from './useGolfSession';
import { useRoundActions } from './useRoundActions';

export type { ActiveCourseSession, SelectionStep };

export function useGolfRecord(mode?: string) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(golfRecordReducer, initialState);

  // 1. Data Queries
  const { data: clubs = [] } = useQuery({
    queryKey: ['golf_clubs'],
    queryFn: ({ signal }) => clubRepository.getAllClubsSummary(signal),
    staleTime: 1000 * 60 * 60, // 1 hour: 마스터 데이터는 자주 바뀌지 않음
  });

  // current_round_id, golf_rounds: loadMasterAndSession에서 직접 읽으므로
  // React Query 캐시 갱신만 유지 (isLoading은 스피너 트리거로 사용 안 함)
  useQuery({
    queryKey: ['current_round_id'],
    queryFn: () => roundRepository.getCurrentRoundId(),
    staleTime: 1000 * 60,
  });

  useQuery({
    queryKey: ['golf_rounds'],
    queryFn: () => roundRepository.getAllRounds(),
    staleTime: 1000 * 60,
  });

  const { data: syncQueueCount = 0 } = useQuery({
    queryKey: ['sync_queue_count'],
    queryFn: () => roundRepository.getSyncQueueCount(),
  });

  // 렌더링과 동시에 최신 state를 Ref에 동기화 (비동기 클로저의 Stale State 접근 방지)
  const stateRef = useRef(state);
  stateRef.current = state;

  // Lifecycle Guard: unmounted state update prevention
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      logger.info('[useGolfRecord] UNMOUNTED');
    };
  }, []);

  // mode prop을 Ref로 동기화 — URL 파라미터 변경 시 loadMasterAndSession이 재생성되지 않도록 함
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; });

  // 2. 세션 복원 훅
  const { loadMasterAndSession } = useGolfSession({ dispatch, stateRef, queryClient, modeRef, isMounted });

  // 3. 라운드 액션 훅
  const { startNewRound, saveCurrentHole, finishRound, resetSession } = useRoundActions({
    dispatch,
    stateRef,
    queryClient,
    isMounted,
  });

  // 4. [Optimization] Remove redundant useEffect and combine into handlers
  // Sync hole data when switching holes — Moved into setCurrentHole for performance
  /*
  useEffect(() => {
    if (state.activeSession) {
      const data = golfService.getHoleData(state.currentHole, state.holeRecords, state.activeSession.combinedPars);
      dispatch({ type: 'SET_HOLE', payload: { holeNo: state.currentHole, data } });
    }
  }, [state.currentHole, state.activeSession, state.holeRecords]);
  */

  // 5. [Optimization] Auto Three-putt logic — Moved into setPutt for performance
  /*
  useEffect(() => {
    if (!state.activeSession) return;
    const nextMissShot = golfService.updateMissShotPatterns(state.missShot, state.putt);
    if (nextMissShot !== state.missShot && isMounted.current) {
      dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { missShot: nextMissShot } });
    }
  }, [state.putt, state.activeSession, state.missShot]);
  */

  // 6. Score setters
  const setPar = useCallback((v: number | ((p: number) => number)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { par: v } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [dispatch]);

  const setStroke = useCallback((v: number | ((p: number) => number)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { stroke: v } });
    Haptics.selectionAsync();
  }, [dispatch]);

  const setPutt = useCallback((v: number | ((p: number) => number)) => {
    const nextPutt = typeof v === 'function' ? v(stateRef.current.putt) : v;
    const payload: Partial<GolfRecordState> = { putt: nextPutt };

    // Auto Three-putt logic merged here
    if (stateRef.current.activeSession) {
      const nextMissShot = golfService.updateMissShotPatterns(stateRef.current.missShot, nextPutt);
      if (nextMissShot !== stateRef.current.missShot) {
        payload.missShot = nextMissShot;
      }
    }

    dispatch({ type: 'UPDATE_SCORE_FIELD', payload });
    Haptics.selectionAsync();
  }, [dispatch]);

  const setOb = useCallback((v: number | ((p: number) => number)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { ob: v } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [dispatch]);

  const setPenalty = useCallback((v: number | ((p: number) => number)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { penalty: v } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [dispatch]);

  const setMissShot = useCallback((v: string | ((p: string) => string)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { missShot: v } });
  }, [dispatch]);

  const setIsParEditing = useCallback((s: boolean) =>
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { isParEditing: s } }), [dispatch]);

  const setCurrentHole = useCallback((h: number | ((prev: number) => number)) => {
    const nextHole = typeof h === 'function' ? h(stateRef.current.currentHole) : h;
    
    // Sync hole data merged here
    if (stateRef.current.activeSession) {
      const data = golfService.getHoleData(nextHole, stateRef.current.holeRecords, stateRef.current.activeSession.combinedPars);
      dispatch({ type: 'SET_HOLE', payload: { holeNo: nextHole, data } });
    } else {
      dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { currentHole: nextHole } });
    }
  }, [dispatch]);

  const setShowHoleGrid = useCallback((s: boolean) =>
    dispatch({ type: 'SET_UI', payload: { showHoleGrid: s } }), [dispatch]);

  const setShowScoreCard = useCallback((s: boolean) =>
    dispatch({ type: 'SET_UI', payload: { showScoreCard: s } }), [dispatch]);

  const setSelectionStep = useCallback((s: SelectionStep) =>
    dispatch({ type: 'SET_UI', payload: { selectionStep: s } }), [dispatch]);

  const setTempSelection = useCallback((p: Partial<GolfRecordState['tempSelection']> | ((prev: GolfRecordState['tempSelection']) => GolfRecordState['tempSelection'])) => {
    dispatch({ type: 'SET_TEMP_SELECTION', payload: p });
  }, [dispatch]);

  const setSelectedTee = useCallback((t: string) =>
    dispatch({ type: 'SET_TEE_COLOR', payload: t }), [dispatch]);

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
    setSelectionStep,
    setTempSelection,
    setSelectedTee,
    loadMasterAndSession,
    startNewRound,
    saveCurrentHole,
    resetSession,
    finishRound,
  }), [
    setCurrentHole, setShowHoleGrid, setShowScoreCard,
    setPar, setStroke, setPutt, setOb, setPenalty, setMissShot,
    setIsParEditing, setSelectionStep, setTempSelection, setSelectedTee,
    loadMasterAndSession, startNewRound, saveCurrentHole, resetSession, finishRound,
  ]);

  const { filledHoles, progressPercentage } = useMemo(() => {
    const filled = state.holeRecords.filter(h => h.stroke > 0).length;
    return {
      filledHoles: filled,
      progressPercentage: (filled / 18) * 100,
    };
  }, [state.holeRecords]);

  // SSOT: 반환 객체의 참조 안정성 확보 (Premium Performance)
  const memoizedState = useMemo(() => ({
    ...state,
    clubs,
    isLoadingMaster: state.isManualLoading,
    pendingSyncCount: syncQueueCount,
  }), [state, clubs, syncQueueCount]);

  return useMemo(() => ({
    state: memoizedState,
    actions,
    filledHoles,
    progressPercentage,
  }), [memoizedState, actions, filledHoles, progressPercentage]);
}
