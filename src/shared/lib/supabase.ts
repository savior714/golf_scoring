import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Environment variables are missing. Please check your .env file.');
}

// SSR(Server-Side Rendering) 환경 대응을 위한 스토리지 추상화
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            storage: isBrowser ? AsyncStorage : {
                getItem: () => Promise.resolve(null),
                setItem: () => Promise.resolve(),
                removeItem: () => Promise.resolve(),
            },
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: isBrowser, // 빌드 타임에는 URL 감지 비활성화
        },
    }
);

