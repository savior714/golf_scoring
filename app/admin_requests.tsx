/**
 * @file app/admin_requests.tsx
 * @description 관리자용 구장 추가 요청 관리 화면
 */

import { Stack } from 'expo-router';
import { 
    MessageSquare, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    User, 
    Mail, 
    AlertCircle, 
    RefreshCw,
    ChevronRight
} from 'lucide-react-native';
import { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsAdmin } from '../src/shared/components/useIsAdmin';
import { adminRepository, CourseRequest } from '../src/modules/admin/admin.repository';

export default function AdminRequestsScreen() {
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
    const [requests, setRequests] = useState<CourseRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const stats = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter(r => r.status === 'pending').length;
        const completed = requests.filter(r => r.status === 'completed').length;
        return { total, pending, completed };
    }, [requests]);

    const loadRequests = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await adminRepository.getCourseRequests();
            setRequests(data);
        } catch (e: unknown) {
            setError('데이터 로딩 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, _currentStatus: string) => {
        Alert.alert(
            '상태 변경',
            '요청의 상태를 무엇으로 변경할까요?',
            [
                { text: '취소', style: 'cancel' },
                { 
                    text: '완료 처리', 
                    onPress: async () => {
                        const success = await adminRepository.updateRequestStatus(id, 'completed');
                        if (success) loadRequests();
                    }
                },
                { 
                    text: '반려', 
                    style: 'destructive',
                    onPress: async () => {
                        const success = await adminRepository.updateRequestStatus(id, 'rejected');
                        if (success) loadRequests();
                    }
                },
                { 
                    text: '대기로 복구', 
                    onPress: async () => {
                        const success = await adminRepository.updateRequestStatus(id, 'pending');
                        if (success) loadRequests();
                    }
                },
            ]
        );
    };

    useEffect(() => {
        if (isAdmin) loadRequests();
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

    const renderItem = ({ item, index }: { item: CourseRequest; index: number }) => (
        <Animated.View 
            entering={FadeInDown.delay(index * 50)}
            layout={LinearTransition}
            style={styles.requestCard}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                    <Text style={[styles.statusText, styles[`statusText_${item.status}`]]}>
                        {item.status === 'pending' ? '대기 중' : item.status === 'completed' ? '완료' : '반려'}
                    </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>

            <View style={styles.clubInfoRow}>
                <MessageSquare size={18} color="#0A2647" style={{ marginRight: 8 }} />
                <Text style={styles.clubName}>{item.requested_club_name}</Text>
            </View>

            <View style={styles.userSection}>
                <View style={styles.userInfoRow}>
                    <User size={14} color="#6E85B7" style={{ marginRight: 6 }} />
                    <Text style={styles.userName}>{item.profiles?.full_name || '알 수 없는 사용자'}</Text>
                </View>
                <View style={styles.userInfoRow}>
                    <Mail size={12} color="#adb5bd" style={{ marginRight: 6 }} />
                    <Text style={styles.userEmail}>{item.profiles?.email || '-'}</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleUpdateStatus(item.id, item.status)}
            >
                <Text style={styles.actionBtnText}>상태 관리</Text>
                <ChevronRight size={14} color="#6E85B7" />
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{ 
                title: '구장 추가 요청 관리',
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F8F9FA' },
            }} />

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
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <XCircle size={48} color="#E9ECEF" style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyText}>요청 내역이 없습니다.</Text>
                        </View>
                    }
                    refreshing={isLoading}
                    onRefresh={loadRequests}
                />
            )}
        </SafeAreaView>
    );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
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
    listContent: {
        padding: 20,
        paddingTop: 0,
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
