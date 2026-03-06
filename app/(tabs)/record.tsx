import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { clubRepository, roundRepository } from '../../src/modules/golf/golf.repository';
import { ClubCourseInfo, ClubSummary, GolfRound, HoleRecord, ClubHoleInfo } from '../../src/modules/golf/golf.types';
import { ScoreCardTable } from '../../src/shared/components/ScoreCardTable';

// Modularized Components
import { CourseHeader, HoleSelectorGrid, MissShotPatternGrid, ScoreAdjuster } from '../../src/modules/golf/components/Record';

interface ActiveCourseSession {
  clubId: string;
  clubName: string;
  outCourse: ClubCourseInfo;
  inCourse: ClubCourseInfo;
  combinedPars: number[];
  availableTees: string[];
}

export default function RecordScreen() {
  const router = useRouter(); const { mode } = useLocalSearchParams<{ mode?: string }>();
  const queryClient = useQueryClient();

  // Navigation State
  const [currentHole, setCurrentHole] = useState(1);
  const [showHoleGrid, setShowHoleGrid] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);

  // Scoring State
  const [par, setPar] = useState(4);
  const [stroke, setStroke] = useState(4);
  const [putt, setPutt] = useState(2);
  const [ob, setOb] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [missShot, setMissShot] = useState('없음');
  const [isParEditing, setIsParEditing] = useState(false);

  // Course Master State
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveCourseSession | null>(null);
  const [selectionStep, setSelectionStep] = useState<'club' | 'out' | 'in' | 'tee'>('club');
  const [tempSelection, setTempSelection] = useState<{
    club?: ClubSummary;
    outCourse?: { id: string; name: string };
    inCourse?: { id: string; name: string };
  }>({});
  const [selectedTee, setSelectedTee] = useState<string>('White');

  // Persistence State
  const [holeRecords, setHoleRecords] = useState<HoleRecord[]>([]);
  const [roundId, setRoundId] = useState<string>("");
  const [roundDate, setRoundDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');

  // Load Initial Data
  useFocusEffect(
    useCallback(() => {
      const loadMasterAndSession = async () => {
        try {
          setIsLoadingMaster(true);
          const clubList = await clubRepository.getAllClubsSummary();
          setClubs(clubList);

          const savedId = await roundRepository.getCurrentRoundId();
          if (savedId && mode !== 'new') {
            setRoundId(savedId);
            const rounds = await roundRepository.getAllRounds();
            const currentRound = rounds.find(r => r.id === savedId);

            if (currentRound) {
              setHoleRecords(currentRound.holes || []);
              setRoundDate(currentRound.date);
              // Tee color used in this round (legacy rounds default to White)
              setSelectedTee(currentRound.teeColor || 'White');

              if (currentRound.outCourseId && currentRound.inCourseId) {
                const [outData, inData] = await Promise.all([
                  clubRepository.getCourseWithHoles(currentRound.outCourseId),
                  clubRepository.getCourseWithHoles(currentRound.inCourseId)
                ]);

                if (outData && inData) {
                  // Determine available tees (intersection of out/in courses)
                  const outTees = outData.holes[0]?.distances.map(d => d.teeColor) || [];
                  const inTees = inData.holes[0]?.distances.map(d => d.teeColor) || [];
                  const commonTees = outTees.filter(t => inTees.includes(t));

                  setActiveSession({
                    clubId: outData.clubId,
                    clubName: currentRound.courseName,
                    outCourse: outData,
                    inCourse: inData,
                    combinedPars: [...outData.holes.map(h => h.par), ...inData.holes.map(h => h.par)],
                    availableTees: commonTees.length > 0 ? commonTees : ['White'],
                  });
                }
              }
            } else {
              setRoundId("");
              setActiveSession(null);
              setSelectionStep('club');
            }
          } else {
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

  // New Round Start
  const startNewRound = async (tee: string) => {
    if (!tempSelection.club || !tempSelection.outCourse || !tempSelection.inCourse) return;

    setIsLoadingMaster(true);
    try {
      const { club, outCourse, inCourse } = tempSelection;
      const [outData, inData] = await Promise.all([
        clubRepository.getCourseWithHoles(outCourse.id),
        clubRepository.getCourseWithHoles(inCourse.id)
      ]);

      if (!outData || !inData) throw new Error("Course load failed");

      const targetId = roundId || "round_" + Date.now();
      const courseComboName = `${outData.name}-${inData.name}`;

      const session: ActiveCourseSession = {
        clubId: club.id,
        clubName: club.name,
        outCourse: outData,
        inCourse: inData,
        combinedPars: [...outData.holes.map(h => h.par), ...inData.holes.map(h => h.par)],
        availableTees: tee ? [tee] : ['White'],
      };

      const initialRound: GolfRound = {
        id: targetId,
        date: roundId ? roundDate : new Date().toISOString().split('T')[0],
        courseName: club.name,
        courseType: courseComboName,
        outCourseId: outCourse.id,
        inCourseId: inCourse.id,
        holes: roundId ? holeRecords : [],
        updatedAt: Date.now(),
        teeColor: tee,
        memo: '',
      };

      await Promise.all([
        roundRepository.setCurrentRoundId(targetId),
        roundRepository.saveRound(initialRound)
      ]);

      setRoundId(targetId);
      if (!roundId) {
        setHoleRecords([]);
        setCurrentHole(1);
      }
      setSelectedTee(tee);
      setActiveSession(session);
      queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
      queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    } catch (e) {
      Alert.alert("Error", "Failed to start round.");
    } finally {
      setIsLoadingMaster(false);
    }
  };

  // Sync hole data effect
  useEffect(() => {
    if (activeSession) {
      const existingRecord = holeRecords.find(r => r.holeNo === currentHole);
      if (existingRecord) {
        setPar(existingRecord.par);
        setStroke(existingRecord.stroke);
        setPutt(existingRecord.putt);
        setOb(existingRecord.ob);
        setPenalty(existingRecord.penalty);
        setMissShot(existingRecord.missShot || '없음');
      } else {
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

  // Auto Three-putt logic
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

  const saveCurrentHole = async () => {
    if (!activeSession) return holeRecords;
    const currentRecord: HoleRecord = {
      holeNo: currentHole,
      par, stroke, putt,
      isFairway: true,
      isGIR: (stroke - putt) <= (par - 2),
      ob, penalty,
      missShot: (missShot === '없음' || !missShot) ? undefined : missShot
    };
    const updatedRecords = [...holeRecords.filter(r => r.holeNo !== currentHole), currentRecord].sort((a, b) => a.holeNo - b.holeNo);
    setHoleRecords(updatedRecords);

    const currentRound: GolfRound = {
      id: roundId,
      date: roundDate,
      courseName: activeSession.clubName,
      courseType: `${activeSession.outCourse.name}-${activeSession.inCourse.name}`,
      outCourseId: activeSession.outCourse.id,
      inCourseId: activeSession.inCourse.id,
      holes: updatedRecords,
      updatedAt: Date.now(),
      teeColor: selectedTee,
      memo: '',
    };
    await roundRepository.saveRound(currentRound);

    // Background Sync with Status Update
    setSyncStatus('syncing');
    roundRepository.syncRoundToSupabase(currentRound)
      .then(res => setSyncStatus(res.success ? 'synced' : 'failed'))
      .catch(() => setSyncStatus('failed'));

    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    return updatedRecords;
  };

  const handleNextHole = async () => {
    await saveCurrentHole();
    if (currentHole < 18) {
      setCurrentHole(prev => prev + 1);
    } else {
      finishRound();
    }
  };

  const finishRound = async () => {
    await roundRepository.setCurrentRoundId(null);
    queryClient.invalidateQueries({ queryKey: ['current_round_id'] });
    queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
    const msg = "라운딩이 마감되었습니다.\n대시보드에서 최종 결과를 확인하세요.";
    Alert.alert("완료", msg, [{ text: "확인", onPress: () => router.push('/(tabs)') }]);
  };

  const getCurrentDistance = () => {
    if (!activeSession) return 0;
    const hole = currentHole <= 9
      ? activeSession.outCourse.holes[currentHole - 1]
      : activeSession.inCourse.holes[currentHole - 10];
    return hole?.distances.find((d: any) => d.teeColor === selectedTee)?.distanceMeter || 0;
  };

  // Course Selection UI
  if (!activeSession) {
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
                <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection(p => ({ ...p, outCourse: course })); setSelectionStep('in'); }}>
                  <Text style={styles.selectText}>{course.name}</Text>
                </TouchableOpacity>
              ))}
              {selectionStep === 'in' && tempSelection.club?.courses.map(course => (
                <TouchableOpacity key={course.id} style={styles.selectItem} onPress={() => { setTempSelection(p => ({ ...p, inCourse: course })); setSelectionStep('tee'); }}>
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

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <Stack.Screen options={{
        title: `HOLE ${currentHole}`,
        headerTitleStyle: { fontWeight: '900', color: '#0A2647' },
        headerLeft: () => (
          <TouchableOpacity onPress={() => setShowHoleGrid(true)} style={styles.headerIcon}>
            <Ionicons name="grid-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Sync Status Icon */}
            {syncStatus === 'syncing' && <ActivityIndicator size="small" color="#007AFF" />}
            {syncStatus === 'synced' && <Ionicons name="cloud-done" size={20} color="#28a745" />}
            {syncStatus === 'failed' && <Ionicons name="cloud-offline" size={20} color="#FF3B30" />}

            <TouchableOpacity onPress={() => {
              Alert.alert("새 라운딩", "진행 중인 세션을 종료하고 새로 시작하시겠습니까?", [
                { text: "취소", style: "cancel" },
                { text: "새로 시작", style: "destructive", onPress: () => { setActiveSession(null); setSelectionStep('club'); roundRepository.setCurrentRoundId(null); } }
              ]);
            }} style={styles.headerIcon}>
              <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )
      }} />

      <ScrollView contentContainerStyle={styles.container}>
        <CourseHeader
          clubName={activeSession.clubName}
          outCourseName={activeSession.outCourse.name}
          inCourseName={activeSession.inCourse.name}
          distanceMeter={getCurrentDistance()}
        />

        <View style={styles.parSection}>
          <Text style={styles.sectionLabel}>PAR</Text>
          <View style={styles.parRow}>
            {[3, 4, 5].map(p => (
              <TouchableOpacity key={p} style={[styles.parBtn, par === p && styles.parActive]} onPress={() => setPar(p)}>
                <Text style={[styles.parText, par === p && styles.parActiveText]}>{p}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setIsParEditing(!isParEditing)} style={styles.moreParBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#6E85B7" />
            </TouchableOpacity>
          </View>
        </View>

        <ScoreAdjuster label="STROKES" value={stroke} onAdjust={(d: number) => setStroke((s: number) => Math.max(1, s + d))} accentColor="#007AFF" />
        <ScoreAdjuster label="PUTTS" value={putt} onAdjust={(d: number) => setPutt((p: number) => Math.max(0, p + d))} accentColor="#28a745" />

        <View style={styles.penaltyRow}>
          <View style={{ flex: 1 }}>
            <ScoreAdjuster label="OB" value={ob} onAdjust={(d: number) => setOb((o: number) => Math.max(0, o + d))} accentColor="#FF3B30" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <ScoreAdjuster label="PENALTY" value={penalty} onAdjust={(d: number) => setPenalty((p: number) => Math.max(0, p + d))} accentColor="#FF9500" />
          </View>
        </View>

        <MissShotPatternGrid
          missShot={missShot}
          onTogglePattern={(pattern) => {
            if (pattern === '없음') {
              setMissShot('없음');
            } else {
              const current = (missShot === '없음' || !missShot) ? [] : missShot.split(',');
              if (current.includes(pattern)) {
                const filtered = current.filter(p => p !== pattern);
                setMissShot(filtered.length > 0 ? filtered.join(',') : '없음');
              } else {
                if (current.length >= 2) {
                  const next = [...current.slice(1), pattern];
                  setMissShot(next.join(','));
                } else {
                  setMissShot([...current, pattern].join(','));
                }
              }
            }
          }}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.navBtn, currentHole === 1 && { opacity: 0.5 }]} disabled={currentHole === 1} onPress={async () => { await saveCurrentHole(); setCurrentHole(h => h - 1); }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainNavBtn} onPress={handleNextHole}>
            <Text style={styles.mainNavBtnText}>{currentHole === 18 ? 'ROUND FINISH' : 'NEXT HOLE'}</Text>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          {currentHole < 18 && (
            <TouchableOpacity style={styles.earlyFinishBtn} onPress={() => {
              Alert.alert("조기 종료", "현재 홀까지만 기록하고 라운딩을 마감하시겠습니까?", [
                { text: "취소", style: "cancel" },
                { text: "라운딩 마감", onPress: async () => { await saveCurrentHole(); finishRound(); } }
              ]);
            }}>
              <Ionicons name="save-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={showHoleGrid} transparent animationType="fade" onRequestClose={() => setShowHoleGrid(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowHoleGrid(false)}>
          <HoleSelectorGrid
            currentHole={currentHole}
            totalHoles={18}
            holeRecords={holeRecords}
            onSelectHole={async (h) => { await saveCurrentHole(); setCurrentHole(h); }}
            onClose={() => setShowHoleGrid(false)}
          />
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity style={styles.floatScoreCard} onPress={async () => { await saveCurrentHole(); setShowScoreCard(true); }}>
        <Ionicons name="list" size={20} color="#fff" />
        <Text style={styles.floatScoreCardText}>CARD</Text>
      </TouchableOpacity>

      <Modal visible={showScoreCard} transparent animationType="slide" onRequestClose={() => setShowScoreCard(false)}>
        <View style={styles.modalOverlayFull}>
          <View style={styles.scoreCardModal}>
            <View style={styles.scoreCardHeader}>
              <Text style={styles.scoreCardTitle}>SCORE CARD</Text>
              <TouchableOpacity onPress={() => setShowScoreCard(false)}><Ionicons name="close" size={24} color="#495057" /></TouchableOpacity>
            </View>
            <ScrollView>
              <ScoreCardTable startHole={1} endHole={9} holes={holeRecords} coursePars={activeSession.combinedPars} />
              <View style={{ height: 20 }} />
              <ScoreCardTable startHole={10} endHole={18} holes={holeRecords} coursePars={activeSession.combinedPars} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  courseSelectContainer: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#F8F9FA' },
  selectionProgress: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
  progressDot: { width: 40, height: 6, backgroundColor: '#E9ECEF', borderRadius: 3 },
  title: { fontSize: 28, fontWeight: '900', color: '#0A2647', marginBottom: 40, textAlign: 'center' },
  selectItem: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  selectText: { fontSize: 18, fontWeight: '700', color: '#333' },
  selectSubText: { fontSize: 12, color: '#adb5bd', marginTop: 4 },
  backStepBtn: { marginTop: 10, alignSelf: 'center', padding: 10 },
  backStepBtnText: { color: '#6E85B7', fontWeight: '700', textDecorationLine: 'underline' },
  headerIcon: { padding: 4 },
  parSection: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#6E85B7', marginBottom: 8, textAlign: 'center' },
  parRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  parBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  parActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  parText: { fontSize: 16, fontWeight: '700', color: '#495057' },
  parActiveText: { color: '#fff' },
  moreParBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  penaltyRow: { flexDirection: 'row' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 24 },
  navBtn: { width: 52, height: 52, backgroundColor: '#6c757d', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mainNavBtn: { flex: 1, backgroundColor: '#007AFF', height: 52, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  mainNavBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  earlyFinishBtn: { width: 52, height: 52, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 38, 71, 0.4)', justifyContent: 'center', padding: 20 },
  modalOverlayFull: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  scoreCardModal: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%' },
  scoreCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  scoreCardTitle: { fontSize: 20, fontWeight: '900', color: '#0A2647' },
  floatScoreCard: { position: 'absolute', bottom: 85, right: 16, backgroundColor: '#0A2647', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  floatScoreCardText: { color: '#fff', fontSize: 10, fontWeight: '900' },
});



