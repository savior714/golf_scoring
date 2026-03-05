import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { roundRepository } from '@/src/modules/golf/golf.repository';
import { useColorScheme } from '@/src/shared/components/useColorScheme';
import { supabase } from '@/src/shared/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthReady(true);
    });

    // 인증 상태 변화 감시
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // 로그인 성공 시 데이터 마이그레이션 및 클라우드 데이터 Pull 실행
        Promise.all([
          roundRepository.migrateAnonymousData(),
          roundRepository.pullRoundsFromSupabase(session)
        ]).then(([migRes, pullRes]) => {
          if (migRes.migrated > 0) console.log(`[Migration] ${migRes.migrated} rounds migrated.`);
          if (pullRes.success) {
            console.log(`[Sync] ${pullRes.count} rounds pulled from cloud.`);
            queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 인증 상태 및 폰트 로드 완료 시 스플래시 화면 해제 (리다이렉트 완료 대기)
  useEffect(() => {
    if (fontsLoaded && isAuthReady) {
      const inAuthGroup = segments[0] === '(auth)';
      const isRedirectNeeded = (!session && !inAuthGroup) || (session && inAuthGroup);

      // 리다이렉트가 필요 없는 최종 목적지에 도달했을 때만 스플래시 해제
      if (!isRedirectNeeded) {
        SplashScreen.hideAsync();

        // KakaoTalk 인앱 브라우저 감지 및 외부 브라우저 호출 (스플래시 해제 시점에 수행)
        if (typeof window !== 'undefined') {
          const ua = navigator.userAgent.toLowerCase();
          if (ua.indexOf('kakao') > -1) {
            window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(window.location.href);
          }
        }
      }
    }
  }, [fontsLoaded, isAuthReady, session, segments]);

  // 인증 상태에 따른 페이지 리다이렉트 제어
  useEffect(() => {
    if (!isAuthReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // 세션이 없고 auth 그룹이 아니면 로그인 페이지로 이동
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // 세션이 있고 auth 그룹이면 메인 페이지로 이동
      router.replace('/(tabs)');
    }
  }, [session, segments, isAuthReady]);

  // 인증 상태가 결정될 때까지 아무것도 렌더링하지 않음 (스플래시 유지)
  if (!isAuthReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

