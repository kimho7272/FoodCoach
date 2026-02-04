import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        // Custom fonts could be added here
    });

    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        if (fontsLoaded) {
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            </Stack>
        </SafeAreaProvider>
    );
}
