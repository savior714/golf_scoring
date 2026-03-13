import { StyleSheet, Platform } from 'react-native';

export const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 360,
        ...Platform.select({ web: { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' } }),
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0A2647',
        marginBottom: 10,
    },
    modalBody: {
        fontSize: 14,
        color: '#495057',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalBtnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnCancel: {
        backgroundColor: '#F1F3F5',
    },
    modalBtnCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6E85B7',
    },
    modalBtnConfirm: {
        backgroundColor: '#0A2647',
    },
    modalBtnConfirmText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
    modalBtnDisabled: {
        backgroundColor: '#D1D5DB',
    },
    // ── 인간 검증 체크박스 ──
    verifyCheckRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#FFFBEB',
        borderWidth: 1.5,
        borderColor: '#FCD34D',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: '#0A2647',
        borderColor: '#0A2647',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
    },
    verifyCheckLabel: {
        flex: 1,
        fontSize: 13,
        color: '#78350F',
        lineHeight: 20,
        fontWeight: '600',
    },
});
