import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { LanguageProvider } from '../src/lib/i18n';
import { TourProvider } from '../src/context/TourContext';
import { AlertProvider } from '../src/context/AlertContext';
import { TourOverlay } from '../src/components/TourOverlay';
import { HealthProvider } from '../src/context/HealthContext';

import { supabase } from '../src/lib/supabase';
import { useRouter, useSegments } from 'expo-router';

SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const [fontsLoaded] = useFonts({
        // Custom fonts could be added here
    });

    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        if (fontsLoaded) {
            // Hide the splash screen once fonts are loaded
            SplashScreen.hideAsync();
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            const inAuthGroup = segments[0] === 'login';

            if (event === 'SIGNED_OUT' && !inAuthGroup) {
                router.replace('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [segments]);

    if (!fontsLoaded) return null;

    return (
        <LanguageProvider>
            <HealthProvider>
                <AlertProvider>
                    <TourProvider>
                        <SafeAreaProvider>
                            <Stack screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="index" />
                                <Stack.Screen name="login" />
                                <Stack.Screen name="onboarding" />
                                <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
                            </Stack>
                            <TourOverlay />
                        </SafeAreaProvider>
                    </TourProvider>
                </AlertProvider>
            </HealthProvider>
        </LanguageProvider>
    );
}
