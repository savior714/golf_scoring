import { StyleSheet } from 'react-native';

export const tableStyles = StyleSheet.create({
    // ── 홀 테이블 ──
    expandHint: {
        fontSize: 11,
        color: '#6E85B7',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    holeTable: {
        marginTop: 10,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    holeTableRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    holeTableRowEven: {
        backgroundColor: '#fff',
    },
    holeTableRowOdd: {
        backgroundColor: '#F8F9FA',
    },
    holeTableCell: {
        paddingVertical: 6,
        paddingHorizontal: 4,
        textAlign: 'center',
        fontSize: 12,
    },
    holeTableHeader: {
        fontWeight: '800',
        color: '#6E85B7',
        backgroundColor: '#EEF2FF',
        paddingVertical: 8,
    },
    holeTableHoleNum: {
        fontWeight: '800',
        color: '#495057',
    },
    holeTablePar: {
        fontWeight: '700',
        color: '#0A2647',
    },
    holeTableDist: {
        fontWeight: '600',
        color: '#007AFF',
    },
    parSumRow: {
        backgroundColor: '#F0F4F8',
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    parSumLabel: {
        fontWeight: '800',
        color: '#6c757d',
        fontSize: 12,
        paddingVertical: 8,
        paddingHorizontal: 4,
        textAlign: 'center',
    },
    parSumValue: {
        fontWeight: '800',
        fontSize: 12,
        textAlign: 'center',
    },
    parSumOkText: {
        color: '#1a7a3c',
    },
    parSumWarnText: {
        color: '#c0392b',
    },
});
