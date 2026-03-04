import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../src/lib/supabase';

// 브라우저 세션 완료 처리
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);

    async function handleGoogleOAuth() {
        setLoading(true);
        try {
            console.log('Starting Google OAuth flow...');

            // 플랫폼별 리다이렉트 및 인증 방식 최적화
            const isWeb = Platform.OS === 'web';

            // 현재 접속 중인 원본 주소를 리다이렉트 URL로 사용 (모바일 웹 localhost 방지)
            const redirectUrl = isWeb
                ? `${window.location.origin}/(auth)/login`
                : Linking.createURL('/(auth)/login');

            console.log('Platform:', Platform.OS, 'Redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: !isWeb, // 웹은 직접 리다이렉트, 네이티브는 가로채기 위해 true
                },
            });

            if (error) throw error;

            // 웹인 경우 Supabase가 이미 브라우저를 리다이렉트 시켰으므로 이후 로직 중단
            if (isWeb) return;

            // 네이티브(Expo Go/Build) 인 경우만 WebBrowser 팝업 사용
            if (data?.url) {
                console.log('Opening OAuth URL (Native):', data.url);
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    console.log('OAuth session returned URL:', result.url);

                    // URL에서 토큰 추출 (해시 및 쿼리 파라미터 모두 대응)
                    const extractToken = (url: string, key: string) => {
                        const regex = new RegExp(`[#?&]${key}=([^&]*)`);
                        const match = url.match(regex);
                        return match ? decodeURIComponent(match[1]) : null;
                    };

                    const access_token = extractToken(result.url, 'access_token');
                    const refresh_token = extractToken(result.url, 'refresh_token');

                    if (access_token && refresh_token) {
                        console.log('Tokens found, setting session manually...');
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });

                        if (sessionError) throw sessionError;
                        // 성공 시 _layout.tsx의 onAuthStateChange가 감지하여 이동시킵니다.
                    } else {
                        console.warn('No tokens found in redirect URL');
                    }
                }
            }
        } catch (error: any) {
            console.error('OAuth Error:', error);
            Alert.alert('로그인 실패', '구글 로그인 중 오류가 발생했습니다. ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Ionicons name="golf" size={60} color="#38E54D" />
                </View>
                <Text style={styles.title}>GOLF SCORE</Text>
                <Text style={styles.subtitle}>Google 계정으로 간편하게 시작하세요</Text>
            </View>

            <View style={styles.form}>
                <TouchableOpacity
                    style={[styles.authButton, loading && styles.authButtonDisabled]}
                    onPress={handleGoogleOAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={20} color="#0A2647" style={{ marginRight: 12 }} />
                            <Text style={styles.authButtonText}>Google로 계속하기</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.footerNote}>
                    <Text style={styles.footerNoteText}>
                        버튼을 누르면 구글 계정 선택 창이 열립니다.{"\n"}
                        로그인 시 기기의 기존 데이터가 계정에 연동됩니다.
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A2647',
        padding: 30,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#B2C8DF',
        marginTop: 8,
        fontWeight: '600',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#B2C8DF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    authButton: {
        backgroundColor: '#38E54D',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        // 표준 React Native Shadow 적용
        shadowColor: '#38E54D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    authButtonDisabled: {
        opacity: 0.7,
    },
    authButtonText: {
        color: '#0A2647',
        fontSize: 18,
        fontWeight: '900',
    },
    toggleButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleButtonText: {
        color: '#B2C8DF',
        fontSize: 14,
        fontWeight: '600',
    },
    footerNote: {
        marginTop: 40,
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    footerNoteText: {
        color: '#6E85B7',
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        fontWeight: '500',
    },
});
