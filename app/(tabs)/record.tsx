import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CourseInfo, PREDEFINED_COURSES } from '../../src/data/courseData';
import { GolfRound, HoleRecord } from '../../src/domains/golf';
import { roundRepository } from '../../src/repositories/roundRepository';

export default function RecordScreen() {
  const [currentHole, setCurrentHole] = useState(1);
  const [par, setPar] = useState(4);
  const [stroke, setStroke] = useState(4);
  const [putt, setPutt] = useState(2);
  const [ob, setOb] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [missShot, setMissShot] = useState('없음');
  const [isParEditing, setIsParEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo | null>(null);
  const [holeRecords, setHoleRecords] = useState<HoleRecord[]>([]);
  const [roundId, setRoundId] = useState<string>("");
  const queryClient = useQueryClient();

  // 최초 진입 시 진행 중인 라운드 ID 로드
  useEffect(() => {
    const initSession = async () => {
      try {
        const savedId = await roundRepository.getCurrentRoundId();
        if (savedId) {
          setRoundId(savedId);
          // 해당 라운드의 기록 로드
          const rounds = await roundRepository.getAllRounds();
          const currentRound = rounds.find(r => r.id === savedId);
          if (currentRound) {
            setHoleRecords(currentRound.holes);
            // 코스 자동 선택 (기존 기록이 있다면)
            const matchedCourse = PREDEFINED_COURSES.find(c => c.name === currentRound.courseName);
            if (matchedCourse) setSelectedCourse(matchedCourse);
          }
        }
      } catch (e) {
        console.error("Session init failed", e);
      }
    };
    initSession();
  }, []);

  // 홀 변경 시 해당 홀의 데이터 로드 또는 초기화
  useEffect(() => {
    if (selectedCourse) {
      // 기존 기록이 있는지 확인
      const existingRecord = holeRecords.find(r => r.holeNo === currentHole);

      if (existingRecord) {
        // 기존 기록이 있으면 해당 값으로 설정
        setPar(existingRecord.par);
        setStroke(existingRecord.stroke);
        setPutt(existingRecord.putt);
        setOb(existingRecord.ob);
        setPenalty(existingRecord.penalty);
        setMissShot(existingRecord.missShot || '없음');
      } else {
        // 기록이 없으면 코스 데이터 기반 초기화
        setPar(selectedCourse.pars[currentHole - 1]);
        setStroke(selectedCourse.pars[currentHole - 1]);
        setPutt(2);
        setOb(0);
        setPenalty(0);
        setMissShot('없음');
      }
      setIsParEditing(false);
    }
  }, [currentHole, selectedCourse, holeRecords]);

  const adjustValue = (type: 'stroke' | 'putt' | 'par' | 'ob' | 'penalty', delta: number) => {
    if (type === 'stroke') setStroke(prev => Math.max(1, prev + delta));
    else if (type === 'putt') setPutt(prev => Math.max(0, prev + delta));
    else if (type === 'ob') {
      setOb(prev => Math.max(0, prev + delta));
    }
    else if (type === 'penalty') {
      setPenalty(prev => Math.max(0, prev + delta));
    }
    else if (type === 'par') setPar(prev => {
      const next = prev + delta;
      return next >= 3 && next <= 5 ? next : prev;
    });
  };

  const startNewRound = async (course: CourseInfo) => {
    const newId = "round_" + Date.now();
    setRoundId(newId);
    setHoleRecords([]);
    setCurrentHole(1);
    setSelectedCourse(course);
    await roundRepository.setCurrentRoundId(newId);
  };

  const saveCurrentHole = async () => {
    const currentRecord: HoleRecord = {
      holeNo: currentHole,
      par,
      stroke,
      putt,
      isFairway: true,
      isGIR: (stroke - putt) <= (par - 2),
      ob,
      penalty,
      missShot: missShot === '없음' ? undefined : missShot
    };

    const updatedRecords = [...holeRecords.filter(r => r.holeNo !== currentHole), currentRecord].sort((a, b) => a.holeNo - b.holeNo);
    setHoleRecords(updatedRecords);

    if (selectedCourse) {
      const currentRound: GolfRound = {
        id: roundId,
        date: new Date().toISOString().split('T')[0],
        courseName: selectedCourse.name,
        courseType: 'Main',
        holes: updatedRecords,
      };
      await roundRepository.saveRound(currentRound);
      // 대시보드 동기화를 위해 Query Invalidation
      queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    }
    return updatedRecords;
  };

  const handlePrevHole = async () => {
    if (currentHole > 1) {
      await saveCurrentHole();
      setCurrentHole(prev => prev - 1);
    }
  };

  const handleNextHole = async () => {
    await saveCurrentHole();
    if (currentHole < 18) {
      setCurrentHole(prev => prev + 1);
    } else {
      Alert.alert('완료', '18홀 라운딩 기록이 저장되었습니다. 대시보드에서 결과를 확인하세요.');
    }
  };

  if (!selectedCourse) {
    return (
      <View style={styles.courseSelectContainer}>
        <Stack.Screen options={{ title: '코스 선택' }} />
        <Text style={styles.title}>오늘의 코스는 어디인가요?</Text>
        {PREDEFINED_COURSES.map(course => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseBtn}
            onPress={() => startNewRound(course)}
          >
            <Text style={styles.courseBtnText}>{course.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
      <Stack.Screen options={{
        title: `${currentHole} / 18`,
        headerTitleStyle: { fontWeight: '900', color: '#0A2647' },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              if (window.confirm) {
                if (window.confirm("코스 변경\n\n코스 변경 시 입력 중인 데이터가 초기화되고, 기존 진행 중인 코스 기록이 소실될 수 있습니다. 정말 변경하시겠습니까?")) {
                  setHoleRecords([]);
                  setCurrentHole(1);
                  setSelectedCourse(null);
                }
              } else {
                Alert.alert(
                  "코스 변경",
                  "코스 변경 시 입력 중인 데이터가 초기화되고, 기존 진행 중인 코스 기록이 소실될 수 있습니다. 정말 변경하시겠습니까?",
                  [
                    { text: "취소", style: "cancel" },
                    {
                      text: "변경하기", onPress: () => {
                        setHoleRecords([]);
                        setCurrentHole(1);
                        setSelectedCourse(null);
                      }, style: "destructive"
                    }
                  ]
                );
              }
            }}
            style={{ marginRight: 15, padding: 5 }}
          >
            <Ionicons name="flag-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
        )
      }} />

      {/* 코스 정보 박스 (터치 시 코스 변경) */}
      <TouchableOpacity
        style={styles.courseHeaderInfo}
        onPress={() => {
          if (typeof window !== 'undefined' && window.confirm) {
            if (window.confirm("코스 변경\n\n코스 변경 시 입력 중인 데이터가 초기화되고, 기존 진행 중인 코스 기록이 소실될 수 있습니다. 정말 변경하시겠습니까?")) {
              setHoleRecords([]);
              setCurrentHole(1);
              setSelectedCourse(null);
            }
          } else {
            Alert.alert(
              "코스 변경",
              "코스 변경 시 입력 중인 데이터가 초기화되고, 기존 진행 중인 코스 기록이 소실될 수 있습니다. 정말 변경하시겠습니까?",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "변경하기", onPress: () => {
                    setHoleRecords([]);
                    setCurrentHole(1);
                    setSelectedCourse(null);
                  }, style: "destructive"
                }
              ]
            );
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="location-sharp" size={16} color="#007AFF" />
        <Text style={styles.courseHeaderText}>{selectedCourse.name} (변경)</Text>
      </TouchableOpacity>

      {/* PAR 및 거리 정보 섹션 */}
      <View style={[styles.card, { flexDirection: 'row', paddingVertical: 15 }]}>
        {/* 왼쪽: PAR 정보 */}
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#eee', paddingRight: 15 }}>
          <View style={styles.cardHeader}>
            <Text style={[styles.label, { textAlign: 'left' }]}>PAR</Text>
            <TouchableOpacity
              onPress={() => setIsParEditing(!isParEditing)}
              style={styles.editIconBtn}
            >
              <Ionicons
                name={isParEditing ? "checkmark-circle" : "pencil-sharp"}
                size={20}
                color={isParEditing ? "#28a745" : "#007AFF"}
              />
            </TouchableOpacity>
          </View>

          {!isParEditing ? (
            <View style={styles.valueDisplay}>
              <Text style={styles.displayValueText}>{par}</Text>
            </View>
          ) : (
            <View style={styles.parRow}>
              {[3, 4, 5].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.parBtnSmall, par === p && styles.parBtnActive]}
                  onPress={() => setPar(p)}
                >
                  <Text style={[styles.parBtnTextSmall, par === p && styles.parBtnTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 오른쪽: DISTANCE 정보 */}
        <View style={{ flex: 1, paddingLeft: 15, justifyContent: 'center' }}>
          <Text style={[styles.label, { textAlign: 'left', marginBottom: 5 }]}>DISTANCE</Text>
          <View style={styles.valueDisplay}>
            <Text style={[styles.displayValueText, { color: '#495057' }]}>
              {selectedCourse.distances ? `${selectedCourse.distances[currentHole - 1]}m` : '-'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>STX (타수)</Text>
        </View>
        <View style={styles.counterRow}>
          <TouchableOpacity style={styles.btn} onPress={() => adjustValue('stroke', -1)}><Text style={styles.btnText}>-</Text></TouchableOpacity>
          <Text style={styles.valueText}>{stroke}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => adjustValue('stroke', 1)}><Text style={styles.btnText}>+</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>PUTT (퍼트)</Text>
        </View>
        <View style={styles.counterRow}>
          <TouchableOpacity style={styles.btn} onPress={() => adjustValue('putt', -1)}><Text style={styles.btnText}>-</Text></TouchableOpacity>
          <Text style={styles.valueText}>{putt}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => adjustValue('putt', 1)}><Text style={styles.btnText}>+</Text></TouchableOpacity>
        </View>
      </View>

      {/* OB 섹션 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>OB (오비)</Text>
        </View>
        <View style={styles.counterRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#FF3B30' }]} onPress={() => adjustValue('ob', -1)}><Text style={styles.btnText}>-</Text></TouchableOpacity>
          <Text style={styles.valueText}>{ob}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#FF3B30' }]} onPress={() => adjustValue('ob', 1)}><Text style={styles.btnText}>+</Text></TouchableOpacity>
        </View>
      </View>

      {/* 벌타 섹션 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>PENALTY (벌타/해저드)</Text>
        </View>
        <View style={styles.counterRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#FF9500' }]} onPress={() => adjustValue('penalty', -1)}><Text style={styles.btnText}>-</Text></TouchableOpacity>
          <Text style={styles.valueText}>{penalty}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#FF9500' }]} onPress={() => adjustValue('penalty', 1)}><Text style={styles.btnText}>+</Text></TouchableOpacity>
        </View>
      </View>

      {/* 미스샷 패턴 섹션 */}
      <View style={[styles.card, { paddingBottom: 30 }]}>
        <View style={[styles.cardHeader, { justifyContent: 'center' }]}>
          <Ionicons name="flash-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#333' }}>미스샷 패턴 분석</Text>
        </View>
        <View style={styles.missShotGrid}>
          {['없음', '슬라이스', '훅', '탑볼', '뒤땅', '뽕샷', '생크'].map(pattern => (
            <TouchableOpacity
              key={pattern}
              style={[
                styles.missShotBtn,
                missShot === pattern && (pattern === '없음' ? styles.missShotBtnNoneActive : styles.missShotBtnActive)
              ]}
              onPress={() => setMissShot(pattern)}
            >
              <Text style={[
                styles.missShotBtnText,
                missShot === pattern && styles.missShotBtnTextActive
              ]}>{pattern}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>


      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, currentHole === 1 && styles.disabledBtn]}
          onPress={handlePrevHole}
          disabled={currentHole === 1}
        >
          <Ionicons name="chevron-back" size={24} color={currentHole === 1 ? "#adb5bd" : "#fff"} />
          <Text style={[styles.navBtnText, currentHole === 1 && styles.disabledBtnText]}>이전 홀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, { flex: 1, marginBottom: 0 }]}
          onPress={handleNextHole}
        >
          <Text style={styles.saveBtnText}>
            {currentHole === 18 ? '라운딩 종료' : '다음 홀'}
          </Text>
          {currentHole < 18 && <Ionicons name="chevron-forward" size={24} color="#fff" style={{ marginLeft: 5 }} />}
        </TouchableOpacity>
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  courseSelectContainer: { flex: 1, backgroundColor: '#f8f9fa', padding: 30, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#0A2647', marginBottom: 30, textAlign: 'center' },
  courseBtn: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', alignItems: 'center' },
  courseBtnText: { fontSize: 18, fontWeight: '700', color: '#333' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  label: { flex: 1, fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center' },
  editIconBtn: { position: 'absolute', right: 0, padding: 5 },
  valueDisplay: { alignItems: 'center', paddingVertical: 10 },
  displayValueText: { fontSize: 32, fontWeight: '800', color: '#007AFF' },
  parRow: { flexDirection: 'row', justifyContent: 'space-between' },
  parBtnSmall: { width: 40, height: 40, backgroundColor: '#f1f3f5', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  parBtnActive: { backgroundColor: '#007AFF' },
  parBtnTextSmall: { fontSize: 16, fontWeight: 'bold', color: '#495057' },
  parBtnTextActive: { color: '#fff' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btn: { width: 60, height: 60, backgroundColor: '#007AFF', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  valueText: { fontSize: 40, fontWeight: '800' },
  saveBtn: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', gap: 10, marginBottom: 40, alignItems: 'center' },
  navBtn: { flex: 1, backgroundColor: '#6c757d', padding: 18, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 5 },
  disabledBtn: { backgroundColor: '#e9ecef' },
  disabledBtnText: { color: '#adb5bd' },
  missShotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 10
  },
  missShotBtn: {
    minWidth: '22%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  missShotBtnActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
    boxShadow: '0 4px 8px rgba(255,107,107,0.3)',
  },
  missShotBtnNoneActive: {
    backgroundColor: '#6c757d',
    borderColor: '#6c757d',
    boxShadow: '0 4px 8px rgba(108,117,125,0.3)',
  },
  missShotBtnText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '700'
  },
  missShotBtnTextActive: {
    color: '#fff'
  },
  courseHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  courseHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#495057',
    marginLeft: 6,
  }
});
