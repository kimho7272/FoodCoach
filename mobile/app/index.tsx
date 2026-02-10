import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
    const router = useRouter();
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            setIsError(false);
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (session) {
                // If we have a session, verify the profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('nickname')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) {
                    // PGRST116 is the "Row not found" error code from PostgREST/Supabase
                    // If profile is missing, it's a new user -> Onboarding
                    if (profileError.code === 'PGRST116') {
                        router.replace('/onboarding');
                        return;
                    }

                    // For other errors (like network/timeout), throw to catch block
                    // to show Retry UI instead of logging out
                    console.error('Profile fetch error:', profileError);
                    throw new Error('프로필 정보를 불러오는데 실패했습니다.');
                }

                if (profile?.nickname) {
                    router.replace('/(tabs)');
                } else {
                    // Profile exists but nickname missing
                    router.replace('/onboarding');
                }
            } else {
                // No session -> Login
                router.replace('/login');
            }
        } catch (e: any) {
            console.error('Auth check error', e);
            // Show retry UI for network/unexpected errors
            // DO NOT force logout here, as it might be a temporary network issue
            setIsError(true);
            setErrorMsg(e.message || '연결 오류가 발생했습니다.');
        } finally {
            await SplashScreen.hideAsync();
        }
    };

    if (isError) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity onPress={checkUser} style={styles.retryButton}>
                    <Text style={styles.retryText}>다시 시도</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginButton}>
                    <Text style={styles.loginText}>로그인 화면으로 이동</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#10b981" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    retryText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loginButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    loginText: {
        color: '#6b7280',
        textDecorationLine: 'underline',
    }
});
