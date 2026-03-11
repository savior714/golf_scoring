import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Flag, LayoutGrid, CheckCircle } from 'lucide-react-native';
import { GolfRound, RoundSummary } from '../../golf.types';
import { getScoreColor } from '../../../../shared/utils/scoreUtils';

interface LeaderboardCardProps {
  latestRound: GolfRound;
  summary: RoundSummary;
  progressPercent: number | null;
  relativeScore: number;
  relativeScoreText: string;
  isRoundComplete: boolean;
  isSyncing: boolean;
  onShowScoreCard: () => void;
  onFinishRound: () => void;
}

export function LeaderboardCard({
  latestRound,
  summary,
  progressPercent,
  relativeScore,
  relativeScoreText,
  isRoundComplete,
  isSyncing,
  onShowScoreCard,
  onFinishRound,
}: LeaderboardCardProps) {
  return (
    <View style={styles.mainCard}>
      {/* Top: Course Info & Action Buttons */}
      <View style={styles.cardHeader}>
        <View style={styles.courseInfo}>
          <Flag size={14} color="#B2C8DF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel} numberOfLines={1}>{latestRound.courseName}</Text>
            {latestRound.courseType && (
              <Text style={styles.courseTypeLabel} numberOfLines={1}>{latestRound.courseType}</Text>
            )}
          </View>
        </View>

        <View style={styles.actionHeader}>
          <TouchableOpacity
            style={styles.glassBtn}
            onPress={onShowScoreCard}
          >
            <LayoutGrid size={14} color="#fff" />
            <Text style={styles.glassBtnText}>스코어카드</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Center: Main Score Section */}
      <View style={styles.cardBody}>
        <View style={styles.mainScoreWrapper}>
          <Text style={[styles.mainScoreValue, { color: getScoreColor(relativeScore, true) }]}>
            {summary.totalScore}
          </Text>
          <View style={styles.relativeBadge}>
            <Text style={[styles.relativeText, { color: getScoreColor(relativeScore, true) }]}>
              {relativeScoreText}
            </Text>
            <Text style={styles.unitText}>타</Text>
          </View>
        </View>

        {isRoundComplete && (
          <TouchableOpacity
            style={[styles.finishBtnPremium, isSyncing && { opacity: 0.7 }]}
            onPress={onFinishRound}
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

      {/* Bottom: Progress Bar */}
      <View style={styles.cardFooter}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>ROUND PROGRESS</Text>
          <Text style={styles.progressValueText}>{latestRound.holes.length} / 18 HOLES</Text>
        </View>
        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressFillElegant, { width: `${progressPercent || 0}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: '#0A2647',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    // Android Elevation
    elevation: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardLabel: {
    color: '#B2C8DF',
    fontSize: 12,
    fontWeight: '700',
  },
  courseTypeLabel: {
    color: 'rgba(178, 200, 223, 0.65)',
    fontSize: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 12,
  },
  mainScoreWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  mainScoreValue: {
    fontSize: 60,
    fontWeight: '900',
    lineHeight: 64,
    letterSpacing: -2,
  },
  relativeBadge: {
    marginLeft: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  relativeText: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  unitText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '700',
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
    // iOS Shadow
    shadowColor: '#38E54D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    // Android Elevation
    elevation: 5,
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
});