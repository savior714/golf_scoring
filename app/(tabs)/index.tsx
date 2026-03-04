/**
 * @file app/(tabs)/index.tsx
 * @description 라운딩 실시간 스코어카드 및 요약 리더보드
 */

import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Award, Hash, Target, Zap } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roundRepository } from '../../src/repositories/roundRepository';
import { golfService } from '../../src/services/golfService';

// 임시 데이터 (실제 데이터는 Repository와 연결 예정)
const MOCK_SUMMARY = {
  totalScore: 78,
  birdies: 2,
  pars: 10,
  girRate: 65,
  avgPutt: 1.8,
  obCount: 1,
  penaltyCount: 2, // Penalty 추가
};

export default function LeaderboardScreen() {
  const { data: rounds, isLoading, refetch } = useQuery({
    queryKey: ['golf_rounds'],
    queryFn: () => roundRepository.getAllRounds(),
  });

  const latestRound = rounds && rounds.length > 0 ? rounds[0] : null;
  const summary = latestRound ? golfService.calculateSummary(latestRound.holes) : null;
  const progressPercent = latestRound ? Math.round((latestRound.holes.length / 18) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: '실시간 리더보드' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {summary ? (
          <>
            {/* 메인 스코어 카드: 스코어 및 진행 상황 통합 */}
            <View style={styles.mainCard}>
              <View style={styles.mainCardContent}>
                {/* 왼쪽: 스코어 정보 */}
                <View style={styles.scoreSection}>
                  <Text style={styles.cardLabel}>{latestRound?.courseName}</Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreValue}>{summary.totalScore}</Text>
                    <Text style={styles.scoreUnit}>타</Text>
                  </View>
                </View>

                {/* 오른쪽: 진행 상황 정보 */}
                <View style={styles.progressSection}>
                  <Text style={[styles.cardLabel, { textAlign: 'right' }]}>진행 상황</Text>
                  <View style={styles.progressContainerInline}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressTextHole}>{latestRound?.holes.length} / 18 홀</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 전체 3x5 통계 그리드 (스코어 & 미스샷 패턴) */}
            <View style={styles.grid}>
              <StatItem icon={<Award size={22} color="#FFD700" />} label="이글+" value={summary.eagles} color="#FFD700" />
              <StatItem icon={<Award size={22} color="#FF6B6B" />} label="버디" value={summary.birdies} color="#FF6B6B" />
              <StatItem icon={<Hash size={22} color="#38E54D" />} label="파" value={summary.pars} color="#38E54D" />

              <StatItem icon={<Hash size={22} color="#6E85B7" />} label="보기" value={summary.bogeys} color="#6E85B7" />
              <StatItem icon={<Hash size={22} color="#adb5bd" />} label="더블+" value={summary.doubles} color="#adb5bd" />
              <StatItem icon={<Target size={22} color="#007AFF" />} label="GIR" value={`${summary.girRate}%`} color="#007AFF" />

              <StatItem icon={<Zap size={22} color="#FF9500" />} label="평균 퍼트" value={(summary.totalPutt / (latestRound?.holes.length || 1)).toFixed(1)} color="#FF9500" />
              <StatItem icon={<Target size={22} color="#FF3B30" />} label="OB" value={summary.obCount} color="#FF3B30" />
              <StatItem icon={<Zap size={22} color="#FF9500" />} label="해저드" value={summary.penaltyCount} color="#FF9500" />

              <StatItem icon={<Zap size={22} color="#FF6B6B" />} label="슬라이스" value={summary.missShots['슬라이스'] || 0} color="#FF6B6B" />
              <StatItem icon={<Zap size={22} color="#FF6B6B" />} label="훅" value={summary.missShots['훅'] || 0} color="#FF6B6B" />
              <StatItem icon={<Zap size={22} color="#FF6B6B" />} label="탑볼" value={summary.missShots['탑볼'] || 0} color="#FF6B6B" />

              <StatItem icon={<Zap size={22} color="#FF6B6B" />} label="뒤땅" value={summary.missShots['뒤땅'] || 0} color="#FF6B6B" />
              <StatItem icon={<Zap size={22} color="#FF6B6B" />} label="뽕샷" value={summary.missShots['뽕샷'] || 0} color="#FF6B6B" />
              <StatItem icon={<Zap size={22} color="#FF6B6B" />} label="생크" value={summary.missShots['생크'] || 0} color="#FF6B6B" />
            </View>

            {/* 기타 분석 섹션 (필요 시 다른 정보 배치 가능) */}
            <View style={{ marginBottom: 20 }} />
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>진행 중인 라운딩이 없습니다.</Text>
            <Text style={styles.emptySubText}>기록 탭에서 새로운 라운딩을 시작하세요!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ icon, label, value, color }: { icon: any, label: string, value: string | number, color?: string }) {
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreSection: {
    flex: 3,
  },
  progressSection: {
    flex: 7,
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: '#B2C8DF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    color: '#38E54D',
    fontSize: 56,
    fontWeight: '900',
  },
  scoreUnit: {
    color: '#fff',
    fontSize: 24,
    marginLeft: 8,
    fontWeight: '700',
  },
  badgeRow: {
    marginTop: 20,
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    marginBottom: 8,
    backgroundColor: '#F0F4F8',
    padding: 8,
    borderRadius: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#6E85B7',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2647',
    textAlign: 'center',
  },
  analysisSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2647',
    marginBottom: 16,
  },
  progressContainerInline: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38E54D',
    borderRadius: 4,
  },
  progressTextHole: {
    fontSize: 14,
    color: '#B2C8DF',
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
});
