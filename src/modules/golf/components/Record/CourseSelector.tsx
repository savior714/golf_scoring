import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from './courseSelector.styles';
import { supabase } from '../../../../shared/lib/supabase';
import { ClubSummary } from '../../golf.types';
import { golfService } from '../../golf.service';
import { parseCourseDisplayName } from '../../golf.constants';

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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

      if (isMounted.current) {
        Alert.alert('성공', '구장 요청이 완료되었습니다.\n관리자 확인 후 추가될 예정입니다.');
        setRequestClubName('');
        setIsRequestModalVisible(false);
      }
    } catch (err) {
      console.error('Course request error:', err);
      if (isMounted.current) {
        Alert.alert('오류', '요청 중 문제가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
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
      {/* 
        Stack.Screen options moved to TabLayout(_layout.tsx) for SSOT.
        If we need dynamic header changes, we can use it here, 
        but currently we use headerShown: false in _layout.tsx.
      */}

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
            {selectionStep === 'out' && tempSelection.club?.courses.map((course) => {
              const { label, direction, suffix } = parseCourseDisplayName(course.name);
              return (
                <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p) => ({ ...p, outCourse: course })); handleSetStep('in'); }}>
                  <View style={styles.courseNameRow}>
                    <Text style={styles.selectText}>{label} {suffix}</Text>
                    {direction && (
                      <View style={styles.directionBadge}>
                        <Text style={styles.directionBadgeText}>{direction}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectionStep === 'in' && tempSelection.club?.courses.map((course) => {
              const { label, direction, suffix } = parseCourseDisplayName(course.name);
              return (
                <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p) => ({ ...p, inCourse: course })); handleSetStep('tee'); }}>
                  <View style={styles.courseNameRow}>
                    <Text style={styles.selectText}>{label} {suffix}</Text>
                    {direction && (
                      <View style={styles.directionBadge}>
                        <Text style={styles.directionBadgeText}>{direction}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
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

