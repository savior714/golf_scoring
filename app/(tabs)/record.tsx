import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { clubRepository, roundRepository } from '../../src/modules/golf/golf.repository';
import { ClubSummary, GolfRound, HoleRecord } from '../../src/modules/golf/golf.types';
import { ScoreCardTable } from '../../src/shared/components/ScoreCardTable';

// 런타임용 가공된 코스 정보 (18홀 합본)
interface ActiveCourseSession {
  clubId: string;
  clubName: string;
  outCourse: { id: string; name: string; holes: any[] };
  inCourse: { id: string; name: string; holes: any[] };
  combinedPars: number[];
  combinedDistances: number[];
}

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

  // 구장 마스터 데이터 관련 상태
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveCourseSession | null>(null);
  const [selectionStep, setSelectionStep] = useState<'club' | 'out' | 'in'>('club');
  const [tempSelection, setTempSelection] = useState<{
    club?: ClubSummary;
    outCourse?: { id: string; name: string };
  }>({});

  const [holeRecords, setHoleRecords] = useState<HoleRecord[]>([]);
  const [roundId, setRoundId] = useState<string>("");
  const [roundDate, setRoundDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true); // 초기값 true로 설정하여 번쩍임 방지

  const queryClient = useQueryClient();

  // 탭 진입 시마다 데이터 로드 (useFocusEffect)
  useFocusEffect(
    useCallback(() => {
      const loadMasterAndSession = async () => {
        try {
          setIsLoadingMaster(true);
          // 1. 구장 목록 로드
          const clubList = await clubRepository.getAllClubsSummary();
          setClubs(clubList);

          // 2. 진행 중인 세션 로드
          const savedId = await roundRepository.getCurrentRoundId();

          if (savedId) {
            setRoundId(savedId);
            const rounds = await roundRepository.getAllRounds();
            const currentRound = rounds.find(r => r.id === savedId);

            if (currentRound) {
              // 기록이 있으면 먼저 불러오기 (구장 선택 전이라도)
              setHoleRecords(currentRound.holes || []);
              setRoundDate(currentRound.date);

              if (currentRound.outCourseId && currentRound.inCourseId) {
                // 코스 상세 데이터 로드하여 세션 구성
                const [outData, inData] = await Promise.all([
                  clubRepository.getCourseWithHoles(currentRound.outCourseId),
                  clubRepository.getCourseWithHoles(currentRound.inCourseId)
                ]);

                if (outData && inData) {
                  const session: ActiveCourseSession = {
                    clubId: outData.clubId,
                    clubName: currentRound.courseName,
                    outCourse: outData,
                    inCourse: inData,
                    combinedPars: [...outData.holes.map(h => h.par), ...inData.holes.map(h => h.par)],
                    combinedDistances: [
                      ...outData.holes.map(h => h.distances[0]?.distanceMeter || 0),
                      ...inData.holes.map(h => h.distances[0]?.distanceMeter || 0)
                    ]
                  };
                  setActiveSession(session);
                } else {
                  setActiveSession(null);
                }
              } else {
                // 진행 중인 ID는 있으나 코스가 미정인 경우 (새 라운드 시작 중 또는 레거시 수정)
                setActiveSession(null);
              }
            } else {
              setRoundId("");
              setActiveSession(null);
              setSelectionStep('club');
            }
          } else {
            // 진행 중인 라운드가 아예 없는 경우
            setRoundId("");
            setActiveSession(null);
            setSelectionStep('club');
          }
        } catch (e) {
          console.error("Initialization failed", e);
        } finally {
          setIsLoadingMaster(false);
        }
      };

      loadMasterAndSession();
    }, [queryClient])
  );

  // 27홀 지원용 신규 라운드 시작 로직 (기존 라운드 수정 시에도 활용)
  const startNewRoundWithCourses = async (club: ClubSummary, outId: string, inId: string, existingRoundId?: string) => {
    setIsLoadingMaster(true);
    try {
      const [outData, inData] = await Promise.all([
        clubRepository.getCourseWithHoles(outId),
        clubRepository.getCourseWithHoles(inId)
      ]);

      if (!outData || !inData) throw new Error("Course data load failed");

      // 기존 ID가 있으면 그것을 사용, 없으면 신규 생성
      const targetId = existingRoundId || "round_" + Date.now();
      const courseComboName = `${outData.name}-${inData.name}`;

      const session: ActiveCourseSession = {
        clubId: club.id,
        clubName: club.name,
        outCourse: outData,
        inCourse: inData,
        combinedPars: [...outData.holes.map(h => h.par), ...inData.holes.map(h => h.par)],
        combinedDistances: [
          ...outData.holes.map(h => h.distances[0]?.distanceMeter || 0),
          ...inData.holes.map(h => h.distances[0]?.distanceMeter || 0)
        ]
      };

      const initialRound: GolfRound = {
        id: targetId,
        date: existingRoundId ? roundDate : new Date().toISOString().split('T')[0],
        courseName: club.name,
        courseType: courseComboName,
        outCourseId: outId,
        inCourseId: inId,
        holes: existingRoundId ? holeRecords : [], // 기존 기록이 있으면 유지
      };

      await Promise.all([
        roundRepository.setCurrentRoundId(targetId),
        roundRepository.saveRound(initialRound)
      ]);

      setRoundId(targetId);
      // setHoleRecords([]) 는 신규일 때만 필요함. 기존 기록은 이미 loadMasterAndSession에서 setHoleRecords 되었을 것임.
      if (!existingRoundId) {
        setHoleRecords([]);
        setCurrentHole(1);
      }

      setActiveSession(session);

      queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
      queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "코스 데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoadingMaster(false);
    }
  };

  // 홀 변경 시 해당 홀의 데이터 로드 또는 초기화
  useEffect(() => {
    if (activeSession) {
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
        const defaultPar = activeSession.combinedPars[currentHole - 1] || 4;
        setPar(defaultPar);
        setStroke(defaultPar);
        setPutt(2);
        setOb(0);
        setPenalty(0);
        setMissShot('없음');
      }
      setIsParEditing(false);
    }
  }, [currentHole, activeSession, holeRecords]);

  // 3퍼터 이상 시 '쓰리펏' 자동 선택 로직
  useEffect(() => {
    if (!activeSession) return;

    if (putt >= 3) {
      setMissShot(prev => {
        const current = (prev === '없음' || !prev) ? [] : prev.split(',');
        if (!current.includes('쓰리펏')) {
          const next = current.length >= 2 ? [...current.slice(1), '쓰리펏'] : [...current, '쓰리펏'];
          return next.join(',');
        }
        return prev;
      });
    } else {
      setMissShot(prev => {
        const current = (prev === '없음' || !prev) ? [] : prev.split(',');
        if (current.includes('쓰리펏')) {
          const filtered = current.filter(p => p !== '쓰리펏');
          return filtered.length > 0 ? filtered.join(',') : '없음';
        }
        return prev;
      });
    }
  }, [putt, activeSession]);

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
      missShot: (missShot === '없음' || !missShot) ? undefined : missShot
    };

    const updatedRecords = [...holeRecords.filter(r => r.holeNo !== currentHole), currentRecord].sort((a, b) => a.holeNo - b.holeNo);
    setHoleRecords(updatedRecords);

    if (activeSession) {
      const currentRound: GolfRound = {
        id: roundId,
        date: roundDate, // Preserve original date
        courseName: activeSession.clubName,
        courseType: `${activeSession.outCourse.name}-${activeSession.inCourse.name}`,
        outCourseId: activeSession.outCourse.id,
        inCourseId: activeSession.inCourse.id,
        holes: updatedRecords,
      };
      await roundRepository.saveRound(currentRound);
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

  if (!activeSession) {
    return (
      <View style={styles.courseSelectContainer}>
        <Stack.Screen options={{ title: '라운딩 시작' }} />

        {isLoadingMaster ? (
          <ActivityIndicator size="large" color="#0A2647" />
        ) : (
          <>
            <Text style={styles.title}>
              {selectionStep === 'club' && (holeRecords.length > 0 ? '기존 기록의 구장을 선택해주세요' : '오늘의 구장은 어디인가요?')}
              {selectionStep === 'out' && '전반 코스를 선택하세요'}
              {selectionStep === 'in' && '후반 코스를 선택하세요'}
            </Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {/* 1단계: 구장 선택 */}
              {selectionStep === 'club' && clubs.map(club => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.courseBtn}
                  onPress={() => {
                    setTempSelection({ club });
                    setSelectionStep('out');
                  }}
                >
                  <Text style={styles.courseBtnText}>{club.name}</Text>
                  <Text style={styles.courseBtnSub}>{club.courseCount}개 코스</Text>
                </TouchableOpacity>
              ))}

              {/* 2단계: 전반 코스 선택 */}
              {selectionStep === 'out' && tempSelection.club?.courses.map(course => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseBtn}
                  onPress={() => {
                    setTempSelection(prev => ({ ...prev, outCourse: course }));
                    setSelectionStep('in');
                  }}
                >
                  <Text style={styles.courseBtnText}>{course.name}</Text>
                </TouchableOpacity>
              ))}

              {/* 3단계: 후반 코스 선택 */}
              {selectionStep === 'in' && tempSelection.club?.courses.map(course => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseBtn}
                  onPress={() => {
                    if (tempSelection.club && tempSelection.outCourse) {
                      // 기존에 roundId가 있다면 (수정 시) 해당 ID를 넘겨서 기록을 유지함
                      startNewRoundWithCourses(tempSelection.club, tempSelection.outCourse.id, course.id, roundId || undefined);
                    }
                  }}
                >
                  <Text style={styles.courseBtnText}>{course.name}</Text>
                  {tempSelection.outCourse?.id === course.id && (
                    <Text style={{ color: '#007AFF', fontSize: 12, marginTop: 4 }}>* 전반과 동일한 코스</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectionStep !== 'club' && (
              <TouchableOpacity
                style={styles.backStepBtn}
                onPress={() => setSelectionStep(selectionStep === 'in' ? 'out' : 'club')}
              >
                <Text style={styles.backStepBtnText}>이전 단계로</Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
                  setActiveSession(null);
                  setSelectionStep('club');
                  setTempSelection({});
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
          <Text style={styles.courseHeaderText}>{activeSession.clubName}</Text>
          <Text style={styles.courseSubHeaderText}> ({activeSession.outCourse.name}-{activeSession.inCourse.name})</Text>
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
                {activeSession.combinedDistances[currentHole - 1] > 0 ? `${activeSession.combinedDistances[currentHole - 1]}m` : '-'}
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
            {['없음', '슬라이스', '훅', '뒤땅', '생크', '벙커', '쓰리펏'].map(pattern => {
              const isSelected = pattern === '없음'
                ? missShot === '없음' || !missShot
                : missShot.split(',').includes(pattern);

              return (
                <TouchableOpacity
                  key={pattern}
                  style={[
                    styles.missShotBtn,
                    isSelected && (pattern === '없음' ? styles.missShotBtnNoneActive : styles.missShotBtnActive)
                  ]}
                  onPress={() => {
                    if (pattern === '없음') {
                      setMissShot('없음');
                    } else {
                      const currentPatterns = (missShot === '없음' || !missShot) ? [] : missShot.split(',');
                      if (currentPatterns.includes(pattern)) {
                        // 선택 해제
                        const filtered = currentPatterns.filter(p => p !== pattern);
                        setMissShot(filtered.length > 0 ? filtered.join(',') : '없음');
                      } else {
                        // 새로운 선택 (최대 2개)
                        if (currentPatterns.length >= 2) {
                          // 이미 2개면 가장 오래된 것 제거하고 추가하거나, 알림
                          const next = [...currentPatterns.slice(1), pattern];
                          setMissShot(next.join(','));
                        } else {
                          setMissShot([...currentPatterns, pattern].join(','));
                        }
                      }
                    }
                  }}
                >
                  <Text style={[
                    styles.missShotBtnText,
                    isSelected && styles.missShotBtnTextActive
                  ]}>{pattern}</Text>
                </TouchableOpacity>
              );
            })}
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
              <Text style={styles.scoreCardSubTitle}>{activeSession.clubName}</Text>
              <Text style={{ fontSize: 11, color: '#6E85B7', marginTop: 2 }}>{activeSession.outCourse.name} / {activeSession.inCourse.name}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 전반 코스 (1-9) */}
              <View style={styles.tableGroup}>
                <Text style={styles.coursePartTitle}>전반 코스</Text>
                <ScoreCardTable
                  startHole={1}
                  endHole={9}
                  holes={holeRecords}
                  currentHole={currentHole}
                  currentStroke={stroke}
                  currentPar={par}
                  currentPutt={putt}
                  coursePars={activeSession.combinedPars}
                />
              </View>

              {/* 후반 코스 (10-18) */}
              <View style={styles.tableGroup}>
                <Text style={styles.coursePartTitle}>후반 코스</Text>
                <ScoreCardTable
                  startHole={10}
                  endHole={18}
                  holes={holeRecords}
                  currentHole={currentHole}
                  currentStroke={stroke}
                  currentPar={par}
                  currentPutt={putt}
                  coursePars={activeSession.combinedPars}
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


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  courseSelectContainer: { flex: 1, backgroundColor: '#f8f9fa', padding: 30, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#0A2647', marginBottom: 30, textAlign: 'center' },
  courseBtn: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', alignItems: 'center' },
  courseBtnText: { fontSize: 18, fontWeight: '700', color: '#333' },
  courseBtnSub: { fontSize: 12, color: '#adb5bd', marginTop: 4, fontWeight: '600' },
  backStepBtn: { marginTop: 10, padding: 15, alignItems: 'center' },
  backStepBtnText: { color: '#6c757d', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
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
  courseSubHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#adb5bd',
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
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  },
  scoreCardHeader: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 12,
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
    marginBottom: 16,
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
    height: 32,
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
    gap: 10,
    marginTop: 4,
    paddingVertical: 12,
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
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  }
});
