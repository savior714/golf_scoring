import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../../../../shared/lib/supabase';
import { ClubSummary } from '../../golf.types';
import { golfService } from '../../golf.service';

interface CourseSelectorProps {
  isLoadingMaster: boolean;
  selectionStep: 'club' | 'out' | 'in' | 'tee';
  clubs: ClubSummary[];
  tempSelection: {
    club?: ClubSummary;
    outCourse?: { id: string; name: string };
    inCourse?: { id: string; name: string };
  };
  setTempSelection: (selection: Partial<CourseSelectorProps['tempSelection']> | ((prev: CourseSelectorProps['tempSelection']) => CourseSelectorProps['tempSelection'])) => void;
  setSelectionStep: (step: 'club' | 'out' | 'in' | 'tee') => void;
  startNewRound: (tee: string) => void;
}

export function CourseSelector({
  isLoadingMaster,
  selectionStep,
  clubs,
  tempSelection,
  setTempSelection,
  setSelectionStep,
  startNewRound,
}: CourseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [requestClubName, setRequestClubName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 구장 요청 제출 */
  const handleRequestSubmit = async () => {
    if (!requestClubName.trim()) {
      Alert.alert('알림', '요청하실 구장명을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const normalizedName = golfService.normalizeClubName(requestClubName.trim());
      const { error } = await supabase
        .from('course_requests')
        .insert({
          user_id: user.id,
          requested_club_name: normalizedName,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert('성공', '구장 요청이 완료되었습니다.\n관리자 확인 후 추가될 예정입니다.');
      setRequestClubName('');
      setIsRequestModalVisible(false);
    } catch (err) {
      console.error('Course request error:', err);
      Alert.alert('오류', '요청 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 단계 전환 시 검색어 초기화 */
  const handleSetStep = (step: 'club' | 'out' | 'in' | 'tee') => {
    setSearchQuery('');
    setSelectionStep(step);
  };

  /** 구장명 필터링 (대소문자 무시, 공백 무시) */
  const filteredClubs = useMemo(() => {
    // [Task 1] 검증된(isVerified) 구장만 노출 (테스트/더미 데이터 제외)
    const baseClubs = clubs.filter(club => club.isVerified === true);
    
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return baseClubs;
    return baseClubs.filter((club) => club.name.toLowerCase().includes(normalized));
  }, [clubs, searchQuery]);

  const isClubStep = selectionStep === 'club';

  return (
    <View style={styles.courseSelectContainer}>
      <Stack.Screen options={{ title: '라운딩 설정' }} />

      {isLoadingMaster && clubs.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0A2647" />
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {isClubStep && '구장 선택'}
              {selectionStep === 'out' && '전반 코스 선택'}
              {selectionStep === 'in' && '후반 코스 선택'}
              {selectionStep === 'tee' && '티박스 선택'}
            </Text>
            {isLoadingMaster && (
              <ActivityIndicator size="small" color="#0A2647" style={{ marginLeft: 10, marginBottom: 40 }} />
            )}
          </View>
          {!isClubStep && tempSelection.club && (
            <Text style={styles.selectedClubLabel}>{tempSelection.club.name}</Text>
          )}

          {/* 구장 선택 단계에서만 검색창 노출 */}
          {isClubStep && (
            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="구장명 검색..."
                placeholderTextColor="#adb5bd"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Text style={styles.searchResultCount}>
                  {filteredClubs.length}개 결과
                </Text>
              )}
            </View>
          )}

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {isClubStep && filteredClubs.length === 0 && !isLoadingMaster && (
              <View style={styles.emptyState}>
                {searchQuery.trim().length > 0 ? (
                  <>
                    <Text style={styles.emptyStateText}>'{searchQuery}'에 해당하는 구장이 없습니다.</Text>
                    <TouchableOpacity 
                      style={styles.requestButtonInline}
                      onPress={() => {
                        setRequestClubName(searchQuery);
                        setIsRequestModalVisible(true);
                      }}
                    >
                      <Text style={styles.requestButtonTextInline}>이 구장 추가 요청하기</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyStateText}>구장 데이터를 불러오지 못했습니다.</Text>
                    <Text style={styles.emptyStateSubText}>네트워크 연결을 확인하거나 잠시 후 다시 시도해 주세요.</Text>
                  </>
                )}
              </View>
            )}
            {isClubStep && (
              <TouchableOpacity 
                style={styles.bottomRequestBtn}
                onPress={() => setIsRequestModalVisible(true)}
              >
                <Text style={styles.bottomRequestBtnText}>찾으시는 구장이 없나요? 요청하기</Text>
              </TouchableOpacity>
            )}
            {isClubStep && filteredClubs.map((club) => (
              <TouchableOpacity
                key={club.id}
                style={styles.selectItem}
                onPress={() => { setTempSelection({ club }); handleSetStep('out'); }}
              >
                <Text style={styles.selectText}>{club.name}</Text>
                <Text style={styles.selectSubText}>{club.courseCount}개 코스</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'out' && tempSelection.club?.courses.map((course) => (
              <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p) => ({ ...p, outCourse: course })); handleSetStep('in'); }}>
                <Text style={styles.selectText}>{course.name}</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'in' && tempSelection.club?.courses.map((course) => (
              <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p) => ({ ...p, inCourse: course })); handleSetStep('tee'); }}>
                <Text style={styles.selectText}>{course.name}</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'tee' && ['White', 'Blue', 'Black', 'Red'].map((tee) => (
              <TouchableOpacity key={tee} style={[styles.selectItem, { borderLeftWidth: 10, borderLeftColor: tee.toLowerCase() }]} onPress={() => startNewRound(tee)}>
                <Text style={styles.selectText}>{tee} Tee</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectionStep !== 'club' && (
            <TouchableOpacity style={styles.backStepBtn} onPress={() => handleSetStep(selectionStep === 'tee' ? 'in' : selectionStep === 'in' ? 'out' : 'club')}>
              <Text style={styles.backStepBtnText}>이전 단계</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* 구장 요청 모달 */}
      <Modal
        visible={isRequestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>구장 추가 요청</Text>
            <Text style={styles.modalDesc}>
              원하시는 구장 이름을 남겨주시면{"\n"}최대한 빨리 업데이트하겠습니다!
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="구장명 입력 (예: 해피골프 CC)"
              placeholderTextColor="#adb5bd"
              value={requestClubName}
              onChangeText={setRequestClubName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setIsRequestModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.submitBtn]} 
                onPress={handleRequestSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>요청하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  courseSelectContainer: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#6E85B7', fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#0A2647', marginBottom: 16, textAlign: 'center' },
  searchWrapper: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  searchResultCount: {
    marginTop: 8,
    fontSize: 12,
    color: '#6E85B7',
    fontWeight: '600',
    textAlign: 'right',
  },
  selectItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  selectText: { fontSize: 18, fontWeight: '700', color: '#333' },
  selectSubText: { fontSize: 12, color: '#adb5bd', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyStateText: { fontSize: 15, fontWeight: '700', color: '#495057' },
  emptyStateSubText: { fontSize: 13, color: '#adb5bd', textAlign: 'center' },
  backStepBtn: { marginTop: 10, alignSelf: 'center', padding: 10 },
  backStepBtnText: { color: '#6E85B7', fontWeight: '700', textDecorationLine: 'underline' },
  selectedClubLabel: { fontSize: 14, fontWeight: '700', color: '#6E85B7', textAlign: 'center', marginTop: -8, marginBottom: 16 },
  
  // 구장 요청 스타일
  requestButtonInline: {
    marginTop: 12,
    backgroundColor: '#0A2647',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  requestButtonTextInline: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bottomRequestBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    marginTop: 10,
  },
  bottomRequestBtnText: {
    color: '#6E85B7',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 38, 71, 0.4)', // 더 부드러운 오버레이
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400, // 너무 넓어지지 않게 제한
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0A2647',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A2647',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  modalDesc: {
    fontSize: 15,
    color: '#6E85B7',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    marginBottom: 24,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%', // 너비 고정 필수
    gap: 12,
  },
  modalBtn: {
    flex: 1, // 버튼이 동일한 공간을 차지하도록 flex 적용
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F3F5',
  },
  submitBtn: {
    backgroundColor: '#0A2647',
    shadowColor: '#0A2647',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelBtnText: {
    color: '#495057',
    fontWeight: '700',
    fontSize: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});