import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Environment variables are missing. Please check your .env file.');
}

// Storage abstraction for SSR (Server-Side Rendering) compatibility
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
            detectSessionInUrl: isBrowser, // Disable URL session detection at build time
        },
    }
);

