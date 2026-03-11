/**
 * @file app/(tabs)/index.tsx
 * @description 라운딩 실시간 스코어카드 및 요약 리더보드
 */

import { useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, LogOut, Share2 } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LeaderboardCard, PatternHeatmap, StatGrid, TrendChart } from '../../src/modules/golf/components/Dashboard';
import { ScoreCardTable } from '../../src/shared/components/ScoreCardTable';
import { supabase } from '../../src/shared/lib/supabase';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// Hooks
import { useDashboardData } from '../../src/modules/golf/hooks/useDashboardData';


export default function LeaderboardScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { roundId: selectedRoundId } = useLocalSearchParams<{ roundId: string }>();
  const viewShotRef = useRef<ViewShot>(null);
  const scoreCardDomRef = useRef<View>(null);
  const statGridViewShotRef = useRef<ViewShot>(null);
  const statGridDomRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const {
    latestRound, summary,
    isLoading, isSyncing,
    currentRoundId, advancedStats,
    progressPercent, relativeScore, relativeScoreText,
    autoSync, handleFinishRound,
    startNewRound,
    refetch,
  } = useDashboardData(selectedRoundId);

  const [showScoreCard, setShowScoreCard] = useState(false);

  // 화면 포커스 시 데이터 실시간 새로고침 및 클라우드 동기화
  useFocusEffect(
    useCallback(() => {
      autoSync();
    }, [autoSync])
  );

  const isRoundComplete = !!(latestRound && latestRound.holes.length === 18 && latestRound.id === currentRoundId);

  const handleShareScoreCard = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      if (Platform.OS === 'web') {
        await shareOnWeb();
      } else {
        await shareOnNative();
      }
    } finally {
      setIsSharing(false);
    }
  };

  // 웹 환경: html-to-image로 DOM 캡처 → Web Share API 또는 다운로드
  const shareOnWeb = async () => {
    const { toPng } = await import('html-to-image');
    const scoreEl = scoreCardDomRef.current as unknown as HTMLElement;
    const statsEl = statGridDomRef.current as unknown as HTMLElement;
    if (!scoreEl || !statsEl) return;

    const date = latestRound?.date ?? 'golf';

    const [scoreDataUrl, statsDataUrl] = await Promise.all([
      toPng(scoreEl, { backgroundColor: '#ffffff', pixelRatio: 2 }),
      toPng(statsEl, { backgroundColor: '#F8F9FA', pixelRatio: 2 }),
    ]);

    const [scoreBlob, statsBlob] = await Promise.all([
      fetch(scoreDataUrl).then(r => r.blob()),
      fetch(statsDataUrl).then(r => r.blob()),
    ]);

    const scoreFile = new File([scoreBlob], `scorecard_${date}.png`, { type: 'image/png' });
    const statsFile = new File([statsBlob], `stats_${date}.png`, { type: 'image/png' });

    // Web Share API Level 2 (다중 파일 공유) 지원 여부 확인
    if (navigator.canShare?.({ files: [scoreFile, statsFile] })) {
      await navigator.share({
        files: [scoreFile, statsFile],
        title: '골프 라운딩 결과',
        text: `${latestRound?.courseName ?? ''} 라운딩 결과`,
      });
    } else {
      // 미지원 환경: 두 파일 순차 다운로드 폴백
      for (const [file, blob] of [[scoreFile, scoreBlob], [statsFile, statsBlob]] as [File, Blob][]) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // 네이티브 환경: react-native-view-shot + expo-sharing
  const shareOnNative = async () => {
    const scoreUri = viewShotRef.current?.capture ? await viewShotRef.current.capture() : null;
    const statsUri = statGridViewShotRef.current?.capture ? await statGridViewShotRef.current.capture() : null;

    if (scoreUri) {
      await Sharing.shareAsync(scoreUri, {
        mimeType: 'image/png',
        dialogTitle: '스코어카드 공유',
        UTI: 'public.png',
      });
    }
    if (statsUri) {
      await Sharing.shareAsync(statsUri, {
        mimeType: 'image/png',
        dialogTitle: '라운드 통계 공유',
        UTI: 'public.png',
      });
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: '실시간 리더보드',
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
                onPress={() => {
                  void supabase.auth.signOut();
                  queryClient.clear();
                }}
                style={{ marginRight: 15 }}
              >
                <LogOut color="#FF6B6B" size={22} />
              </TouchableOpacity>
            </View>
          )
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {summary && latestRound ? (
          <>
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

            {/* 최근 5경기 트렌드 차트 및 미스 패턴 */}
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
          <EmptyState onStartNew={() => router.push('/(tabs)/record')} />
        )}
      </ScrollView>

      {/* 스코어카드 모달 */}
      <Modal
        visible={showScoreCard}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowScoreCard(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowScoreCard(false)}
        >
          <Animated.View
            entering={FadeInUp.duration(500)}
            exiting={FadeOutUp.duration(300)}
            style={styles.scoreCardContainer}
          >
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 0.9 }}
              style={{ backgroundColor: '#fff', borderRadius: 20, padding: 10 }}
            >
              {/* web에서 html2canvas가 캡처할 DOM 영역 */}
              <View ref={scoreCardDomRef}>
              <View style={styles.scoreCardHeader}>
                <Text style={styles.scoreCardTitle}>SCORE CARD</Text>
                <Text style={styles.scoreCardSubTitle}>{latestRound?.courseName} ({latestRound?.date})</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 전반 코스 (1-9) */}
                <View style={styles.tableGroup}>
                  <Text style={styles.coursePartTitle}>전반 코스</Text>
                  <ScoreCardTable
                    startHole={1}
                    endHole={9}
                    holes={latestRound?.holes || []}
                    onHolePress={(h) => {
                      setShowScoreCard(false);
                      router.push({ pathname: '/(tabs)/record', params: { hole: h } });
                    }}
                  />
                </View>

                {/* 후반 코스 (10-18) */}
                <View style={styles.tableGroup}>
                  <Text style={styles.coursePartTitle}>후반 코스</Text>
                  <ScoreCardTable
                    startHole={10}
                    endHole={18}
                    holes={latestRound?.holes || []}
                    onHolePress={(h) => {
                      setShowScoreCard(false);
                      router.push({ pathname: '/(tabs)/record', params: { hole: h } });
                    }}
                  />
                </View>

                {/* Legend (범례) */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.symbolCircle, styles.symbolDouble]}>
                      <View style={styles.symbolCircleInner} />
                    </View>
                    <Text style={styles.legendLabel}>이글(-)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.symbolCircle} />
                    <Text style={styles.legendLabel}>버디</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.symbolDot} />
                    <Text style={styles.legendLabel}>파</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.symbolSquare} />
                    <Text style={styles.legendLabel}>보기</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.symbolSquare, styles.symbolDouble]}>
                      <View style={styles.symbolSquareInner} />
                    </View>
                    <Text style={styles.legendLabel}>더블보기(+)</Text>
                  </View>
                </View>
              </ScrollView>
              </View>{/* scoreCardDomRef View 닫기 */}
            </ViewShot>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.shareBtn, isSharing && { opacity: 0.7 }]}
                onPress={handleShareScoreCard}
                disabled={isSharing}
              >
                {isSharing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Share2 size={18} color="#fff" />
                }
                <Text style={styles.shareBtnText}>
                  {isSharing ? '준비 중...' : '이미지로 공유'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowScoreCard(false)}
              >
                <Text style={styles.closeBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 38, 71, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scoreCardContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    // Android Elevation
    elevation: 20,
  },
  scoreCardHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  scoreCardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0A2647',
    letterSpacing: 2,
  },
  scoreCardSubTitle: {
    fontSize: 13,
    color: '#6E85B7',
    fontWeight: '600',
    marginTop: 6,
  },
  tableGroup: {
    width: '100%',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    // iOS Shadow
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    // Android Elevation
    elevation: 5,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#F1F3F5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '800',
  },
  coursePartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#495057',
    marginBottom: 10,
    marginLeft: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: '#adb5bd',
    fontWeight: '600',
  },
  symbolCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  symbolCircleInner: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  symbolSquare: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  symbolSquareInner: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  symbolDouble: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ADB5BD',
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
