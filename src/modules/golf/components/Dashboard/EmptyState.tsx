import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Trophy, ArrowRight } from 'lucide-react-native';

interface EmptyStateProps {
  onStartNew: () => void;
}

export function EmptyState({ onStartNew }: EmptyStateProps) {
  return (
    <View style={styles.emptyCard}>
      <Trophy size={48} color="#B2C8DF" style={{ marginBottom: 16 }} />
      <Text style={styles.emptyText}>환영합니다!</Text>
      <Text style={styles.emptySubText}>저장된 라운딩 기록이 아직 없거나
모든 라운딩이 마감되었습니다.
새로운 라운딩을 시작해 보세요!</Text>
      <TouchableOpacity
        style={styles.startNewBtnLarge}
        onPress={onStartNew}
      >
        <Text style={styles.startNewBtnText}>새 라운딩 시작하기</Text>
        <ArrowRight size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
  startNewBtnLarge: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 24,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  startNewBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});