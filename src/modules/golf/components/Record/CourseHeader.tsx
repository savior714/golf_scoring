import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

interface CourseHeaderProps {
    clubName: string;
    outCourseName: string;
    inCourseName: string;
    distanceMeter?: number;
    holeNumber: number;
    /** 동기화 상태 — 우측 상단 아이콘 표시용 */
    syncStatus?: SyncStatus;
    /** 진행률 0~100 */
    progressPercentage?: number;
    /** 진행률 레이블 ex) "12 / 18 Holes" */
    progressLabel?: string;
}

export const CourseHeader: React.FC<CourseHeaderProps> = React.memo(({
    clubName,
    outCourseName,
    inCourseName,
    distanceMeter,
    holeNumber,
    syncStatus,
    progressPercentage,
    progressLabel,
}) => {
    // ProgressBar 애니메이션
    const animatedWidth = useSharedValue(0);

    useEffect(() => {
        if (progressPercentage !== undefined) {
            animatedWidth.value = withSpring(Math.min(100, Math.max(0, progressPercentage)), {
                damping: 15,
                stiffness: 80,
            });
        }
    }, [progressPercentage, animatedWidth]);

    const animatedBarStyle = useAnimatedStyle(() => ({
        width: `${animatedWidth.value}%`,
    }));

    const isShowProgress = progressPercentage !== undefined;

    return (
        <View style={styles.container}>
            {/* 상단 행: 홀 정보 + 동기화 아이콘 */}
            <View style={styles.topRow}>
                <View style={styles.holeInfo}>
                    <Text style={styles.holeLabel}>HOLE</Text>
                    <Text style={styles.holeNumber}>{holeNumber}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.clubInfo}>
                    <Text style={styles.clubName} numberOfLines={1}>{clubName}</Text>
                    <View style={styles.courseRow}>
                        <Text style={styles.courseName}>{outCourseName}-{inCourseName}</Text>
                        {distanceMeter !== undefined && distanceMeter > 0 && (
                            <View style={styles.distanceBadge}>
                                <Text style={styles.distanceValue}>{distanceMeter}m</Text>
                            </View>
                        )}
                    </View>
                </View>
                {/* 동기화 상태 아이콘 */}
                {syncStatus === 'syncing' && (
                    <ActivityIndicator size="small" color="#007AFF" style={styles.syncIcon} />
                )}
                {syncStatus === 'synced' && (
                    <View style={[styles.syncDot, { backgroundColor: '#28a745' }]} />
                )}
                {syncStatus === 'failed' && (
                    <View style={[styles.syncDot, { backgroundColor: '#FF3B30' }]} />
                )}
            </View>

            {/* 하단: 진행률 바 */}
            {isShowProgress && (
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        {progressLabel && (
                            <Text style={styles.progressLabel}>{progressLabel}</Text>
                        )}
                        <Text style={styles.progressPercent}>
                            {Math.round(progressPercentage ?? 0)}%
                        </Text>
                    </View>
                    <View style={styles.barBackground}>
                        <Animated.View style={[styles.barFill, animatedBarStyle]} />
                    </View>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    holeInfo: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 10,
    },
    holeLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#ADB5BD',
        letterSpacing: 1,
    },
    holeNumber: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0A2647',
        marginTop: -2,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#E9ECEF',
        marginRight: 12,
    },
    clubInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    clubName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0A2647',
        marginBottom: 2,
    },
    courseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    courseName: {
        fontSize: 12,
        color: '#6E85B7',
        fontWeight: '600',
    },
    distanceBadge: {
        backgroundColor: '#F1F3F5',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    distanceValue: {
        fontSize: 11,
        fontWeight: '800',
        color: '#495057',
    },
    syncIcon: {
        marginLeft: 8,
    },
    syncDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    progressSection: {
        marginTop: 10,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6E85B7',
    },
    progressPercent: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ADB5BD',
    },
    barBackground: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
    },
    barFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#38E54D',
    },
});
