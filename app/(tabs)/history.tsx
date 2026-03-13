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
    MapPin,
    Trash2,
    Trophy
} from 'lucide-react-native';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Alert, FlatList, Platform, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../src/modules/golf/styles/history.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roundRepository } from '../../src/modules/golf/golf.repository';
import { golfService } from '../../src/modules/golf/golf.service';
import { GolfRound } from '../../src/modules/golf/golf.types';
import { getScoreColor, getScoreBackgroundColor, formatRelativeScore } from '../../src/shared/utils/scoreUtils';

// ============================================================
// [HistoryItem] 개별 라운드 카드 컴포넌트
// React.memo 적용: item, onView, onDelete의 참조가 동일하면 재렌더 차단
// ============================================================
interface HistoryItemProps {
    item: GolfRound;
    onView: (id: string) => void;
    onDelete: (id: string) => void;
}

const HistoryItem = memo(function HistoryItem({ item, onView, onDelete }: HistoryItemProps) {
    const summary = golfService.calculateSummary(item.holes);
    const relativeScore = summary.totalScore - summary.totalPar;
    const relativeScoreText = formatRelativeScore(relativeScore);

    return (
        <View style={styles.historyCard}>
            <View style={styles.cardTop}>
                <View style={styles.dateContainer}>
                    <Calendar size={14} color="#6E85B7" />
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreBackgroundColor(relativeScore) }]}>
                    <Text style={[styles.scoreBadgeText, { color: getScoreColor(relativeScore) }]}>
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
                    style={[styles.actionBtn, { borderColor: '#007AFF20', backgroundColor: '#007AFF08' }]}
                    onPress={() => onView(item.id)}
                >
                    <ChevronRight size={18} color="#007AFF" />
                    <Text style={[styles.actionBtnText, { color: '#007AFF' }]}>보기 / 수정</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#FF6B6B20', backgroundColor: '#FF6B6B08' }]}
                    onPress={() => onDelete(item.id)}
                >
                    <Trash2 size={16} color="#FF6B6B" />
                    <Text style={[styles.actionBtnText, { color: '#FF6B6B' }]}>삭제</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

// ============================================================
// [HistoryScreen] 메인 화면
// ============================================================
export default function HistoryScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const { data: rounds, isLoading, refetch: refetchRounds } = useQuery({
        queryKey: ['golf_rounds'],
        queryFn: async () => {
            const allRounds = await roundRepository.getAllRounds();
            return allRounds.sort((a, b) => b.id.localeCompare(a.id));
        },
        // Step 5.1.1: 로컬 AsyncStorage 기반 — invalidateQueries 명시적 호출로 캐시 무효화
        staleTime: Infinity,
    });

    // 탭 진입 시마다 자동 동기화 실행
    useFocusEffect(
        useCallback(() => {
            const autoSync = async () => {
                try {
                    await roundRepository.pullRoundsFromSupabase();
                    if (isMounted.current) {
                        refetchRounds();
                    }
                } catch (e) {
                    console.error('Auto sync failed on focus', e);
                }
            };
            autoSync();
        }, [refetchRounds])
    );

    const handleSync = useCallback(async () => {
        if (!isMounted.current) return;
        setIsSyncing(true);
        try {
            // 1. 클라우드에서 최신 데이터 가져오기 (Pull)
            const pullRes = await roundRepository.pullRoundsFromSupabase();

            // 2. 로컬 데이터를 클라우드로 전송 (Push)
            const pushRes = await roundRepository.syncAllLocalRounds();

            if (isMounted.current) {
                await refetchRounds();

                if (pullRes.success && pushRes.errors.length === 0) {
                    Alert.alert('동기화 완료', `클라우드에서 ${pullRes.count}개의 기록을 가져오고, 로컬의 기록을 모두 백업했습니다.`);
                } else {
                    Alert.alert('동기화 부분 성공', `가져오기: ${pullRes.count}개, 업로드 성공: ${pushRes.success}개. 일부 에러가 발생했을 수 있습니다.`);
                }
            }
        } catch {
            if (isMounted.current) {
                Alert.alert('오류', '동기화 중 에러가 발생했습니다.');
            }
        } finally {
            if (isMounted.current) {
                setIsSyncing(false);
            }
        }
    }, [refetchRounds]);

    const handleViewRound = useCallback(async (roundId: string) => {
        await roundRepository.setCurrentRoundId(roundId);
        queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
        router.push({ pathname: '/(tabs)/record', params: { source: 'history', mode: 'edit' } });
    }, [queryClient, router]);

    const handleDeleteRound = useCallback(async (roundId: string) => {
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
    }, [queryClient]);

    // Step 4.2.2: renderItem을 useCallback으로 안정화
    // handleViewRound, handleDeleteRound가 useCallback으로 안정화되어 있으므로
    // HistoryItem의 memo가 onView/onDelete Props 변경을 올바르게 감지함
    const renderItem = useCallback(({ item }: { item: GolfRound }) => (
        <HistoryItem
            item={item}
            onView={handleViewRound}
            onDelete={handleDeleteRound}
        />
    ), [handleViewRound, handleDeleteRound]);

    const keyExtractor = useCallback((item: GolfRound) => item.id, []);

    const handleRefresh = useCallback(async () => {
        await roundRepository.pullRoundsFromSupabase();
        refetchRounds();
    }, [refetchRounds]);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
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
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                // Step 4.2.3: FlatList 속성 튜닝
                // 초기 렌더 아이템 수를 5로 제한하여 첫 화면 진입 속도 개선
                initialNumToRender={5}
                // 배치당 최대 렌더 아이템 수: 스크롤 중 프레임 드랍 방지
                maxToRenderPerBatch={10}
                // 화면 크기의 5배 범위 내 아이템만 유지 (메모리 절약)
                windowSize={5}
                // 화면 밖 아이템을 언마운트하여 메모리 절약
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading || isSyncing}
                        onRefresh={handleRefresh}
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

