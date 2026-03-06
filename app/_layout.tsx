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
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthReady(true);
    });

    // Watch for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // On login success: pull cloud data only (anonymous migration deprecated)
        roundRepository.pullRoundsFromSupabase(session).then((pullRes) => {
          if (pullRes.success) {
            console.log(`[Sync] ${pullRes.count} rounds pulled from cloud.`);
            queryClient.invalidateQueries({ queryKey: ['golf_rounds'] });
          }
        });
      }
    });

    return () => subscription.unsubscribe();
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

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // No session and not in auth group: redirect to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Session exists and in auth group: redirect to main
      router.replace('/(tabs)');
    }
  }, [session, segments, isAuthReady]);

  // Render nothing until auth state is resolved (keeps splash screen visible)
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
