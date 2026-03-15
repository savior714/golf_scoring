/**
 * @file app/admin_requests.tsx
 * @description 관리자용 구장 추가 요청 관리 화면
 */

import { adminRepository, CourseRequest } from '@/src/modules/admin/admin.repository';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import { Stack } from 'expo-router';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  RefreshCcw,
  ChevronRight,
  User,
  Mail,
  AlertCircle,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { StatCard } from '../src/modules/admin/components/UserCard';
import { styles } from '../src/modules/admin/styles/adminRequests.styles';

export default function AdminRequestsScreen() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending').length;
    const completed = requests.filter((r) => r.status === 'completed').length;
    return { total, pending, completed };
  }, [requests]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getCourseRequests();
      if (isMounted.current) {
        setRequests(data);
      }
    } catch {
      if (isMounted.current) {
        setError('데이터 로딩 중 오류가 발생했습니다.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleUpdateStatus = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleConfirmStatus = useCallback(
    async (status: CourseRequest['status']) => {
      if (!selectedId) return;
      setSelectedId(null);
      const success = await adminRepository.updateRequestStatus(selectedId, status);
      if (success && isMounted.current) loadRequests();
    },
    [selectedId, requests, loadRequests],
  );

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
    }
  }, [isAdmin, loadRequests]);

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
        <Text style={styles.errorText}>접근 권한이 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: { item: CourseRequest; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      layout={LinearTransition}
      style={styles.requestCard}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            item.status === 'pending'
              ? styles.status_pending
              : item.status === 'completed'
                ? styles.status_completed
                : styles.status_rejected,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === 'pending'
                ? styles.statusText_pending
                : item.status === 'completed'
                  ? styles.statusText_completed
                  : styles.statusText_rejected,
            ]}
          >
            {item.status === 'pending' ? '대기 중' : item.status === 'completed' ? '완료' : '반려'}
          </Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>

      <View style={styles.clubInfoRow}>
        <MessageSquare size={18} color="#0A2647" style={styles.clubIcon} />
        <Text style={styles.clubName}>{item.requested_club_name}</Text>
      </View>

      <View style={styles.userSection}>
        <View style={styles.userInfoRow}>
          <User size={14} color="#6E85B7" style={styles.userIcon} />
          <Text style={styles.userName}>{item.profiles?.full_name || '알 수 없는 사용자'}</Text>
        </View>
        <View style={styles.userInfoRow}>
          <Mail size={12} color="#adb5bd" style={styles.mailIcon} />
          <Text style={styles.userEmail}>{item.profiles?.email || '-'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(item.id)}>
        <Text style={styles.actionBtnText}>상태 관리</Text>
        <ChevronRight size={14} color="#6E85B7" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '구장 추가 요청 관리',
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F8F9FA' },
        }}
      />

      <View style={styles.header}>
        <View style={styles.statsGrid}>
          <StatCard title="전체 요청" value={stats.total} icon={<MessageSquare size={16} color="#0A2647" />} />
          <StatCard title="대기 중" value={stats.pending} icon={<Clock size={16} color="#B45309" />} />
          <StatCard title="처리 완료" value={stats.completed} icon={<CheckCircle2 size={16} color="#2ECC71" />} />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadRequests}>
              <RefreshCcw size={14} color="#0A2647" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#0A2647" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <XCircle size={48} color="#E9ECEF" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>요청 내역이 없습니다.</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={loadRequests}
        />
      )}
      <Modal
        visible={selectedId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedId(null)}
        >
          <View onStartShouldSetResponder={() => true} style={styles.modalSheet}>
            <Text style={styles.modalTitle}>상태 변경</Text>
            <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleConfirmStatus('completed')}>
              <Text style={styles.modalActionText}>✅ 완료 처리</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleConfirmStatus('rejected')}>
              <Text style={[styles.modalActionText, styles.modalDestructiveText]}>❌ 반려</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSelectedId(null)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
