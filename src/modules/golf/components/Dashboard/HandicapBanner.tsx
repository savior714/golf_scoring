import { View, Text, StyleSheet } from 'react-native';
import { Trophy, CircleHelp } from 'lucide-react-native';

interface HandicapBannerProps {
  value: number | null;
  roundsCount: number;
}

export const HandicapBanner = ({ value, roundsCount }: HandicapBannerProps) => {
  if (value === null) {
    const minRequired = 5;
    const needed = minRequired - roundsCount;
    const message = roundsCount === 0 
      ? "최소 5경기의 기록이 필요합니다" 
      : `${needed}경기 더 기록하면 핸디캡 측정이 가능해요`;

    return (
      <View style={styles.container}>
        <View style={styles.leftContent}>
          <View style={styles.iconWrapper}>
            <CircleHelp size={16} color="#6E85B7" />
          </View>
          <View>
            <Text style={styles.title}>MY HANDICAP</Text>
            <Text style={styles.description}>{message}</Text>
          </View>
        </View>
      </View>
    );
  }

  const accuracyMessage = roundsCount < 5 
    ? "데이터가 쌓일수록 정확도가 올라갑니다" 
    : "최근 20경기 기준 USGA 방식 추정치";

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={[styles.iconWrapper, styles.successIcon]}>
          <Trophy size={16} color="#fff" />
        </View>
        <View>
          <Text style={styles.title}>ESTIMATED HANDICAP</Text>
          <Text style={styles.description}>{accuracyMessage}</Text>
        </View>
      </View>
      <View style={styles.valueWrapper}>
        <Text style={styles.value}>{value.toFixed(1)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Android Elevation
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    backgroundColor: '#0A2647',
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6E85B7',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A2647',
    marginTop: 2,
  },
  valueWrapper: {
    backgroundColor: '#38E54D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A2647',
  },
});
