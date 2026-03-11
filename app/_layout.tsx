import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';

import { roundRepository } from '@/src/modules/golf/golf.repository';
import { useColorScheme } from '@/src/shared/components/useColorScheme';
import { supabase } from '@/src/shared/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/src/shared/components/ToastConfig';
import { GlobalErrorBoundary } from '@/src/shared/components/ErrorBoundary';

const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav fontsLoaded={loaded} />
    </QueryClientProvider>
  );
}

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthReady(true);
    });

    // Watch for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // TOKEN_REFRESHED 등 반복 이벤트에서는 동기화 생략, 실제 로그인 시에만 실행
      if (event === 'SIGNED_IN' && session) {
        // On login success: pull cloud data only (anonymous migration deprecated)
        roundRepository.pullRoundsFromSupabase(session).then((pullRes) => {
          if (pullRes.success) {
            if (pullRes.skipped) {
                console.log('[Sync] Pull skipped (throttled).');
                return;
            }
            console.log(`[Sync] ${pullRes.count} rounds pulled from cloud.`);
            queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
            if (pullRes.count > 0) {
              Toast.show({
                type: 'success',
                text1: '데이터 동기화 완료',
                text2: `${pullRes.count}개의 라운딩 데이터를 불러왔습니다.`
              });
            }
          } else {
            Toast.show({
              type: 'error',
              text1: '동기화 실패',
              text2: '클라우드 데이터를 가져오지 못했습니다.'
            });
          }
        });
      }
    });

    // Watch for app state changes for auto-sync retry
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        roundRepository.retryPendingSyncs().then(res => {
          if (res.success > 0) {
            console.log(`[Sync] Auto-retried ${res.success}/${res.attempted} pending rounds.`);
            queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  // Hide splash screen when auth state and fonts are ready (wait for redirect completion)
  useEffect(() => {
    if (fontsLoaded && isAuthReady) {
      const inAuthGroup = segments[0] === '(auth)';
      const isRedirectNeeded = (!session && !inAuthGroup) || (session && inAuthGroup);

      // Hide splash only when no redirect is needed (final destination reached)
      if (!isRedirectNeeded) {
        SplashScreen.hideAsync();

        // Detect KakaoTalk in-app browser and redirect to external browser
        if (typeof window !== 'undefined') {
          const ua = navigator.userAgent.toLowerCase();
          if (ua.indexOf('kakao') > -1) {
            window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(window.location.href);
          }
        }
      }
    }
  }, [fontsLoaded, isAuthReady, session, segments]);

  // Handle page redirect based on auth state
  useEffect(() => {
    if (!isAuthReady) return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';
    const isAtRoot = !rootSegment;

    // 1. 세션이 없는데 인증 그룹이 아닌 곳에 있는 경우 -> 로그인으로 이동
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    } 
    
    // 2. 세션이 있는데 인증 그룹에 있거나 루트(/)에 머물러 있는 경우 -> 메인으로 이동
    if (session && (inAuthGroup || isAtRoot)) {
      router.replace('/(tabs)');
      return;
    }
  }, [session, segments[0], isAuthReady, router]); // segments 전체가 아닌 root segment만 관찰하여 불필요한 재실행 방지

  // Render nothing until auth state is resolved (keeps splash screen visible)
  if (!isAuthReady) {
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <Toast config={toastConfig} />
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
