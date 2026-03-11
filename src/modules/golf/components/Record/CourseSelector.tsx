import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { ClubSummary } from '../../golf.types';

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

  /** 단계 전환 시 검색어 초기화 */
  const handleSetStep = (step: 'club' | 'out' | 'in' | 'tee') => {
    setSearchQuery('');
    setSelectionStep(step);
  };

  /** 구장명 필터링 (대소문자 무시, 공백 무시) */
  const filteredClubs = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return clubs;
    return clubs.filter((club) => club.name.toLowerCase().includes(normalized));
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
                  <Text style={styles.emptyStateText}>'{searchQuery}'에 해당하는 구장이 없습니다.</Text>
                ) : (
                  <>
                    <Text style={styles.emptyStateText}>구장 데이터를 불러오지 못했습니다.</Text>
                    <Text style={styles.emptyStateSubText}>네트워크 연결을 확인하거나 잠시 후 다시 시도해 주세요.</Text>
                  </>
                )}
              </View>
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
});