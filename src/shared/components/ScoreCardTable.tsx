import { memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { HoleRecord } from '../../modules/golf/golf.types';
import { getScoreColor } from '../utils/scoreUtils';

interface ScoreCardTableProps {
    startHole: number;
    endHole: number;
    holes: HoleRecord[];
    currentHole?: number;
    currentStroke?: number;
    currentPar?: number;
    currentPutt?: number;
    coursePars?: number[];
    onHolePress?: (holeNo: number) => void;
}

export const ScoreCardTable = memo(function ScoreCardTable({
    startHole,
    endHole,
    holes,
    currentHole,
    currentStroke,
    currentPar,
    currentPutt,
    coursePars,
    onHolePress
}: ScoreCardTableProps) {
    const holeNumbers = Array.from({ length: endHole - startHole + 1 }, (_, i) => startHole + i);

    const getRecord = (holeNo: number) => {
        // If this is the currently active hole, return the real-time input values
        if (currentHole !== undefined && holeNo === currentHole) {
            return {
                stroke: currentStroke ?? 0,
                par: currentPar ?? 0,
                putt: currentPutt ?? 0
            };
        }
        return holes.find(h => h.holeNo === holeNo);
    };

    const totals = holeNumbers.reduce((acc, h) => {
        const r = getRecord(h);
        if (r) {
            acc.par += r.par;
            acc.stroke += r.stroke;
            acc.putt += (r.putt || 0);
        } else if (coursePars) {
            acc.par += coursePars[h - 1];
        }
        return acc;
    }, { par: 0, stroke: 0, putt: 0 });

    return (
        <View style={styles.table}>
            {/* Hole Header */}
            <View style={styles.tableRow}>
                <View style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>
                    <Text style={styles.headerCellText}>HOLE</Text>
                </View>
                {holeNumbers.map(n => (
                    <TouchableOpacity 
                        key={n} 
                        style={[styles.cell, styles.headerCell, n === currentHole && { backgroundColor: '#E3F2FD' }]}
                        onPress={() => onHolePress?.(n)}
                        disabled={!onHolePress}
                    >
                        <Text style={[styles.headerCellText, n === currentHole && { color: '#007AFF' }]}>
                            {n > 9 ? n - 9 : n}
                        </Text>
                    </TouchableOpacity>
                ))}
                <View style={[styles.cell, styles.headerCell, { borderRightWidth: 0 }]}>
                    <Text style={styles.headerCellText}>T</Text>
                </View>
            </View>

            {/* Par Row */}
            <View style={styles.tableRow}>
                <View style={[styles.cell, { flex: 1.5, backgroundColor: '#fcfcfc' }]}>
                    <Text style={styles.rowLabelText}>Par</Text>
                </View>
                {holeNumbers.map(n => (
                    <View key={n} style={styles.cell}>
                        <Text style={styles.cellText}>{getRecord(n)?.par || (coursePars ? coursePars[n - 1] : '-')}</Text>
                    </View>
                ))}
                <View style={[styles.cell, { borderRightWidth: 0, backgroundColor: '#f8f9fa' }]}>
                    <Text style={[styles.cellText, { fontWeight: '800' }]}>{totals.par || '-'}</Text>
                </View>
            </View>

            {/* Score Row */}
            <View style={styles.tableRow}>
                <View style={[styles.cell, { flex: 1.5, backgroundColor: '#fcfcfc' }]}>
                    <Text style={styles.rowLabelText}>Score</Text>
                </View>
                {holeNumbers.map(n => {
                    const rec = getRecord(n);
                    if (!rec || (currentHole !== undefined && n > currentHole)) {
                        // No record data exists or hole is not yet played
                        if (!rec) return <View key={n} style={styles.cell}><Text style={styles.cellText}>-</Text></View>;
                    }

                    const score = rec.stroke - rec.par;
                    return (
                        <View key={n} style={styles.cell}>
                            <View style={[
                                score < 0 && styles.scoreCircle,
                                score <= -2 && styles.scoreDouble,
                                score > 0 && styles.scoreSquare,
                                score >= 2 && styles.scoreDouble
                            ]}>
                                {score <= -2 && <View style={styles.scoreCircleInner} />}
                                {score >= 2 && <View style={styles.scoreSquareInner} />}
                                <Text style={[
                                    styles.cellText,
                                    score !== 0 && { color: getScoreColor(score) },
                                    { position: 'relative', zIndex: 1 }
                                ]}>
                                    {rec.stroke}
                                </Text>
                            </View>
                        </View>
                    );
                })}
                <View style={[styles.cell, { borderRightWidth: 0, backgroundColor: '#EEF2FF' }]}>
                    <Text style={[styles.cellText, { fontWeight: '900', color: '#007AFF' }]}>{totals.stroke || '-'}</Text>
                </View>
            </View>

            {/* Putt Row */}
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.cell, { flex: 1.5, backgroundColor: '#fcfcfc' }]}>
                    <Text style={styles.rowLabelText}>Putt</Text>
                </View>
                {holeNumbers.map(n => (
                    <View key={n} style={styles.cell}>
                        <Text style={[styles.cellText, { color: '#666' }]}>{getRecord(n)?.putt ?? 0}</Text>
                    </View>
                ))}
                <View style={[styles.cell, { borderRightWidth: 0, backgroundColor: '#f8f9fa' }]}>
                    <Text style={[styles.cellText, { fontWeight: '700', color: '#666' }]}>{totals.putt}</Text>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        height: 32,
    },
    cell: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerCell: {
        backgroundColor: '#F8F9FA',
    },
    headerCellText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#ADB5BD',
    },
    rowLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#495057',
    },
    cellText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#212529',
    },
    greenText: {
        color: '#38E54D',
    },
    redText: {
        color: '#FF6B6B',
    },
    scoreCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#38E54D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreSquare: {
        width: 24,
        height: 24,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreDouble: {
        borderWidth: 1,
    },
    scoreCircleInner: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#38E54D',
    },
    scoreSquareInner: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
});
