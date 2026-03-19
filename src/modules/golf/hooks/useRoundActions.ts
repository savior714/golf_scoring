import {
    GOLF_LIMITS,
    SYNC_STATUS,
} from "@/src/modules/golf/domain";
import { golfApplicationService } from "@/src/modules/golf/application";
import { ClubSummary } from "@/src/modules/golf/domain";
import type {
    GolfRecordAction,
    GolfRecordState,
} from "@/src/modules/golf/hooks/golfRecord.state";
import { QUERY_KEYS } from "@/src/shared/lib/queryKeys";
import { logger } from "@/src/shared/utils/logger";
import type { QueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import type { MutableRefObject } from "react";
import { useCallback, useMemo } from "react";
import Toast from "react-native-toast-message";

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
  const startNewRound = useCallback(
    async (tee: string) => {
      const { tempSelection, roundId, roundDate, holeRecords } =
        stateRef.current;
      if (
        !tempSelection.club ||
        !tempSelection.outCourse ||
        !tempSelection.inCourse
      )
        return;

      if (isMounted.current) {
        dispatch({ type: "SET_MANUAL_LOADING", payload: true });
      }

      try {
        const { session, roundId: targetId, roundDate: targetDate, initialRound } = await golfApplicationService.startNewRound({
          tee,
          tempSelection: tempSelection as {
            club: ClubSummary;
            outCourse: { id: string; name: string };
            inCourse: { id: string; name: string };
          },
          roundId,
          roundDate,
          holeRecords
        });


        if (isMounted.current) {
          dispatch({
            type: "INIT_SESSION",
            payload: {
              roundId: targetId,
              roundDate: targetDate,
              tee: tee,
              records: initialRound.holes,
              session,
            },
          });

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.current_round_id(),
            }),
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.golf_rounds() }),
          ]);

          Toast.show({
            type: "success",
            text1: "라운딩 시작",
            text2: `${tempSelection.club.name}에서 라운딩을 시작합니다.`,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e: any) {
        logger.error("startNewRound failed", e);
        if (isMounted.current) {
          let text2 = "라운딩 정보를 불러오지 못했습니다.";
          if (e.message === "PAST_DATE_LIMIT") {
            text2 = "과거 날짜의 기록은 현재 입력할 수 없습니다.";
          } else if (e.message === "DAILY_LIMIT_EXCEEDED") {
            text2 = `하루에 최대 ${GOLF_LIMITS.MAX_DAILY_ROUNDS}건까지만 기록이 가능합니다.`;
          }

          Toast.show({
            type: "error",
            text1: "오류",
            text2,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        if (isMounted.current) {
          dispatch({ type: "SET_MANUAL_LOADING", payload: false });
        }
      }
    },
    [dispatch, stateRef, queryClient, isMounted],
  );

  const handleSaveCurrentHole = useCallback(async () => {
    const s = stateRef.current;
    if (!s.activeSession || !s.roundId) return s.holeRecords;
    
    const {
      currentHole,
      par,
      stroke,
      putt,
      ob,
      penalty,
      missShot,
      holeRecords,
      roundId,
      roundDate,
      selectedTee,
      activeSession,
    } = s;

    if (isMounted.current) {
      dispatch({ type: "SET_SYNC_STATUS", payload: SYNC_STATUS.SYNCING });
    }

    try {
      const { updatedRecords, syncPromise } = await golfApplicationService.saveHoleRecord({
        roundId,
        roundDate,
        activeSession,
        currentHole,
        scoreData: { par, stroke, putt, ob, penalty, missShot: missShot || "" },
        holeRecords,
        selectedTee,
      });

      if (isMounted.current) {
        dispatch({ type: "SET_HOLE_RECORDS", payload: updatedRecords });
      }

      syncPromise
        .then(async (res) => {
          if (!isMounted.current) return;
          dispatch({
            type: "SET_SYNC_STATUS",
            payload: res.success ? SYNC_STATUS.SYNCED : SYNC_STATUS.FAILED,
          });
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.sync_queue_count(),
          });

          if (!res.success) {
            Toast.show({
              type: "error",
              text1: "동기화 실패",
              text2: "클라우드 저장을 실패했습니다. 나중에 자동 재시도됩니다.",
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        })
        .catch(async () => {
          if (!isMounted.current) return;
          dispatch({ type: "SET_SYNC_STATUS", payload: SYNC_STATUS.FAILED });
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.sync_queue_count(),
          });
        });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.golf_rounds() });
      return updatedRecords;
    } catch (e) {
      logger.error("handleSaveCurrentHole failed", e);
      if (isMounted.current) {
        dispatch({ type: "SET_SYNC_STATUS", payload: SYNC_STATUS.FAILED });
      }
      return holeRecords;
    }
  }, [dispatch, stateRef, queryClient, isMounted]);

  const handleFinishRound = useCallback(async () => {
    await handleSaveCurrentHole();
    await golfApplicationService.finishRound();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.golf_rounds() });
    dispatch({ type: "RESET_SESSION" });
  }, [handleSaveCurrentHole, dispatch, queryClient]);

  const handleResetSession = useCallback(async () => {
    dispatch({ type: "RESET_SESSION" });
    await golfApplicationService.finishRound();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
  }, [dispatch, queryClient]);

  return useMemo(
    () => ({
      startNewRound,
      saveCurrentHole: handleSaveCurrentHole,
      finishRound: handleFinishRound,
      resetSession: handleResetSession,
    }),
    [
      startNewRound,
      handleSaveCurrentHole,
      handleFinishRound,
      handleResetSession,
    ],
  );
}

