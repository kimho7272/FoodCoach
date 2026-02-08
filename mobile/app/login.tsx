import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Apple, Fingerprint } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { signInWithSocial } from '../src/lib/auth_service';
import { ActivityIndicator } from 'react-native';
import { useAlert } from '../src/context/AlertContext';

const { width, height } = Dimensions.get('window');
const fruitCharacter = require('../assets/applei.png');
const googleLogo = require('../assets/google_logo.png');
const kakaoLogo = require('../assets/kakao_logo.png');

export default function LoginScreen() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const bobValue = useSharedValue(0);
    const [isLoading, setIsLoading] = React.useState(false);

    useEffect(() => {
        bobValue.value = withRepeat(
            withTiming(15, {
                duration: 2200,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        );
    }, []);

    const animatedCharacterStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bobValue.value }]
    }));

    const handleSocialLogin = async (provider: 'apple' | 'google' | 'kakao') => {
        setIsLoading(true);
        const { user, error } = await signInWithSocial(provider);
        if (error) {
            setIsLoading(false);
            showAlert({ title: 'Login Failed', message: error.message, type: 'error' });
        } else if (user) {
            // Once user is authenticated, index.tsx will also handle routing
            // but we call replace here for immediate feedback if index hasn't caught up
            router.replace('/onboarding');
        }
    };

    return (
        <View style={styles.root}>
            {/* Background Mesh Gradient */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={['#B2F2BB', '#D0BFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.4)', 'transparent', 'rgba(255, 255, 255, 0.2)']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Vignette Overlay */}
            <View style={[StyleSheet.absoluteFill, styles.vignetteOverlay]} pointerEvents="none" />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centeredContainer}>

                    {/* Glass Card */}
                    <View style={styles.glassCardWrapper}>
                        <BlurView intensity={60} tint="light" style={styles.blurView}>
                            <View style={styles.contentContainer}>

                                {/* 1. Character Section */}
                                <View style={styles.characterSection}>
                                    {/* Floating Label */}
                                    <View style={styles.floatingLabelContainer}>
                                        <BlurView intensity={80} tint="light" style={styles.labelBlur}>
                                            <Text style={styles.labelText}>애플이</Text>
                                        </BlurView>
                                        <View style={styles.labelTriangle} />
                                    </View>

                                    <Animated.View style={animatedCharacterStyle}>
                                        <Image source={fruitCharacter} style={styles.characterImage} resizeMode="contain" />
                                    </Animated.View>
                                </View>

                                {/* 2. Text Content */}
                                <Text style={styles.greetingText}>
                                    반가워요! 오늘도{"\n"}건강한 한 끼 해볼까요?
                                </Text>

                                {/* 3. Social Icons Hub */}
                                <View style={styles.iconsRow}>
                                    <TouchableOpacity onPress={() => handleSocialLogin('apple')} style={styles.iconBubble}>
                                        <BlurView intensity={30} tint="light" style={styles.bubbleInner}>
                                            <Apple color="#1f2937" size={30} />
                                        </BlurView>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => handleSocialLogin('google')} style={styles.iconBubble}>
                                        <BlurView intensity={30} tint="light" style={styles.bubbleInner}>
                                            <Image source={googleLogo} style={styles.socialIconGoogle} />
                                        </BlurView>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => handleSocialLogin('kakao')} style={styles.iconBubble}>
                                        <BlurView intensity={30} tint="light" style={styles.bubbleInner}>
                                            <Image source={kakaoLogo} style={styles.socialIconKakao} />
                                        </BlurView>
                                    </TouchableOpacity>
                                </View>

                                {/* Footnote */}
                                <Text style={styles.footerText}>
                                    POWERED BY FOODCOACH AI
                                </Text>

                            </View>
                        </BlurView>
                    </View>

                </View>
            </SafeAreaView>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#10b981" />
                            <Text style={styles.loadingText}>Connecting to Applei...</Text>
                        </View>
                    </BlurView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#fff',
    },
    vignetteOverlay: {
        backgroundColor: 'rgba(0,0,0,0.03)', // Subtle darkening
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 150,
    },
    safeArea: {
        flex: 1,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    glassCardWrapper: {
        width: width * 0.88,
        height: height * 0.75,
        borderRadius: 60,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    blurView: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    characterSection: {
        alignItems: 'center',
        marginBottom: 50,
        position: 'relative',
    },
    characterImage: {
        width: 180,
        height: 180,
    },
    floatingLabelContainer: {
        position: 'absolute',
        top: -20,
        left: -50,
        zIndex: 10,
    },
    labelBlur: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    labelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
    },
    labelTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'rgba(255,255,255,0.6)',
        alignSelf: 'flex-start',
        marginLeft: 15,
        marginTop: -2,
    },
    greetingText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 32,
        letterSpacing: -0.5,
        marginBottom: 60,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    iconsRow: {
        flexDirection: 'row',
        gap: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBubble: {
        width: 68,
        height: 68,
        borderRadius: 34,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    bubbleInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialIconGoogle: {
        width: 34,
        height: 34,
    },
    socialIconKakao: {
        width: 48,
        height: 48,
    },
    footerText: {
        position: 'absolute',
        bottom: 40,
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        textAlign: 'center',
    },
    loadingOverlay: {
        zIndex: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
    }
});
