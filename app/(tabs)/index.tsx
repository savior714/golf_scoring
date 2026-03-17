/**
 * @file app/(tabs)/index.tsx
 * @description 라운딩 실시간 스코어카드 및 요약 리더보드
 */

import { useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, LogOut } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

import { EmptyState, LeaderboardCard, PatternHeatmap, StatGrid, TrendChart, HandicapBanner } from '@/src/modules/golf/components/Dashboard';
import { ScoreCardModal } from '@/src/modules/golf/components/ScoreCardModal';
import { useDashboardData } from '@/src/modules/golf/hooks/useDashboardData';
import { useScoreCardShare } from '@/src/modules/golf/hooks/useScoreCardShare';
import { supabase } from '@/src/shared/lib/supabase';
import { QUERY_KEYS } from '@/src/shared/lib/queryKeys';

export default function LeaderboardScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { roundId: selectedRoundId } = useLocalSearchParams<{ roundId: string }>();
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    latestRound, summary,
    isLoading, isSyncing,
    currentRoundId, advancedStats,
    estimatedHandicap,
    progressPercent, relativeScore, relativeScoreText,
    autoSync, handleFinishRound,
    startNewRound,
    refetch,
  } = useDashboardData(selectedRoundId);

  const {
    viewShotRef, scoreCardDomRef,
    statGridViewShotRef, statGridDomRef,
    isSharing, handleShare,
  } = useScoreCardShare({
    courseName: latestRound?.courseName,
    date: latestRound?.date,
  });

  useFocusEffect(
    useCallback(() => {
      if (isLoggingOut) return;
      
      autoSync();
      void queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.golf_clubs(),
        queryFn: () => import('@/src/modules/golf/golf.repository').then(m => m.clubRepository.getAllClubsSummary()),
      });
    }, [autoSync, queryClient, isLoggingOut])
  );

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      // Step 1: Query 중단 및 캐시 초기화 (Race Condition 방지)
      await queryClient.cancelQueries();
      queryClient.clear();
      
      // Step 2: Supabase 로그아웃 (await를 통해 스토리지 클린업 보장)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // router.replace('/(auth)/login'); // _layout의 세션 리스너가 처리함
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, queryClient]);

  const isRoundComplete = !!(latestRound && latestRound.holes.length === 18 && latestRound.id === currentRoundId);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: () => null,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { void startNewRound(); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <CheckCircle color="#007AFF" size={18} />
                <Text style={{ color: '#007AFF', fontWeight: '800', fontSize: 13, marginRight: 8 }}>
                  새 라운딩
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { void handleLogout(); }}
                disabled={isLoggingOut}
                style={{ marginRight: 15, opacity: isLoggingOut ? 0.5 : 1 }}
              >
                <LogOut color="#FF6B6B" size={22} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {summary && latestRound ? (
          <>
            <HandicapBanner value={estimatedHandicap} />
            <LeaderboardCard
              latestRound={latestRound}
              summary={summary}
              progressPercent={progressPercent as number | null}
              relativeScore={relativeScore as number}
              relativeScoreText={relativeScoreText as string}
              isRoundComplete={isRoundComplete}
              isSyncing={isSyncing}
              onShowScoreCard={() => setShowScoreCard(true)}
              onFinishRound={handleFinishRound}
            />

            <TrendChart stats={advancedStats} />
            <PatternHeatmap stats={advancedStats} />

            <ViewShot
              ref={statGridViewShotRef}
              options={{ format: 'png', quality: 0.9 }}
            >
              <View ref={statGridDomRef} style={styles.statsCaptureWrapper}>
                <View style={styles.statsShareHeader}>
                  <Text style={styles.statsShareTitle}>ROUND STATS</Text>
                  <Text style={styles.statsShareSubTitle}>{latestRound?.courseName} ({latestRound?.date})</Text>
                </View>
                <StatGrid summary={summary} latestRound={latestRound} />
              </View>
            </ViewShot>

            <View style={{ marginBottom: 20 }} />
          </>
        ) : (
          <EmptyState onStartNew={() => router.push({ pathname: '/(tabs)/record', params: { mode: 'new' } })} />
        )}
      </ScrollView>

      <ScoreCardModal
        visible={showScoreCard}
        courseName={latestRound?.courseName}
        courseType={latestRound?.courseType}
        date={latestRound?.date}
        holes={latestRound?.holes || []}
        isSharing={isSharing}
        viewShotRef={viewShotRef}
        scoreCardDomRef={scoreCardDomRef}
        onClose={() => setShowScoreCard(false)}
        onShare={handleShare}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
  },
  statsCaptureWrapper: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
  },
  statsShareHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  statsShareTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A2647',
    letterSpacing: 2,
  },
  statsShareSubTitle: {
    fontSize: 12,
    color: '#6E85B7',
    fontWeight: '600',
    marginTop: 4,
  },
});
