import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text, View } from './Themed';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;   // e.g. "12 / 18 Holes"
  color?: string;
  backgroundColor?: string;
  height?: number;
}

/**
 * @component ProgressBar
 * @description 라운딩 진행률을 시각적으로 표시하는 프리미엄 애니메이션 프로그레스 바
 */
export function ProgressBar({ 
  progress, 
  label, 
  color = '#38E54D', 
  height = 6,
  backgroundColor
}: ProgressBarProps) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    // 0에서 목표치까지 부드러운 스프링 애니메이션 적용
    animatedProgress.value = withSpring(Math.min(100, Math.max(0, progress)), {
      damping: 15,
      stiffness: 80,
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      </View>
      <View 
        style={[
          styles.barBackground, 
          { height, borderRadius: height / 2 },
          backgroundColor ? { backgroundColor } : {}
        ]}
        lightColor="#F1F5F9"
        darkColor="rgba(255, 255, 255, 0.1)"
      >
        <Animated.View 
          style={[
            styles.barFill, 
            animatedStyle, 
            { backgroundColor: color, height, borderRadius: height / 2 }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.5,
  },
  barBackground: {
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    // width is animated
  },
});
