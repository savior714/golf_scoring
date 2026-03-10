import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { TeeDistance } from '../../src/modules/golf/golf.types';
import { ScoreCardTable } from '../../src/shared/components/ScoreCardTable';

// Hooks
import { useGolfRecord } from '../../src/modules/golf/hooks/useGolfRecord';

// Modularized Components
import { CourseHeader, CourseSelector, HoleSelectorGrid, MissShotPatternGrid, ScoreAdjuster } from '../../src/modules/golf/components/Record';
import { HoleErrorBoundary } from '../../src/modules/golf/components/Record/HoleErrorBoundary';

export default function RecordScreen() {
  const router = useRouter(); 
  const { mode, hole } = useLocalSearchParams<{ mode?: string; hole?: string }>();
  
  const {
    // States
    currentHole, setCurrentHole,
    showHoleGrid, setShowHoleGrid,
    showScoreCard, setShowScoreCard,
    par, setPar,
    stroke, setStroke,
    putt, setPutt,
    ob, setOb,
    penalty, setPenalty,
    missShot, setMissShot,
    isParEditing, setIsParEditing,
    clubs, activeSession,
    selectionStep, setSelectionStep,
    tempSelection, setTempSelection,
    selectedTee,
    holeRecords, syncStatus, pendingSyncCount,
    isLoadingMaster,
    
    // Actions
    loadMasterAndSession,
    startNewRound,
    saveCurrentHole,
    resetSession,
    finishRound,
  } = useGolfRecord(mode);

  // Load Initial Data
  useFocusEffect(
    useCallback(() => {
      loadMasterAndSession();
    }, [loadMasterAndSession])
  );

  // Jump to specific hole if provided in URL params
  useEffect(() => {
    if (hole) {
      const holeNum = parseInt(hole, 10);
      if (!isNaN(holeNum) && holeNum >= 1 && holeNum <= 18) {
        setCurrentHole(holeNum);
      }
    }
  }, [hole, setCurrentHole]);

  const handleNextHole = async () => {
    await saveCurrentHole();
    if (currentHole < 18) {
      setCurrentHole(prev => prev + 1);
    } else {
      await finishRound();
      const msg = "라운딩이 마감되었습니다.\n대시보드에서 최종 결과를 확인하세요.";
      Alert.alert("완료", msg, [{ text: "확인", onPress: () => router.push('/(tabs)') }]);
    }
  };

  const handleJumpToHole = async (h: number) => {
    await saveCurrentHole();
    setCurrentHole(h);
    setShowScoreCard(false);
    setShowHoleGrid(false);
  };

  const getCurrentDistance = (): number => {
    if (!activeSession) return 0;
    const hole = currentHole <= 9
      ? activeSession.outCourse.holes[currentHole - 1]
      : activeSession.inCourse.holes[currentHole - 10];
    return hole?.distances.find((d: TeeDistance) => d.teeColor === selectedTee)?.distanceMeter || 0;
  };


  // Course Selection UI
  if (!activeSession) {
    return (
      <CourseSelector
        isLoadingMaster={isLoadingMaster}
        selectionStep={selectionStep}
        clubs={clubs}
        tempSelection={tempSelection}
        setTempSelection={setTempSelection}
        setSelectionStep={setSelectionStep}
        startNewRound={startNewRound}
      />
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
            {/* Sync Status Icon Logic */}
            {syncStatus === 'syncing' ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : pendingSyncCount > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cloud-offline" size={20} color="#FF9500" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FF9500', marginLeft: 2 }}>{pendingSyncCount}</Text>
              </View>
            ) : syncStatus === 'synced' ? (
              <Ionicons name="cloud-done" size={20} color="#28a745" />
            ) : syncStatus === 'failed' ? (
              <Ionicons name="cloud-offline" size={20} color="#FF3B30" />
            ) : null}

            <TouchableOpacity onPress={() => {
              Alert.alert("새 라운딩", "진행 중인 세션을 종료하고 새로 시작하시겠습니까?", [
                { text: "취소", style: "cancel" },
                { text: "새로 시작", style: "destructive", onPress: () => { resetSession(); } }
              ]);
            }} style={styles.headerIcon}>
              <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )
      }} />

      <ScrollView contentContainerStyle={styles.container}>
        <HoleErrorBoundary 
          holeNumber={currentHole} 
          onReset={() => {
            setPar(4);
            setStroke(1);
            setPutt(0);
            setOb(0);
            setPenalty(0);
            setMissShot('없음');
          }}
        >
          <Animated.View 
            key={`hole-${currentHole}`} 
            entering={FadeIn.duration(400)}
          >
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
          </Animated.View>
        </HoleErrorBoundary>

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
            holeRecords={holeRecords}
            onSelectHole={handleJumpToHole}
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
              <ScoreCardTable 
                startHole={1} 
                endHole={9} 
                holes={holeRecords} 
                coursePars={activeSession.combinedPars} 
                onHolePress={handleJumpToHole}
                currentHole={currentHole}
              />
              <View style={{ height: 20 }} />
              <ScoreCardTable 
                startHole={10} 
                endHole={18} 
                holes={holeRecords} 
                coursePars={activeSession.combinedPars} 
                onHolePress={handleJumpToHole}
                currentHole={currentHole}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  headerIcon: { padding: 4 },
  parSection: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#6E85B7', marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  parRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  parBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  parActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  parText: { fontSize: 18, fontWeight: '800', color: '#495057' },
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
  floatScoreCard: { position: 'absolute', bottom: 85, right: 16, backgroundColor: '#0A2647', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  floatScoreCardText: { color: '#fff', fontSize: 10, fontWeight: '900' },
});
