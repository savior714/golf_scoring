import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  return (
    <View style={styles.courseSelectContainer}>
      <Stack.Screen options={{ title: '라운딩 설정' }} />
      {isLoadingMaster ? (
        <ActivityIndicator size="large" color="#0A2647" />
      ) : (
        <>
          <Text style={styles.title}>
            {selectionStep === 'club' && '구장 선택'}
            {selectionStep === 'out' && '전반 코스 선택'}
            {selectionStep === 'in' && '후반 코스 선택'}
            {selectionStep === 'tee' && '티박스 선택'}
          </Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {selectionStep === 'club' && clubs.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>구장 데이터를 불러오지 못했습니다.</Text>
                <Text style={styles.emptyStateSubText}>네트워크 연결을 확인하거나 잠시 후 다시 시도해 주세요.</Text>
              </View>
            )}
            {selectionStep === 'club' && clubs.map(club => (
              <TouchableOpacity key={club.id} style={styles.selectItem} onPress={() => { setTempSelection({ club }); setSelectionStep('out'); }}>
                <Text style={styles.selectText}>{club.name}</Text>
                <Text style={styles.selectSubText}>{club.courseCount}개 코스</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'out' && tempSelection.club?.courses.map(course => (
              <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p) => ({ ...p, outCourse: course })); setSelectionStep('in'); }}>
                <Text style={styles.selectText}>{course.name}</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'in' && tempSelection.club?.courses.map(course => (
              <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p) => ({ ...p, inCourse: course })); setSelectionStep('tee'); }}>
                <Text style={styles.selectText}>{course.name}</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'tee' && ['White', 'Blue', 'Black', 'Red'].map(tee => (
              <TouchableOpacity key={tee} style={[styles.selectItem, { borderLeftWidth: 10, borderLeftColor: tee.toLowerCase() }]} onPress={() => startNewRound(tee)}>
                <Text style={styles.selectText}>{tee} Tee</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectionStep !== 'club' && (
            <TouchableOpacity style={styles.backStepBtn} onPress={() => setSelectionStep(selectionStep === 'tee' ? 'in' : selectionStep === 'in' ? 'out' : 'club')}>
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
  title: { fontSize: 28, fontWeight: '900', color: '#0A2647', marginBottom: 40, textAlign: 'center' },
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