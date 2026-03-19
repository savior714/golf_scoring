import { memo, useCallback, useEffect, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { styles } from '../../styles/record.styles';
import { CourseHeader } from './CourseHeader';
import { MissShotPatternGrid } from './MissShotPatternGrid';
import { RecordFooter } from './RecordFooter';
import { ScoreAdjuster } from './ScoreAdjuster';
import { ParSelector } from './ParSelector';
import { RoundFinishModal } from './RoundFinishModal';
import { HoleErrorBoundary } from './HoleErrorBoundary';
import { GolfState, GolfActions } from '@/src/modules/golf/domain/golf.types';
import { EdgeInsets } from 'react-native-safe-area-context';

interface RecordMainContentProps {
  state: GolfState;
  actions: GolfActions;
  filledHoles: number;
  progressPercentage: number;
  insets: EdgeInsets;
  showFinishModal: boolean;
  setShowFinishModal: (show: boolean) => void;
  handleNextHole: () => Promise<void>;
  getCurrentDistance: () => number;
  onFinish: () => void;
  isMounted: boolean;
}

export const RecordMainContent = memo(({
  state,
  actions,
  filledHoles,
  progressPercentage,
  insets,
  showFinishModal,
  setShowFinishModal,
  handleNextHole,
  getCurrentDistance,
  onFinish,
  isMounted
}: RecordMainContentProps) => {
  const {
    currentHole,
    par,
    stroke,
    putt,
    ob,
    penalty,
    missShot,
    isParEditing,
    activeSession,
    syncStatus,
    pendingSyncCount,
  } = state;

  // 1-2. Animation & Rendering Priority Guard
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const task = InteractionManager.runAfterInteractions(() => {
      setIsTransitioning(false);
    });
    return () => task.cancel();
  }, [currentHole]);

  const {
    setPar,
    setStroke,
    setPutt,
    setOb,
    setPenalty,
    setMissShot,
    setIsParEditing,
    setCurrentHole,
    saveCurrentHole,
    finishRound,
  } = actions;

  const handleParReset = useCallback(() => {
    setPar(4);
    setStroke(1);
    setPutt(0);
    setOb(0);
    setPenalty(0);
    setMissShot('없음');
  }, [setPar, setStroke, setPutt, setOb, setPenalty, setMissShot]);

  const handleStrokeAdjust = useCallback((d: number) => 
    setStroke((s: number) => Math.max(1, s + d)), [setStroke]);

  const handlePuttAdjust = useCallback((d: number) => 
    setPutt((p: number) => Math.max(0, p + d)), [setPutt]);

  const handleObAdjust = useCallback((d: number) => 
    setOb((o: number) => Math.max(0, o + d)), [setOb]);

  const handlePenaltyAdjust = useCallback((d: number) => 
    setPenalty((p: number) => Math.max(0, p + d)), [setPenalty]);

  const handleTogglePattern = useCallback((pattern: string) => {
    if (pattern === '없음') {
      setMissShot('없음');
    } else {
      const current = (missShot === '없음' || !missShot) ? [] : missShot.split(',');
      if (current.includes(pattern)) {
        const filtered = current.filter((p: string) => p !== pattern);
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
  }, [missShot, setMissShot]);

  const handleFinishLater = useCallback(async () => {
    setShowFinishModal(false);
    await finishRound();
  }, [setShowFinishModal, finishRound]);

  const handleFinishConfirm = useCallback(async () => {
    if (isMounted) setShowFinishModal(false);
    await finishRound();
    if (isMounted) onFinish();
  }, [isMounted, setShowFinishModal, finishRound, onFinish]);

  if (!activeSession) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={styles.mainContainer}>
        {/* Header - Stable outside animation */}
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

        <HoleErrorBoundary 
          holeNumber={currentHole} 
          onReset={handleParReset}
        >
          {/* Inputs - Animated on hole change */}
          <Animated.View 
            key={`hole-${currentHole}`} 
            entering={FadeIn.duration(400)}
            style={[styles.animatedContent, { flex: 1, opacity: isTransitioning ? 0 : 1 }]}
          >
            {!isTransitioning && (
              <>
                <View style={styles.middleSection}>
                  <ParSelector
                    par={par}
                    isParEditing={isParEditing}
                    setPar={setPar}
                    setIsParEditing={setIsParEditing}
                  />

                  <View style={styles.inputRow}>
                    <View style={{ flex: 1 }}>
                      <ScoreAdjuster 
                        label="STROKES" 
                        value={stroke} 
                        onAdjust={handleStrokeAdjust} 
                        accentColor="#007AFF" 
                      />
                    </View>
                    <View style={{ width: 8 }} />
                    <View style={{ flex: 1 }}>
                      <ScoreAdjuster 
                        label="PUTTS" 
                        value={putt} 
                        onAdjust={handlePuttAdjust} 
                        accentColor="#28a745" 
                      />
                    </View>
                  </View>

                  <View style={styles.penaltyRow}>
                    <View style={{ flex: 1 }}>
                      <ScoreAdjuster 
                        label="OB" 
                        value={ob} 
                        onAdjust={handleObAdjust} 
                        accentColor="#FF3B30" 
                      />
                    </View>
                    <View style={{ width: 8 }} />
                    <View style={{ flex: 1 }}>
                      <ScoreAdjuster 
                        label="PENALTY" 
                        value={penalty} 
                        onAdjust={handlePenaltyAdjust} 
                        accentColor="#FF9500" 
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.bottomSection}>
                  <MissShotPatternGrid
                    missShot={missShot}
                    onTogglePattern={handleTogglePattern}
                  />
                </View>
              </>
            )}
          </Animated.View>
        </HoleErrorBoundary>
      </View>

      <RecordFooter 
        currentHole={currentHole}
        insetsBottom={insets.bottom}
        isMounted={isMounted}
        saveCurrentHole={saveCurrentHole}
        setCurrentHole={setCurrentHole}
        handleNextHole={handleNextHole}
        finishRound={finishRound}
      />

      <RoundFinishModal
        visible={showFinishModal}
        onLater={handleFinishLater}
        onConfirm={handleFinishConfirm}
      />
    </View>
  );
});

RecordMainContent.displayName = 'RecordMainContent';
