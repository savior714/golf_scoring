import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { clubRepository, roundRepository } from '../golf.repository';
import { golfService } from '../golf.service';
import { GolfRound, HoleRecord } from '../golf.types';
import { GOLF_LIMITS, MISS_SHOT_PATTERNS, SYNC_STATUS } from '../golf.constants';
import { logger } from '../../../shared/utils/logger';
import type { ActiveCourseSession, GolfRecordAction, GolfRecordState } from './golfRecord.state';

interface UseRoundActionsParams {
  dispatch: (action: GolfRecordAction) => void;
  stateRef: MutableRefObject<GolfRecordState>;
  queryClient: QueryClient;
  isMounted: MutableRefObject<boolean>;
}

export function useRoundActions({
  dispatch,
  stateRef,
  queryClient,
  isMounted,
}: UseRoundActionsParams) {
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
  }, [dispatch, stateRef, queryClient, isMounted]);

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
  }, [dispatch, stateRef, queryClient, isMounted]);

  const handleFinishRound = useCallback(async () => {
    await handleSaveCurrentHole();
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    dispatch({ type: 'RESET_SESSION' });
  }, [handleSaveCurrentHole, dispatch, queryClient]);

  const handleResetSession = useCallback(async () => {
    dispatch({ type: 'RESET_SESSION' });
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
  }, [dispatch, queryClient]);

  return {
    startNewRound,
    saveCurrentHole: handleSaveCurrentHole,
    finishRound: handleFinishRound,
    resetSession: handleResetSession,
  };
}
