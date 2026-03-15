import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCentered: {
    padding: 40,
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#adb5bd',
    fontWeight: '600',
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A2647',
    marginTop: 8,
  },
  blockedSub: {
    fontSize: 14,
    color: '#6E85B7',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  retryBtn: {
    padding: 4,
  },
  blockedIcon: {
    marginBottom: 16,
  },
  emptyIcon: {
    marginBottom: 12,
  },
});
