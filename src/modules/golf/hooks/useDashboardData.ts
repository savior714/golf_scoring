import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { roundRepository } from '@/src/modules/golf/golf.repository';
import { golfService } from '@/src/modules/golf/golf.service';
import { logger } from '@/src/shared/utils/logger';
import { QUERY_KEYS } from '@/src/shared/lib/queryKeys';
import { formatRelativeScore } from '@/src/shared/utils/scoreUtils';

export function useDashboardData(selectedRoundId?: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      logger.info('[useDashboardData] UNMOUNTED');
    };
  }, []);

  // Step 4.4.2: Stable Refs for derived/query data — prevent unnecessary callback recreations
  const isSyncingRef = useRef(isSyncing);
  useEffect(() => { 
    isSyncingRef.current = isSyncing; 
  });

  const { data: rounds, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.golf_rounds(),
    queryFn: () => roundRepository.getAllRounds(),
    // Step 5.1.1: 로컬 AsyncStorage 기반 쿼리 — 모든 변경 지점에서 invalidateQueries 명시적 호출 완비
    // staleTime: Infinity → 앱 포커스 복귀 시 불필요한 재읽기 차단
    staleTime: Infinity,
  });

  const { data: currentRoundId } = useQuery({
    queryKey: QUERY_KEYS.current_round_id(),
    queryFn: () => roundRepository.getCurrentRoundId(),
    staleTime: Infinity,
  });

  const latestRound = useMemo(() => 
    golfService.getDashboardDisplayRound(rounds || [], currentRoundId, selectedRoundId), 
  [rounds, selectedRoundId, currentRoundId]);

  const roundsRef = useRef(rounds);
  const latestRoundRef = useRef(latestRound);
  useEffect(() => {
    roundsRef.current = rounds;
    latestRoundRef.current = latestRound;
  });

  const autoSync = useCallback(async (force = false) => {
    try {
      if (!isMounted.current) return;
      setIsSyncing(true);
      const pullRes = await roundRepository.pullRoundsFromSupabase(undefined, force);
      
      if (!isMounted.current) return;
      
      if (force && pullRes.success) {
        Toast.show({
          type: 'success',
          text1: '동기화 완료',
          text2: '최신 데이터를 클라우드에서 가져왔습니다.'
        });
      } else if (force && !pullRes.success) {
        Toast.show({
          type: 'error',
          text1: '동기화 실패',
          text2: '네트워크 연결을 확인해주세요.'
        });
      }
      await refetch();
      // current_round_id 캐시를 무효화 후 즉시 재읽기 → useMemo 재계산 트리거
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
    } catch (e: unknown) {
      logger.error('[Dashboard] Auto sync failed', e);
    } finally {
      if (isMounted.current) {
        setIsSyncing(false);
      }
    }
  }, [refetch, queryClient]);

  const handleFinishRound = useCallback(async () => {
    const lr = latestRoundRef.current;
    if (!lr || isSyncingRef.current) return;

    const msg = "오늘의 라운딩 기록을 최종 저장하시겠습니까?\n저장 후에도 히스토리 탭에서 언제든 다시 수정할 수 있습니다.";

    const proceedSync = async () => {
      if (!isMounted.current) return;
      setIsSyncing(true);
      try {
        const [syncResult] = await Promise.all([
          roundRepository.syncRoundToSupabase(lr),
          roundRepository.setCurrentRoundId(null)
        ]);

        if (!isMounted.current) return;

        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.golf_rounds() });

        const successMsg = syncResult.success
          ? "라운딩이 클라우드에 성공적으로 저장되었습니다."
          : "클라우드 저장에 실패했지만, 로컬 세션은 정상 종료되었습니다.";

        Toast.show({
          type: syncResult.success ? 'success' : 'error',
          text1: syncResult.success ? '저장 완료' : '동기화 미완료',
          text2: successMsg
        });
        Haptics.notificationAsync(
          syncResult.success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
        );
      } catch (e: unknown) {
        logger.error('[Dashboard] handleFinishRound failed', e);
        if (isMounted.current) {
          Toast.show({
            type: 'error',
            text1: '오류',
            text2: '처리 중 오류가 발생했습니다.'
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        if (isMounted.current) {
          setIsSyncing(false);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) await proceedSync();
    } else {
      Alert.alert("라운딩 종료", msg, [
        { text: "취소", style: "cancel" },
        { text: "저장 및 종료", onPress: proceedSync }
      ]);
    }
  }, [queryClient]);

  const deleteRound = useCallback(async (id: string) => {
    try {
      await roundRepository.deleteRound(id);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.golf_rounds() });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
      router.replace('/(tabs)/history');
      
      if (isMounted.current) {
        Toast.show({
          type: 'success',
          text1: '삭제 완료',
          text2: '라운딩 기록이 삭제되었습니다.'
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      logger.error('Delete flow error:', e);
      if (isMounted.current) {
        Toast.show({
          type: 'error',
          text1: '삭제 실패',
          text2: '기록을 삭제하는 중 오류가 발생했습니다.'
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [queryClient, router]);

  const startNewRound = useCallback(async () => {
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
    router.push({ pathname: '/(tabs)/record', params: { mode: 'new', t: Date.now().toString() } });
  }, [queryClient, router]);


  const continueRound = useCallback((id?: string) => {
    if (id) {
       roundRepository.setCurrentRoundId(id);
       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
    }
    router.push({ pathname: '/(tabs)/record', params: { mode: 'edit' } });
  }, [queryClient, router]);

  const summaryData = useMemo(() => {
    if (!latestRound) return null;
    const s = golfService.calculateSummary(latestRound.holes);
    const score = s.totalScore - s.totalPar;
    return {
      summary: s,
      progressPercent: Math.round((latestRound.holes.length / 18) * 100),
      relativeScore: score,
      relativeScoreText: formatRelativeScore(score)
    };
  }, [latestRound]);

  const advancedStats = useMemo(() => {
    if (!rounds) return [];
    // Step 4.4.1: 홀 기록이 있는 라운드를 날짜 기준 정렬 후 최근 5경기만 선별
    // → calculateSummary 호출 횟수 O(N) → O(5) 절감
    const recentRounds = rounds
      .filter(r => r.holes.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-5);
    return golfService.calculateAdvancedStats(recentRounds);
  }, [rounds]);

  const handleManualRefresh = useCallback(async () => {
    await autoSync(true); // Force sync from cloud
    await refetch();      // Refresh local data
  }, [autoSync, refetch]);

  const actions = useMemo(() => ({
    autoSync,
    handleFinishRound,
    deleteRound,
    startNewRound,
    continueRound,
    refetch: handleManualRefresh, // Replace default refetch with cloud-sync enabled one
  }), [autoSync, handleFinishRound, deleteRound, startNewRound, continueRound, handleManualRefresh]);

  return {
    rounds,
    latestRound,
    isLoading,
    isSyncing,
    currentRoundId,
    advancedStats,
    ...summaryData,
    ...actions
  };
}
