import React from 'react';
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
  setTempSelection: (selection: any) => void;
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
          <View style={styles.selectionProgress}>
            <View style={[styles.progressDot, { backgroundColor: '#007AFF' }]} />
            <View style={[styles.progressDot, selectionStep !== 'club' ? { backgroundColor: '#007AFF' } : null]} />
            <View style={[styles.progressDot, selectionStep === 'tee' ? { backgroundColor: '#007AFF' } : null]} />
          </View>
          <Text style={styles.title}>
            {selectionStep === 'club' && '구장 선택'}
            {selectionStep === 'out' && '전반 코스 선택'}
            {selectionStep === 'in' && '후반 코스 선택'}
            {selectionStep === 'tee' && '티박스 선택'}
          </Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {selectionStep === 'club' && clubs.map(club => (
              <TouchableOpacity key={club.id} style={styles.selectItem} onPress={() => { setTempSelection({ club }); setSelectionStep('out'); }}>
                <Text style={styles.selectText}>{club.name}</Text>
                <Text style={styles.selectSubText}>{club.courseCount}개 코스</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'out' && tempSelection.club?.courses.map(course => (
              <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p: any) => ({ ...p, outCourse: course })); setSelectionStep('in'); }}>
                <Text style={styles.selectText}>{course.name}</Text>
              </TouchableOpacity>
            ))}
            {selectionStep === 'in' && tempSelection.club?.courses.map(course => (
              <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection((p: any) => ({ ...p, inCourse: course })); setSelectionStep('tee'); }}>
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
  selectionProgress: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
  progressDot: { width: 40, height: 6, backgroundColor: '#E9ECEF', borderRadius: 3 },
  title: { fontSize: 28, fontWeight: '900', color: '#0A2647', marginBottom: 40, textAlign: 'center' },
  selectItem: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  selectText: { fontSize: 18, fontWeight: '700', color: '#333' },
  selectSubText: { fontSize: 12, color: '#adb5bd', marginTop: 4 },
  backStepBtn: { marginTop: 10, alignSelf: 'center', padding: 10 },
  backStepBtnText: { color: '#6E85B7', fontWeight: '700', textDecorationLine: 'underline' },
});