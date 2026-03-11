import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { AdvancedStats } from '../../golf.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PatternHeatmapProps {
  stats: AdvancedStats[];
}

type Category = 'all' | 'iron' | 'driver';

export const PatternHeatmap: React.FC<PatternHeatmapProps> = ({ stats }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // 미스 샷 데이터 집계
  const aggregatedData = useMemo(() => {
    const counts: Record<string, number> = {
      '슬라이스': 0,
      '훅': 0,
      '뒤땅/탑볼': 0,
      '생크': 0,
      '벙커': 0,
      '쓰리펏': 0,
    };

    let totalMissCount = 0;
    stats.forEach(s => {
      const targetMap = 
        selectedCategory === 'iron' ? s.ironMissShots :
        selectedCategory === 'driver' ? s.driverMissShots :
        s.missShots;

      Object.entries(targetMap || {}).forEach(([pattern, count]) => {
        if (counts[pattern] !== undefined) {
          counts[pattern] += count;
          totalMissCount += count;
        }
      });
    });

    // 빈도순 정렬
    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { sorted, totalMissCount };
  }, [stats, selectedCategory]);

  if (!stats || stats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>데이터가 없습니다.</Text>
      </View>
    );
  }

  const maxFreq = Math.max(...aggregatedData.sorted.map(d => d.value)) || 1;

  return (
    <Animated.View 
      entering={FadeInDown.duration(800).delay(400)}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>미스 패턴 분석</Text>
          <Text style={styles.subtitle}>최근 5경기 데이터 기반</Text>
        </View>
      </View>

      {/* 상황별 탭 선택기 */}
      <View style={styles.tabContainer}>
        {(['all', 'iron', 'driver'] as Category[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.tabButton,
              selectedCategory === cat && styles.tabButtonActive
            ]}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              selectedCategory === cat && styles.tabTextActive
            ]}>
              {cat === 'all' ? '전체' : cat === 'iron' ? '아이언' : '드라이버'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View key={selectedCategory} entering={FadeIn.duration(400)} style={styles.chartArea}>
        {aggregatedData.totalMissCount === 0 ? (
          <View style={styles.innerEmpty}>
            <Text style={styles.innerEmptyText}>해당 상황의 미스 데이터가 없습니다.</Text>
          </View>
        ) : (
          aggregatedData.sorted.map((item, index) => {
            if (item.value === 0) return null;

            const barWidth = (item.value / maxFreq) * (SCREEN_WIDTH - 120);
            const barColor = index === 0 ? '#10B981' : index < 3 ? '#3B82F6' : '#ADB5BD';

            return (
              <View key={item.name} style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text style={styles.labelText}>{item.name}</Text>
                </View>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: barWidth, 
                        backgroundColor: barColor,
                      }
                    ]} 
                  />
                </View>
                <View style={styles.valueContainer}>
                  <Text style={styles.valueText}>{item.value}</Text>
                </View>
              </View>
            );
          })
        )}
      </Animated.View>

      {aggregatedData.totalMissCount > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedCategory === 'iron' ? '파3 홀' : selectedCategory === 'driver' ? '파4/5 홀' : '모든 홀'}에서 
            가장 주의해야 할 패턴은 <Text style={styles.highlight}>{aggregatedData.sorted[0].name}</Text>입니다.
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  subtitle: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    padding: 4,
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C757D',
  },
  tabTextActive: {
    color: '#1A1C1E',
  },
  chartArea: {
    gap: 12,
    minHeight: 120, // 탭 전환 시 높이 점프 방지
    justifyContent: 'center',
  },
  innerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  innerEmptyText: {
    fontSize: 13,
    color: '#ADB5BD',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainer: {
    width: 70,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  valueContainer: {
    width: 30,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  footerText: {
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 18,
  },
  highlight: {
    color: '#FF3B30',
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#ADB5BD',
    textAlign: 'center',
  },
});
