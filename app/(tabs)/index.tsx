/**
 * @file app/(tabs)/index.tsx
 * @description 라운딩 요약 대시보드
 */

import { roundRepository } from '@/src/repositories/roundRepository';
import { golfService } from '@/src/services/golfService';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Activity, Award, Target, TrendingUp } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { data: rounds, isLoading, refetch } = useQuery({
    queryKey: ['golf_rounds'],
    queryFn: () => roundRepository.getAllRounds(),
  });

  const latestRound = rounds && rounds.length > 0 ? rounds[0] : null;
  const summary = latestRound ? golfService.calculateSummary(latestRound) : null;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: '골프 대시보드' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Text style={styles.sectionTitle}>최근 라운딩 요약</Text>

        {summary ? (
          <View>
            <View style={styles.mainCard}>
              <Text style={styles.courseName}>{latestRound?.courseName}</Text>
              <Text style={styles.dateText}>{latestRound?.date}</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.totalScore}>{summary.totalScore}</Text>
                <Text style={styles.scoreUnit}>타</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <StatCard icon={<Award color="#FF9500" />} label="버디" value={summary.birdies} color="#FF9500" />
              <StatCard icon={<Target color="#34C759" />} label="GIR" value={`${summary.girRate}%`} color="#34C759" />
              <StatCard icon={<TrendingUp color="#007AFF" />} label="퍼트" value={summary.totalPutt} color="#007AFF" />
              <StatCard icon={<Activity color="#FF3B30" />} label="벌타" value={summary.obCount} color="#FF3B30" />
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>저장된 라운딩 기록이 없습니다.</Text>
            <Text style={styles.emptySubText}>지금 바로 첫 라운딩을 기록해보세요!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 20,
  },
  mainCard: {
    backgroundColor: '#212529',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 10px 20px rgba(0,0,0,0.15)',
  },
  courseName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dateText: {
    color: '#ADB5BD',
    fontSize: 14,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  totalScore: {
    color: '#FFF',
    fontSize: 64,
    fontWeight: '900',
  },
  scoreUnit: {
    color: '#FFF',
    fontSize: 20,
    marginLeft: 8,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFF',
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 4px 10px rgba(0,0,0,0.05)',
  },
  iconBox: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.05)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#495057',
  },
  emptySubText: {
    fontSize: 14,
    color: '#ADB5BD',
    marginTop: 8,
  }
});
