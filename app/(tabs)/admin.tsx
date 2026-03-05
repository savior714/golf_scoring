/**
 * @file app/(tabs)/admin.tsx
 * @description 관리자 전용 구장 등록 화면 (savior714@gmail.com만 접근 가능)
 * - useIsAdmin 훅으로 현재 사용자 권한 판단
 * - 비관리자에게는 탭 자체가 노출되지 않음 (_layout.tsx에서 제어)
 * - 구장명 / 코스명 / 홀별 Par 입력 후 Supabase에 등록
 */

import { clubRepository } from '@/src/modules/golf/golf.repository';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import { Stack } from 'expo-router';
import { PlusCircle, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────
interface HoleInput {
    holeNumber: number;
    par: string; // TextInput은 string으로 받고 저장 시 숫자로 변환
}

interface CourseInput {
    courseName: string;
    holes: HoleInput[];
}

const DEFAULT_HOLES = (count: number): HoleInput[] =>
    Array.from({ length: count }, (_, i) => ({ holeNumber: i + 1, par: '4' }));

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
        { courseName: '', holes: DEFAULT_HOLES(9) },
    ]);
    const [isSaving, setIsSaving] = useState(false);

    // 코스 추가
    const addCourse = () => {
        setCourses(prev => [...prev, { courseName: '', holes: DEFAULT_HOLES(9) }]);
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
                    })),
                })),
            };

            const result = await clubRepository.registerClub(payload);

            if (result.success) {
                showAlert('등록 완료', `"${clubName}" 구장이 성공적으로 등록되었습니다.`);
                // 폼 초기화
                setClubName('');
                setCourses([{ courseName: '', holes: DEFAULT_HOLES(9) }]);
            } else {
                showAlert('등록 실패', result.error ?? '알 수 없는 오류가 발생했습니다.');
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

                {/* 구장명 */}
                <View style={styles.card}>
                    <Text style={styles.label}>구장명</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 아리스타CC"
                        placeholderTextColor="#adb5bd"
                        value={clubName}
                        onChangeText={setClubName}
                    />
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
                        />

                        {/* Par 합계 미리보기 */}
                        <ParSumPreview holes={course.holes} />

                        {/* 홀별 Par 입력 그리드 */}
                        <View style={styles.parGrid}>
                            {course.holes.map((hole, hi) => (
                                <View key={hi} style={styles.parCell}>
                                    <Text style={styles.parHoleLabel}>{hole.holeNumber}번</Text>
                                    <TextInput
                                        style={styles.parInput}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        value={hole.par}
                                        onChangeText={v => updatePar(ci, hi, v)}
                                        selectTextOnFocus
                                    />
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
                        <Text style={styles.saveBtnText}>구장 등록</Text>
                    )}
                </TouchableOpacity>

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
    },
    parGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    parCell: {
        alignItems: 'center',
        width: '18%',
    },
    parHoleLabel: {
        fontSize: 11,
        color: '#6E85B7',
        fontWeight: '700',
        marginBottom: 4,
    },
    parInput: {
        borderWidth: 1.5,
        borderColor: '#dee2e6',
        borderRadius: 10,
        width: '100%',
        textAlign: 'center',
        paddingVertical: 8,
        fontSize: 18,
        fontWeight: '800',
        color: '#0A2647',
        backgroundColor: '#f8f9fa',
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
    saveBtn: {
        backgroundColor: '#0A2647',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
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
});
