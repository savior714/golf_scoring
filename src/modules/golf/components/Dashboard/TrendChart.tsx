/**
 * @file src/modules/golf/components/Dashboard/TrendChart.tsx
 * @description 최근 5경기 스코어 및 퍼트 추세를 시각화하는 차트 컴포넌트
 */

import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AdvancedStats } from '../../golf.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 120;
const CHART_PADDING = 20;

interface TrendChartProps {
  stats: AdvancedStats[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ stats }) => {
  if (!stats || stats.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>추세를 분석하려면 최소 2라운드 이상의 기록이 필요합니다.</Text>
      </View>
    );
  }

  const scores = stats.map((s) => s.totalScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 1;

  // 정규화된 좌표 계산
  const points = stats.map((s, i) => {
    const x = (i / (stats.length - 1)) * (SCREEN_WIDTH - 64 - CHART_PADDING * 2);
    const y = CHART_HEIGHT - ((s.totalScore - minScore) / scoreRange) * (CHART_HEIGHT - CHART_PADDING * 2) - CHART_PADDING;
    return { x, y, score: s.totalScore, date: s.date.slice(5) }; // MM-DD
  });

  return (
    <Animated.View 
      entering={FadeInDown.duration(800).delay(200)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>최근 5경기 트렌드</Text>
        <Text style={styles.avgText}>Avg: {Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}</Text>
      </View>

      <View style={styles.chartArea}>
        {/* 연결선 (View 기반 Line 구현) */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          return (
            <View
              key={`line-${i}`}
              style={[
                styles.line,
                {
                  width: distance,
                  left: prev.x + 8, // 점의 중심을 맞추기 위한 오프셋
                  top: prev.y + 12,
                  transform: [
                    { translateX: 0 },
                    { translateY: 0 },
                    { rotate: `${angle}rad` },
                  ],
                },
              ]}
            />
          );
        })}

        {/* 데이터 포인트 */}
        {points.map((p, i) => (
          <View key={`point-${i}`} style={[styles.pointWrapper, { left: p.x, top: p.y }]}>
            <View style={styles.point} />
            <Text style={styles.pointValue}>{p.score}</Text>
            <Text style={styles.pointDate}>{p.date}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginVertical: 12,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    // Android Elevation
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
  avgText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chartArea: {
    height: CHART_HEIGHT + 20,
    position: 'relative',
    marginTop: 10,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#007AFF20',
    transformOrigin: 'left top',
  },
  pointWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: 24,
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
    // 점의 그림자
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  pointValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A1C1E',
    marginTop: 4,
  },
  pointDate: {
    fontSize: 9,
    fontWeight: '500',
    color: '#ADB5BD',
    marginTop: 2,
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
