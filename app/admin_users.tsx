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
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsAdmin } from '../src/shared/components/useIsAdmin';
import { adminApplicationService } from '../src/modules/admin/application';
import { UserProfile } from '../src/modules/admin/domain/admin.types';
import { logger } from '../src/shared/utils/logger';
import { UserCard, StatCard } from '../src/modules/admin/components/UserCard';
import { styles } from '../src/modules/admin/styles/adminUsers.styles';

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
      const data = await adminApplicationService.getAllUsers();
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
        <AlertCircle size={48} color="#FF6B6B" style={styles.blockedIcon} />
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
              <Users size={48} color="#E9ECEF" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>사용자가 아직 없습니다.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
