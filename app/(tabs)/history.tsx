/**
 * @file app/(tabs)/history.tsx
 * @description 과거 라운딩 기록 리스트 및 요약 조회
 */

import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Calendar, ChevronRight, CloudUpload, MapPin, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GolfRound } from '../../src/domains/golf';
import { roundRepository } from '../../src/repositories/roundRepository';
import { golfService } from '../../src/services/golfService';

export default function HistoryScreen() {
    const router = useRouter();
    const [isSyncing, setIsSyncing] = useState(false);
    const { data: rounds, isLoading, refetch } = useQuery({
        queryKey: ['golf_rounds'],
        queryFn: async () => {
            const allRounds = await roundRepository.getAllRounds();
            return allRounds.sort((a, b) => b.id.localeCompare(a.id));
        },
    });

    const handleSync = async () => {
        if (!rounds || rounds.length === 0) {
            Alert.alert('알림', '동기화할 데이터가 없습니다.');
            return;
        }

        Alert.alert(
            '클라우드 동기화',
            `현재 로컬에 저장된 ${rounds.length}개의 라운딩 기록을 Supabase로 전송하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '전송',
                    onPress: async () => {
                        setIsSyncing(true);
                        try {
                            const result = await roundRepository.syncAllLocalRounds();
                            if (result.errors.length === 0) {
                                Alert.alert('성공', '모든 기록이 안전하게 클라우드에 저장되었습니다.');
                            } else {
                                Alert.alert('일부 실패', `${result.total}개 중 ${result.success}개 성공. 에러를 확인해주세요.`);
                                console.error('Sync errors:', result.errors);
                            }
                        } catch (error) {
                            Alert.alert('오류', '동기화 중 에러가 발생했습니다.');
                        } finally {
                            setIsSyncing(false);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: GolfRound }) => {
        const summary = golfService.calculateSummary(item.holes);
        const relativeScore = summary.totalScore - summary.totalPar;
        const relativeScoreText = relativeScore > 0 ? `+${relativeScore}` : relativeScore < 0 ? `${relativeScore}` : 'E';

        return (
            <TouchableOpacity
                style={styles.historyCard}
                onPress={() => router.push({ pathname: '/(tabs)', params: { roundId: item.id } })}
            >
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
                        <Text style={styles.courseName}>{item.courseName}</Text>
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

                <View style={styles.chevronContainer}>
                    <ChevronRight size={20} color="#adb5bd" />
                </View>
            </TouchableOpacity>
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
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
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
