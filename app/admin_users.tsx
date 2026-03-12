/**
 * @file app/admin_users.tsx
 * @description 관리자용 사용자 관리 화면
 * - 전체 사용자 목록, 가입일, 라운드 수, 활성 상태 등을 시각화
 */

import { Stack } from 'expo-router';
import { Users, UserPlus, Activity, User, Mail, Database, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsAdmin } from '../src/shared/components/useIsAdmin';
import { adminRepository, UserProfile } from '../src/modules/admin/admin.repository';

export default function AdminUsersScreen() {
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const stats = useMemo(() => {
        const total = users.length;
        const activeToday = users.filter(u => {
            const lastActive = new Date(u.last_active_at).getTime();
            return Date.now() - lastActive < 24 * 60 * 60 * 1000;
        }).length;
        const withData = users.filter(u => (u.rounds_count ?? 0) > 0).length;
        return { total, activeToday, withData };
    }, [users]);

    const loadUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await adminRepository.getAllUsers();
            if (data.length === 0) {
                setError('사용자 데이터를 찾을 수 없습니다. (Migration 필요)');
            }
            setUsers(data);
        } catch (e: unknown) {
            setError('데이터 로딩 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
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

    const renderItem = ({ item, index }: { item: UserProfile; index: number }) => (
        <Animated.View 
            entering={FadeInDown.delay(index * 50)}
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
                    <Text style={styles.userName}>{item.full_name}</Text>
                    <View style={styles.emailRow}>
                        <Mail size={12} color="#adb5bd" style={{ marginRight: 4 }} />
                        <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                </View>
                <View style={styles.roundsBadge}>
                    <Database size={12} color="#0A2647" style={{ marginRight: 4 }} />
                    <Text style={styles.roundsCount}>{item.rounds_count} Rounds</Text>
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
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{ 
                title: '사용자 통계 및 관리',
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F8F9FA' },
            }} />

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
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
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

function getTimeAgo(dateStr: string) {
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
