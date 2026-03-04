import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { CourseInfo, PREDEFINED_COURSES } from '../../src/data/courseData';
import { GolfRound, HoleRecord } from '../../src/domains/golf';
import { roundRepository } from '../../src/repositories/roundRepository';

export default function RecordScreen() {
  const router = useRouter();
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
  const [showScoreCard, setShowScoreCard] = useState(false);
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

    // 새 라운드 시작 시 초기 데이터 저장 (대시보드 즉시 초기화 유도)
    const initialRound: GolfRound = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      courseName: course.name,
      courseType: 'Main',
      holes: [],
    };
    await roundRepository.saveRound(initialRound);

    // 대시보드 동기화
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
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
      const msg = "18홀 라운딩 기록이 저장되었습니다.\n대시보드에서 최종 결과를 확인하고 종료하세요.";

      if (typeof window !== 'undefined') {
        window.alert(msg);
        router.push('/(tabs)');
      } else {
        Alert.alert('완료', msg, [
          { text: '확인', onPress: () => router.push('/(tabs)') }
        ]);
      }
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
    <View style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
        <Stack.Screen options={{
          title: `${currentHole} / 18`,
          headerTitleStyle: { fontWeight: '900', color: '#0A2647' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                const confirmAction = async () => {
                  setHoleRecords([]);
                  setCurrentHole(1);
                  setSelectedCourse(null);
                  await roundRepository.setCurrentRoundId(null);
                  queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
                  queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
                };

                if (typeof window !== 'undefined' && window.confirm) {
                  if (window.confirm("코스 변경\n\n코스 변경 시 입력 중인 데이터가 초기화되고, 기존 진행 중인 코스 기록이 소실될 수 있습니다. 정말 변경하시겠습니까?")) {
                    confirmAction();
                  }
                } else {
                  Alert.alert(
                    "코스 변경",
                    "코스 변경 시 입력 중인 데이터가 초기화되고, 기존 진행 중인 코스 기록이 소실될 수 있습니다. 정말 변경하시겠습니까?",
                    [
                      { text: "취소", style: "cancel" },
                      { text: "변경하기", onPress: confirmAction, style: "destructive" }
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

        {/* 코스 정보 박스 (정적 표시) */}
        <View style={styles.courseHeaderInfo}>
          <Ionicons name="location-sharp" size={16} color="#007AFF" />
          <Text style={styles.courseHeaderText}>{selectedCourse.name}</Text>
        </View>

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
            {['없음', '슬라이스', '훅', '뒤땅', '생크', '벙커', '쓰리펏'].map(pattern => (
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
      </ScrollView>

      {/* 스코어카드 버튼 (18홀일 때만 표시, ScrollView 외부) */}
      {currentHole === 18 && (
        <TouchableOpacity
          style={styles.scoreCardFloatBtn}
          onPress={async () => {
            await saveCurrentHole();
            setShowScoreCard(true);
          }}
        >
          <Ionicons name="grid" size={24} color="#fff" />
          <Text style={styles.scoreCardFloatBtnText}>스코어카드</Text>
        </TouchableOpacity>
      )}

      {/* 스코어카드 모달 (통합 디자인 적용) */}
      <Modal
        visible={showScoreCard}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowScoreCard(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowScoreCard(false)}
        >
          <Animated.View
            entering={FadeInUp.duration(500)}
            exiting={FadeOutUp.duration(300)}
            style={styles.scoreCardContainer}
          >
            <View style={styles.scoreCardHeader}>
              <Text style={styles.scoreCardTitle}>SCORE CARD</Text>
              <Text style={styles.scoreCardSubTitle}>{selectedCourse.name}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Out-Course (1-9) */}
              <View style={styles.tableGroup}>
                <Text style={styles.coursePartTitle}>Out Course</Text>
                <RenderScoreTable
                  startHole={1}
                  endHole={9}
                  holes={holeRecords}
                  currentHole={currentHole}
                  currentStroke={stroke}
                  currentPar={par}
                  coursePars={selectedCourse.pars}
                />
              </View>

              {/* In-Course (10-18) */}
              <View style={styles.tableGroup}>
                <Text style={styles.coursePartTitle}>In Course</Text>
                <RenderScoreTable
                  startHole={10}
                  endHole={18}
                  holes={holeRecords}
                  currentHole={currentHole}
                  currentStroke={stroke}
                  currentPar={par}
                  coursePars={selectedCourse.pars}
                />
              </View>

              {/* Legend (범례) */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.symbolCircle, styles.symbolDouble]}>
                    <View style={styles.symbolCircleInner} />
                  </View>
                  <Text style={styles.legendLabel}>이글(-)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.symbolCircle} />
                  <Text style={styles.legendLabel}>버디</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.symbolDot} />
                  <Text style={styles.legendLabel}>파</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.symbolSquare} />
                  <Text style={styles.legendLabel}>보기</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.symbolSquare, styles.symbolDouble]}>
                    <View style={styles.symbolSquareInner} />
                  </View>
                  <Text style={styles.legendLabel}>더블보기(+)</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowScoreCard(false)}
            >
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/**
 * 기록 화면용 스코어 테이블 렌더러
 */
function RenderScoreTable({
  startHole,
  endHole,
  holes,
  currentHole,
  currentStroke,
  currentPar,
  coursePars
}: {
  startHole: number,
  endHole: number,
  holes: HoleRecord[],
  currentHole: number,
  currentStroke: number,
  currentPar: number,
  coursePars: number[]
}) {
  const holeNumbers = Array.from({ length: endHole - startHole + 1 }, (_, i) => startHole + i);

  const getRecord = (holeNo: number) => {
    if (holeNo === currentHole) return { stroke: currentStroke, par: currentPar, putt: 0, ob: 0, penalty: 0 };
    return holes.find(h => h.holeNo === holeNo);
  };

  const totals = holeNumbers.reduce((acc, h) => {
    const r = getRecord(h);
    if (r) {
      acc.par += r.par;
      acc.stroke += r.stroke;
      acc.putt += (r.putt || 0);
      acc.penalty += (r.ob || 0) + (r.penalty || 0);
    } else {
      acc.par += coursePars[h - 1];
    }
    return acc;
  }, { par: 0, stroke: 0, putt: 0, penalty: 0 });

  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        <View style={[styles.cell, styles.headerCell, { flex: 1.5 }]}><Text style={styles.headerCellText}>HOLE</Text></View>
        {holeNumbers.map(n => (
          <View key={n} style={[styles.cell, styles.headerCell]}><Text style={styles.headerCellText}>{n > 9 ? n - 9 : n}</Text></View>
        ))}
        <View style={[styles.cell, styles.headerCell, { borderRightWidth: 0 }]}><Text style={styles.headerCellText}>T</Text></View>
      </View>

      <View style={styles.tableRow}>
        <View style={[styles.cell, { flex: 1.5, backgroundColor: '#fcfcfc' }]}><Text style={styles.rowLabelText}>Par</Text></View>
        {holeNumbers.map(n => (
          <View key={n} style={styles.cell}><Text style={styles.cellText}>{getRecord(n)?.par || coursePars[n - 1]}</Text></View>
        ))}
        <View style={[styles.cell, { borderRightWidth: 0, backgroundColor: '#f8f9fa' }]}><Text style={[styles.cellText, { fontWeight: '800' }]}>{totals.par}</Text></View>
      </View>

      <View style={styles.tableRow}>
        <View style={[styles.cell, { flex: 1.5, backgroundColor: '#fcfcfc' }]}><Text style={styles.rowLabelText}>Score</Text></View>
        {holeNumbers.map(n => {
          const rec = getRecord(n);
          if (!rec) return <View key={n} style={styles.cell}><Text style={styles.cellText}>-</Text></View>;
          const score = rec.stroke - rec.par;
          return (
            <View key={n} style={styles.cell}>
              <View style={[
                score < 0 && styles.scoreCircle,
                score <= -2 && styles.scoreDouble,
                score > 0 && styles.scoreSquare,
                score >= 2 && styles.scoreDouble
              ]}>
                {score <= -2 && <View style={styles.scoreCircleInner} />}
                {score >= 2 && <View style={styles.scoreSquareInner} />}
                <Text style={[styles.cellText, score < 0 && styles.blueText, score > 0 && styles.redText]}>{rec.stroke}</Text>
              </View>
            </View>
          );
        })}
        <View style={[styles.cell, { borderRightWidth: 0, backgroundColor: '#EEF2FF' }]}><Text style={[styles.cellText, { fontWeight: '900', color: '#007AFF' }]}>{totals.stroke || '-'}</Text></View>
      </View>

      <View style={styles.tableRow}>
        <View style={[styles.cell, { flex: 1.5, backgroundColor: '#fcfcfc' }]}><Text style={styles.rowLabelText}>Putt</Text></View>
        {holeNumbers.map(n => (<View key={n} style={styles.cell}><Text style={[styles.cellText, { color: '#666' }]}>{getRecord(n)?.putt || 0}</Text></View>))}
        <View style={[styles.cell, { borderRightWidth: 0, backgroundColor: '#f8f9fa' }]}><Text style={[styles.cellText, { fontWeight: '700', color: '#666' }]}>{totals.putt}</Text></View>
      </View>

      <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
        <View style={[styles.cell, { flex: 1.5, backgroundColor: '#fcfcfc' }]}><Text style={styles.rowLabelText}>Penalty</Text></View>
        {holeNumbers.map(n => (<View key={n} style={styles.cell}><Text style={[styles.cellText, { color: '#adb5bd' }]}>{(getRecord(n)?.ob || 0) + (getRecord(n)?.penalty || 0)}</Text></View>))}
        <View style={[styles.cell, { borderRightWidth: 0, backgroundColor: '#f8f9fa' }]}><Text style={[styles.cellText, { fontWeight: '700', color: '#adb5bd' }]}>{totals.penalty}</Text></View>
      </View>
    </View>
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
  },
  scoreCardFloatBtn: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: '#0A2647',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 8px 16px rgba(10,38,71,0.3)',
    zIndex: 10,
  },
  scoreCardFloatBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scoreCardContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  },
  scoreCardHeader: {
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 16,
  },
  scoreCardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A2647',
    letterSpacing: 1.5,
  },
  scoreCardSubTitle: {
    fontSize: 13,
    color: '#6E85B7',
    fontWeight: '600',
    marginTop: 6,
  },
  tableGroup: {
    marginBottom: 24,
  },
  coursePartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#495057',
    marginBottom: 10,
    marginLeft: 4,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    height: 38,
  },
  cell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerCell: {
    backgroundColor: '#F8F9FA',
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ADB5BD',
  },
  rowLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#495057',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
  },
  blueText: {
    color: '#007AFF',
  },
  redText: {
    color: '#FF6B6B',
  },
  // 점수 심볼 스타일
  scoreCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSquare: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDouble: {
    borderWidth: 1,
  },
  scoreCircleInner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  scoreSquareInner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  // 범례 (Legend)
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: '#adb5bd',
    fontWeight: '600',
  },
  symbolCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  symbolCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007AFF',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  symbolSquare: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  symbolSquareInner: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  symbolDouble: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ADB5BD',
  },
  closeBtn: {
    backgroundColor: '#0A2647',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  }
});
