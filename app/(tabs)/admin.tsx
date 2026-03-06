/**
 * @file app/(tabs)/admin.tsx
 * @description 관리자 전용 구장 등록 화면 (savior714@gmail.com만 접근 가능)
 * - useIsAdmin 훅으로 현재 사용자 권한 판단
 * - 비관리자에게는 탭 자체가 노출되지 않음 (_layout.tsx에서 제어)
 * - 구장명 / 코스명 / 홀별 Par + 티별 전장 입력 후 Supabase에 등록
 */

import { clubRepository } from '@/src/modules/golf/golf.repository';
import { supabase } from '@/src/shared/lib/supabase';
import { ClubSummary } from '@/src/modules/golf/golf.types';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import { Stack } from 'expo-router';
import { ChevronDown, FileSearch, PlusCircle, Save, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ────────────────────────────────────────────────────────────
// 티 색상 상수
// ────────────────────────────────────────────────────────────
const TEE_COLORS = [
    { key: 'Black', label: '블랙', color: '#212529' },
    { key: 'Blue', label: '블루', color: '#007AFF' },
    { key: 'White', label: '화이트', color: '#495057' },
    { key: 'Red', label: '레드', color: '#FF6B6B' },
] as const;

type TeeColorKey = typeof TEE_COLORS[number]['key'];

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────
interface HoleInput {
    holeNumber: number;
    par: string;
    distances: Partial<Record<TeeColorKey, string>>;
}

interface CourseInput {
    id?: string;
    courseName: string;
    holes: HoleInput[];
    activeTees: TeeColorKey[];
}

const DEFAULT_HOLES = (count: number): HoleInput[] =>
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


    // 구장 선택용
    const [clubList, setClubList] = useState<ClubSummary[]>([]);
    const [showClubSelect, setShowClubSelect] = useState(false);
    const [isLoadingClubs, setIsLoadingClubs] = useState(false);

    // 구장 목록 불러오기
    const loadClubList = async () => {
        setIsLoadingClubs(true);
        try {
            const list = await clubRepository.getAllClubsSummary();
            setClubList(list);
        } finally {
            setIsLoadingClubs(false);
        }
    };

    const handleSelectClub = async (clubId: string) => {
        setIsLoadingClubs(true);
        setShowClubSelect(false);
        try {
            const fullInfo = await clubRepository.getClubFullInfo(clubId);
            if (fullInfo) {
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
        } catch (e) {
            showAlert('오류', '구장 정보를 불러오지 못했습니다.');
        } finally {
            setIsLoadingClubs(false);
        }
    };


    // 코스 추가
    const addCourse = () => {
        setCourses(prev => [...prev, { courseName: '', holes: DEFAULT_HOLES(9), activeTees: ['White'] }]);
    };

    // 코스 삭제
    const removeCourse = (idx: number) => {
        if (courses.length <= 1) return; // 최소 1개 유지
        setCourses(prev => prev.filter((_, i) => i !== idx));
    };

    // 코스명 변경
    const updateCourseName = (idx: number, name: string) => {
        setCourses(prev => prev.map((c, i) => i === idx ? { ...c, courseName: name } : c));
    };

    // 활성 티 토글 (코스별)
    const toggleTee = (courseIdx: number, teeKey: TeeColorKey) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const already = c.activeTees.includes(teeKey);
            if (already && c.activeTees.length <= 1) return c; // 최소 1개 유지
            const newTees = already
                ? c.activeTees.filter(t => t !== teeKey)
                : [...c.activeTees, teeKey];
            return { ...c, activeTees: newTees };
        }));
    };

    // Par 변경
    const updatePar = (courseIdx: number, holeIdx: number, value: string) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const newHoles = c.holes.map((h, hi) =>
                hi === holeIdx ? { ...h, par: value } : h
            );
            return { ...c, holes: newHoles };
        }));
    };

    // 티별 전장 변경
    const updateTeeDistance = (courseIdx: number, holeIdx: number, teeKey: TeeColorKey, value: string) => {
        setCourses(prev => prev.map((c, ci) => {
            if (ci !== courseIdx) return c;
            const newHoles = c.holes.map((h, hi) => {
                if (hi !== holeIdx) return h;
                return { ...h, distances: { ...h.distances, [teeKey]: value } };
            });
            return { ...c, holes: newHoles };
        }));
    };

    // 저장
    const handleSave = async () => {
        if (!clubName.trim()) {
            showAlert('입력 오류', '구장명을 입력해 주세요.');
            return;
        }

        for (const course of courses) {
            if (!course.courseName.trim()) {
                showAlert('입력 오류', '모든 코스명을 입력해 주세요.');
                return;
            }
        }

        setIsSaving(true);
        try {
            const payload = {
                clubName: clubName.trim(),
                courses: courses.map(c => ({
                    courseName: c.courseName.trim(),
                    holes: c.holes.map(h => ({
                        holeNumber: h.holeNumber,
                        par: parseInt(h.par, 10) || 4,
                        distances: Object.entries(h.distances)
                            .filter(([_, v]) => v !== '' && !isNaN(parseInt(v, 10)))
                            .map(([teeColor, distanceMeter]) => ({
                                teeColor,
                                distanceMeter: parseInt(distanceMeter, 10),
                            })),
                    })),
                })),
            };

            const result = await clubRepository.registerClub(payload);

            if (result.success) {
                showAlert('등록/수정 완료', `"${clubName}" 구장이 성공적으로 저장되었습니다.`);
            } else {
                showAlert('저장 실패', result.error ?? '알 수 없는 오류가 발생했습니다.');
            }
        } catch (e: any) {
            showAlert('오류', e?.message ?? '저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

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

                {/* 코스 목록 */}
                {courses.map((course, ci) => (
                    <View key={ci} style={styles.card}>
                        {/* 코스 헤더 */}
                        <View style={styles.courseHeader}>
                            <Text style={styles.label}>코스 {ci + 1}</Text>
                            {courses.length > 1 && (
                                <TouchableOpacity onPress={() => removeCourse(ci)} style={styles.removeBtn}>
                                    <Trash2 size={16} color="#FF6B6B" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TextInput
                            style={[styles.input, { marginBottom: 16 }]}
                            placeholder="예: Lake Course"
                            placeholderTextColor="#adb5bd"
                            value={course.courseName}
                            onChangeText={v => updateCourseName(ci, v)}
                            blurOnSubmit={false}
                        />

                        {/* Par 합계 미리보기 */}
                        <ParSumPreview holes={course.holes} />

                        {/* 티 선택 토글 */}
                        <View style={styles.teeToggleRow}>
                            <Text style={styles.teeToggleLabel}>입력 티:</Text>
                            {TEE_COLORS.map(tee => {
                                const active = course.activeTees.includes(tee.key);
                                return (
                                    <TouchableOpacity
                                        key={tee.key}
                                        style={[
                                            styles.teeToggleBtn,
                                            active && { backgroundColor: tee.color, borderColor: tee.color },
                                        ]}
                                        onPress={() => toggleTee(ci, tee.key)}
                                    >
                                        <Text style={[styles.teeToggleBtnText, active && { color: '#fff' }]}>
                                            {tee.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* 홀별 Par 및 티별 전장 입력 그리드 */}
                        <View style={styles.parGrid}>
                            <View style={styles.gridHeader}>
                                <Text style={[styles.gridHeaderText, { width: 30 }]}>홀</Text>
                                <Text style={[styles.gridHeaderText, { width: 46 }]}>PAR</Text>
                                {course.activeTees.map(teeKey => {
                                    const tee = TEE_COLORS.find(t => t.key === teeKey)!;
                                    return (
                                        <Text
                                            key={teeKey}
                                            style={[styles.gridHeaderText, styles.gridHeaderTee, { color: tee.color }]}
                                        >
                                            {tee.label}(m)
                                        </Text>
                                    );
                                })}
                            </View>
                            {course.holes.map((hole, hi) => (
                                <View key={hi} style={styles.holeInputRow}>
                                    <View style={styles.holeNumberBadge}>
                                        <Text style={styles.holeNumberText}>{hole.holeNumber}</Text>
                                    </View>
                                    <TextInput
                                        style={styles.parInputSmall}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        value={hole.par}
                                        onChangeText={v => updatePar(ci, hi, v)}
                                        selectTextOnFocus
                                    />
                                    {course.activeTees.map(teeKey => (
                                        <TextInput
                                            key={teeKey}
                                            style={styles.distanceInput}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor="#ced4da"
                                            value={hole.distances[teeKey] ?? ''}
                                            onChangeText={v => updateTeeDistance(ci, hi, teeKey, v)}
                                            selectTextOnFocus
                                        />
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
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
                        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalContent}>
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
                                    <Text style={styles.emptyListText}>등록된 구장이 없습니다.</Text>
                                ) : clubList.map(club => (
                                    <TouchableOpacity
                                        key={club.id}
                                        style={styles.clubListItem}
                                        onPress={() => handleSelectClub(club.id)}
                                    >
                                        <Text style={styles.clubListItemName}>{club.name}</Text>
                                        <View style={styles.clubListItemCourse}>
                                            <Text style={styles.courseCountText}>{club.courseCount}개 코스</Text>
                                            <ChevronDown size={14} color="#adb5bd" />
                                        </View>
                                    </TouchableOpacity>
                                ))}
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
// Par 합계 미리보기 컴포넌트
// ────────────────────────────────────────────────────────────
function ParSumPreview({ holes }: { holes: HoleInput[] }) {
    const sum = holes.reduce((acc, h) => acc + (parseInt(h.par, 10) || 0), 0);
    const expected = holes.length === 9 ? 36 : 72;
    const isValid = sum === expected;

    return (
        <View style={[styles.parSumBadge, isValid ? styles.parSumOk : styles.parSumWarn]}>
            <Text style={[styles.parSumText, isValid ? styles.parSumTextOk : styles.parSumTextWarn]}>
                Par 합계: {sum} / {expected} {isValid ? '(정상)' : '(오류 — 입력 확인 필요)'}
            </Text>
        </View>
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
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 10,
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
});
