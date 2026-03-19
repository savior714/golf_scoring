import { useCallback, useMemo } from 'react';
import type { MutableRefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { golfApplicationService } from '@/src/modules/golf/application';
import { logger } from '@/src/shared/utils/logger';
import { QUERY_KEYS } from '@/src/shared/lib/queryKeys';
import type { GolfRecordAction, GolfRecordState } from '@/src/modules/golf/hooks/golfRecord.state';

interface UseGolfSessionParams {
  dispatch: (action: GolfRecordAction) => void;
  stateRef: MutableRefObject<GolfRecordState>;
  queryClient: QueryClient;
  modeRef: MutableRefObject<string | undefined>;
  isMounted: MutableRefObject<boolean>;
}

export function useGolfSession({
  dispatch,
  stateRef,
  queryClient,
  modeRef,
  isMounted,
}: UseGolfSessionParams) {
  const loadMasterAndSession = useCallback(async () => {
    logger.info('[loadMasterAndSession] ENTER', { 
      selectionStep: stateRef.current.selectionStep, 
      mode: modeRef.current 
    });
    
    const currentMode = modeRef.current;
    if (stateRef.current.selectionStep !== 'club' && !currentMode) {
      logger.warn('[loadMasterAndSession] early return: selectionStep is not club');
      return;
    }

    try {
      if (!isMounted.current) return;
      dispatch({ type: 'SET_MANUAL_LOADING', payload: true });

      // Refresh sync status
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sync_queue_count() });

      const result = await golfApplicationService.loadSession({
        mode: currentMode,
        currentSelectionStep: stateRef.current.selectionStep
      });

      if (!isMounted.current) return;

      if (result) {
        if (result.roundId) {
          dispatch({
            type: 'INIT_SESSION',
            payload: {
              roundId: result.roundId,
              roundDate: result.roundDate || new Date().toISOString().split('T')[0],
              tee: result.tee,
              records: result.records,
              session: result.session
            }
          });
        } else {
          // result exists but no roundId usually means RESET_SESSION (e.g. mode='new')
          dispatch({ type: 'RESET_SESSION' });
        }
      } else {
        // Fallback or early return logic from service returned null
        if ((stateRef.current.selectionStep === 'club' || currentMode)) {
          dispatch({ type: 'RESET_SESSION' });
        }
      }
    } catch (e: unknown) {
      logger.error("[useGolfSession] Initialization failed", e);
    } finally {
      if (isMounted.current) {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: false });
      }
    }
  }, [queryClient, dispatch, stateRef, modeRef, isMounted]);

  return useMemo(() => ({ loadMasterAndSession }), [loadMasterAndSession]);
}

