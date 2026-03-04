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
            const isWeb = Platform.OS === 'web';

            const currentOrigin = isWeb ? window.location.origin : Linking.createURL('/');
            const redirectUrl = isWeb
                ? `${currentOrigin}/(auth)/login`
                : Linking.createURL('/(auth)/login');

            const authOptions = {
                redirectTo: redirectUrl,
                skipBrowserRedirect: !isWeb,
            };

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: authOptions,
            });

            if (error) throw error;

            if (isWeb) {
                return;
            }

            // 네이티브/EXPO: WebBrowser 팝업 세션 실행
            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    const extractToken = (url: string, key: string) => {
                        const regex = new RegExp(`[#?&]${key}=([^&]*)`);
                        const match = url.match(regex);
                        return match ? decodeURIComponent(match[1]) : null;
                    };

                    const access_token = extractToken(result.url, 'access_token');
                    const refresh_token = extractToken(result.url, 'refresh_token');

                    if (access_token && refresh_token) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        if (sessionError) throw sessionError;
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
