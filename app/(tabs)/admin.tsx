/**
 * @file app/(tabs)/admin.tsx
 * @description 관리자 전용 구장 등록 화면 (savior714@gmail.com만 접근 가능)
 * - useIsAdmin 훅으로 현재 사용자 권한 판단
 * - 비관리자에게는 탭 자체가 노출되지 않음 (_layout.tsx에서 제어)
 * - 구장명 / 코스명 / 홀별 Par + 티별 전장 입력 후 Supabase에 등록
 */

import { clubRepository } from '@/src/modules/golf/golf.repository';
import { ClubSummary } from '@/src/modules/golf/golf.types';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import { Stack } from 'expo-router';
import { ChevronDown, FileJson, FileSearch, MessageSquare, PlusCircle, Save, Users, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { golfService } from '@/src/modules/golf/golf.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CourseSection, CourseInput, TeeColorKey, TEE_COLORS } from '@/src/modules/admin/components/AdminFormComponents';
import { useCallback, useMemo } from 'react';

const DEFAULT_HOLES = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ holeNumber: i + 1, par: '4', distances: {} }));


// ────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────────────────────────
export default function AdminScreen() {
    const { isAdmin, isLoading } = useIsAdmin();

    // 로딩 중
    if (isLoading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#0A2647" />
            </SafeAreaView>
        );
    }

    // 비관리자 접근 차단 (이중 방어)
    if (!isAdmin) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.blockedTitle}>접근 권한 없음</Text>
                <Text style={styles.blockedSub}>이 페이지는 관리자 전용입니다.</Text>
            </SafeAreaView>
        );
    }

    return <AdminForm />;
}

// ────────────────────────────────────────────────────────────
// 관리자 폼 (관리자만 렌더링)
// ────────────────────────────────────────────────────────────
function AdminForm() {
    const [clubName, setClubName] = useState('');
    const [courses, setCourses] = useState<CourseInput[]>([
        { courseName: '', holes: DEFAULT_HOLES(9), activeTees: ['White'] },
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const isMounted = useRef(true);

    // Stable Ref Pattern (User Rule 9)
    const stateRef = useRef({ clubName, courses });
    useEffect(() => {
        stateRef.current = { clubName, courses };
    }, [clubName, courses]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // 구장 선택용
    const [clubList, setClubList] = useState<ClubSummary[]>([]);
    const [showClubSelect, setShowClubSelect] = useState(false);
    const [isLoadingClubs, setIsLoadingClubs] = useState(false);

    const loadClubList = useCallback(async () => {
        setIsLoadingClubs(true);
        try {
            const list = await clubRepository.getAllClubsSummary();
            if (isMounted.current) {
                setClubList(list);
            }
        } finally {
            if (isMounted.current) {
                setIsLoadingClubs(false);
            }
        }
    }, []);

    const handleSelectClub = useCallback(async (clubId: string) => {
        setIsLoadingClubs(true);
        setShowClubSelect(false);
        try {
            const fullInfo = await clubRepository.getClubFullInfo(clubId);
            if (fullInfo && isMounted.current) {
                setClubName(fullInfo.name);
                setCourses(fullInfo.courses.map(c => {
                    const teesInData = [...new Set(
                        c.holes.flatMap(h => h.distances.map(d => d.teeColor))
                    )] as TeeColorKey[];
                    const activeTees: TeeColorKey[] = teesInData.length > 0
                        ? TEE_COLORS.filter(t => teesInData.includes(t.key)).map(t => t.key)
                        : ['White'];
                    return {
                        id: c.id,
                        courseName: c.name,
                        activeTees,
                        holes: c.holes.map(h => ({
                            holeNumber: h.holeNumber,
                            par: String(h.par),
                            distances: Object.fromEntries(
                                h.distances.map(d => [d.teeColor, String(d.distanceMeter)])
                            ) as Partial<Record<TeeColorKey, string>>,
                        })),
                    };
                }));
            }
        } catch {
            if (isMounted.current) {
                showAlert('오류', '구장 정보를 불러오지 못했습니다.');
            }
        } finally {
            if (isMounted.current) {
                setIsLoadingClubs(false);
            }
        }
    }, []);

    const addCourse = useCallback(() => {
        setCourses(prev => [...prev, { courseName: '', holes: DEFAULT_HOLES(9), activeTees: ['White'] }]);
    }, []);

    const removeCourse = useCallback(async (idx: number) => {
        const { courses: currentCourses } = stateRef.current;
        if (currentCourses.length <= 1) return;

        const target = currentCourses[idx];
        if (!target.id) {
            setCourses(prev => prev.filter((_, i) => i !== idx));
            return;
        }

        const confirmed = await new Promise<boolean>(resolve => {
            if (Platform.OS === 'web') {
                resolve(window.confirm(`"${target.courseName}" 코스를 영구 삭제하시겠습니까?`));
            } else {
                Alert.alert(
                    '코스 삭제 확인',
                    `"${target.courseName}" 코스를 영구 삭제하시겠습니까?`,
                    [
                        { text: '취소', onPress: () => resolve(false), style: 'cancel' },
                        { text: '삭제', onPress: () => resolve(true), style: 'destructive' },
                    ]
                );
            }
        });

        if (!confirmed) return;

        const result = await clubRepository.deleteGolfCourse(target.id);
        if (!result.success) {
            showAlert('삭제 실패', result.error ?? '코스 삭제 중 오류가 발생했습니다.');
            return;
        }

        setCourses(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const updateCourseName = useCallback((idx: number, name: string) => {
        setCourses(prev => prev.map((c, i) => i === idx ? { ...c, courseName: name } : c));
    }, []);

    const toggleTee = useCallback((courseIdx: number, teeKey: TeeColorKey) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const already = c.activeTees.includes(teeKey);
            if (already && c.activeTees.length <= 1) return c;
            const newTees = already
                ? c.activeTees.filter(t => t !== teeKey)
                : [...c.activeTees, teeKey];
            return { ...c, activeTees: newTees };
        }));
    }, []);

    const updatePar = useCallback((courseIdx: number, holeIdx: number, value: string) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const newHoles = c.holes.map((h, hi) =>
                hi === holeIdx ? { ...h, par: value } : h
            );
            return { ...c, holes: newHoles };
        }));
    }, []);

    const updateTeeDistance = useCallback((courseIdx: number, holeIdx: number, teeKey: TeeColorKey, value: string) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const newHoles = c.holes.map((h, hi) => {
                if (hi !== holeIdx) return h;
                return { ...h, distances: { ...h.distances, [teeKey]: value } };
            });
            return { ...c, holes: newHoles };
        }));
    }, []);

    const buildValidationPayload = useCallback(() => {
        const { clubName: cName, courses: cCourses } = stateRef.current;
        return {
            name: cName,
            courses: cCourses.map(c => ({
                name: c.courseName,
                holes: c.holes.map(h => ({
                    holeNumber: h.holeNumber,
                    par: parseInt(h.par, 10) || 0,
                    distances: Object.entries(h.distances)
                        .filter(([, v]) => v !== '' && !isNaN(parseInt(v ?? '', 10)))
                        .map(([teeColor, distanceMeter]) => ({
                            teeColor,
                            distanceMeter: parseInt(distanceMeter ?? '', 10),
                        })),
                })),
            })),
        };
    }, []);

    const handleSave = useCallback(async () => {
        const { clubName: cName, courses: cCourses } = stateRef.current;
        if (!cName.trim()) {
            showAlert('입력 오류', '구장명을 입력해 주세요.');
            return;
        }

        const payloadSummary = buildValidationPayload();
        const validation = golfService.validateClubData(payloadSummary);
        
        if (!validation.isValid) {
            let confirmSave: boolean;
            if (Platform.OS === 'web') {
                confirmSave = window.confirm(
                    `데이터 무결성 주의\n입력된 정보에 ${validation.issues.length}건의 주의사항이 있습니다.\n이대로 저장하시겠습니까?`
                );
            } else {
                confirmSave = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                        '데이터 무결성 주의',
                        `입력된 정보에 ${validation.issues.length}건의 주의사항이 있습니다.\n이대로 저장하시겠습니까?`,
                        [
                            { text: '취소', onPress: () => resolve(false), style: 'cancel' },
                            { text: '저장 진행', onPress: () => resolve(true) }
                        ]
                    );
                });
            }
            if (!confirmSave) return;
        }

        for (const course of cCourses) {
            if (!course.courseName.trim()) {
                showAlert('입력 오류', '모든 코스명을 입력해 주세요.');
                return;
            }
        }

        setIsSaving(true);
        try {
            const payload = {
                clubName: cName.trim(),
                isVerified: validation.isValid,
                courses: cCourses.map(c => ({
                    courseName: c.courseName.trim(),
                    holes: c.holes.map(h => ({
                        holeNumber: h.holeNumber,
                        par: parseInt(h.par, 10) || 4,
                        distances: Object.entries(h.distances)
                            .filter(([, v]) => v !== '' && !isNaN(parseInt(v, 10)))
                            .map(([teeColor, distanceMeter]) => ({
                                teeColor,
                                distanceMeter: parseInt(distanceMeter, 10),
                            })),
                    })),
                })),
            };

            const result = await clubRepository.registerClub(payload);
            if (isMounted.current) {
                if (result.success) {
                    showAlert('등록/수정 완료', `"${cName}" 구장이 저장되었습니다.`);
                } else {
                    showAlert('저장 실패', result.error ?? '오류가 발생했습니다.');
                }
            }
        } catch (e) {
            if (isMounted.current) {
                showAlert('오류', '저장 중 오류가 발생했습니다.');
            }
        } finally {
            if (isMounted.current) {
                setIsSaving(false);
            }
        }
    }, [buildValidationPayload]);

    // Validation status displayed in UI
    const validationStatus = useMemo(() => {
        return golfService.validateClubData(buildValidationPayload());
    }, [clubName, courses, buildValidationPayload]);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: '구장 관리 (관리자)' }} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
            >
                {/* 헤더 배지 */}
                <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN ONLY</Text>
                </View>

                {/* 구장 불러오기 버튼 */}
                <TouchableOpacity
                    style={styles.loadBtn}
                    onPress={() => {
                        loadClubList();
                        setShowClubSelect(true);
                    }}
                >
                    <FileSearch size={18} color="#007AFF" />
                    <Text style={styles.loadBtnText}>기존 구장 불러오기 (수정)</Text>
                </TouchableOpacity>

                {/* 사용자 관리 이동 버튼 (추가) */}
                <TouchableOpacity
                    style={[styles.loadBtn, { backgroundColor: '#E8F8F0', borderColor: '#2ECC7130', marginBottom: 12 }]}
                    onPress={() => router.push('/admin_users' as Parameters<typeof router.push>[0])}
                >
                    <Users size={18} color="#2ECC71" />
                    <Text style={[styles.loadBtnText, { color: '#2ECC71' }]}>사용자 통계 및 관리 (Users)</Text>
                </TouchableOpacity>

                {/* 구장 추가 요청 관리 이동 버튼 (신규) */}
                <TouchableOpacity
                    style={[styles.loadBtn, { backgroundColor: '#FEF3C7', borderColor: '#B4530930', marginBottom: 12 }]}
                    onPress={() => router.push('/admin_requests' as Parameters<typeof router.push>[0])}
                >
                    <MessageSquare size={18} color="#B45309" />
                    <Text style={[styles.loadBtnText, { color: '#B45309' }]}>구장 추가 요청 내역 (Requests)</Text>
                </TouchableOpacity>

                {/* JSON 대량 등록 이동 버튼 (추가) */}
                <TouchableOpacity
                    style={[styles.loadBtn, { backgroundColor: '#F0F4F8', borderColor: '#6E85B730' }]}
                    onPress={() => router.push('/admin_import' as Parameters<typeof router.push>[0])}
                >
                    <FileJson size={18} color="#6E85B7" />
                    <Text style={[styles.loadBtnText, { color: '#6E85B7' }]}>JSON 대량 임포트 (Bulk)</Text>
                </TouchableOpacity>



                {/* 구장명 */}
                <View style={[styles.card, { paddingBottom: 10 }]}>
                    <Text style={styles.label}>구장명</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 아리스타CC"
                        placeholderTextColor="#adb5bd"
                        value={clubName}
                        onChangeText={setClubName}
                    />
                    <Text style={styles.inputHelp}>* 이미 존재하는 구장명이면 정보가 업데이트됩니다.</Text>
                </View>

                {/* 데이터 무결성 가이드 및 자동 검증 상태 */}
                <View style={styles.card}>
                    <View style={styles.verificationRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>데이터 무결성 및 검증 정보</Text>
                            <Text style={styles.inputHelp}>
                                모든 홀의 Par(합계 36)와 전장이 입력되면 시스템이 자동으로 '검증 완료' 상태로 등록합니다.
                            </Text>
                        </View>
                        <View style={[
                            styles.verifyStatusBadge,
                            validationStatus.isValid ? styles.verifyBadgeValid : styles.verifyBadgeInvalid
                        ]}>
                            <Text style={[
                                styles.verifyStatusText,
                                validationStatus.isValid ? styles.verifyTextValid : styles.verifyTextInvalid
                            ]}>
                                {validationStatus.isValid ? '검증 통과' : '미검증'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 코스 목록 - 컴포넌트 분리 및 최적화 */}
                {courses.map((course, ci) => (
                    <CourseSection
                        key={ci}
                        course={course}
                        courseIdx={ci}
                        canRemove={courses.length > 1}
                        onRemove={removeCourse}
                        onUpdateName={updateCourseName}
                        onToggleTee={toggleTee}
                        onUpdatePar={updatePar}
                        onUpdateDistance={updateTeeDistance}
                    />
                ))}

                {/* 코스 추가 버튼 */}
                <TouchableOpacity style={styles.addCourseBtn} onPress={addCourse}>
                    <PlusCircle size={18} color="#0A2647" />
                    <Text style={styles.addCourseBtnText}>코스 추가</Text>
                </TouchableOpacity>

                {/* 저장 버튼 */}
                <TouchableOpacity
                    style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Save size={18} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.saveBtnText}>{isSaving ? '저장 중...' : '구장 정보 최종 저장'}</Text>
                </TouchableOpacity>

                {/* 구장 선택 모달 */}
                <Modal
                    visible={showClubSelect}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowClubSelect(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowClubSelect(false)}
                    >
                        <Animated.View entering={FadeIn} style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>기존 구장 선택</Text>
                                <TouchableOpacity onPress={() => setShowClubSelect(false)}>
                                    <X size={24} color="#0A2647" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.clubListScroll}>
                                {isLoadingClubs ? (
                                    <ActivityIndicator style={{ marginTop: 20 }} color="#0A2647" />
                                ) : clubList.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyListText}>등록된 구장이 없습니다.</Text>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.listStats}>
                                            <Text style={styles.listStatsText}>
                                                전체 {clubList.length}개 (검증 {clubList.filter(c => c.isVerified).length} / 미검증 {clubList.filter(c => !c.isVerified).length})
                                            </Text>
                                        </View>
                                        {clubList.map(club => (
                                    <TouchableOpacity
                                        key={club.id}
                                        style={styles.clubListItem}
                                        onPress={() => handleSelectClub(club.id)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.clubListItemName}>{club.name}</Text>
                                            {club.isVerified && <View style={styles.verifiedBadgeMini}><Text style={styles.verifiedBadgeTextMini}>✓</Text></View>}
                                        </View>
                                        <View style={styles.clubListItemCourse}>
                                            <Text style={styles.courseCountText}>{club.courseCount}개 코스</Text>
                                            <ChevronDown size={14} color="#adb5bd" />
                                        </View>
                                    </TouchableOpacity>
                                        ))}
                                    </>
                                )}
                            </ScrollView>
                        </Animated.View>
                    </TouchableOpacity>
                </Modal>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}


// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────
function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
    } else {
        Alert.alert(title, message);
    }
}

// ────────────────────────────────────────────────────────────
// 스타일
// ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        padding: 20,
    },
    adminBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 16,
    },
    adminBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0A2647',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#dee2e6',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#212529',
        backgroundColor: '#f8f9fa',
        width: '100%',
    },
    inputHelp: {
        fontSize: 11,
        color: '#6E85B7',
        marginTop: 6,
        fontWeight: '600',
    },
    teeToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    teeToggleLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6c757d',
    },
    teeToggleBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
        backgroundColor: '#f8f9fa',
    },
    teeToggleBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6c757d',
    },
    parGrid: {
        marginTop: 4,
        overflow: 'hidden',
    },
    gridHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginBottom: 8,
        gap: 8,
    },
    gridHeaderText: {
        fontSize: 10,
        color: '#adb5bd',
        fontWeight: '800',
        textAlign: 'center',
    },
    gridHeaderTee: {
        flex: 1,
        textAlign: 'center',
    },
    holeInputRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
        backgroundColor: '#f8f9fa',
        padding: 6,
        borderRadius: 10,
    },
    holeNumberBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#DEE2E6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    holeNumberText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#495057',
    },
    parInputSmall: {
        width: 46,
        height: 36,
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '800',
        color: '#0A2647',
        backgroundColor: '#fff',
    },
    distanceInput: {
        flex: 1,
        minWidth: 0,
        height: 36,
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 8,
        paddingHorizontal: 6,
        fontSize: 14,
        fontWeight: '700',
        color: '#007AFF',
        backgroundColor: '#fff',
        textAlign: 'center',
    },
    loadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: '#E7F1FF',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#007AFF20',
    },
    loadBtnText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(10, 38, 71, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0A2647',
    },
    clubListScroll: {
        marginBottom: 20,
    },
    clubListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },
    clubListItemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
    },
    clubListItemCourse: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    courseCountText: {
        fontSize: 13,
        color: '#adb5bd',
        fontWeight: '600',
    },
    emptyListText: {
        textAlign: 'center',
        color: '#adb5bd',
        paddingVertical: 40,
        fontWeight: '600',
    },
    removeBtn: {
        padding: 4,
    },
    addCourseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#0A2647',
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    addCourseBtnText: {
        color: '#0A2647',
        fontSize: 15,
        fontWeight: '700',
    },
    parSumBadge: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 12,
    },
    parSumOk: {
        backgroundColor: '#38E54D20',
    },
    parSumWarn: {
        backgroundColor: '#FF6B6B20',
    },
    parSumText: {
        fontSize: 12,
        fontWeight: '700',
    },
    parSumTextOk: {
        color: '#1a7a3c',
    },
    parSumTextWarn: {
        color: '#c0392b',
    },
    saveBtn: {
        flexDirection: 'row',
        backgroundColor: '#0A2647',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '900',
    },
    blockedTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0A2647',
        marginBottom: 8,
    },
    blockedSub: {
        fontSize: 14,
        color: '#adb5bd',
    },
    autoImportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    autoImportTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#6C3EC1',
    },
    autoImportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6C3EC1',
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 20,
    },
    verificationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    verifyToggle: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f3f5',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    verifyToggleActive: {
        backgroundColor: '#E7F1FF',
        borderColor: '#007AFF',
    },
    verifyToggleText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#adb5bd',
    },
    verifyToggleTextActive: {
        color: '#007AFF',
    },
    verifyStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    verifyBadgeValid: {
        backgroundColor: '#E7F1FF',
        borderColor: '#007AFF',
    },
    verifyBadgeInvalid: {
        backgroundColor: '#f1f3f5',
        borderColor: '#dee2e6',
    },
    verifyStatusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    verifyTextValid: {
        color: '#007AFF',
    },
    verifyTextInvalid: {
        color: '#adb5bd',
    },
    verifiedBadgeMini: {
        backgroundColor: '#007AFF',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBadgeTextMini: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    autoImportBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    textModeArea: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
        paddingTop: 16,
        gap: 10,
    },
    textModeGuide: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '600',
        lineHeight: 18,
        marginBottom: 4,
    },
    textModeInput: {
        borderWidth: 1.5,
        borderColor: '#dee2e6',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 13,
        color: '#212529',
        backgroundColor: '#f8f9fa',
        minHeight: 120,
        textAlignVertical: 'top',
    },
    listStats: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 12,
    },
    listStatsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6E85B7',
        textAlign: 'center',
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    issuesCard: {
        backgroundColor: '#FFF4F4',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFCACA',
    },
    issuesTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#D32F2F',
        marginBottom: 6,
    },
    issueItem: {
        fontSize: 11,
        color: '#B71C1C',
        fontWeight: '600',
        marginBottom: 2,
    },
});
