/**
 * @file app/(tabs)/index.tsx
 * @description 라운딩 실시간 스코어카드 및 요약 리더보드
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, ArrowDown, ArrowRight, ArrowUpLeft, ArrowUpRight, CheckCircle, CornerRightDown, Droplets, Flag, LayoutGrid, LogOut, RotateCcw, Save, Star, Target, Trophy, Waves, XCircle } from 'lucide-react-native';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { roundRepository } from '../../src/modules/golf/golf.repository';
import { golfService } from '../../src/modules/golf/golf.service';
import { ScoreCardTable } from '../../src/shared/components/ScoreCardTable';
import { supabase } from '../../src/shared/lib/supabase';


export default function LeaderboardScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const { data: rounds, isLoading, refetch } = useQuery({
    queryKey: ['golf_rounds'],
    queryFn: () => roundRepository.getAllRounds(),
  });

  const [showScoreCard, setShowScoreCard] = useState(false);

  const { data: currentRoundId } = useQuery({
    queryKey: ['current_round_id'],
    queryFn: () => roundRepository.getCurrentRoundId(),
  });

  // 화면 포커스 시 데이터 실시간 새로고침 및 클라우드 동기화 (멀티 디바이스 정합성 확보)
  useFocusEffect(
    useCallback(() => {
      const autoSync = async () => {
        try {
          setIsSyncing(true);
          // 클라우드에서 최신 데이터를 가져옴 (Pull)
          await roundRepository.pullRoundsFromSupabase();
          // 로컬 데이터 새로고침
          await refetch();
          queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
        } catch (e) {
          console.error('[Dashboard] Auto sync failed', e);
        } finally {
          setIsSyncing(false);
        }
      };
      autoSync();
    }, [refetch, queryClient])
  );

  const { roundId: selectedRoundId } = useLocalSearchParams<{ roundId: string }>();

  // 진행 중인 라운드 또는 선택된 라운드, 혹은 가장 최근 라운드 표시
  const latestRound = useMemo(() => {
    if (!rounds) return null;

    // 1. 선택된 라운드 (히스토리에서 접근 등 - 쿼리 스트링 우선)
    if (selectedRoundId) {
      const selected = rounds.find(r => r.id === selectedRoundId);
      if (selected) return selected;
    }

    // 2. 현재 진행 중인 라운드 (AsyncStorage에 저장된 current_round_id 기준)
    if (currentRoundId) {
      const current = rounds.find(r => r.id === currentRoundId);
      if (current) return current;
    }

    // 3. Fallback: 가장 최근 라운드
    return rounds.length > 0 ? rounds[0] : null;
  }, [rounds, selectedRoundId, currentRoundId]);

  // useMemo를 통한 불필요한 계산 최소화
  const summary = useMemo(() => latestRound ? golfService.calculateSummary(latestRound.holes) : null, [latestRound]);
  const progressPercent = useMemo(() => latestRound ? Math.round((latestRound.holes.length / 18) * 100) : 0, [latestRound]);

  const relativeScore = summary ? summary.totalScore - summary.totalPar : 0;
  const relativeScoreText = relativeScore > 0 ? `+${relativeScore}` : relativeScore < 0 ? `${relativeScore}` : 'E';

  const isRoundComplete = latestRound && latestRound.holes.length === 18 && latestRound.id === currentRoundId;

  const handleFinishRound = async () => {
    if (!latestRound || isSyncing) return;

    const msg = "오늘의 라운딩 기록을 최종 저장하시겠습니까?\n저장 후에도 히스토리 탭에서 언제든 다시 수정할 수 있습니다.";

    const proceedSync = async () => {
      setIsSyncing(true);
      try {
        // 병렬 실행으로 성능 최적화
        const [syncResult] = await Promise.all([
          roundRepository.syncRoundToSupabase(latestRound),
          roundRepository.setCurrentRoundId(null)
        ]);

        queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
        queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });

        const successMsg = syncResult.success
          ? "라운딩이 클라우드에 성공적으로 저장되었습니다."
          : "클라우드 저장에 실패했지만, 로컬 세션은 정상 종료되었습니다.";

        if (typeof window !== 'undefined') window.alert(successMsg);
        else Alert.alert("완료", successMsg);
      } catch (e) {
        if (typeof window !== 'undefined') window.alert("처리 중 오류가 발생했습니다.");
        else Alert.alert("오류", "처리 중 오류가 발생했습니다.");
      } finally {
        setIsSyncing(false);
      }
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(msg)) await proceedSync();
    } else {
      Alert.alert("라운딩 종료", msg, [
        { text: "취소", style: "cancel" },
        { text: "저장 및 종료", onPress: proceedSync }
      ]);
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
                onPress={() => router.push('/(tabs)/record')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <CheckCircle color="#007AFF" size={18} />
                <Text style={{ color: '#007AFF', fontWeight: '800', fontSize: 13 }}>새 라운딩</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  supabase.auth.signOut();
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
        {summary ? (
          <>
            {/* 메인 스코어 카드: 프리미엄 레이아웃 적용 */}
            <View style={styles.mainCard}>
              {/* 상단: 구장 정보 및 액션 버튼 */}
              <View style={styles.cardHeader}>
                <View style={styles.courseInfo}>
                  <Flag size={14} color="#B2C8DF" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel} numberOfLines={1}>{latestRound?.courseName}</Text>
                    {latestRound?.courseType && (
                      <Text style={styles.courseTypeLabel} numberOfLines={1}>{latestRound.courseType}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.actionHeader}>
                  <TouchableOpacity
                    style={styles.glassBtn}
                    onPress={() => setShowScoreCard(true)}
                  >
                    <LayoutGrid size={14} color="#fff" />
                    <Text style={styles.glassBtnText}>스코어카드</Text>
                  </TouchableOpacity>

                  {!isRoundComplete && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.glassBtn, { backgroundColor: 'rgba(255, 107, 107, 0.3)' }]}
                        onPress={async () => {
                          const doDelete = async () => {
                            if (latestRound) {
                              try {
                                await roundRepository.deleteRound(latestRound.id);
                                await queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
                                await queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
                                router.replace('/(tabs)/history');
                              } catch (e) {
                                console.error('Delete flow error:', e);
                                Alert.alert("삭제 실패", "기록을 삭제하는 중 오류가 발생했습니다.");
                              }
                            }
                          };

                          if (Platform.OS === 'web') {
                            if (window.confirm("이 라운딩 기록을 영구 삭제하시겠습니까?")) {
                              await doDelete();
                            }
                          } else {
                            Alert.alert("기록 삭제", "이 라운딩 기록을 영구 삭제하시겠습니까?", [
                              { text: "취소", style: "cancel" },
                              { text: "삭제", style: "destructive", onPress: doDelete }
                            ]);
                          }
                        }}
                      >
                        <XCircle size={14} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.glassBtn, { backgroundColor: 'rgba(0, 122, 255, 0.3)' }]}
                        onPress={async () => {
                          if (latestRound) {
                            await roundRepository.setCurrentRoundId(latestRound.id);
                            queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
                            router.push('/(tabs)/record');
                          }
                        }}
                      >
                        <Save size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* 중앙: 메인 스코어 섹션 */}
              <View style={styles.cardBody}>
                <View style={styles.mainScoreWrapper}>
                  <Text style={[styles.mainScoreValue, { color: relativeScore > 0 ? '#FF6B6B' : relativeScore < 0 ? '#38E54D' : '#FFFFFF' }]}>
                    {summary.totalScore}
                  </Text>
                  <View style={styles.relativeBadge}>
                    <Text style={[styles.relativeText, { color: relativeScore > 0 ? '#FF6B6B' : relativeScore < 0 ? '#38E54D' : '#adb5bd' }]}>
                      {`(${relativeScoreText})`}
                    </Text>
                    <Text style={styles.unitText}>타</Text>
                  </View>
                </View>

                {isRoundComplete && (
                  <TouchableOpacity
                    style={[styles.finishBtnPremium, isSyncing && { opacity: 0.7 }]}
                    onPress={handleFinishRound}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#0A2647" />
                    ) : (
                      <>
                        <CheckCircle size={16} color="#0A2647" />
                        <Text style={styles.finishBtnTextPremium}>라운딩 종료</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* 하단: 통합 진행 상태 바 */}
              <View style={styles.cardFooter}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>ROUND PROGRESS</Text>
                  <Text style={styles.progressValueText}>{latestRound?.holes.length} / 18 HOLES</Text>
                </View>
                <View style={styles.progressBarWrapper}>
                  <View style={[styles.progressFillElegant, { width: `${progressPercent}%` }]} />
                </View>
              </View>
            </View>

            {/* 전체 3x5 통계 그리드 (스코어 & 미스샷 패턴) */}
            <View style={styles.grid}>
              <StatItem icon={<Trophy size={22} color="#FFD700" />} label="이글+" value={summary.eagles} color="#FFD700" />
              <StatItem icon={<Star size={22} color="#FF6B6B" />} label="버디" value={summary.birdies} color="#FF6B6B" />
              <StatItem icon={<CheckCircle size={22} color="#38E54D" />} label="파" value={summary.pars} color="#38E54D" />

              <StatItem icon={<AlertCircle size={22} color="#6E85B7" />} label="보기" value={summary.bogeys} color="#6E85B7" />
              <StatItem icon={<XCircle size={22} color="#adb5bd" />} label="더블+" value={summary.doubles} color="#adb5bd" />
              <StatItem icon={<Target size={22} color="#007AFF" />} label="GIR" value={`${summary.girRate}%`} color="#007AFF" />

              <StatItem icon={<CornerRightDown size={22} color="#FF9500" />} label="평균 퍼트" value={(summary.totalPutt / (latestRound?.holes.length || 1)).toFixed(1)} color="#FF9500" />
              <StatItem icon={<Flag size={22} color="#FF3B30" />} label="OB" value={summary.obCount} color="#FF3B30" />
              <StatItem icon={<Droplets size={22} color="#FF9500" />} label="해저드" value={summary.penaltyCount} color="#FF9500" />

              <StatItem icon={<ArrowUpRight size={22} color="#FF6B6B" />} label="슬라이스" value={summary.missShots['슬라이스'] || 0} color="#FF6B6B" />
              <StatItem icon={<ArrowUpLeft size={22} color="#FF6B6B" />} label="훅" value={summary.missShots['훅'] || 0} color="#FF6B6B" />
              <StatItem icon={<Waves size={22} color="#FF6B6B" />} label="벙커" value={summary.missShots['벙커'] || 0} color="#FF6B6B" />

              <StatItem icon={<ArrowDown size={22} color="#FF6B6B" />} label="뒤땅" value={summary.missShots['뒤땅'] || 0} color="#FF6B6B" />
              <StatItem icon={<RotateCcw size={22} color="#FF6B6B" />} label="쓰리펏" value={summary.missShots['쓰리펏'] || 0} color="#FF6B6B" />
              <StatItem icon={<ArrowRight size={22} color="#FF6B6B" />} label="생크" value={summary.missShots['생크'] || 0} color="#FF6B6B" />
            </View>

            {/* 기타 분석 섹션 (필요 시 다른 정보 배치 가능) */}
            <View style={{ marginBottom: 20 }} />
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Trophy size={48} color="#B2C8DF" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>환영합니다!</Text>
            <Text style={styles.emptySubText}>저장된 라운딩 기록이 아직 없거나`n모든 라운딩이 마감되었습니다.`n새로운 라운딩을 시작해 보세요!</Text>
            <TouchableOpacity
              style={styles.startNewBtnLarge}
              onPress={() => router.push('/(tabs)/record')}
            >
              <Text style={styles.startNewBtnText}>새 라운딩 시작하기</Text>
              <ArrowRight size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 스코어카드 모달 (통합 - 시각화 개편) */}
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
                />
              </View>

              {/* 후반 코스 (10-18) */}
              <View style={styles.tableGroup}>
                <Text style={styles.coursePartTitle}>후반 코스</Text>
                <ScoreCardTable
                  startHole={10}
                  endHole={18}
                  holes={latestRound?.holes || []}
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

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowScoreCard(false)}
            >
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}


function StatItem({ icon, label, value, color }: { icon: ReactNode, label: string, value: string | number, color?: string }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.iconContainer, color ? { backgroundColor: color + '15' } : null]}>
        {icon}
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
  },
  mainCard: {
    backgroundColor: '#0A2647',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    // iOS Shadow
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
    // Android Elevation (fallback)
    elevation: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardLabel: {
    color: '#B2C8DF',
    fontSize: 13,
    fontWeight: '700',
  },
  courseTypeLabel: {
    color: 'rgba(178, 200, 223, 0.65)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  glassBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  mainScoreWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  mainScoreValue: {
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 80,
    letterSpacing: -2,
  },

  relativeBadge: {
    marginLeft: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  relativeText: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  unitText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2647',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6E85B7',
    fontWeight: '500',
    textAlign: 'center',
  },
  finishBtnPremium: {
    backgroundColor: '#38E54D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginTop: 15,
    boxShadow: '0 4px 12px rgba(56, 229, 77, 0.3)',
  },
  startNewBtnLarge: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 24,
    gap: 8,
    boxShadow: '0 8px 16px rgba(0, 122, 255, 0.2)',
  },
  startNewBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  finishBtnTextPremium: {
    color: '#0A2647',
    fontSize: 14,
    fontWeight: '900',
  },
  cardFooter: {
    marginTop: 'auto',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressValueText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  progressBarWrapper: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFillElegant: {
    height: '100%',
    backgroundColor: '#38E54D',
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    backgroundColor: '#fff',
    width: '31%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  },
  iconContainer: {
    marginBottom: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6E85B7',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A2647',
    textAlign: 'center',
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
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
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
    marginBottom: 16,
  },
  coursePartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#495057',
    marginBottom: 10,
    marginLeft: 4,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    height: 32,
  },
  cell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerCell: {
    backgroundColor: '#F8F9FA',
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ADB5BD',
  },
  rowLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#495057',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
  },
  blueText: {
    color: '#007AFF',
  },
  redText: {
    color: '#FF6B6B',
  },
  // 점수 심볼 스타일
  scoreCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSquare: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDouble: {
    borderWidth: 1, // 바깥 선
  },
  scoreCircleInner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  scoreSquareInner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  // 범례 (Legend)
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
  input: {
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212529',
    backgroundColor: '#f8f9fa',
    width: '100%',
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
  closeBtn: {
    backgroundColor: '#0A2647',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  }
});
