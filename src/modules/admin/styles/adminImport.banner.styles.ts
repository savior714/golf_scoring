import { StyleSheet } from 'react-native';

export const bannerStyles = StyleSheet.create({
    // ── 결과 배너 ──
    resultBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
    },
    resultBannerOk: {
        backgroundColor: '#E8F8F0',
        borderColor: '#A8E6C3',
    },
    resultBannerErr: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FFD1D1',
    },
    resultBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    resultBannerTextOk: {
        color: '#1a8a4a',
    },
    resultBannerTextErr: {
        color: '#FF6B6B',
    },
    totalErrorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF0F0',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFD1D1',
        marginBottom: 10,
    },
    totalErrorText: {
        flex: 1,
        fontSize: 13,
        color: '#FF6B6B',
        fontWeight: '700',
        lineHeight: 18,
    },
    blockedTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#212529',
        marginBottom: 8,
    },
    blockedSub: {
        fontSize: 14,
        color: '#6E85B7',
    },
    // ── AI 경고 배너 ──
    aiWarningBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#FFFBEB',
        borderWidth: 1.5,
        borderColor: '#FCD34D',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    aiWarningTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#92400E',
        marginBottom: 4,
    },
    aiWarningBody: {
        fontSize: 12,
        color: '#78350F',
        lineHeight: 18,
        fontWeight: '500',
    },
});
