import { ChevronRight, ChevronDown } from 'lucide-react-native';
import { useState, useMemo, memo } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { ClubInfo } from '../../golf/golf.types';
import { golfService } from '../../golf/golf.service';
import { styles } from '../styles/adminImport.styles';

// 홀 거리 타입 (ClubInfo 내부 구조)
interface HoleDistance {
    teeColor: string;
    distanceMeter: number;
}
interface HoleData {
    holeNumber: number;
    par: number;
    distances: HoleDistance[];
}
interface CourseData {
    name: string;
    holes: HoleData[];
}

interface ClubPreviewCardProps {
    club: ClubInfo;
}

/**
 * 구장별 프리뷰 카드 — 코스 클릭 시 홀별 par/거리 테이블 전개
 */
export const ClubPreviewCard = memo(function ClubPreviewCard({ club }: ClubPreviewCardProps) {
    const validation = useMemo(() => golfService.validateClubData(club), [club]);
    const [expandedCourses, setExpandedCourses] = useState<Record<number, boolean>>({});

    const toggleCourse = (idx: number) => {
        setExpandedCourses(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <View style={styles.clubCard}>
            <View style={styles.clubHeader}>
                <Text style={styles.clubName}>{club.name || '이름 없음'}</Text>
                <View style={[
                    styles.validBadge,
                    !validation.isValid ? styles.validBadgeErr : 
                    validation.warnings.length > 0 ? { backgroundColor: '#FFFBEB' } : styles.validBadgeOk
                ]}>
                    <Text style={[
                        styles.validBadgeText,
                        !validation.isValid ? styles.validBadgeTextErr :
                        validation.warnings.length > 0 ? { color: '#B45309' } : styles.validBadgeTextOk
                    ]}>
                        {!validation.isValid ? '검증 실패' : 
                         validation.warnings.length > 0 ? '주의 필요' : '검증 통과'}
                    </Text>
                </View>
            </View>

            {club.address && <Text style={styles.clubAddress}>{club.address}</Text>}

            <View style={styles.courseList}>
                {(club.courses as unknown as CourseData[])?.map((course, cIdx) => {
                    const isExpanded = !!expandedCourses[cIdx];
                    const courseKey = course.name || `코스 ${cIdx + 1}`;
                    
                    // 이 코스에 해당하는 warnings 필터링
                    const courseWarnings = validation.warnings.filter(w => w.includes(`[${courseKey}]`));
                    const courseIssues = validation.issues.filter(i => i.includes(`[${courseKey}]`));

                    // 이 코스에 존재하는 티 색상 목록
                    const teeColors = [...new Set(
                        course.holes?.flatMap(h => h.distances?.map(d => d.teeColor) ?? []) ?? []
                    )];

                    return (
                        <View key={cIdx} style={styles.courseItem}>
                            {/* 코스 헤더 — 탭으로 접기/펼치기 */}
                            <TouchableOpacity
                                style={styles.courseItemHeader}
                                onPress={() => toggleCourse(cIdx)}
                                activeOpacity={0.7}
                            >
                                {isExpanded
                                    ? <ChevronDown size={14} color="#6E85B7" />
                                    : <ChevronRight size={14} color="#6E85B7" />
                                }
                                <Text style={styles.courseName}>{courseKey}</Text>
                                <Text style={styles.holeCount}>{course.holes?.length || 0}홀</Text>
                                <Text style={styles.expandHint}>{isExpanded ? '접기' : '데이터 확인'}</Text>
                            </TouchableOpacity>

                            {/* 홀별 par/거리 테이블 */}
                            {isExpanded && (
                                <View style={styles.holeTable}>
                                    {/* ...기존 테이블 코드 동일... (생략 방지를 위해 실제로는 전체를 교체하거나 부분 교체) */}
                                    <View style={styles.holeTableRow}>
                                        <Text style={[styles.holeTableCell, styles.holeTableHeader, { width: 32 }]}>홀</Text>
                                        <Text style={[styles.holeTableCell, styles.holeTableHeader, { width: 36 }]}>Par</Text>
                                        {teeColors.map(tc => (
                                            <Text key={tc} style={[styles.holeTableCell, styles.holeTableHeader, { flex: 1 }]}>
                                                {tc}(m)
                                            </Text>
                                        ))}
                                    </View>
                                    {course.holes?.map((hole, hIdx) => (
                                        <View key={hIdx} style={[
                                            styles.holeTableRow,
                                            hIdx % 2 === 0 ? styles.holeTableRowEven : styles.holeTableRowOdd,
                                        ]}>
                                            <Text style={[styles.holeTableCell, styles.holeTableHoleNum, { width: 32 }]}>{hole.holeNumber}</Text>
                                            <Text style={[styles.holeTableCell, styles.holeTablePar, { width: 36 }]}>{hole.par}</Text>
                                            {teeColors.map(tc => {
                                                const dist = hole.distances?.find(d => d.teeColor === tc);
                                                return (
                                                    <Text key={tc} style={[styles.holeTableCell, styles.holeTableDist, { flex: 1 }]}>
                                                        {dist ? dist.distanceMeter : '—'}
                                                    </Text>
                                                );
                                            })}
                                        </View>
                                    ))}
                                    {(() => {
                                        const parSum = course.holes?.reduce((s, h) => s + (h.par || 0), 0) ?? 0;
                                        const expected = (course.holes?.length ?? 0) === 9 ? 36 : 72;
                                        const isParOk = parSum === expected;
                                        return (
                                            <View style={[styles.holeTableRow, styles.parSumRow]}>
                                                <Text style={[styles.holeTableCell, styles.parSumLabel, { width: 32 + 36 }]}>합계</Text>
                                                <Text style={[
                                                    styles.holeTableCell,
                                                    styles.parSumValue,
                                                    { flex: 1 },
                                                    isParOk ? styles.parSumOkText : styles.parSumWarnText,
                                                ]}>
                                                    Par {parSum}{isParOk ? ' ✓' : ` ≠ ${expected} ⚠`}
                                                </Text>
                                            </View>
                                        );
                                    })()}
                                </View>
                            )}

                            {/* 경고 리스트 (Warnings: 노란색) */}
                            {courseWarnings.length > 0 && (
                                <View style={[styles.issuesList, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                                    {courseWarnings.map((warn, wIdx) => (
                                        <Text key={wIdx} style={[styles.issueItem, { color: '#B45309' }]}>⚠️ {warn}</Text>
                                    ))}
                                </View>
                            )}

                            {/* 에러 리스트 (Issues: 빨간색) */}
                            {courseIssues.length > 0 && (
                                <View style={styles.issuesList}>
                                    {courseIssues.map((issue, iIdx) => (
                                        <Text key={iIdx} style={styles.issueItem}>• {issue}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
});
