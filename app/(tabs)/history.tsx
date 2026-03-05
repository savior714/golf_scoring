/**
 * @file app/(tabs)/history.tsx
 * @description 과거 라운딩 기록 리스트 및 요약 조회
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import {
    Calendar,
    ChevronRight,
    CloudUpload,
    Edit3,
    MapPin,
    Trash2,
    Trophy
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roundRepository } from '../../src/modules/golf/golf.repository';
import { golfService } from '../../src/modules/golf/golf.service';
import { GolfRound } from '../../src/modules/golf/golf.types';

export default function HistoryScreen() {
    const router = useRouter();
    const [isSyncing, setIsSyncing] = useState(false);
    const { data: rounds, isLoading, refetch: refetchRounds } = useQuery({
        queryKey: ['golf_rounds'],
        queryFn: async () => {
            const allRounds = await roundRepository.getAllRounds();
            return allRounds.sort((a, b) => b.id.localeCompare(a.id));
        },
    });

    const queryClient = useQueryClient();

    // 탭 진입 시마다 자동 동기화 실행
    useFocusEffect(
        useCallback(() => {
            const autoSync = async () => {
                try {
                    await roundRepository.pullRoundsFromSupabase();
                    refetchRounds();
                } catch (e) {
                    console.error('Auto sync failed on focus', e);
                }
            };
            autoSync();
        }, [])
    );

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // 1. 클라우드에서 최신 데이터 가져오기 (Pull)
            const pullRes = await roundRepository.pullRoundsFromSupabase();

            // 2. 로컬 데이터를 클라우드로 전송 (Push)
            const pushRes = await roundRepository.syncAllLocalRounds();

            await refetchRounds();

            if (pullRes.success && pushRes.errors.length === 0) {
                Alert.alert('동기화 완료', `클라우드에서 ${pullRes.count}개의 기록을 가져오고, 로컬의 기록을 모두 백업했습니다.`);
            } else {
                Alert.alert('동기화 부분 성공', `가져오기: ${pullRes.count}개, 업로드 성공: ${pushRes.success}개. 일부 에러가 발생했을 수 있습니다.`);
            }
        } catch (error) {
            Alert.alert('오류', '동기화 중 에러가 발생했습니다.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleEditRound = async (roundId: string) => {
        await roundRepository.setCurrentRoundId(roundId);
        queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
        router.push('/(tabs)/record');
    };

    const handleDeleteRound = async (roundId: string) => {
        const confirmDelete = () => {
            return new Promise<boolean>((resolve) => {
                if (Platform.OS === 'web') {
                    resolve(window.confirm('이 라운딩 기록을 영구 삭제하시겠습니까?'));
                } else {
                    Alert.alert('기록 삭제', '이 라운딩 기록을 영구 삭제하시겠습니까?', [
                        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
                        { text: '삭제', style: 'destructive', onPress: () => resolve(true) }
                    ]);
                }
            });
        };

        if (await confirmDelete()) {
            try {
                await roundRepository.deleteRound(roundId);
                queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
                queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
            } catch (e) {
                console.error('Delete error:', e);
                Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
            }
        }
    };

    const renderItem = ({ item }: { item: GolfRound }) => {
        const summary = golfService.calculateSummary(item.holes);
        const relativeScore = summary.totalScore - summary.totalPar;
        const relativeScoreText = relativeScore > 0 ? `+${relativeScore}` : relativeScore < 0 ? `${relativeScore}` : 'E';

        return (
            <View style={styles.historyCard}>
                <View style={styles.cardTop}>
                    <View style={styles.dateContainer}>
                        <Calendar size={14} color="#6E85B7" />
                        <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: relativeScore > 0 ? '#FFF0F0' : relativeScore < 0 ? '#E8FBF0' : '#F1F3F5' }]}>
                        <Text style={[styles.scoreBadgeText, { color: relativeScore > 0 ? '#FF6B6B' : relativeScore < 0 ? '#38E54D' : '#6c757d' }]}>
                            {relativeScoreText}
                        </Text>
                    </View>
                </View>

                <View style={styles.courseContainer}>
                    <View style={styles.courseHeader}>
                        <MapPin size={18} color="#0A2647" />
                        <View>
                            <Text style={styles.courseName}>{item.courseName}</Text>
                            {item.courseType && <Text style={styles.courseType}>{item.courseType}</Text>}
                        </View>
                    </View>
                    <Text style={styles.totalScore}>{summary.totalScore} <Text style={styles.scoreUnit}>타</Text></Text>
                </View>

                <View style={styles.statRow}>
                    <View style={styles.miniStat}>
                        <Trophy size={14} color="#FFD700" />
                        <Text style={styles.miniStatText}>버디 {summary.birdies}</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <View style={[styles.dot, { backgroundColor: '#38E54D' }]} />
                        <Text style={styles.miniStatText}>PAR {summary.pars}</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <View style={[styles.dot, { backgroundColor: '#007AFF' }]} />
                        <Text style={styles.miniStatText}>GIR {summary.girRate}%</Text>
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#E9ECEF' }]}
                        onPress={() => router.push({ pathname: '/(tabs)', params: { roundId: item.id } })}
                    >
                        <ChevronRight size={18} color="#6E85B7" />
                        <Text style={styles.actionBtnText}>보기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#007AFF20', backgroundColor: '#007AFF08' }]}
                        onPress={() => handleEditRound(item.id)}
                    >
                        <Edit3 size={16} color="#007AFF" />
                        <Text style={[styles.actionBtnText, { color: '#007AFF' }]}>수정</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#FF6B6B20', backgroundColor: '#FF6B6B08' }]}
                        onPress={() => handleDeleteRound(item.id)}
                    >
                        <Trash2 size={16} color="#FF6B6B" />
                        <Text style={[styles.actionBtnText, { color: '#FF6B6B' }]}>삭제</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: '라운딩 히스토리',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleSync} disabled={isSyncing} style={{ marginRight: 15 }}>
                            <CloudUpload size={24} color={isSyncing ? '#adb5bd' : '#0A2647'} />
                        </TouchableOpacity>
                    )
                }}
            />
            <FlatList
                data={rounds}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading || isSyncing}
                        onRefresh={async () => {
                            await roundRepository.pullRoundsFromSupabase();
                            refetchRounds();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>아직 종료된 라운딩이 없습니다.</Text>
                        <Text style={styles.emptySubText}>18홀을 모두 기록하고 '종료'를 눌러보세요!</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        paddingBottom: 16,
        marginBottom: 16,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 14,
        color: '#6E85B7',
        fontWeight: '600',
    },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreBadgeText: {
        fontSize: 14,
        fontWeight: '900',
    },
    courseContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    courseName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0A2647',
    },
    courseType: {
        fontSize: 12,
        color: '#6E85B7',
        fontWeight: '600',
        marginTop: 2,
    },
    totalScore: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0A2647',
    },
    scoreUnit: {
        fontSize: 16,
        fontWeight: '600',
        color: '#adb5bd',
    },
    statRow: {
        flexDirection: 'row',
        gap: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
        paddingTop: 12,
    },
    miniStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    miniStatText: {
        fontSize: 13,
        color: '#495057',
        fontWeight: '700',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    chevronContainer: {
        position: 'absolute',
        right: 15,
        top: '50%',
        marginTop: 0,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
        paddingTop: 14,
        marginTop: 14,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        gap: 6,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6E85B7',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
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
});
