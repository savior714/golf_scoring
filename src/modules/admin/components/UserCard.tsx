import { Activity, Database, Mail, User, UserPlus } from 'lucide-react-native';
import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import type { UserProfile } from '../domain/admin.types';

export function getTimeAgo(dateStr: string) {
  if (!dateStr) return '기록 없음';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

export const UserCard = memo(({ item, index }: { item: UserProfile; index: number }) => (
  <Animated.View
    entering={FadeInDown.delay(Math.min(index * 50, 500))}
    layout={LinearTransition}
    style={styles.userCard}
  >
    <View style={styles.userHeader}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <User size={20} color="#6E85B7" />
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.userName}>{item.full_name}</Text>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        <View style={styles.emailRow}>
          <Mail size={12} color="#adb5bd" style={{ marginRight: 4 }} />
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.roundsBadge}>
        <Database size={12} color="#0A2647" style={{ marginRight: 4 }} />
        <Text style={styles.roundsCount}>{item.rounds_count ?? 0} Rounds</Text>
      </View>
    </View>

    <View style={styles.userFooter}>
      <View style={styles.footerInfo}>
        <UserPlus size={12} color="#adb5bd" style={{ marginRight: 4 }} />
        <Text style={styles.dateLabel}>가입:</Text>
        <Text style={styles.dateValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.footerInfo}>
        <Activity size={12} color="#2ECC71" style={{ marginRight: 4 }} />
        <Text style={styles.dateLabel}>접속:</Text>
        <Text style={styles.dateValue}>{getTimeAgo(item.last_active_at)}</Text>
      </View>
    </View>
  </Animated.View>
));

export function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        {icon}
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212529',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '500',
  },
  adminBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4338CA',
    textTransform: 'uppercase',
  },
  roundsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roundsCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A2647',
  },
  userFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
    gap: 16,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    color: '#adb5bd',
    marginRight: 4,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 11,
    color: '#495057',
    fontWeight: '700',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 11,
    color: '#6E85B7',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A2647',
  },
});
