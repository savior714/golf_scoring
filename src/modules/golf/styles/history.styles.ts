import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
