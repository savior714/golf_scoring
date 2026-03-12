import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, InteractionManager, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../src/modules/golf/styles/record.styles';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { TeeDistance } from '../../src/modules/golf/golf.types';

// Hooks
import { useGolfRecord } from '../../src/modules/golf/hooks/useGolfRecord';

// Modularized Components
import { CourseHeader, CourseSelector, MissShotPatternGrid, ScoreAdjuster } from '../../src/modules/golf/components/Record';
import { HoleErrorBoundary } from '../../src/modules/golf/components/Record/HoleErrorBoundary';
import { ParSelector } from '../../src/modules/golf/components/Record/ParSelector';
import { RoundFinishModal } from '../../src/modules/golf/components/Record/RoundFinishModal';
import { logger } from '../../src/shared/utils/logger';

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, hole } = useLocalSearchParams<{ mode?: string; hole?: string }>();
  // tabLabel logic moved to TabLayout for declarative control
  
  const { state, actions, filledHoles, progressPercentage } = useGolfRecord(mode);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // 1-1. Lifecycle Guard: unmounted state update prevention
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  const {
    currentHole,
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
    syncStatus,
    pendingSyncCount,
    isLoadingMaster,
  } = state;

  const {
    loadMasterAndSession,
    startNewRound,
    saveCurrentHole,
    finishRound,
    setPar,
    setStroke,
    setPutt,
    setOb,
    setPenalty,
    setMissShot,
    setIsParEditing,
    setCurrentHole,
    setSelectionStep,
    setTempSelection,
    // setSelectedTee
  } = actions;

  // Load Initial Data with InteractionManager to avoid animation stutter
  // activeSession\uc774 \uc774\ubbf8 \ubcf5\uc6d0\ub41c \uc0c1\ud0dc\uc5d0\uc11c\ub294 \ud0ed \ubcf5\uadc0 \uc2dc \uc7ac\uc2e4\ud589 \ec8a4\ud0b5
  // \u2192 \ucd5c\ucd08 \uc9c4\uc785 or mode='new' \uc2e0\uaddc \ub77c\uc6b4\ub529 \uc2dc\uc5d0\ub9cc loadMasterAndSession \uc2e4\ud589
  useFocusEffect(
    useCallback(() => {
      logger.info('[useFocusEffect] fired', { hasSession: !!activeSession, mode });
      if (activeSession && mode !== 'new') {
        logger.info('[useFocusEffect] Guard: SKIPPED');
        return;
      }
      logger.info('[useFocusEffect] Guard: PASS → loadMasterAndSession');
      const task = InteractionManager.runAfterInteractions(() => {
        loadMasterAndSession();
      });
      return () => {
        logger.info('[useFocusEffect] cleanup: task.cancel');
        task.cancel();
      };
    }, [loadMasterAndSession, activeSession, mode])
  );

  // Jump to specific hole if provided in URL params
  useEffect(() => {
    if (hole && isMounted.current) {
      const holeNum = parseInt(hole, 10);
      if (!isNaN(holeNum) && holeNum >= 1 && holeNum <= 18) {
        setCurrentHole(holeNum);
      }
    }
  }, [hole, setCurrentHole]);
  const handleNextHole = async () => {
    if (currentHole < 18) {
      await saveCurrentHole();
      if (isMounted.current) {
        setCurrentHole(prev => prev + 1);
      }
    } else {
      // 18홀 기록 완료
      await saveCurrentHole();
      
      if (isMounted.current) {
        Toast.show({
          type: 'success',
          text1: '라운딩 기록 완료',
          text2: '18홀 모든 기록이 업로드 되었습니다.'
        });

        setShowFinishModal(true);
      }
    }
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
    // 초기화 중(isManualLoading: true)이면 스피너 표시 → CourseSelector 깜빡임 차단
    if (isLoadingMaster) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
          <ActivityIndicator size="large" color="#0A2647" />
        </View>
      );
    }
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
      <View style={styles.mainContainer}>
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
            style={styles.animatedContent}
          >
            <View style={styles.topSection}>
              <CourseHeader
                clubName={activeSession.clubName}
                outCourseName={activeSession.outCourse.name}
                inCourseName={activeSession.inCourse.name}
                distanceMeter={getCurrentDistance()}
                holeNumber={currentHole}
                syncStatus={pendingSyncCount > 0 ? 'failed' : syncStatus}
                progressPercentage={progressPercentage}
                progressLabel={`${filledHoles} / 18 Holes`}
              />
            </View>

            <View style={styles.middleSection}>
              <ParSelector
                par={par}
                isParEditing={isParEditing}
                setPar={setPar}
                setIsParEditing={setIsParEditing}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <ScoreAdjuster label="STROKES" value={stroke} onAdjust={(d: number) => setStroke((s: number) => Math.max(1, s + d))} accentColor="#007AFF" />
                </View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}>
                  <ScoreAdjuster label="PUTTS" value={putt} onAdjust={(d: number) => setPutt((p: number) => Math.max(0, p + d))} accentColor="#28a745" />
                </View>
              </View>

              <View style={styles.penaltyRow}>
                <View style={{ flex: 1 }}>
                  <ScoreAdjuster label="OB" value={ob} onAdjust={(d: number) => setOb((o: number) => Math.max(0, o + d))} accentColor="#FF3B30" />
                </View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}>
                  <ScoreAdjuster label="PENALTY" value={penalty} onAdjust={(d: number) => setPenalty((p: number) => Math.max(0, p + d))} accentColor="#FF9500" />
                </View>
              </View>
            </View>

            <View style={styles.bottomSection}>
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
            </View>
          </Animated.View>
        </HoleErrorBoundary>
      </View>


      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity 
          style={[styles.navBtn, currentHole === 1 && { opacity: 0.5 }]} 
          disabled={currentHole === 1} 
          onPress={async () => { 
            await saveCurrentHole(); 
            if (isMounted.current) setCurrentHole(h => h - 1); 
          }}
        >
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
              { text: "라운딩 마감", onPress: async () => { 
                await saveCurrentHole(); 
                if (isMounted.current) finishRound(); 
              } }
            ]);
          }}>
            <Ionicons name="save-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <RoundFinishModal
        visible={showFinishModal}
        onLater={async () => {
          setShowFinishModal(false);
          await finishRound();
        }}
        onConfirm={async () => {
          if (isMounted.current) setShowFinishModal(false);
          await finishRound();
          if (isMounted.current) router.push('/(tabs)');
        }}
      />
    </View>
  );
}

