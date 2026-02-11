import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { signInWithSocial } from '../src/lib/auth_service';
import { ActivityIndicator } from 'react-native';
import { useAlert } from '../src/context/AlertContext';
import { useTranslation } from '../src/lib/i18n';

const { width, height } = Dimensions.get('window');
const fruitCharacter = require('../assets/applei.png');
const googleLogo = require('../assets/google_logo.jpg');

export default function LoginScreen() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { language } = useTranslation();
    const bobValue = useSharedValue(0);
    const [isLoading, setIsLoading] = React.useState(false);

    useEffect(() => {
        bobValue.value = withRepeat(
            withTiming(10, {
                duration: 2000,
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
        try {
            const { user, error } = await signInWithSocial(provider);
            if (error) {
                setIsLoading(false);
                console.error("Login Error Object:", JSON.stringify(error, null, 2));
                const errorMsg = error.message || 'Unknown error occurred';
                const errorDetails = (error as any).details || (error as any).hint || '';
                showAlert({
                    title: 'Login Failed',
                    message: `${errorMsg}\n\nTechnical Details: ${errorDetails}`,
                    type: 'error'
                });
            } else if (user) {
                // Keep loading TRUE until replace happens to prevent flickering
                router.replace('/onboarding');
            } else {
                setIsLoading(false);
            }
        } catch (e) {
            setIsLoading(false);
            console.error(e);
        }
    };

    return (
        <View style={styles.root}>
            {/* Premium Flowing Background */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={['#0F172A', '#1E1B4B', '#312E81', '#1E3A8A']} // Deep Navy & Midnight Flow
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}>
                    <LinearGradient
                        colors={['#10B981', 'transparent', '#6366F1']} // Emerald & Indigo highlights
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centeredContainer}>
                    <View style={styles.contentWrapper}>
                        {/* Header with Logo/Character */}
                        <Animated.View style={[styles.characterSection, animatedCharacterStyle]}>
                            <View style={styles.glowContainer} />
                            <Image source={fruitCharacter} style={styles.characterImage} resizeMode="contain" />
                        </Animated.View>

                        {/* Title & Subtitle */}
                        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.textSection}>
                            <View style={styles.brandContainer}>
                                <Text style={styles.brandText}>FoodCoach</Text>
                                <Text style={styles.brandSubText}>AI Based Nutritionist</Text>
                            </View>

                            <Text style={styles.greetingText}>
                                건강한 식습관,{"\n"}오늘부터 시작해보세요.
                            </Text>
                        </Animated.View>

                        {/* Action Buttons */}
                        <Animated.View
                            entering={FadeInDown.delay(600).duration(800)}
                            style={styles.actionContainer}
                        >
                            <TouchableOpacity
                                onPress={() => handleSocialLogin('google')}
                                activeOpacity={0.8}
                                style={styles.googleButton}
                            >
                                <Image source={googleLogo} style={styles.googleButtonIcon} />
                                <Text style={styles.googleButtonText}>Google로 시작하기</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Disclaimer */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>
                                로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            {/* Premium Loading Overlay */}
            <Modal transparent visible={isLoading} animationType="fade">
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <Animated.View
                        entering={FadeInDown}
                        style={styles.loadingContent}
                    >
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text style={{ marginTop: 15, fontWeight: 'bold', color: '#10B981', fontSize: 16 }}>
                            {language === 'Korean' ? '계정 연결 중...' : 'Connecting...'}
                        </Text>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
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
    contentWrapper: {
        width: width * 0.9,
        maxWidth: 400,
        height: height * 0.72,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 50,
    },
    characterSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowContainer: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
    },
    characterImage: {
        width: 180,
        height: 180,
        zIndex: 10,
    },
    textSection: {
        alignItems: 'center',
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    brandText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    brandSubText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    greetingText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 42,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    actionContainer: {
        width: '100%',
        paddingHorizontal: 10,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
        gap: 12,
    },
    googleButtonIcon: {
        width: 24,
        height: 24,
    },
    googleButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    footerContainer: {
        marginTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        fontWeight: '600',
    },
    loadingOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    loadingContent: {
        padding: 30,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    }
});
