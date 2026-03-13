/**
 * @file app/admin_users.tsx
 * @description 관리자용 사용자 관리 화면
 * - 전체 사용자 목록, 가입일, 라운드 수, 활성 상태 등을 시각화
 */

import { Stack } from 'expo-router';
import { Users, Activity, Database, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsAdmin } from '../src/shared/components/useIsAdmin';
import { adminRepository, UserProfile } from '../src/modules/admin/admin.repository';
import { logger } from '../src/shared/utils/logger';
import { UserCard, StatCard } from '../src/modules/admin/components/UserCard';

export default function AdminUsersScreen() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      logger.info('[AdminUsers] UNMOUNTED');
    };
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const activeToday = users.filter((u) => {
      const lastActive = new Date(u.last_active_at).getTime();
      return Date.now() - lastActive < 24 * 60 * 60 * 1000;
    }).length;
    const withData = users.filter((u) => (u.rounds_count ?? 0) > 0).length;
    return { total, activeToday, withData };
  }, [users]);

  const loadUsers = async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getAllUsers();
      if (!isMounted.current) return;
      if (data.length === 0) {
        setError('사용자 데이터를 찾을 수 없습니다. (Migration 필요)');
      }
      setUsers(data);
    } catch (e: unknown) {
      logger.error('[AdminUsers] Load failed', e);
      if (isMounted.current) {
        setError('데이터 로딩 중 오류가 발생했습니다.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  if (isAdminLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0A2647" />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.centered}>
        <AlertCircle size={48} color="#FF6B6B" style={{ marginBottom: 16 }} />
        <Text style={styles.blockedTitle}>접근 권한 없음</Text>
        <Text style={styles.blockedSub}>관리자 계정으로 로그인해 주세요.</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: { item: UserProfile; index: number }) =>
    <UserCard item={item} index={index} />;

  const keyExtractor = (item: UserProfile) => item.id;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '사용자 통계 및 관리',
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F8F9FA' },
        }}
      />

      <View style={styles.header}>
        <View style={styles.statsGrid}>
          <StatCard title="전체 사용자" value={stats.total} icon={<Users size={16} color="#0A2647" />} />
          <StatCard title="오늘 활성" value={stats.activeToday} icon={<Activity size={16} color="#2ECC71" />} />
          <StatCard title="데이터 보유" value={stats.withData} icon={<Database size={16} color="#B45309" />} />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadUsers}>
              <RefreshCw size={14} color="#0A2647" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.listCentered}>
          <ActivityIndicator size="small" color="#0A2647" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color="#E9ECEF" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>사용자가 아직 없습니다.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
