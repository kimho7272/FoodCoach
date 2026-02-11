import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView, PanResponder, Alert } from 'react-native';
import * as Localization from 'expo-localization';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    useDerivedValue
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { updateProfile } from '../src/lib/auth_service';
import { supabase } from '../src/lib/supabase';
import { useTranslation } from '../src/lib/i18n';
// import * as Notifications from 'expo-notifications';
const Notifications = {
    requestPermissionsAsync: async () => ({ status: 'granted' }),
};
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Bell, Camera as CameraIcon, Image as ImageIcon, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;
const fruitCharacter = require('../assets/applei.png');

export default function EnhancedOnboarding() {
    const router = useRouter();
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState('');
    const [weight, setWeight] = useState(70);
    const [heightVal, setHeightVal] = useState(170);
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

    const [targetKcal, setTargetKcal] = useState(2000);
    const [isManualKcal, setIsManualKcal] = useState(false);

    // For FT/IN display
    const [feet, setFeet] = useState(5);
    const [inches, setInches] = useState(7);

    useEffect(() => {
        // Detect region for default units
        const region = Localization.getLocales()[0].regionCode;
        if (region === 'US' || region === 'LR' || region === 'MM') {
            setWeightUnit('lb');
            setHeightUnit('ft');

            // Convert 170cm to ft/in
            const totalInches = 170 / 2.54;
            const f = Math.floor(totalInches / 12);
            const i = Math.round(totalInches % 12);
            setFeet(f);
            setInches(i);

            setWeight(Math.round(70 * 2.20462)); // Initial kg to lb
        }
    }, []);

    // Automatic recommendation logic
    useEffect(() => {
        if (!isManualKcal) {
            const kg = weightUnit === 'lb' ? weight * 0.453592 : weight;
            // Simple maintenance formula: kg * 30
            const recommended = Math.round(kg * 30 / 50) * 50; // Round to nearest 50
            setTargetKcal(recommended);
        }
    }, [weight, weightUnit, isManualKcal]);

    const characterScale = useSharedValue(1);
    const characterRotation = useSharedValue(0);

    const bgColor = useDerivedValue(() => {
        return interpolateColor(
            weight,
            [40, 120],
            ['#F0FDFA', '#FFF1F2']
        );
    });

    const animatedBgStyle = useAnimatedStyle(() => ({
        backgroundColor: bgColor.value,
    }));

    const steps = [
        { title: "Hi! I'm Applei.", sub: "What's your nickname?", type: "text" },
        { title: "Your Height", sub: "Slide to adjust", type: "slider_height" },
        { title: "Your Weight", sub: "Tap to adjust", type: "slider_weight" },
        { title: "Calorie Goal", sub: "AI Recommended", type: "slider_kcal" },
        { title: t('permissionsRequired'), sub: t('permissionsDesc'), type: "permissions" },
        { title: "Ready!", sub: "Let's start your health journey.", type: "done" }
    ];

    useEffect(() => {
        characterScale.value = withTiming(1.2, { duration: 200 }, () => {
            characterScale.value = withTiming(1, { duration: 200 });
        });
        characterRotation.value = withTiming(10, { duration: 100 }, () => {
            characterRotation.value = withTiming(-10, { duration: 100 }, () => {
                characterRotation.value = withTiming(0, { duration: 100 });
            });
        });
    }, [step]);

    const [notifGranted, setNotifGranted] = useState(false);
    const [cameraGranted, setCameraGranted] = useState(false);
    const [libraryGranted, setLibraryGranted] = useState(false);
    const [locationGranted, setLocationGranted] = useState(false);

    const handleGrantPermissions = async () => {
        try {
            // Notifications
            const { status: nStatus } = await Notifications.requestPermissionsAsync();
            setNotifGranted(nStatus === 'granted');

            // Camera
            const { status: cStatus } = await Camera.requestCameraPermissionsAsync();
            setCameraGranted(cStatus === 'granted');

            // Media Library
            const { status: lStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setLibraryGranted(lStatus === 'granted');

            // Location
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            setLocationGranted(locStatus === 'granted');

            // Small delay for UX feel
            setTimeout(() => nextStep(), 500);
        } catch (error) {
            console.error('Permission request error:', error);
            nextStep(); // Fallback to next step even if it fails
        }
    };

    const nextStep = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            // Save to database before finishing
            saveProfile();
        }
    };

    const saveProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Convert back to standard units (cm, kg) if needed for DB consistency
                const finalHeight = heightUnit === 'ft' ? Math.round((feet * 12 + inches) * 2.54) : heightVal;
                const finalWeight = weightUnit === 'lb' ? Math.round(weight * 0.453592) : weight;

                const result = await updateProfile(user.id, {
                    nickname,
                    height: finalHeight,
                    weight: finalWeight,
                    target_calories: targetKcal
                });

                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to sync with server');
                }
            }
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            Alert.alert("Sync Error", "We couldn't save your profile due to a security policy (RLS). Please check your Supabase settings.");
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const characterStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: characterScale.value },
            { rotate: `${characterRotation.value}deg` }
        ]
    }));

    // Swipe Handler for Character
    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (evt, gestureState) => {
            const { dx } = gestureState;
            if (dx > 50) {
                // Swipe Right -> Previous Step
                prevStep();
            } else if (dx < -50) {
                // Swipe Left -> Next Step
                nextStep();
            }
        },
    });

    return (
        <Animated.View style={[styles.root, animatedBgStyle]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header Bar */}
                <View style={styles.header}>
                    {step > 0 ? (
                        <TouchableOpacity onPress={prevStep} style={styles.backIconButton}>
                            <ArrowLeft color="#64748b" size={24} />
                        </TouchableOpacity>
                    ) : <View style={{ width: 44 }} />}

                    <View style={styles.progressRow}>
                        {steps.map((_, i) => (
                            <View key={i} style={[styles.progressDot, { backgroundColor: i === step ? '#6366f1' : '#e2e8f0' }]} />
                        ))}
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.mainContainer}>
                            {/* Character Column */}
                            <View style={[styles.characterContainer, steps[step].type === "permissions" && { marginBottom: 4 }]} {...panResponder.panHandlers}>
                                <Animated.View style={[characterStyle, styles.characterShadow]}>
                                    <Image
                                        source={fruitCharacter}
                                        style={[
                                            styles.characterImg,
                                            steps[step].type === "permissions" && { width: 80, height: 80 }
                                        ]}
                                        resizeMode="contain"
                                    />
                                </Animated.View>
                            </View>

                            {/* Setup Card */}
                            <BlurView intensity={40} tint="light" style={styles.glassCard}>
                                <View style={[styles.cardContent, steps[step].type === "permissions" && { paddingHorizontal: 16, paddingVertical: 16 }]}>
                                    <Text style={styles.cardTitle}>{steps[step].title}</Text>
                                    <Text style={styles.cardSub}>{steps[step].sub}</Text>

                                    {steps[step].type === "text" && (
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Enter nickname"
                                            value={nickname}
                                            onChangeText={setNickname}
                                            autoFocus
                                        />
                                    )}

                                    {steps[step].type === "slider_height" && (
                                        <View style={styles.inputBody}>
                                            <View style={styles.unitToggleRow}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (heightUnit === 'ft') {
                                                            setHeightUnit('cm');
                                                            const totalIn = feet * 12 + inches;
                                                            setHeightVal(Math.round(totalIn * 2.54));
                                                        }
                                                    }}
                                                    style={[styles.unitBtn, heightUnit === 'cm' && styles.unitBtnActive]}
                                                >
                                                    <Text style={[styles.unitBtnText, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (heightUnit === 'cm') {
                                                            setHeightUnit('ft');
                                                            const totalIn = heightVal / 2.54;
                                                            setFeet(Math.floor(totalIn / 12));
                                                            setInches(Math.round(totalIn % 12));
                                                        }
                                                    }}
                                                    style={[styles.unitBtn, heightUnit === 'ft' && styles.unitBtnActive]}
                                                >
                                                    <Text style={[styles.unitBtnText, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft/in</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {heightUnit === 'cm' ? (
                                                <>
                                                    <Text style={styles.valueTxt}>{heightVal} cm</Text>
                                                    <View style={styles.sliderMock}>
                                                        <TouchableOpacity onPress={() => setHeightVal((h: number) => Math.max(1, h - 1))} style={styles.sliderBtn}>
                                                            <Text>-</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => setHeightVal((h: number) => h + 1)} style={styles.sliderBtn}>
                                                            <Text>+</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            ) : (
                                                <View style={styles.ftInContainer}>
                                                    <View style={styles.ftInBlock}>
                                                        <Text style={styles.valueTxtSmall}>{feet} ft</Text>
                                                        <View style={styles.miniBtnRow}>
                                                            <TouchableOpacity onPress={() => setFeet((f: number) => Math.max(1, f - 1))} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                            <TouchableOpacity onPress={() => setFeet((f: number) => f + 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                                        </View>
                                                    </View>
                                                    <View style={styles.ftInBlock}>
                                                        <Text style={styles.valueTxtSmall}>{inches} in</Text>
                                                        <View style={styles.miniBtnRow}>
                                                            <TouchableOpacity onPress={() => setInches((i: number) => Math.max(0, i - 1))} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                            <TouchableOpacity onPress={() => setInches((i: number) => i >= 11 ? 0 : i + 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {steps[step].type === "slider_weight" && (
                                        <View style={styles.inputBody}>
                                            <View style={styles.unitToggleRow}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (weightUnit === 'lb') {
                                                            setWeightUnit('kg');
                                                            setWeight(Math.round(weight * 0.453592));
                                                        }
                                                    }}
                                                    style={[styles.unitBtn, weightUnit === 'kg' && styles.unitBtnActive]}
                                                >
                                                    <Text style={[styles.unitBtnText, weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (weightUnit === 'kg') {
                                                            setWeightUnit('lb');
                                                            setWeight(Math.round(weight * 2.20462));
                                                        }
                                                    }}
                                                    style={[styles.unitBtn, weightUnit === 'lb' && styles.unitBtnActive]}
                                                >
                                                    <Text style={[styles.unitBtnText, weightUnit === 'lb' && styles.unitBtnTextActive]}>lb</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <Text style={styles.valueTxt}>{weight} {weightUnit}</Text>
                                            <View style={styles.btnRow}>
                                                {[-5, -1, 1, 5].map(val => (
                                                    <TouchableOpacity
                                                        key={val}
                                                        onPress={() => setWeight(w => w + val)}
                                                        style={styles.stepBtn}
                                                    >
                                                        <Text style={styles.stepBtnTxt}>{val > 0 ? `+` : ''}{val}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {steps[step].type === "slider_kcal" && (
                                        <View style={styles.inputBody}>
                                            <View style={styles.unitToggleRow}>
                                                <View style={[styles.unitBtn, styles.unitBtnActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                                                    <Text style={styles.unitBtnTextActive}>{!isManualKcal ? t('recommended') : t('manualTarget')}</Text>
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={styles.valueTxt}>{targetKcal} kcal</Text>
                                                {!isManualKcal && (
                                                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 20 }}>
                                                        <Text style={{ fontSize: 12, color: '#10b981', fontWeight: 'bold' }}>✨ {t('basedOnHeightWeight')}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.btnRow}>
                                                {[-100, -50, 50, 100].map(val => (
                                                    <TouchableOpacity
                                                        key={val}
                                                        onPress={() => {
                                                            setTargetKcal(k => k + val);
                                                            setIsManualKcal(true);
                                                        }}
                                                        style={styles.stepBtn}
                                                    >
                                                        <Text style={styles.stepBtnTxt}>{val > 0 ? `+` : ''}{val}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                            {isManualKcal && (
                                                <TouchableOpacity
                                                    onPress={() => setIsManualKcal(false)}
                                                    style={{ marginTop: 20 }}
                                                >
                                                    <Text style={{ fontSize: 13, color: '#6366f1', fontWeight: 'bold', textDecorationLine: 'underline' }}>{t('recommendedValue')}로 초기화</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}

                                    {steps[step].type === "permissions" && (
                                        <View style={styles.inputBody}>
                                            <View style={styles.permissionItem}>
                                                <View style={styles.permIconBox}>
                                                    <CameraIcon size={18} color="#6366f1" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.permTitle}>{t('cameraAccess')}</Text>
                                                    <Text style={styles.permSub} numberOfLines={1}>{t('cameraAccessDesc')}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.permissionItem}>
                                                <View style={styles.permIconBox}>
                                                    <Bell size={18} color="#6366f1" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.permTitle}>{t('notificationAccess')}</Text>
                                                    <Text style={styles.permSub} numberOfLines={1}>{t('notificationAccessDesc')}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.permissionItem}>
                                                <View style={styles.permIconBox}>
                                                    <ImageIcon size={18} color="#6366f1" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.permTitle}>{t('galleryAccess')}</Text>
                                                    <Text style={styles.permSub} numberOfLines={1}>{t('galleryAccessDesc')}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.permissionItem}>
                                                <View style={styles.permIconBox}>
                                                    <MapPin size={18} color="#6366f1" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.permTitle}>{t('locationAccess')}</Text>
                                                    <Text style={styles.permSub} numberOfLines={1}>{t('locationAccessDesc')}</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity onPress={handleGrantPermissions} style={[styles.primaryBtn, { marginTop: 12 }]}>
                                                <Text style={styles.primaryBtnTxt}>{t('grantAllPermissions')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {steps[step].type !== "permissions" && (
                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity onPress={nextStep} style={styles.primaryBtn}>
                                                <Text style={styles.primaryBtnTxt}>Next</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </BlurView>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F0FDFA' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backIconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    progressRow: { flexDirection: 'row', gap: 8 },
    progressDot: { height: 6, width: 24, borderRadius: 3 },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    mainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 20,
    },
    characterContainer: { alignItems: 'center', marginBottom: 12 },
    characterImg: { width: isSmallDevice ? 100 : 130, height: isSmallDevice ? 100 : 130 },
    characterShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    labelWrapper: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    labelTxt: { color: '#6366f1', fontWeight: 'bold' },
    glassCard: {
        width: '100%',
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.6)',
        overflow: 'hidden',
    },
    cardContent: { padding: 24, alignItems: 'center' },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 4, textAlign: 'center' },
    cardSub: { fontSize: 13, color: '#64748b', marginBottom: 16, textAlign: 'center' },
    textInput: {
        width: '100%',
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 16,
        paddingHorizontal: 24,
        fontSize: 18,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    inputBody: { width: '100%', alignItems: 'center' },
    valueTxt: { fontSize: 32, fontWeight: 'bold', color: '#6366f1', marginBottom: 16 },
    sliderMock: {
        width: '100%',
        height: 48,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    sliderBtn: { width: 32, height: 32, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    btnRow: { flexDirection: 'row', gap: 12 },
    stepBtn: {
        width: 52,
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    stepBtnTxt: { fontWeight: 'bold' },
    primaryBtn: {
        marginTop: 20,
        width: '100%',
        height: 56,
        backgroundColor: '#0f172a',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    buttonRow: {
        marginTop: 20,
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    secondaryBtn: {
        flex: 1,
        height: 56,
        backgroundColor: 'rgba(15, 23, 42, 0.1)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(15, 23, 42, 0.1)',
    },
    secondaryBtnTxt: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
    unitToggleRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    unitBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    unitBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    unitBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
    },
    unitBtnTextActive: {
        color: '#0f172a',
    },
    ftInContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 10,
    },
    ftInBlock: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    valueTxtSmall: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366f1',
        marginBottom: 10,
    },
    miniBtnRow: {
        flexDirection: 'row',
        gap: 10,
    },
    miniBtn: {
        width: 36,
        height: 36,
        backgroundColor: '#fff',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        padding: 10,
        borderRadius: 16,
        marginBottom: 6,
        width: '100%',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    permIconBox: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    permTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    permSub: { fontSize: 11, color: '#64748b' },
});
