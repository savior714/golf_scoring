import { StyleSheet, Platform } from 'react-native';
import { modalStyles } from './adminImport.modal.styles';
import { bannerStyles } from './adminImport.banner.styles';
import { tableStyles } from './adminImport.table.styles';

const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0A2647',
    },
    description: {
        fontSize: 14,
        color: '#6E85B7',
        lineHeight: 20,
        marginBottom: 20,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginBottom: 10,
    },
    sampleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
    },
    sampleBtnText: {
        fontSize: 12,
        color: '#6E85B7',
        fontWeight: '700',
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
    },
    clearBtnText: {
        fontSize: 12,
        color: '#adb5bd',
        fontWeight: '700',
    },
    inputCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E9ECEF',
        marginBottom: 16,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }
        }),
    },
    jsonInput: {
        height: 250,
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#2C3E50',
    },
    parseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#0A2647',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    parseBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF5F5',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD1D1',
        marginBottom: 20,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 13,
        fontWeight: '600',
    },
    previewSection: {
        marginTop: 10,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0A2647',
    },
    clubCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    clubHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    clubName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#212529',
        flex: 1,
        marginRight: 10,
    },
    validBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    validBadgeOk: {
        backgroundColor: '#E8F8F0',
    },
    validBadgeErr: {
        backgroundColor: '#FFF0F0',
    },
    validBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    validBadgeTextOk: {
        color: '#2ECC71',
    },
    validBadgeTextErr: {
        color: '#FF6B6B',
    },
    clubAddress: {
        fontSize: 12,
        color: '#adb5bd',
        marginBottom: 12,
    },
    courseList: {
        gap: 8,
    },
    courseItem: {
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 12,
    },
    courseItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    courseName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#495057',
        flex: 1,
    },
    holeCount: {
        fontSize: 12,
        color: '#adb5bd',
        fontWeight: '600',
    },
    issuesList: {
        marginTop: 6,
        paddingLeft: 20,
    },
    issueItem: {
        fontSize: 11,
        color: '#FF6B6B',
        fontWeight: '600',
        marginBottom: 2,
    },
    finalSaveBtn: {
        backgroundColor: '#2ECC71',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    finalSaveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    disabledBtn: {
        backgroundColor: '#E9ECEF',
    },
});

// 소비자(admin_import.tsx, ClubPreviewCard.tsx)의 import를 변경 없이 유지하기 위한 aggregator
export const styles = { ...commonStyles, ...modalStyles, ...bannerStyles, ...tableStyles };
