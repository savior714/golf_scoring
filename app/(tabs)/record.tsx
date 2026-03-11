import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { TeeDistance } from '../../src/modules/golf/golf.types';

// Hooks
import { useGolfRecord } from '../../src/modules/golf/hooks/useGolfRecord';

// Modularized Components
import { CourseHeader, CourseSelector, HoleSelectorGrid, MissShotPatternGrid, ScoreAdjuster } from '../../src/modules/golf/components/Record';
import { HoleErrorBoundary } from '../../src/modules/golf/components/Record/HoleErrorBoundary';

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, hole, source } = useLocalSearchParams<{ mode?: string; hole?: string; source?: string }>();
  const tabLabel = source === 'history' ? '기록 수정' : '새 라운딩';
  const navigation = useNavigation();

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarLabel: tabLabel });
    return () => {
      navigation.getParent()?.setOptions({ tabBarLabel: '새 라운딩' });
    };
  }, [navigation, tabLabel]);
  
  const { state, actions } = useGolfRecord(mode);
  const [showFinishModal, setShowFinishModal] = useState(false);
  
  const {
    currentHole,
    showHoleGrid,
    showScoreCard,
    par,
    stroke,
    putt,
    ob,
    penalty,
    missShot,
    isParEditing,
    clubs, 
    activeSession,
    selectionStep,
    tempSelection,
    selectedTee,
    holeRecords, 
    syncStatus, 
    pendingSyncCount,
    isLoadingMaster,
  } = state;

  const {
    loadMasterAndSession,
    startNewRound,
    saveCurrentHole,
    resetSession,
    finishRound,
    setPar,
    setStroke,
    setPutt,
    setOb,
    setPenalty,
    setMissShot,
    setIsParEditing,
    setCurrentHole,
    setShowHoleGrid,
    setShowScoreCard,
    setSelectionStep,
    setTempSelection,
    // setSelectedTee
  } = actions;

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
    if (currentHole < 18) {
      await saveCurrentHole();
      setCurrentHole(prev => prev + 1);
    } else {
      // 18홀 기록 완료
      await saveCurrentHole();
      
      Toast.show({
        type: 'success',
        text1: '라운딩 기록 완료',
        text2: '18홀 모든 기록이 업로드 되었습니다.'
      });

      setShowFinishModal(true);
    }
  };

  const handleJumpToHole = async (h: number) => {
    await saveCurrentHole();
    setCurrentHole(h);
    setShowHoleGrid(false);
  };

  const getCurrentDistance = (): number => {
    if (!activeSession) return 0;
    const holeData = currentHole <= 9
      ? activeSession.outCourse.holes[currentHole - 1]
      : activeSession.inCourse.holes[currentHole - 10];
    return holeData?.distances.find((d: TeeDistance) => d.teeColor === selectedTee)?.distanceMeter || 0;
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

            <TouchableOpacity onPress={() => setShowScoreCard(true)} style={styles.headerIcon}>
              <Ionicons name="list-outline" size={24} color="#007AFF" />
            </TouchableOpacity>

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

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
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
              holeNumber={currentHole}
            />

            <View style={styles.parSection}>
              <Text style={styles.sectionLabel}>PAR</Text>
              <View style={styles.parRow}>
                {isParEditing ? (
                  [2, 3, 4, 5, 6].map(p => (
                    <TouchableOpacity 
                      key={p} 
                      style={[styles.parBtn, par === p && styles.parActive]} 
                      onPress={() => { setPar(p); setIsParEditing(false); }}
                    >
                      <Text style={[styles.parText, par === p && styles.parActiveText]}>{p}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <>
                    {[3, 4, 5].map(p => (
                      <TouchableOpacity key={p} style={[styles.parBtn, par === p && styles.parActive]} onPress={() => setPar(p)}>
                        <Text style={[styles.parText, par === p && styles.parActiveText]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => setIsParEditing(true)} style={styles.moreParBtn}>
                      <Ionicons name="ellipsis-horizontal" size={20} color="#6E85B7" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <ScoreAdjuster label="STROKES" value={stroke} onAdjust={(d: number) => setStroke((s: number) => Math.max(1, s + d))} accentColor="#007AFF" />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <ScoreAdjuster label="PUTTS" value={putt} onAdjust={(d: number) => setPutt((p: number) => Math.max(0, p + d))} accentColor="#28a745" />
              </View>
            </View>

            <View style={styles.penaltyRow}>
              <View style={{ flex: 1 }}>
                <ScoreAdjuster label="OB" value={ob} onAdjust={(d: number) => setOb((o: number) => Math.max(0, o + d))} accentColor="#FF3B30" />
              </View>
              <View style={{ width: 10 }} />
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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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

      <Modal visible={showScoreCard} transparent animationType="slide" onRequestClose={() => setShowScoreCard(false)}>
        <TouchableOpacity style={styles.modalOverlayFull} activeOpacity={1} onPress={() => setShowScoreCard(false)}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.scoreCardModal}>
            <View style={styles.scoreCardHeader}>
              <Text style={styles.scoreCardTitle}>SCORE CARD</Text>
              <TouchableOpacity onPress={() => setShowScoreCard(false)}>
                <Ionicons name="close" size={28} color="#6c757d" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ paddingBottom: 40 }}>
                <Text style={{ textAlign: 'center', color: '#ADB5BD', marginTop: 40 }}>전체 스코어카드 보기는 리더보드 탭을 이용해 주세요.</Text>
                <TouchableOpacity 
                   style={[styles.mainNavBtn, { marginTop: 20 }]} 
                   onPress={() => { setShowScoreCard(false); router.push('/(tabs)'); }}
                >
                  <Text style={styles.mainNavBtnText}>GO TO DASHBOARD</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Round Finish Confirmation Modal */}
      <Modal visible={showFinishModal} transparent animationType="fade" onRequestClose={() => setShowFinishModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.confirmModal}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="trophy-outline" size={32} color="#007AFF" />
            </View>
            <Text style={styles.confirmTitle}>라운딩 완료!</Text>
            <Text style={styles.confirmMessage}>
              18홀 기록이 모두 안전하게 저장되었습니다.{"\n"}최종 스코어와 리포트를 확인하시겠습니까?
            </Text>
            
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity 
                style={styles.confirmCancelBtn} 
                onPress={async () => {
                  setShowFinishModal(false);
                  await finishRound();
                }}
              >
                <Text style={styles.confirmCancelText}>나중에</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmOkBtn} 
                onPress={async () => {
                  setShowFinishModal(false);
                  await finishRound();
                  router.push('/(tabs)');
                }}
              >
                <Text style={styles.confirmOkText}>결과 확인</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 12, paddingBottom: 24 },
  headerIcon: { padding: 4 },
  parSection: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#6E85B7', marginBottom: 8, textAlign: 'center', letterSpacing: 1.2, textTransform: 'uppercase' },
  parRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  parBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  parActive: { backgroundColor: '#007AFF', borderColor: '#007AFF', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  parText: { fontSize: 20, fontWeight: '800', color: '#495057' },
  parActiveText: { color: '#fff' },
  moreParBtn: { width: 44, height: 52, justifyContent: 'center', alignItems: 'center' },
  inputRow: { flexDirection: 'row', marginBottom: 10 },
  penaltyRow: { flexDirection: 'row', marginBottom: 10 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F3F5', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 5 },
  navBtn: { width: 54, height: 54, backgroundColor: '#F1F3F5', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mainNavBtn: { flex: 1, backgroundColor: '#007AFF', height: 54, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  mainNavBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  earlyFinishBtn: { width: 54, height: 54, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 38, 71, 0.4)', justifyContent: 'center', padding: 20 },
  modalOverlayFull: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  scoreCardModal: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%' },
  scoreCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  scoreCardTitle: { fontSize: 20, fontWeight: '900', color: '#0A2647' },
  confirmModal: { backgroundColor: '#fff', borderRadius: 28, padding: 24, alignItems: 'center', width: '90%', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  confirmIconBg: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  confirmTitle: { fontSize: 22, fontWeight: '900', color: '#0A2647', marginBottom: 8 },
  confirmMessage: { fontSize: 15, color: '#495057', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  confirmBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancelBtn: { flex: 1, height: 54, borderRadius: 16, backgroundColor: '#F1F3F5', justifyContent: 'center', alignItems: 'center' },
  confirmCancelText: { fontSize: 16, fontWeight: '800', color: '#495057' },
  confirmOkBtn: { flex: 2, height: 54, borderRadius: 16, backgroundColor: '#007AFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  confirmOkText: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
