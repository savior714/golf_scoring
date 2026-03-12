import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clubRepository, roundRepository } from '../golf.repository';
import { supabase } from '../../../shared/lib/supabase';
import { golfService } from '../golf.service';
import { ClubSummary, GolfRound, HoleRecord, ClubCourseInfo } from '../golf.types';
import { DEFAULT_SCORES, GOLF_LIMITS, MISS_SHOT_PATTERNS, SYNC_STATUS, TEE_COLORS } from '../golf.constants';
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
  syncStatus: typeof SYNC_STATUS[keyof typeof SYNC_STATUS];
}

type GolfRecordAction =
  | { type: 'SET_UI', payload: Partial<Pick<GolfRecordState, 'showHoleGrid' | 'showScoreCard' | 'selectionStep'>> }
  | { type: 'SET_MANUAL_LOADING', payload: boolean }
  | { type: 'SET_SYNC_STATUS', payload: GolfRecordState['syncStatus'] }
  | { type: 'INIT_SESSION', payload: { roundId: string; roundDate: string; tee: string; records: HoleRecord[]; session: ActiveCourseSession | null } }
  | { type: 'SET_TEE_COLOR', payload: string }
  | { type: 'SET_TEMP_SELECTION', payload: Partial<GolfRecordState['tempSelection']> | ((prev: GolfRecordState['tempSelection']) => GolfRecordState['tempSelection']) }
  | { type: 'SET_HOLE', payload: { holeNo: number; data: Partial<HoleRecord> } }
  | { type: 'SET_HOLE_RECORDS', payload: HoleRecord[] }
  | { type: 'UPDATE_SCORE_FIELD', payload: Partial<{ [K in keyof GolfRecordState]: GolfRecordState[K] | ((prev: GolfRecordState[K]) => GolfRecordState[K]) }> }
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
  activeSession: null,
  tempSelection: {},
  selectedTee: TEE_COLORS.WHITE,
  holeRecords: [],
  roundId: "",
  roundDate: new Date().toISOString().split('T')[0],
  isManualLoading: true, // 초기 렌더 시 CourseSelector 노출 차단 (loadMasterAndSession finally에서 false로 전환됨)
  syncStatus: SYNC_STATUS.IDLE,
};

function golfRecordReducer(state: GolfRecordState, action: GolfRecordAction): GolfRecordState {
  switch (action.type) {
    case 'SET_UI':
      return { ...state, ...action.payload };
    case 'SET_MANUAL_LOADING':
      return { ...state, isManualLoading: action.payload };
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
        selectionStep: action.payload.session ? 'club' : state.selectionStep,
      };
    case 'SET_TEE_COLOR':
      return { ...state, selectedTee: action.payload };
    case 'SET_TEMP_SELECTION':
      return { 
        ...state, 
        tempSelection: typeof action.payload === 'function'
          ? (action.payload as (prev: GolfRecordState['tempSelection']) => GolfRecordState['tempSelection'])(state.tempSelection)
          : { ...state.tempSelection, ...action.payload }
      };
    case 'SET_HOLE':
      return {
        ...state,
        currentHole: action.payload.holeNo,
        ...action.payload.data,
        isParEditing: false,
      };
    case 'UPDATE_SCORE_FIELD': {
      const mutable = { ...state } as unknown as Record<string, unknown>;
      const current = state as unknown as Record<string, unknown>;
      Object.entries(action.payload).forEach(([key, value]) => {
        mutable[key] = typeof value === 'function'
          ? (value as (prev: unknown) => unknown)(current[key])
          : value;
      });
      return mutable as unknown as GolfRecordState;
    }
    case 'SET_HOLE_RECORDS':
      return { ...state, holeRecords: action.payload };
    case 'RESET_SESSION':
      // initialState.isManualLoading = true 이므로, 리셋 후 재진입 시 스피너가 먼저 표시됨 (의도된 동작)
      // loadMasterAndSession의 finally 블록이 isManualLoading: false로 전환하여 CourseSelector 노출
      return { ...initialState };
    default:
      return state;
  }
}

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
  // React Query 캐시 갱신만 유지 (isLoading은 스피너 트리거로 사용 안 함 — Task 2)
  useQuery({
    queryKey: ['current_round_id'],
    queryFn: () => roundRepository.getCurrentRoundId(),
    staleTime: 1000 * 60, // 1 minute
  });

  useQuery({
    queryKey: ['golf_rounds'],
    queryFn: () => roundRepository.getAllRounds(),
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: syncQueueCount = 0 } = useQuery({
    queryKey: ['sync_queue_count'],
    queryFn: () => roundRepository.getSyncQueueCount(),
  });

  // 렌더링과 동시에 최신 state를 Ref에 동기화 (비동기 클로저의 Stale State 접근 방지)
  const stateRef = useRef(state);
  stateRef.current = state;

  // 1-1. Lifecycle Guard: unmounted state update prevention
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

  // Load Initial Data (Session Restoration Logic)
  const loadMasterAndSession = useCallback(async () => {
    logger.info('[loadMasterAndSession] ENTER', { selectionStep: stateRef.current.selectionStep, mode: modeRef.current });
    const currentMode = modeRef.current;
    if (stateRef.current.selectionStep !== 'club' && !currentMode) {
      logger.warn('[loadMasterAndSession] early return: selectionStep is not club');
      return;
    }

    try {
      if (!isMounted.current) return;
      dispatch({ type: 'SET_MANUAL_LOADING', payload: true });
      logger.info('[loadMasterAndSession] SET_MANUAL_LOADING: true');
      
      // 병렬 핵심 작업: 클라우드 연결 상태 확인 및 데이터 정합성 보장 (retryPending은 Layout에서 수행)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sync_queue_count'] })
      ]);

      const savedId = await roundRepository.getCurrentRoundId();
      
      if (savedId && currentMode !== 'new') {
        const rounds = await roundRepository.getAllRounds();
        const currentRound = rounds.find(r => r.id === savedId);

        if (currentRound) {
          let session: ActiveCourseSession | null = null;

          // 로컬 or Supabase에서 사용할 course ID 초기화
          let outCourseIdToUse: string | undefined = currentRound.outCourseId;
          let inCourseIdToUse: string | undefined  = currentRound.inCourseId;

          // ─── Auto-Repair Step A ─────────────────────────────────────────
          // course ID 자체가 null(코스 삭제 후 NULL화) → 이름 기반 즉시 복원
          if (!outCourseIdToUse || !inCourseIdToUse) {
            logger.info('[loadMasterAndSession] Course IDs null — starting auto-repair (pass A)');
            const repaired = await clubRepository.repairRoundCourseIds(
              currentRound.courseName,
              currentRound.courseType,
            );
            if (repaired.outCourseId && repaired.inCourseId) {
              outCourseIdToUse = repaired.outCourseId;
              inCourseIdToUse  = repaired.inCourseId;
              // Supabase + 로컬 영구 반영
              await Promise.all([
                supabase.from('rounds').update({
                  out_course_id: outCourseIdToUse,
                  in_course_id:  inCourseIdToUse,
                  updated_at:    new Date().toISOString(),
                }).eq('id', savedId),
                roundRepository.saveRound({
                  ...currentRound,
                  outCourseId: outCourseIdToUse,
                  inCourseId:  inCourseIdToUse,
                  updatedAt:   Date.now(),
                }),
              ]);
              logger.info('[loadMasterAndSession] Auto-repair A succeeded');
            }
          }

          if (outCourseIdToUse && inCourseIdToUse) {
            let [outData, inData] = await Promise.all([
              clubRepository.getCourseWithHoles(outCourseIdToUse),
              clubRepository.getCourseWithHoles(inCourseIdToUse),
            ]);

            // ─── Auto-Repair Step B ──────────────────────────────────────
            // 로컬 캐시 course_id 만료 → Supabase에서 최신 ID 재조회
            if (!outData || !inData) {
              const { data: remoteRow } = await supabase
                .from('rounds')
                .select('out_course_id, in_course_id')
                .eq('id', savedId)
                .single();
              if (remoteRow?.out_course_id && remoteRow?.in_course_id) {
                [outData, inData] = await Promise.all([
                  clubRepository.getCourseWithHoles(remoteRow.out_course_id as string),
                  clubRepository.getCourseWithHoles(remoteRow.in_course_id as string),
                ]);
                if (outData && inData) {
                  await roundRepository.pullRoundsFromSupabase(undefined, true);
                }
              }
            }

            // ─── Auto-Repair Step C ──────────────────────────────────────
            // Supabase ID도 만료/NULL → 이름 기반 재복원 후 DB + 로컬 동시 갱신
            if (!outData || !inData) {
              logger.info('[loadMasterAndSession] Course data missing — starting auto-repair (pass C)');
              const repaired = await clubRepository.repairRoundCourseIds(
                currentRound.courseName,
                currentRound.courseType,
              );
              if (repaired.outCourseId && repaired.inCourseId) {
                [outData, inData] = await Promise.all([
                  clubRepository.getCourseWithHoles(repaired.outCourseId),
                  clubRepository.getCourseWithHoles(repaired.inCourseId),
                ]);
                if (outData && inData) {
                  await Promise.all([
                    supabase.from('rounds').update({
                      out_course_id: repaired.outCourseId,
                      in_course_id:  repaired.inCourseId,
                      updated_at:    new Date().toISOString(),
                    }).eq('id', savedId),
                    roundRepository.saveRound({
                      ...currentRound,
                      outCourseId: repaired.outCourseId,
                      inCourseId:  repaired.inCourseId,
                      updatedAt:   Date.now(),
                    }),
                    roundRepository.pullRoundsFromSupabase(undefined, true),
                  ]);
                  logger.info('[loadMasterAndSession] Auto-repair C succeeded');
                }
              }
            }

            if (outData && inData) {
              const outTees = outData.holes[0]?.distances.map(d => d.teeColor) || [];
              const inTees  = inData.holes[0]?.distances.map(d => d.teeColor) || [];
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

          if (isMounted.current) {
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
          }

        } else if (isMounted.current) {
          dispatch({ type: 'RESET_SESSION' });
        }
      } else {
        if ((stateRef.current.selectionStep === 'club' || currentMode) && isMounted.current) {
          dispatch({ type: 'RESET_SESSION' });
        }
      }
    } catch (e: unknown) {
      logger.error("Initialization failed", e);
    } finally {
      if (isMounted.current) {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: false });
        logger.info('[loadMasterAndSession] SET_MANUAL_LOADING: false');
      }
    }
  }, [queryClient]);

  // Start New Round
  const startNewRound = useCallback(async (tee: string) => {
    const { tempSelection, roundId, roundDate, holeRecords } = stateRef.current;
    if (!tempSelection.club || !tempSelection.outCourse || !tempSelection.inCourse) return;

    const today = new Date().toISOString().split('T')[0];

    // [제한 2] 과거 날짜 기록 생성 차단
    if (roundDate < today) {
      Toast.show({
        type: 'info',
        text1: '기록 제한',
        text2: '과거 날짜의 기록은 현재 입력할 수 없습니다.'
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // [제한 1] 일일 기록 건수 제한 (최대 10건)
    const todayCount = await roundRepository.getRoundsCountByDate(today);
    if (todayCount >= GOLF_LIMITS.MAX_DAILY_ROUNDS) {
      Toast.show({
        type: 'error',
        text1: '일일 기록 초과',
        text2: `하루에 최대 ${GOLF_LIMITS.MAX_DAILY_ROUNDS}건까지만 기록이 가능합니다.`
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (isMounted.current) {
      dispatch({ type: 'SET_MANUAL_LOADING', payload: true });
    }
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

      if (isMounted.current) {
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
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['current_round_id'] }),
        queryClient.invalidateQueries({ queryKey: ['golf_rounds'] })
      ]);

      if (isMounted.current) {
        Toast.show({
          type: 'success',
          text1: '라운딩 시작',
          text2: `${club.name}에서 라운딩을 시작합니다.`
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: unknown) {
      logger.error("startNewRound failed", e);
      if (isMounted.current) {
        Toast.show({
          type: 'error',
          text1: '오류',
          text2: '라운딩 정보를 불러오지 못했습니다.'
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      if (isMounted.current) {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: false });
      }
    }
  }, [queryClient]);

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
    if (nextMissShot !== state.missShot && isMounted.current) {
      dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { missShot: nextMissShot } });
    }
  }, [state.putt, state.activeSession, state.missShot]);


  const handleResetSession = useCallback(async () => {
    dispatch({ type: 'RESET_SESSION' });
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
  }, [queryClient]);

  const handleSaveCurrentHole = useCallback(async () => {
    const s = stateRef.current;
    if (!s.activeSession) return s.holeRecords;
    const { currentHole, par, stroke, putt, ob, penalty, missShot, holeRecords, roundId, roundDate, selectedTee, activeSession } = s;

    const currentRecord: HoleRecord = {
      holeNo: currentHole,
      par, stroke, putt,
      isGIR: golfService.isGIR(stroke, putt, par),
      ob, penalty,
      missShot: (missShot === MISS_SHOT_PATTERNS.NONE || !missShot) ? undefined : missShot
    };
    
    const updatedRecords = [...holeRecords.filter(r => r.holeNo !== currentHole), currentRecord].sort((a, b) => a.holeNo - b.holeNo);
    if (isMounted.current) {
      dispatch({ type: 'SET_HOLE_RECORDS', payload: updatedRecords });
    }

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

    if (isMounted.current) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: SYNC_STATUS.SYNCING });
    }

    roundRepository.syncRoundToSupabase(currentRound)
      .then(async (res) => {
        if (!isMounted.current) return;
        dispatch({ type: 'SET_SYNC_STATUS', payload: res.success ? SYNC_STATUS.SYNCED : SYNC_STATUS.FAILED });
        queryClient.invalidateQueries({ queryKey: ['sync_queue_count'] });
        
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
        if (!isMounted.current) return;
        dispatch({ type: 'SET_SYNC_STATUS', payload: SYNC_STATUS.FAILED });
        queryClient.invalidateQueries({ queryKey: ['sync_queue_count'] });
      });

    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    return updatedRecords;
  }, [queryClient]);

  const handleFinishRound = useCallback(async () => {
    await handleSaveCurrentHole();
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    dispatch({ type: 'RESET_SESSION' });
  }, [handleSaveCurrentHole, queryClient]);

  const setPar = useCallback((v: number | ((p: number) => number)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { par: v } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [dispatch]);

  const setStroke = useCallback((v: number | ((p: number) => number)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { stroke: v } });
    Haptics.selectionAsync();
  }, [dispatch]);

  const setPutt = useCallback((v: number | ((p: number) => number)) => {
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { putt: v } });
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
    dispatch({ type: 'UPDATE_SCORE_FIELD', payload: { currentHole: h } });
  }, [dispatch]);

  const setShowHoleGrid = useCallback((s: boolean) => dispatch({ type: 'SET_UI', payload: { showHoleGrid: s } }), [dispatch]);
  const setShowScoreCard = useCallback((s: boolean) => dispatch({ type: 'SET_UI', payload: { showScoreCard: s } }), [dispatch]);

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
    saveCurrentHole: handleSaveCurrentHole,
    resetSession: handleResetSession,
    finishRound: handleFinishRound,
  }), [
    setCurrentHole, setShowHoleGrid, setShowScoreCard,
    setPar, setStroke, setPutt, setOb, setPenalty, setMissShot,
    setIsParEditing, setSelectionStep, setTempSelection, setSelectedTee,
    loadMasterAndSession, startNewRound, handleSaveCurrentHole, handleResetSession, handleFinishRound
  ]);

  const { filledHoles, progressPercentage } = useMemo(() => {
    const filled = state.holeRecords.filter(h => h.stroke > 0).length;
    return {
      filledHoles: filled,
      progressPercentage: (filled / 18) * 100,
    };
  }, [state.holeRecords]);

  return {
    state: {
      ...state,
      clubs,
      // Task 2: React Query isLoading을 스피너 트리거에서 분리
      // → loadMasterAndSession의 SET_MANUAL_LOADING만으로 스피너 제어
      // → autoSync의 invalidate/refetch가 isLoading=true를 발생시켜도 스피너 재출현 없음
      isLoadingMaster: state.isManualLoading,
      pendingSyncCount: syncQueueCount,
    },
    actions,
    filledHoles,
    progressPercentage,
  };
}
