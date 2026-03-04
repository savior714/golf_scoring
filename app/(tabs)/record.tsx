/**
 * @file app/(tabs)/record.tsx
 * @description 홀별 스코어 입력 화면
 */

import { GolfRound, HoleRecord } from '@/src/domains/golf';
import { roundRepository } from '@/src/repositories/roundRepository';
import { Stack } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordScreen() {
  const [holeIndex, setHoleIndex] = useState(0); // 0 ~ 17 (1~18홀)
  const [currentHole, setCurrentHole] = useState<HoleRecord>({
    holeNo: 1,
    par: 4,
    stroke: 4,
    putt: 2,
    isFairway: true,
    isGIR: false,
    penalty: 0,
  });

  const [holes, setHoles] = useState<HoleRecord[]>([]);

  /**
   * 카운터 증감 로직
   */
  const updateValue = (key: keyof HoleRecord, delta: number) => {
    setCurrentHole((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] as number) + delta),
    }));
  };

  /**
   * 현재 홀 저장 및 다음 홀 이동
   */
  const handleNextHole = () => {
    const updatedHoles = [...holes];
    updatedHoles[holeIndex] = currentHole;
    setHoles(updatedHoles);

    if (holeIndex < 17) {
      setHoleIndex(holeIndex + 1);
      // 다음 홀 초기값 설정 (이전 기록이 있으면 로드, 없으면 기본값)
      const nextHole = updatedHoles[holeIndex + 1] || {
        holeNo: holeIndex + 2,
        par: 4,
        stroke: 4,
        putt: 2,
        isFairway: true,
        isGIR: false,
        penalty: 0,
      };
      setCurrentHole(nextHole);
    } else {
      Alert.alert('알림', '마지막 홀입니다. 전체 라운딩을 저장하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '저장', onPress: saveFullRound },
      ]);
    }
  };

  const saveFullRound = async () => {
    const newRound: GolfRound = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      courseName: '써닝포인트 CC',
      courseType: 'Sun',
      holes: holes,
    };
    await roundRepository.saveRound(newRound);
    Alert.alert('성공', '라운딩 기록이 저장되었습니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `${holeIndex + 1}번 홀 기록` }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Par 입력 */}
        <View style={styles.card}>
          <Text style={styles.label}>PAR</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={() => updateValue('par', -1)} style={styles.btnSmall}><Minus color="#fff" /></TouchableOpacity>
            <Text style={styles.valueText}>{currentHole.par}</Text>
            <TouchableOpacity onPress={() => updateValue('par', 1)} style={styles.btnSmall}><Plus color="#fff" /></TouchableOpacity>
          </View>
        </View>

        {/* Stroke 입력 */}
        <View style={styles.card}>
          <Text style={styles.label}>STROKE (총 타수)</Text>
          <View style={styles.counterRowLarge}>
            <TouchableOpacity onPress={() => updateValue('stroke', -1)} style={styles.btnLarge}><Minus size={32} color="#fff" /></TouchableOpacity>
            <Text style={styles.valueTextLarge}>{currentHole.stroke}</Text>
            <TouchableOpacity onPress={() => updateValue('stroke', 1)} style={styles.btnLarge}><Plus size={32} color="#fff" /></TouchableOpacity>
          </View>
        </View>

        {/* Putt 입력 */}
        <View style={styles.card}>
          <Text style={styles.label}>PUTT</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={() => updateValue('putt', -1)} style={styles.btnSmall}><Minus color="#fff" /></TouchableOpacity>
            <Text style={styles.valueText}>{currentHole.putt}</Text>
            <TouchableOpacity onPress={() => updateValue('putt', 1)} style={styles.btnSmall}><Plus color="#fff" /></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNextHole}>
          <Text style={styles.nextBtnText}>{holeIndex === 17 ? '라운딩 종료 및 저장' : '다음 홀로 이동'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 4px 6px rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  counterRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212529',
  },
  valueTextLarge: {
    fontSize: 64,
    fontWeight: '800',
    color: '#007AFF',
  },
  btnSmall: {
    backgroundColor: '#ADB5BD',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLarge: {
    backgroundColor: '#007AFF',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: '#212529',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
