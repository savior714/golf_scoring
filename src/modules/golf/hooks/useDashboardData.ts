import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { roundRepository } from '../golf.repository';
import { golfService } from '../golf.service';

export function useDashboardData(selectedRoundId?: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPromptedSession, setHasPromptedSession] = useState(false);

  const { data: rounds, isLoading, refetch } = useQuery({
    queryKey: ['golf_rounds'],
    queryFn: () => roundRepository.getAllRounds(),
  });

  const { data: currentRoundId } = useQuery({
    queryKey: ['current_round_id'],
    queryFn: () => roundRepository.getCurrentRoundId(),
  });

  const autoSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      await roundRepository.pullRoundsFromSupabase();
      const { data: currentRounds } = await refetch();
      const savedId = await roundRepository.getCurrentRoundId();
      queryClient.invalidateQueries({ queryKey: ['current_round_id'] });

      // Check for incomplete session
      if (savedId && !hasPromptedSession) {
        const activeRound = currentRounds?.find(r => r.id === savedId);
        if (activeRound && activeRound.holes.length < 18) {
          setHasPromptedSession(true);
          promptIncompleteSession(activeRound.courseName);
        }
      }
    } catch (e) {
      console.error('[Dashboard] Auto sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  }, [refetch, queryClient, hasPromptedSession]);

  const promptIncompleteSession = (courseName: string) => {
    const msg = `마지막으로 기록 중이던 라운딩(${courseName})이 있습니다.\n이어서 기록하시겠습니까?`;
    const onContinue = () => router.push('/(tabs)/record');
    const onStartNew = async () => {
      await roundRepository.setCurrentRoundId(null);
      queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
      router.push({ pathname: '/(tabs)/record', params: { mode: 'new', t: Date.now().toString() } });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) onContinue();
      else if (window.confirm("기존 기록을 종료하고 새 라운딩을 시작하시겠습니까?")) onStartNew();
    } else {
      Alert.alert("진행 중인 라운딩 감지", msg, [
        { text: "새로 시작", style: "destructive", onPress: onStartNew },
        { text: "이어서 기록", onPress: onContinue }
      ]);
    }
  };

  const latestRound = useMemo(() => 
    golfService.getDashboardDisplayRound(rounds || [], currentRoundId, selectedRoundId), 
  [rounds, selectedRoundId, currentRoundId]);

  const summary = useMemo(() => latestRound ? golfService.calculateSummary(latestRound.holes) : null, [latestRound]);
  const progressPercent = useMemo(() => latestRound ? Math.round((latestRound.holes.length / 18) * 100) : 0, [latestRound]);
  const relativeScore = summary ? summary.totalScore - summary.totalPar : 0;
  const relativeScoreText = relativeScore > 0 ? `+${relativeScore}` : relativeScore < 0 ? `${relativeScore}` : 'E';

  const handleFinishRound = async () => {
    if (!latestRound || isSyncing) return;

    const msg = "오늘의 라운딩 기록을 최종 저장하시겠습니까?\n저장 후에도 히스토리 탭에서 언제든 다시 수정할 수 있습니다.";

    const proceedSync = async () => {
      setIsSyncing(true);
      try {
        const [syncResult] = await Promise.all([
          roundRepository.syncRoundToSupabase(latestRound),
          roundRepository.setCurrentRoundId(null)
        ]);

        queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
        queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });

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
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: '오류',
          text2: '처리 중 오류가 발생했습니다.'
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSyncing(false);
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
  };

  const deleteRound = async (id: string) => {
    try {
      await roundRepository.deleteRound(id);
      await queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
      await queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
      router.replace('/(tabs)/history');
      Toast.show({
        type: 'success',
        text1: '삭제 완료',
        text2: '라운딩 기록이 삭제되었습니다.'
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('Delete flow error:', e);
      Toast.show({
        type: 'error',
        text1: '삭제 실패',
        text2: '기록을 삭제하는 중 오류가 발생했습니다.'
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const startNewRound = async () => {
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    router.push({ pathname: '/(tabs)/record', params: { mode: 'new', t: Date.now().toString() } });
  };

  const continueRound = (id?: string) => {
    if (id) {
       roundRepository.setCurrentRoundId(id);
       queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    }
    router.push('/(tabs)/record');
  };

  return {
    rounds, latestRound, summary,
    isLoading, isSyncing,
    currentRoundId,
    progressPercent, relativeScore, relativeScoreText,
    autoSync, handleFinishRound, deleteRound,
    startNewRound, continueRound,
    refetch, setHasPromptedSession
  };
}
