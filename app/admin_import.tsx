/**
 * @file app/admin_import.tsx
 * @description 관리자용 구장 데이터 JSON 대량 등록 화면
 * - 스타일, 로직, 컴포넌트를 분리하여 다이어트 완료 (글로벌 룰 0 준수)
 */

import React from 'react';
import { Stack } from 'expo-router';
import { ClipboardList, Database, FileJson, Trash2, AlertCircle, CheckCircle2, X, ShieldAlert } from 'lucide-react-native';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsAdmin } from '../src/shared/components/useIsAdmin';
import { golfService } from '../src/modules/golf/golf.service';

// 리팩토링된 모듈 임포트
import { styles } from '../src/modules/admin/styles/adminImport.styles';
import { useBulkImport } from '../src/modules/admin/hooks/useBulkImport';
import { ClubPreviewCard } from '../src/modules/admin/components/ClubPreviewCard';

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

    const {
        jsonText, setJsonText,
        parsedData, setParsedData,
        parseError, setParseError,
        isSaving,
        isConfirmVisible, setIsConfirmVisible,
        isVerifiedByHuman, setIsVerifiedByHuman,
        saveResult, setSaveResult,
        handleParse, handleFinalSave, handleConfirmSave, handleClear
    } = useBulkImport();


    // 1. Stack.Screen 옵션 메모이제이션
    const stackOptions = React.useMemo(() => ({
        title: '대량 데이터 임포트',
        headerShown: true,
        headerBackVisible: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8F9FA' }
    }), []);

    // 2. 샘플 데이터 로드 헬퍼 (useCallback 적용)
    const loadSample = React.useCallback(() => {
        setJsonText(JSON.stringify(SAMPLE_JSON, null, 2));
        setParsedData(null);
        setParseError(null);
    }, [setJsonText, setParsedData, setParseError]);

    // 3. 데이터 검증 로직 메모이제이션 (성능 최적화 핵심)
    const validationSummary = React.useMemo(() => {
        if (!parsedData) return null;
        
        const allValidations = parsedData.map(c => golfService.validateClubData(c));
        const totalErrors = allValidations.reduce((sum, v) => sum + v.issues.length, 0);
        const totalWarnings = allValidations.reduce((sum, v) => sum + v.warnings.length, 0);
        const isAllValid = totalErrors === 0;
        return { totalErrors, totalWarnings, isAllValid };
    }, [parsedData]);

    // 탭 전환 시 세션 갱신으로 인한 불필요한 깜빡임은 AdminContext에서 이미 해결됨.
    // 여기서는 단순하고 명확한 권한 가드만 남기고, 내용(jsonText) 유무에 따른 차등 대우를 제거함.
    const showBlocked = !isAdmin && !isAdminLoading;

    return (
        <>
            <Stack.Screen options={{ ...stackOptions, headerBackVisible: true }} />
            <SafeAreaView style={styles.container} edges={['bottom']}>

            {isAdminLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0A2647" />
                </View>
            ) : showBlocked ? (
                <View style={styles.centered}>
                    <AlertCircle size={48} color="#FF6B6B" style={{ marginBottom: 16 }} />
                    <Text style={styles.blockedTitle}>접근 권한 없음</Text>
                    <Text style={styles.blockedSub}>관리자 계정으로 로그인해 주세요.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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

                        <TouchableOpacity
                            style={styles.verifyCheckRow}
                            onPress={() => setIsVerifiedByHuman(!isVerifiedByHuman)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, isVerifiedByHuman && styles.checkboxChecked]}>
                                {isVerifiedByHuman && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.verifyCheckLabel}>
                                구장 공식 홈페이지에서{"\n"}
                                <Text style={{ fontWeight: '900', color: '#B45309' }}>홀별 Par와 거리를 직접 대조</Text>
                                하여{"\n데이터가 정확함을 확인했습니다."}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setIsConfirmVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm, !isVerifiedByHuman && styles.modalBtnDisabled]}
                                onPress={handleConfirmSave}
                                disabled={!isVerifiedByHuman}
                            >
                                <Text style={styles.modalBtnConfirmText}>등록 실행</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── 상위에서 Stack.Screen을 이미 정의함 ── */}
                <Animated.View entering={FadeInDown.duration(400)}>
                    <View style={styles.headerSection}>
                        <FileJson size={24} color="#0A2647" />
                        <Text style={styles.title}>JSON Bulk Import</Text>
                    </View>
                    
                    <View style={styles.aiWarningBanner}>
                        <ShieldAlert size={20} color="#B45309" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.aiWarningTitle}>AI 생성 데이터 경고</Text>
                            <Text style={styles.aiWarningBody}>
                                AI가 생성한 데이터는 실제와 다를 수 있으니 반드시 직접 대조 후 등록하세요.
                            </Text>
                        </View>
                    </View>

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

                    <View style={styles.inputCard}>
                        <TextInput
                            style={styles.jsonInput}
                            multiline
                            placeholder='[ { "name": "구장명", ... } ]'
                            value={jsonText}
                            onChangeText={setJsonText}
                            textAlignVertical="top"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity style={styles.parseBtn} onPress={handleParse}>
                        <Database size={20} color="#fff" />
                        <Text style={styles.parseBtnText}>데이터 파싱 및 프리뷰</Text>
                    </TouchableOpacity>

                    {parseError && (
                        <Animated.View entering={FadeIn} style={styles.errorBox}>
                            <AlertCircle size={18} color="#FF6B6B" />
                            <Text style={styles.errorText}>{parseError}</Text>
                        </Animated.View>
                    )}

                    {saveResult && (
                        <Animated.View entering={FadeIn} style={[styles.resultBanner, saveResult.type === 'success' ? styles.resultBannerOk : styles.resultBannerErr]}>
                            {saveResult.type === 'success' ? <CheckCircle2 size={18} color="#2ECC71" /> : <AlertCircle size={18} color="#FF6B6B" />}
                            <Text style={[styles.resultBannerText, saveResult.type === 'success' ? styles.resultBannerTextOk : styles.resultBannerTextErr]}>
                                {saveResult.message}
                            </Text>
                            <TouchableOpacity onPress={() => setSaveResult(null)}>
                                <X size={16} color={saveResult.type === 'success' ? '#2ECC71' : '#FF6B6B'} />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </Animated.View>

                {parsedData && validationSummary && (
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.previewSection}>
                        <Text style={styles.previewTitle}>임포트 프리뷰 ({parsedData.length}개 구장)</Text>
                        {parsedData.map((club, idx) => <ClubPreviewCard key={idx} club={club} />)}

                        <View style={{ marginTop: 10 }}>
                            {!validationSummary.isAllValid && (
                                <View style={styles.totalErrorBox}>
                                    <AlertCircle size={20} color="#FF6B6B" />
                                    <Text style={styles.totalErrorText}>
                                        전체 {validationSummary.totalErrors}개의 오류가 있습니다. 모두 수정해야 등록 가능합니다.
                                    </Text>
                                </View>
                            )}
                            {validationSummary.isAllValid && validationSummary.totalWarnings > 0 && (
                                <View style={[styles.totalErrorBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                                    <ShieldAlert size={20} color="#B45309" />
                                    <Text style={[styles.totalErrorText, { color: '#B45309' }]}>
                                        전체 {validationSummary.totalWarnings}개의 확인 필요 사항이 있습니다. (예: Par 36이 아닌 코스 포함)
                                    </Text>
                                </View>
                            )}
                            <TouchableOpacity 
                                style={[styles.finalSaveBtn, (!validationSummary.isAllValid || isSaving) && styles.disabledBtn]}
                                disabled={!validationSummary.isAllValid || isSaving}
                                onPress={handleFinalSave}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.finalSaveBtnText}>
                                        {validationSummary.isAllValid ? '검증 통과: 최종 등록 실행' : '데이터 오류 수정 필요'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
            )}
            </SafeAreaView>
        </>
    );
}
