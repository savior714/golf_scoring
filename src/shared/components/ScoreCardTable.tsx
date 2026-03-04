import { StyleSheet, Text, View } from 'react-native';
import { HoleRecord } from '../../modules/golf/golf.types';

interface ScoreCardTableProps {
    startHole: number;
    endHole: number;
    holes: HoleRecord[];
    currentHole?: number;
    currentStroke?: number;
    currentPar?: number;
    currentPutt?: number;
    coursePars?: number[];
}

export function ScoreCardTable({
    startHole,
    endHole,
    holes,
    currentHole,
    currentStroke,
    currentPar,
    currentPutt,
    coursePars
}: ScoreCardTableProps) {
    const holeNumbers = Array.from({ length: endHole - startHole + 1 }, (_, i) => startHole + i);

    const getRecord = (holeNo: number) => {
        // 만약 현재 기록 중인 홀이라면 실시간 입력값 반환
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
                    <View key={n} style={[styles.cell, styles.headerCell]}>
                        <Text style={styles.headerCellText}>{n > 9 ? n - 9 : n}</Text>
                    </View>
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
                        // 기록 데이터가 없는 경우 또는 진행 전인 홀
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
                                    score < 0 && styles.blueText,
                                    score > 0 && styles.redText,
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
}

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
    blueText: {
        color: '#007AFF',
    },
    redText: {
        color: '#FF6B6B',
    },
    scoreCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#007AFF',
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
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    scoreSquareInner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
});
