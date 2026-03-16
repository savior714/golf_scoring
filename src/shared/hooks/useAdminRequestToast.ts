import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useIsAdmin } from '../components/useIsAdmin';

/**
 * Hook for administrators to receive real-time notifications for new course requests.
 * Listens to 'INSERT' events on the 'course_requests' table.
 */
export const useAdminRequestToast = () => {
  const { isAdmin } = useIsAdmin();
  const retryCountRef = useRef(0);
  const isRetryingRef = useRef(false); // 가드: 재시도 로직 중복 실행 방지
  const channelSuffixRef = useRef(Math.random().toString(36).substring(2, 10)); // 채널 고유성 확보
  const MAX_RETRIES = 5;

  useEffect(() => {
    // Only administrators should subscribe to these notifications
    if (!isAdmin) {
      isRetryingRef.current = false;
      return;
    }

    let channel: any = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const subscribe = () => {
      // 새로운 구독 시도 시 가드 해제
      isRetryingRef.current = false;
      const channelName = `admin-course-requests-${channelSuffixRef.current}`;
      console.log(`[useAdminRequestToast] Subscribing to ${channelName}... (Attempt: ${retryCountRef.current + 1})`);

      const activeChannel = supabase.channel(channelName);
      channel = activeChannel; // 현재 활성 채널 인스턴스 추적

      activeChannel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'course_requests',
          },
          (payload) => {
            // [PATCH] 인스턴스 일치 확인: 콜백 캡처 시점의 채널이 현재 활성 채널인지 검증
            if (channel !== activeChannel) return;

            console.log('[useAdminRequestToast] New request received:', payload.new);
            
            const clubName = payload.new.requested_club_name;
            
            Toast.show({
              type: 'info',
              text1: '⛳ 새 구장 추가 요청',
              text2: `${clubName} 요청이 접수되었습니다.`,
              onPress: () => {
                Toast.hide();
              }
            });
          }
        )
        .subscribe((status) => {
          // [PATCH] 인스턴스 일치 확인: 비동기적으로 전달된 상태가 현재 채널의 것인지 확인
          if (channel !== activeChannel) {
            console.log(`[useAdminRequestToast] Stale channel status (${status}) ignored.`);
            return;
          }

          if (status === 'SUBSCRIBED') {
            console.log('[useAdminRequestToast] Successfully subscribed to Realtime');
            retryCountRef.current = 0; // Reset retries on success
            isRetryingRef.current = false;
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            // 이미 재시도 중이거나 정지된 상태라면 무시 (무한 루프 방지)
            if (isRetryingRef.current) {
              console.log(`[useAdminRequestToast] Status ${status} ignored (already retrying or cleaning up)`);
              return;
            }

            // [PATCH] CLOSED 상태가 예상된 상황(Cleanup/Retry)이 아닐 때만 에러로 기록
            if (status === 'CLOSED') {
              console.log('[useAdminRequestToast] Channel closed gracefully or via retry.');
              return;
            }

            console.error(`[useAdminRequestToast] Realtime status error: ${status}`);
            
            if (retryCountRef.current < MAX_RETRIES) {
              isRetryingRef.current = true; // 재시도 가드 활성화
              retryCountRef.current++;
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // Exponential backoff max 30s
              console.log(`[useAdminRequestToast] Retrying in ${delay}ms...`);
              
              timeoutId = setTimeout(() => {
                if (channel) {
                  supabase.removeChannel(channel).catch(e => console.warn('[useAdminRequestToast] Silent remove error:', e));
                  channel = null;
                }
                subscribe();
              }, delay);
            } else {
              console.error('[useAdminRequestToast] Max retries reached. Subscription failed.');
            }
          }
        });
    };

    // Use InteractionManager to ensure subscription starts after UI transitions
    const task = InteractionManager.runAfterInteractions(() => {
      subscribe();
    });

    return () => {
      console.log('[useAdminRequestToast] Cleaning up subscription...');
      isRetryingRef.current = true; // Cleanup 중임을 표시하여 CLOSED 유발 재시도 차단
      task.cancel();
      if (timeoutId) clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [isAdmin]);
};
