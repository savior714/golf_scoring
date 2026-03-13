/**
 * @file app/(tabs)/admin.tsx
 * @description 관리자 전용 구장 등록 화면 (savior714@gmail.com만 접근 가능)
 * - useIsAdmin 훅으로 현재 사용자 권한 판단
 * - 비관리자에게는 탭 자체가 노출되지 않음 (_layout.tsx에서 제어)
 */

import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import { PlusCircle, Save } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminNavButtons } from '@/src/modules/admin/components/AdminNavButtons';
import { ClubSelectModal } from '@/src/modules/admin/components/ClubSelectModal';
import { CourseSection } from '@/src/modules/admin/components/AdminFormComponents';
import { useAdminForm } from '@/src/modules/admin/hooks/useAdminForm';
import { styles } from '@/src/modules/admin/styles/adminStyles';

export default function AdminScreen() {
    const { isAdmin, isLoading } = useIsAdmin();

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#0A2647" />
            </SafeAreaView>
        );
    }

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

function AdminForm() {
    const {
        clubName, setClubName,
        courses, isSaving, isSubmitted,
        clubList, showClubSelect, setShowClubSelect,
        isLoadingClubs, validationStatus,
        loadClubList, handleSelectClub,
        addCourse, removeCourse,
        updateCourseName, toggleTee, updatePar, updateTeeDistance,
        handleSave,
    } = useAdminForm();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN ONLY</Text>
                </View>

                <AdminNavButtons
                    onLoadClub={() => {
                        loadClubList();
                        setShowClubSelect(true);
                    }}
                />

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

                {/* 데이터 무결성 검증 상태 */}
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
                            validationStatus.isValid ? styles.verifyBadgeValid : styles.verifyBadgeInvalid,
                        ]}>
                            <Text style={[
                                styles.verifyStatusText,
                                validationStatus.isValid ? styles.verifyTextValid : styles.verifyTextInvalid,
                            ]}>
                                {validationStatus.isValid ? '검증 통과' : '미검증'}
                            </Text>
                        </View>
                    </View>
                </View>

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
                        forceShowErrors={isSubmitted}
                    />
                ))}

                <TouchableOpacity style={styles.addCourseBtn} onPress={addCourse}>
                    <PlusCircle size={18} color="#0A2647" />
                    <Text style={styles.addCourseBtnText}>코스 추가</Text>
                </TouchableOpacity>

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

                <ClubSelectModal
                    visible={showClubSelect}
                    isLoading={isLoadingClubs}
                    clubList={clubList}
                    onClose={() => setShowClubSelect(false)}
                    onSelect={handleSelectClub}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
