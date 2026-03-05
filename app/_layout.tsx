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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();

      // KakaoTalk In-app browser detection & Auto-redirect to external browser
      if (typeof window !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf('kakao') > -1) {
          // Kakaotalk custom scheme to open in external browser
          window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(window.location.href);
        }
      }
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 인증 상태 변화 감시
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // 로그인 성공 시 데이터 마이그레이션 및 클라우드 데이터 Pull 실행
        // session을 직접 전달하여 getSession() 재호출로 인한 타이밍 불일치 방지
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

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // 세션이 없고 auth 그룹이 아니면 로그인 페이지로 이동
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // 세션이 있고 auth 그룹이면 메인 페이지로 이동
      router.replace('/(tabs)');
    }
  }, [session, segments]);

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

