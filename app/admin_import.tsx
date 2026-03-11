/**
 * @file app/admin_import.tsx
 * @description 관리자용 구장 데이터 JSON 대량 등록 화면
 * - JSON 데이터를 붙여넣어 구장/코스/홀 정보를 일괄 프리뷰하고 검증
 * - "완벽한 데이터만 적재" 원칙에 따른 1차 파싱 UI
 */

import { Stack } from 'expo-router';
import { ChevronRight, ChevronDown, ClipboardList, Database, FileJson, Trash2, AlertCircle, CheckCircle2, X, ShieldAlert } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsAdmin } from '../src/shared/components/useIsAdmin';
import { ClubInfo } from '../src/modules/golf/golf.types';
import { golfService } from '../src/modules/golf/golf.service';
import { clubRepository } from '../src/modules/golf/golf.repository';

const SAMPLE_JSON = [
    {
        "name": "샘플 컨트리클럽",
        "address": "경기도 용인시 ...",
        "courses": [
            {
                "name": "OUT",
                "holes": Array.from({ length: 9 }, (_, i: number) => ({
                    "holeNumber": i + 1,
                    "par": 4,
                    "distances": [
                        { "teeColor": "White", "distanceMeter": 320 + i * 10 },
                        { "teeColor": "Red", "distanceMeter": 280 + i * 10 }
                    ]
                }))
            }
        ]
    }
];

export default function BulkImportScreen() {
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
    const [jsonText, setJsonText] = useState('');
    const [parsedData, setParsedData] = useState<ClubInfo[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isVerifiedByHuman, setIsVerifiedByHuman] = useState(false);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 권한 체크
    if (isAdminLoading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#0A2647" />
            </SafeAreaView>
        );
    }

    if (!isAdmin) {
        return (
            <SafeAreaView style={styles.centered}>
                <AlertCircle size={48} color="#FF6B6B" style={{ marginBottom: 16 }} />
                <Text style={styles.blockedTitle}>접근 권한 없음</Text>
                <Text style={styles.blockedSub}>관리자 계정으로 로그인해 주세요.</Text>
            </SafeAreaView>
        );
    }


    // JSON 파싱 핸들러
    const handleParse = () => {
        setParseError(null);
        if (!jsonText.trim()) {
            setParseError('JSON 데이터를 입력해 주세요.');
            return;
        }

        try {
            const data = JSON.parse(jsonText) as unknown;
            if (!Array.isArray(data)) {
                setParseError('데이터는 배열([]) 형태여야 합니다.');
                return;
            }
            setParsedData(data as ClubInfo[]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '알 수 없는 JSON 오류';
            setParseError(`JSON 문법 오류: ${msg}`);
        }
    };

    // 최종 등록 모달 열기
    const handleFinalSave = () => {
        if (!parsedData || parsedData.length === 0) return;
        setSaveResult(null);
        setIsVerifiedByHuman(false);
        setIsConfirmVisible(true);
    };

    // 모달 확인 후 실제 DB 등록 실행
    const handleConfirmSave = async () => {
        if (!parsedData || parsedData.length === 0) return;
        setIsConfirmVisible(false);
        setIsSaving(true);
        setSaveResult(null);
        try {
            const result = await clubRepository.registerClubsBulk(parsedData);
            if (result.success) {
                setSaveResult({ type: 'success', message: `${result.count}개의 구장이 성공적으로 등록되었습니다.` });
                setParsedData(null);
                setJsonText('');
            } else {
                setSaveResult({ type: 'error', message: result.error || '알 수 없는 오류가 발생했습니다.' });
            }
        } catch (e: unknown) {
            setSaveResult({ type: 'error', message: e instanceof Error ? e.message : '데이터 적재 중 오류가 발생했습니다.' });
        } finally {
            setIsSaving(false);
        }
    };

    // 샘플 데이터 로드
    const loadSample = () => {
        setJsonText(JSON.stringify(SAMPLE_JSON, null, 2));
        setParsedData(null);
        setParseError(null);
    };

    // 초기화
    const handleClear = () => {
        setJsonText('');
        setParsedData(null);
        setParseError(null);
        setSaveResult(null);
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* ── 최종 등록 확인 커스텀 모달 ── */}
            <Modal
                visible={isConfirmVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsConfirmVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>최종 등록 확인</Text>
                        <Text style={styles.modalBody}>
                            {parsedData?.length ?? 0}개의 구장 데이터를 DB에 적재합니다.
                        </Text>

                        {/* 인간 검증 확인 체크박스 */}
                        <TouchableOpacity
                            style={styles.verifyCheckRow}
                            onPress={() => setIsVerifiedByHuman(prev => !prev)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                isVerifiedByHuman && styles.checkboxChecked,
                            ]}>
                                {isVerifiedByHuman && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.verifyCheckLabel}>
                                구장 공식 홈페이지에서{"\n"}
                                <Text style={{ fontWeight: '900', color: '#B45309' }}>홀별 Par와 거리를 직접 대조</Text>
                                하여{"\n"}데이터가 정확함을 확인했습니다.
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setIsConfirmVisible(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalBtn,
                                    styles.modalBtnConfirm,
                                    !isVerifiedByHuman && styles.modalBtnDisabled,
                                ]}
                                onPress={handleConfirmSave}
                                disabled={!isVerifiedByHuman}
                            >
                                <Text style={styles.modalBtnConfirmText}>등록 실행</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Stack.Screen options={{ 
                title: '대량 데이터 임포트',
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F8F9FA' },
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.duration(400)}>
                    <View style={styles.headerSection}>
                        <FileJson size={24} color="#0A2647" />
                        <Text style={styles.title}>JSON Bulk Import</Text>
                    </View>
                    <Text style={styles.description}>
                        구장 마스터 데이터를 JSON 형식으로 한 번에 등록합니다.{"\n"}
                        아래 영역에 데이터를 붙여넣고 '파싱 및 프리뷰'를 클릭하세요.
                    </Text>

                    {/* AI 데이터 경고 배너 */}
                    <View style={styles.aiWarningBanner}>
                        <ShieldAlert size={20} color="#B45309" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.aiWarningTitle}>AI 생성 데이터 경고</Text>
                            <Text style={styles.aiWarningBody}>
                                AI(Gemini, ChatGPT 등)가 생성한 구장 데이터는 코스명·홀별 거리·Par가{"\n"}
                                <Text style={{ fontWeight: '900' }}>실제와 완전히 다를 수 있습니다.</Text>{"\n"}
                                반드시 구장 공식 홈페이지와 홀별로 직접 대조한 후 등록하세요.
                            </Text>
                        </View>
                    </View>

                    {/* 입력 제어 버튼들 */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.sampleBtn} onPress={loadSample}>
                            <ClipboardList size={16} color="#6E85B7" />
                            <Text style={styles.sampleBtnText}>샘플 불러오기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                            <Trash2 size={16} color="#adb5bd" />
                            <Text style={styles.clearBtnText}>지우기</Text>
                        </TouchableOpacity>
                    </View>

                    {/* JSON 입력창 */}
                    <View style={styles.inputCard}>
                        <TextInput
                            style={styles.jsonInput}
                            multiline
                            placeholder='[ { "name": "구장명", ... } ]'
                            placeholderTextColor="#adb5bd"
                            value={jsonText}
                            onChangeText={setJsonText}
                            textAlignVertical="top"
                            spellCheck={false}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* 파싱 버튼 */}
                    <TouchableOpacity style={styles.parseBtn} onPress={handleParse}>
                        <Database size={20} color="#fff" />
                        <Text style={styles.parseBtnText}>데이터 파싱 및 프리뷰</Text>
                    </TouchableOpacity>

                    {/* 파싱 에러 메시지 */}
                    {parseError && (
                        <Animated.View entering={FadeIn} style={styles.errorBox}>
                            <AlertCircle size={18} color="#FF6B6B" />
                            <Text style={styles.errorText}>{parseError}</Text>
                        </Animated.View>
                    )}

                    {/* 저장 결과 배너 */}
                    {saveResult && (
                        <Animated.View
                            entering={FadeIn}
                            style={[
                                styles.resultBanner,
                                saveResult.type === 'success' ? styles.resultBannerOk : styles.resultBannerErr,
                            ]}
                        >
                            {saveResult.type === 'success'
                                ? <CheckCircle2 size={18} color="#2ECC71" />
                                : <AlertCircle size={18} color="#FF6B6B" />}
                            <Text style={[
                                styles.resultBannerText,
                                saveResult.type === 'success' ? styles.resultBannerTextOk : styles.resultBannerTextErr,
                            ]}>
                                {saveResult.message}
                            </Text>
                            <TouchableOpacity onPress={() => setSaveResult(null)}>
                                <X size={16} color={saveResult.type === 'success' ? '#2ECC71' : '#FF6B6B'} />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </Animated.View>

                {/* 프리뷰 섹션 */}
                {parsedData && (
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.previewSection}>
                        <View style={styles.previewHeader}>
                            <Text style={styles.previewTitle}>임포트 프리뷰 ({parsedData.length}개 구장)</Text>
                            <CheckCircle2 size={18} color="#2ECC71" />
                        </View>

                        {parsedData.map((club, idx: number) => (
                            <ClubPreviewCard key={idx} club={club} />
                        ))}

                        {/* 전체 무결성 검증 결과에 따른 버튼 처리 */}
                        {(() => {
                            const allValidations = parsedData.map(c => golfService.validateClubData(c));
                            const totalErrors = allValidations.reduce((sum, v) => sum + v.issues.length, 0);
                            const isAllValid = totalErrors === 0;

                            return (
                                <View style={{ marginTop: 10 }}>
                                    {!isAllValid && (
                                        <View style={styles.totalErrorBox}>
                                            <AlertCircle size={20} color="#FF6B6B" />
                                            <Text style={styles.totalErrorText}>
                                                전체 {totalErrors}개의 데이터 오류가 발견되었습니다.{"\n"}
                                                모든 오류를 해결해야 등록이 가능합니다.
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity 
                                        style={[styles.finalSaveBtn, (!isAllValid || isSaving) && styles.disabledBtn]}
                                        disabled={!isAllValid || isSaving}
                                        onPress={handleFinalSave}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.finalSaveBtnText}>
                                                {isAllValid ? '검증 통과: 최종 등록 실행' : '데이터 오류 수정 필요'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        })()}
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

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

/**
 * 구장별 프리뷰 카드 — 코스 클릭 시 홀별 par/거리 테이블 전개
 */
function ClubPreviewCard({ club }: { club: ClubInfo }) {
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
                    validation.isValid ? styles.validBadgeOk : styles.validBadgeErr
                ]}>
                    <Text style={[
                        styles.validBadgeText,
                        validation.isValid ? styles.validBadgeTextOk : styles.validBadgeTextErr
                    ]}>
                        {validation.isValid ? '검증 통과' : '검증 실패'}
                    </Text>
                </View>
            </View>

            {club.address && <Text style={styles.clubAddress}>{club.address}</Text>}

            <View style={styles.courseList}>
                {(club.courses as unknown as CourseData[])?.map((course, cIdx) => {
                    const isExpanded = !!expandedCourses[cIdx];
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
                                <Text style={styles.courseName}>{course.name || `코스 ${cIdx + 1}`}</Text>
                                <Text style={styles.holeCount}>{course.holes?.length || 0}홀</Text>
                                <Text style={styles.expandHint}>{isExpanded ? '접기' : '데이터 확인'}</Text>
                            </TouchableOpacity>

                            {/* 홀별 par/거리 테이블 */}
                            {isExpanded && (
                                <View style={styles.holeTable}>
                                    {/* 테이블 헤더 */}
                                    <View style={styles.holeTableRow}>
                                        <Text style={[styles.holeTableCell, styles.holeTableHeader, { width: 32 }]}>홀</Text>
                                        <Text style={[styles.holeTableCell, styles.holeTableHeader, { width: 36 }]}>Par</Text>
                                        {teeColors.map(tc => (
                                            <Text key={tc} style={[styles.holeTableCell, styles.holeTableHeader, { flex: 1 }]}>
                                                {tc}(m)
                                            </Text>
                                        ))}
                                    </View>
                                    {/* 홀 행 */}
                                    {course.holes?.map((hole, hIdx) => (
                                        <View key={hIdx} style={[
                                            styles.holeTableRow,
                                            hIdx % 2 === 0 ? styles.holeTableRowEven : styles.holeTableRowOdd,
                                        ]}>
                                            <Text style={[styles.holeTableCell, styles.holeTableHoleNum, { width: 32 }]}>
                                                {hole.holeNumber}
                                            </Text>
                                            <Text style={[styles.holeTableCell, styles.holeTablePar, { width: 36 }]}>
                                                {hole.par}
                                            </Text>
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
                                    {/* Par 합계 행 */}
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

                            {/* 이슈 리스트 */}
                            {!validation.isValid && (
                                <View style={styles.issuesList}>
                                    {validation.issues
                                        .filter((issue: string) => issue.startsWith(`코스 ${cIdx + 1}`))
                                        .map((issue: string, iIdx: number) => (
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
}

const styles = StyleSheet.create({
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
    // ── 커스텀 모달 ──
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
    modalBtnDisabled: {
        backgroundColor: '#D1D5DB',
    },
});
