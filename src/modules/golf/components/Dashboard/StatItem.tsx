import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatItemProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

export function StatItem({ icon, label, value, color }: StatItemProps) {
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
  statItem: {
    backgroundColor: '#fff',
    width: '31%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 8,
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6E85B7',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A2647',
    textAlign: 'center',
  },
});