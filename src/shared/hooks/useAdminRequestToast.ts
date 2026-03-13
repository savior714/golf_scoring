import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useIsAdmin } from '../components/useIsAdmin';

/**
 * Hook for administrators to receive real-time notifications for new course requests.
 * Listens to 'INSERT' events on the 'course_requests' table.
 */
export const useAdminRequestToast = () => {
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    // Only administrators should subscribe to these notifications
    if (!isAdmin) return;

    console.log('[useAdminRequestToast] Subscribing to course_requests...');

    const channel = supabase
      .channel('admin-course-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'course_requests',
        },
        (payload) => {
          console.log('[useAdminRequestToast] New request received:', payload.new);
          
          const clubName = payload.new.requested_club_name;
          
          Toast.show({
            type: 'info',
            text1: '⛳ 새 구장 추가 요청',
            text2: `${clubName} 요청이 접수되었습니다.`,
            onPress: () => {
              // TODO: Navigate to admin management page when implemented
              Toast.hide();
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useAdminRequestToast] Successfully subscribed to Realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useAdminRequestToast] Failed to subscribe to Realtime');
        }
      });

    return () => {
      console.log('[useAdminRequestToast] Unsubscribing from course_requests');
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);
};
