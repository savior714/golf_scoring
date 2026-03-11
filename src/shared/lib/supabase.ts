import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Environment variables are missing. Please check your .env file.');
}

// SSR(Static Export) 환경(Node.js)에서는 window가 정의되지 않는다.
// AsyncStorage의 .storage getter가 window에 접근하므로,
// SSR에서는 세션 유지가 필요 없는 no-op storage를 대신 사용한다.
const isBrowser = typeof window !== 'undefined';

const ssrNoopStorage = {
    getItem: (): string | null => null,
    setItem: (): void => undefined,
    removeItem: (): void => undefined,
};

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            storage: isBrowser ? AsyncStorage : ssrNoopStorage,
            autoRefreshToken: isBrowser,
            persistSession: isBrowser,
            detectSessionInUrl: isBrowser,
        },
    }
);

