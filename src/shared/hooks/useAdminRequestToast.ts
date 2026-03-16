import { useEffect, useRef } from 'react';
import { AppState, InteractionManager } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useIsAdmin } from '../components/useIsAdmin';

/**
 * **관리자용 실시간 알림 훅**
 * 'course_requests' 테이블의 INSERT 이벤트를 감시하여 토스트 알림을 표시합니다.
 * **CHANNEL_ERROR** 및 **TIMED_OUT** 상황에 대한 지수 백오프 재시도 로직을 포함합니다.
 */
export const useAdminRequestToast = () => {
  const { isAdmin } = useIsAdmin();
  const retryCountRef = useRef(0);
  const isRetryingRef = useRef(false); // 가드: 재시도 프로세스 중복 실행 방지
  const channelSuffixRef = useRef(Math.random().toString(36).substring(2, 10));
  const MAX_RETRIES = 5;

  useEffect(() => {
    // 관리자가 아닌 경우 구독하지 않음
    if (!isAdmin) {
      isRetryingRef.current = false;
      return;
    }

    let channel: any = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const subscribe = () => {
      // 새로운 구독 시도 시 채널 고유성을 위해 접미사 갱신
      channelSuffixRef.current = Math.random().toString(36).substring(2, 10);
      const channelName = `admin-course-requests-${channelSuffixRef.current}`;
      
      console.log(`[useAdminRequestToast] Subscribing to ${channelName}... (Attempt: ${retryCountRef.current + 1})`);

      const activeChannel = supabase.channel(channelName);
      channel = activeChannel;

      activeChannel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'course_requests',
          },
          (payload) => {
            // 인스턴스 일치 확인: 클로저에 의해 캡처된 channel이 현재 활성 상태인지 검증
            if (channel !== activeChannel) return;

            console.log('[useAdminRequestToast] New request received:', payload.new);
            const clubName = payload.new.requested_club_name;
            
            Toast.show({
              type: 'info',
              text1: '⛳ 새 구장 추가 요청',
              text2: `${clubName} 요청이 접수되었습니다.`,
              onPress: () => Toast.hide()
            });
          }
        )
        .subscribe((status) => {
          // 비동기 상태 콜백이 현재 활성 채널의 것인지 최종 확인
          if (channel !== activeChannel) {
            if (status !== 'CLOSED') {
              console.log(`[useAdminRequestToast] Stale channel status (${status}) ignored.`);
            }
            return;
          }

          if (status === 'SUBSCRIBED') {
            console.log('[useAdminRequestToast] Successfully subscribed to Realtime');
            retryCountRef.current = 0;
            isRetryingRef.current = false;
          } 
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // 재시도 가드: 이미 프로세스가 진행 중이면 중단
            if (isRetryingRef.current) return;

            // 명시적 Cleanup 상황인 경우 에러 처리 생략
            if (status === 'CLOSED') {
              console.log('[useAdminRequestToast] Channel closed gracefully.');
              return;
            }

            console.warn(`[useAdminRequestToast] Realtime connection issue: ${status}`);
            
            if (retryCountRef.current < MAX_RETRIES) {
              isRetryingRef.current = true;
              retryCountRef.current++;
              
              // 지수 백오프 (Exponential Backoff): 최대 30초
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
              console.log(`[useAdminRequestToast] Retrying in ${delay}ms...`);
              
              timeoutId = setTimeout(() => {
                // 재시도 시점에도 인터랙션 가드(InteractionManager) 적용
                InteractionManager.runAfterInteractions(() => {
                  if (channel) {
                    supabase.removeChannel(channel).catch(() => {});
                    channel = null;
                  }
                  isRetryingRef.current = false;
                  subscribe();
                });
              }, delay);
            } else {
              console.warn('[useAdminRequestToast] Max retries reached. Subscription paused until foreground.');
              isRetryingRef.current = false;
            }
          }
        });
    };

    // 초기 실행 시 네비게이션 애니메이션 등 무거운 작업 이후에 시작
    const task = InteractionManager.runAfterInteractions(() => {
      subscribe();
    });

    // 앱 상태 리스너: 포그라운드 복귀 시 강제 재연결 시도
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && (retryCountRef.current >= MAX_RETRIES || !channel)) {
        console.log('[useAdminRequestToast] App foregrounded. Refreshing subscription...');
        retryCountRef.current = 0;
        isRetryingRef.current = false;
        
        if (channel) {
          supabase.removeChannel(channel).catch(() => {});
          channel = null;
        }
        
        subscribe();
      }
    });

    return () => {
      console.log('[useAdminRequestToast] Cleaning up subscription...');
      isRetryingRef.current = true; // Cleanup 중임을 표시하여 후속 CLOSED 이벤트 처리 차단
      task.cancel();
      appStateSubscription.remove();
      if (timeoutId) clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [isAdmin]);
};
