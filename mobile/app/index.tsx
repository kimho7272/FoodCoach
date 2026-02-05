import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { View, ActivityIndicator } from 'react-native';

import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('nickname')
                        .eq('id', session.user.id)
                        .single();

                    if (profile?.nickname) {
                        router.replace('/(tabs)');
                    } else if (!profile) {
                        // DB∞ùÉ ∞£á∞áÇ ∞áòδ│┤Ω░Ç ∞òä∞ÿê ∞ùå∞£╝δ⌐┤(∞é¡∞á£δÉÿ∞ùêΩ▒░δéÿ ∞ÿñδÑÿ) ∞ä╕∞àÿ φîîΩ╕░ φ¢ä δí£Ω╖╕∞¥╕δ╢Çφä░ δïñ∞ï£
                        await supabase.auth.signOut();
                        router.replace('/login');
                    } else {
                        // ∞ä╕∞àÿ∞¥Ç ∞₧êΩ│á DB∞ùÉ ∞£á∞áÇδèö ∞â¥∞ä▒δÉÿ∞ùê∞£╝δéÿ ∞ÿ¿δ│┤δö⌐ ∞áä∞¥╕ Ω▓╜∞Ü░
                        router.replace('/onboarding');
                    }
                } else {
                    router.replace('/login');
                }
            } catch (e) {
                console.error('Auth check error', e);
                router.replace('/login');
            } finally {
                // IMPORTANT: Hide splash screen only after we've decided where to go
                await SplashScreen.hideAsync();
            }
        };

        checkUser();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#10b981" />
        </View>
    );
}
