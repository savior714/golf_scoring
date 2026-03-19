import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TeeDistance } from '@/src/modules/golf/domain/golf.types';

// Hooks
import { useGolfRecord } from '@/src/modules/golf/hooks/useGolfRecord';

// Modularized Components
import { CourseSelector } from '@/src/modules/golf/components/Record/CourseSelector';
import { RecordMainContent } from '@/src/modules/golf/components/Record/RecordMainContent';
import { logger } from '@/src/shared/utils/logger';
import { QUERY_KEYS } from '@/src/shared/lib/queryKeys';
import { roundRepository } from '@/src/modules/golf/infrastructure';

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, hole, id } = useLocalSearchParams<{ mode?: string; hole?: string; id?: string }>();
  
  const queryClient = useQueryClient();
  const { state, actions, filledHoles, progressPercentage } = useGolfRecord(mode);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const isFocused = useIsFocused();

  // 1-1. Lifecycle Guard: unmounted state update prevention
  const isMounted = useRef(true);
  const consumedModeRef = useRef<string | undefined>(undefined);
  const prevIdRef = useRef<string | undefined>(undefined);
  // 히스토리 수정 진입 여부 추적 — handleFinish 시 currentRoundId 초기화 판단에 사용
  const wasHistoryEditRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  const {
    currentHole,
    activeSession,
    selectionStep,
    tempSelection,
    selectedTee,
    isLoadingMaster,
  } = state;

  const {
    loadMasterAndSession,
    startNewRound,
    setCurrentHole,
    setSelectionStep,
    setTempSelection,
    saveCurrentHole,
  } = actions;

  // Load Initial Data with InteractionManager to avoid animation stutter
  useFocusEffect(
    useCallback(() => {
      logger.info('[useFocusEffect] fired', { 
        hasSession: !!activeSession, 
        mode, 
        id,
        selectionStep,
        consumed: consumedModeRef.current,
        prevId: prevIdRef.current
      });
      
      // mode와 id가 모두 이전 소비 시점과 동일하다면 중복 로딩 방지
      if (mode && mode === consumedModeRef.current && id === prevIdRef.current) {
        logger.info('[useFocusEffect] Guard: Already consumed (mode & id match)');
        return;
      }

      if (!mode) {
        if (activeSession) {
          logger.info('[useFocusEffect] Guard: Normal focus with active session (skip)');
          return;
        }
        
        if (selectionStep !== 'club') {
          logger.info('[useFocusEffect] Guard: Course selection in progress (skip)');
          return;
        }

        // [New Guard] activeSession 없음 + 캐시에서 이미 current_round_id = null 확인된 경우 DB 재조회 생략
        const cachedRoundId = queryClient.getQueryData<string | null>(QUERY_KEYS.current_round_id());
        if (cachedRoundId === null) {
          logger.info('[useFocusEffect] Guard: Cache confirms no active round → skip DB fetch');
          return;
        }

        logger.info('[useFocusEffect] No mode & No session → checking DB for ongoing round');
      }

      logger.info('[useFocusEffect] → Executing loadMasterAndSession');
      const task = InteractionManager.runAfterInteractions(async () => {
        try {
          // If id is provided in edit mode, set it as the current round before loading
          if (id && mode === 'edit') {
            logger.info(`[useFocusEffect] Setting current round ID to ${id}`);
            await roundRepository.setCurrentRoundId(id);
            wasHistoryEditRef.current = true;
          }

          await loadMasterAndSession();

          if (isFocused && (mode === 'new' || mode === 'edit')) {
            logger.info(`[useFocusEffect] Consuming mode=${mode}, id=${id} -> clearing params`);
            consumedModeRef.current = mode;
            prevIdRef.current = id;
            router.setParams({ mode: undefined, id: undefined });
          }
        } catch (error) {
          logger.error('[useFocusEffect] loadMasterAndSession failed', error);
        }
      });

      return () => {
        logger.info('[useFocusEffect] cleanup - clearing consumed states');
        task.cancel();
        // 탭 전환 시 다음 진입을 위해 소비 상태 초기화 (activeSession이 있으면 가드에서 걸러짐)
        consumedModeRef.current = undefined;
        prevIdRef.current = undefined;
        wasHistoryEditRef.current = false;
      };
    }, [loadMasterAndSession, activeSession, mode, id, selectionStep, router, queryClient, isFocused])
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

  const handleNextHole = useCallback(async () => {
    if (currentHole < 18) {
      await saveCurrentHole();
      if (isMounted.current) {
        setCurrentHole(prev => prev + 1);
      }
    } else {
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
  }, [currentHole, saveCurrentHole, setCurrentHole]);

  const getCurrentDistance = useCallback((): number => {
    if (!activeSession) return 0;
    const holeData = currentHole <= 9
      ? activeSession.outCourse.holes[currentHole - 1]
      : activeSession.inCourse.holes[currentHole - 10];
    return holeData?.distances.find((d: TeeDistance) => d.teeColor === selectedTee)?.distanceMeter || 0;
  }, [activeSession, currentHole, selectedTee]);

  const handleFinish = useCallback(async () => {
    // 히스토리 수정 진입이었다면 currentRoundId를 null로 초기화하여 대시보드 stale 방지
    if (wasHistoryEditRef.current) {
      await roundRepository.setCurrentRoundId(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.current_round_id() });
      wasHistoryEditRef.current = false;
    }
    router.push('/(tabs)');
  }, [router, queryClient]);

  // Course Selection UI
  if (!activeSession) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA', paddingTop: insets.top }}>
        {isLoadingMaster ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0A2647" />
          </View>
        ) : (
          <CourseSelector
            isLoadingMaster={isLoadingMaster}
            selectionStep={selectionStep}
            clubs={state.clubs}
            tempSelection={tempSelection}
            setTempSelection={setTempSelection}
            setSelectionStep={setSelectionStep}
            startNewRound={startNewRound}
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA', paddingTop: insets.top }}>
      <RecordMainContent
        state={state}
        actions={actions}
        filledHoles={filledHoles}
        progressPercentage={progressPercentage}
        insets={insets}
        showFinishModal={showFinishModal}
        setShowFinishModal={setShowFinishModal}
        handleNextHole={handleNextHole}
        getCurrentDistance={getCurrentDistance}
        onFinish={handleFinish}
        isMounted={isMounted.current}
      />
    </View>
  );
}

