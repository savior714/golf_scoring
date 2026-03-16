import { View, StyleSheet } from 'react-native';
import Trophy from 'lucide-react-native/dist/icons/trophy';
import Star from 'lucide-react-native/dist/icons/star';
import CheckCircle from 'lucide-react-native/dist/icons/circle-check';
import AlertCircle from 'lucide-react-native/dist/icons/circle-alert';
import XCircle from 'lucide-react-native/dist/icons/circle-x';
import Target from 'lucide-react-native/dist/icons/target';
import CornerRightDown from 'lucide-react-native/dist/icons/corner-right-down';
import Flag from 'lucide-react-native/dist/icons/flag';
import Droplets from 'lucide-react-native/dist/icons/droplets';
import ArrowUpRight from 'lucide-react-native/dist/icons/arrow-up-right';
import ArrowUpLeft from 'lucide-react-native/dist/icons/arrow-up-left';
import Waves from 'lucide-react-native/dist/icons/waves';
import ArrowDown from 'lucide-react-native/dist/icons/arrow-down';
import RotateCcw from 'lucide-react-native/dist/icons/rotate-ccw';
import ArrowRight from 'lucide-react-native/dist/icons/arrow-right';
import { StatItem } from './StatItem';
import { GolfRound, RoundSummary } from '../../golf.types';

interface StatGridProps {
  summary: RoundSummary;
  latestRound: GolfRound;
}

export function StatGrid({ summary, latestRound }: StatGridProps) {
  return (
    <View style={styles.grid}>
      <StatItem icon={<Trophy size={18} color="#FFD700" />} label="이글+" value={summary.eagles} color="#FFD700" />
      <StatItem icon={<Star size={18} color="#FF6B6B" />} label="버디" value={summary.birdies} color="#FF6B6B" />
      <StatItem icon={<CheckCircle size={18} color="#38E54D" />} label="파" value={summary.pars} color="#38E54D" />

      <StatItem icon={<AlertCircle size={18} color="#6E85B7" />} label="보기" value={summary.bogeys} color="#6E85B7" />
      <StatItem icon={<XCircle size={18} color="#adb5bd" />} label="더블+" value={summary.doubleBogeys} color="#adb5bd" />
      <StatItem icon={<Target size={18} color="#007AFF" />} label="GIR" value={`${summary.girRate}%`} color="#007AFF" />

      <StatItem icon={<CornerRightDown size={18} color="#FF9500" />} label="평균 퍼트" value={(summary.totalPutt / (latestRound?.holes.length || 1)).toFixed(1)} color="#FF9500" />
      <StatItem icon={<Flag size={18} color="#FF3B30" />} label="OB" value={summary.obCount} color="#FF3B30" />
      <StatItem icon={<Droplets size={18} color="#FF9500" />} label="해저드" value={summary.penaltyCount} color="#FF9500" />

      <StatItem icon={<ArrowUpRight size={18} color="#FF6B6B" />} label="슬라이스" value={summary.missShots['슬라이스'] || 0} color="#FF6B6B" />
      <StatItem icon={<ArrowUpLeft size={18} color="#FF6B6B" />} label="훅" value={summary.missShots['훅'] || 0} color="#FF6B6B" />
      <StatItem icon={<Waves size={18} color="#FF6B6B" />} label="벙커" value={summary.missShots['벙커'] || 0} color="#FF6B6B" />

      <StatItem icon={<ArrowDown size={18} color="#FF6B6B" />} label="뒤땅/탑볼" value={summary.missShots['뒤땅/탑볼'] || 0} color="#FF6B6B" />
      <StatItem icon={<RotateCcw size={18} color="#FF6B6B" />} label="쓰리펏" value={summary.missShots['쓰리펏'] || 0} color="#FF6B6B" />
      <StatItem icon={<ArrowRight size={18} color="#FF6B6B" />} label="생크" value={summary.missShots['생크'] || 0} color="#FF6B6B" />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});