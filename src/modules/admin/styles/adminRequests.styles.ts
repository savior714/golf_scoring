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
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  status_pending: { backgroundColor: '#FEF3C7' },
  status_completed: { backgroundColor: '#DCFCE7' },
  status_rejected: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusText_pending: { color: '#B45309' },
  statusText_completed: { color: '#166534' },
  statusText_rejected: { color: '#991B1B' },
  dateText: { fontSize: 12, color: '#adb5bd', fontWeight: '500' },
  clubInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2647',
  },
  userSection: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
  },
  userEmail: {
    fontSize: 12,
    color: '#6E85B7',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6E85B7',
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
  clubIcon: {
    marginRight: 8,
  },
  userIcon: {
    marginRight: 6,
  },
  mailIcon: {
    marginRight: 6,
  },
  emptyIcon: {
    marginBottom: 12,
  },
});
