import { useCallback, useMemo } from 'react';
import type { MutableRefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { clubRepository, roundRepository } from '../golf.repository';
import { supabase } from '../../../shared/lib/supabase';
import { golfService } from '../golf.service';
import { logger } from '../../../shared/utils/logger';
import type { ActiveCourseSession, GolfRecordAction, GolfRecordState } from './golfRecord.state';

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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sync_queue_count'] })
      ]);

      const savedId = await roundRepository.getCurrentRoundId();

      if (savedId && currentMode !== 'new') {
        const rounds = await roundRepository.getAllRounds();
        const currentRound = rounds.find(r => r.id === savedId);

        if (currentRound) {
          let session: ActiveCourseSession | null = null;

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
      if (isMounted.current && stateRef.current.isManualLoading) {
        dispatch({ type: 'SET_MANUAL_LOADING', payload: false });
        logger.info('[loadMasterAndSession] SET_MANUAL_LOADING: false (from finally)');
      }
    }
  }, [queryClient, dispatch, stateRef, modeRef, isMounted]);

  return useMemo(() => ({ loadMasterAndSession }), [loadMasterAndSession]);
}
