import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView, PanResponder, Alert, Modal, Linking } from 'react-native';
import * as Localization from 'expo-localization';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    useDerivedValue,
    FadeInDown,
    FadeInUp
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
import { Bell, Camera as CameraIcon, Image as ImageIcon, MapPin, Check } from 'lucide-react-native';
import * as Location from 'expo-location';
import { theme } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;
const fruitCharacter = require('../assets/applei.png');

export default function EnhancedOnboarding() {
    const router = useRouter();
    const { t, language, setLanguage } = useTranslation();
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState('');
    const [weight, setWeight] = useState(70);
    const [heightVal, setHeightVal] = useState(170);
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
    const [gender, setGender] = useState<'Male' | 'Female' | null>('Male');

    const [targetKcal, setTargetKcal] = useState(2000);
    const [isManualKcal, setIsManualKcal] = useState(false);

    // For FT/IN display
    const [feet, setFeet] = useState(5);
    const [inches, setInches] = useState(7);

    // For Phone Verification
    const [countryCode, setCountryCode] = useState('+82'); // Default to Korea
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    useEffect(() => {
        // Detect region for default units
        const region = Localization.getLocales()[0]?.regionCode;

        // precise country code detection could be added here
        if (region === 'US') setCountryCode('+1');
        else if (region === 'KR') setCountryCode('+82');
        // Add more as needed

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

    // Enforce Korean defaults when language is set to Korean
    useEffect(() => {
        if (language === 'Korean') {
            setHeightUnit('cm');
            setWeightUnit('kg');
            setCountryCode('+82');
            // Ensure values are metric defaults if they look like imperial defaults (or just reset to safe defaults for onboarding)
            // If we just switch units without converting, 154 lbs becomes 154 kg.
            // Let's set standard defaults for Korean context.
            setWeight(70);
            setHeightVal(170);
        } else if (language === 'English') {
            // Optional: for English, we might want to ensure it's not 70 lbs (too light) if it was kg.
            // But let's stick to the user's specific complaint about Korean 154kg.
        }
    }, [language]);

    // Automatic recommendation logic
    // Automatic recommendation logic (Mifflin-St Jeor Equation)
    useEffect(() => {
        if (!isManualKcal) {
            const kg = weightUnit === 'lb' ? weight * 0.453592 : weight;
            const cm = heightUnit === 'ft' ? (feet * 12 + inches) * 2.54 : heightVal;

            // Assume age 30 and activity factor 1.2 (Sedentary) as baseline
            let bmr;
            if (gender === 'Male') {
                bmr = 10 * kg + 6.25 * cm - 5 * 30 + 5;
            } else {
                bmr = 10 * kg + 6.25 * cm - 5 * 30 - 161;
            }

            const recommended = Math.round(bmr * 1.2 / 50) * 50; // Round to nearest 50
            setTargetKcal(recommended > 1200 ? recommended : 1200); // Minimum safety floor
        }
    }, [weight, weightUnit, heightVal, heightUnit, feet, inches, gender, isManualKcal]);

    const characterScale = useSharedValue(1);
    const characterRotation = useSharedValue(0);

    const steps = [
        { title: t('phoneNumber'), sub: t('phoneVerificationDesc'), type: "phone" },
        { title: t('welcomeMessage'), sub: "", type: "text" },
        { title: t('aboutYou'), sub: t('aboutYouDesc'), type: "biometrics" },
        { title: t('dailyCalorieGoal'), sub: t('aiRecommended'), type: "slider_kcal" },
        { title: t('permissionsRequired'), sub: t('permissionsDesc'), type: "permissions" },
        { title: t('readyTitle'), sub: t('readyDesc'), type: "done" }
    ];

    useEffect(() => {
        // Reset scroll position on step change
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });

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

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/[^\d]/g, '');

        let formatted = cleaned;
        if (countryCode === '+1') {
            // US Format: (xxx) xxx-xxxx
            if (cleaned.length > 10) return;
            if (cleaned.length > 0) {
                if (cleaned.length <= 3) {
                    formatted = `(${cleaned}`;
                } else if (cleaned.length <= 6) {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
                } else {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
                }
            }
        } else if (countryCode === '+82') {
            // KR Format: 010-xxxx-xxxx
            if (cleaned.length > 11) return;
            if (cleaned.length > 3) {
                if (cleaned.length <= 7) {
                    formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
                } else {
                    formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
                }
            }
        } else {
            // Generic fallback
            if (cleaned.length > 11) return;
        }

        setPhone(formatted);
    };

    const handleLanguageChange = async (lang: 'English' | 'Korean') => {
        await setLanguage(lang);
        if (lang === 'English') {
            setHeightUnit('ft');
            setWeightUnit('lb');
            // Set defaults for English (US Standard)
            const totalInches = 170 / 2.54;
            setFeet(Math.floor(totalInches / 12));
            setInches(Math.round(totalInches % 12));
            setWeight(Math.round(70 * 2.20462));
            setCountryCode('+1');
        } else {
            setHeightUnit('cm');
            setWeightUnit('kg');
            // Set defaults for Korean (Metric)
            setHeightVal(170);
            setWeight(70);
            setCountryCode('+82');
        }
    };

    const handleSendOtp = async () => {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        if (!cleanPhone || cleanPhone.length < 8) {
            Alert.alert("Invalid Phone", "Please enter a valid phone number.");
            return;
        }

        setSendingOtp(true);
        try {
            // Remove leading zero if present when combining with country code
            let finalBody = cleanPhone;
            if (finalBody.startsWith('0')) finalBody = finalBody.substring(1);

            let finalPhone = `${countryCode}${finalBody}`;

            // Special handling for Supabase test phone number: 555-555-5555
            // Supabase requires "15555555555" (no +) for test numbers, but app sends "+15555555555"
            // So we strip the + if the number matches the test number
            if (finalBody === '5555555555') {
                finalPhone = finalPhone.replace('+', '');
            }

            console.log("Sending OTP to:", finalPhone);

            const { error } = await supabase.auth.updateUser({ phone: finalPhone });
            if (error) throw error;
            setIsOtpSent(true);
            Alert.alert(t('codeSent'), t('codeSentDesc'));
        } catch (e: any) {
            console.error(e);
            Alert.alert("Error", e.message || "Failed to send code.");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) return;
        setVerifyingOtp(true);
        try {
            const cleanPhone = phone.replace(/[^\d]/g, '');
            let finalBody = cleanPhone;
            if (finalBody.startsWith('0')) finalBody = finalBody.substring(1);

            let finalPhone = `${countryCode}${finalBody}`;

            // Special handling for Supabase test phone number: 555-555-5555
            if (finalBody === '5555555555') {
                finalPhone = finalPhone.replace('+', '');
            }

            const { error } = await supabase.auth.verifyOtp({
                phone: finalPhone,
                token: otp,
                type: 'phone_change'
            });
            if (error) throw error;

            setIsVerified(true);
            // Auto advance
            setTimeout(() => nextStep(), 500);
        } catch (e: any) {
            console.error(e);
            Alert.alert(t('verificationFailed'), e.message || "Invalid code.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    useEffect(() => {
        if (otp.length === 6) {
            handleVerifyOtp();
        }
    }, [otp]);

    const nextStep = () => {
        if (steps[step].type === 'text' && nickname.trim().length === 0) return;
        if (steps[step].type === 'phone' && !isVerified) return; // Block next until verified
        if (steps[step].type === 'biometrics' && (!gender || !heightVal || !weight)) return;

        if (steps[step].type === 'done') {
            // Complete onboarding
            saveProfile();
        } else {
            setStep(s => s + 1);
        }
    };

    const saveProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Convert back to standard units (cm, kg) if needed for DB consistency
                const finalHeight = heightUnit === 'ft' ? Math.round((feet * 12 + inches) * 2.54) : heightVal;
                const finalWeight = weightUnit === 'lb' ? Math.round(weight * 0.453592) : weight;

                // Combine logic: use verified phone if available
                let finalPhone = null;
                if (isVerified) {
                    const cleanPhone = phone.replace(/[^\d]/g, '');
                    let finalBody = cleanPhone;
                    if (finalBody.startsWith('0')) finalBody = finalBody.substring(1);
                    finalPhone = `${countryCode}${finalBody}`;
                }

                const result = await updateProfile(user.id, {
                    nickname,
                    height: finalHeight,
                    weight: finalWeight,
                    target_calories: targetKcal,
                    gender, // Save gender
                    phone: finalPhone || undefined
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
        // Prevent going back to phone verification (step 0) from nickname (step 1)
        if (step > 1) {
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
        onStartShouldSetPanResponder: () => steps[step].type !== "phone", // Disable swipe on phone step to avoid conflict with gesture
        onPanResponderRelease: (evt, gestureState) => {
            const { dx } = gestureState;
            if (dx > 50) {
                prevStep();
            } else if (dx < -50) {
                nextStep();
            }
        },
    });

    const scrollViewRef = useRef<ScrollView>(null);

    return (
        <View style={styles.root}>
            {/* Dark Premium Background */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={theme.colors.gradients.background as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Header Bar */}
                <View style={styles.header}>
                    {step > 1 ? (
                        <TouchableOpacity onPress={prevStep} style={styles.backIconButton}>
                            <ArrowLeft color={theme.colors.text.secondary} size={24} />
                        </TouchableOpacity>
                    ) : <View style={{ width: 44 }} />}

                    <View style={styles.progressRow}>
                        {steps.map((_, i) => (
                            <View key={i} style={[
                                styles.progressDot,
                                { backgroundColor: i === step ? theme.colors.primary : theme.colors.text.muted }
                            ]} />
                        ))}
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.mainContainer}>
                            {/* Character Column */}
                            <Animated.View
                                entering={FadeInDown.duration(600)}
                                style={[styles.characterContainer, steps[step].type === "permissions" && { marginBottom: 4 }]}
                                {...panResponder.panHandlers}
                            >
                                <Animated.View style={[characterStyle, styles.characterGlow]}>
                                    <Image
                                        source={fruitCharacter}
                                        style={[
                                            styles.characterImg,
                                            steps[step].type === "permissions" && { width: 80, height: 80 }
                                        ]}
                                        resizeMode="contain"
                                    />
                                </Animated.View>
                            </Animated.View>

                            {/* Setup Card */}
                            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={{ width: '100%' }}>
                                <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                                    <View style={[styles.cardContent, steps[step].type === "permissions" && { paddingHorizontal: 16, paddingVertical: 16 }]}>
                                        <Text style={styles.cardTitle}>{steps[step].title}</Text>
                                        {steps[step].sub ? <Text style={styles.cardSub}>{steps[step].sub}</Text> : null}

                                        {steps[step].type === "text" && (
                                            <View style={styles.inputBody}>
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.inputLabel}>{t('language')}</Text>
                                                    <View style={styles.toggleContainer}>
                                                        <TouchableOpacity
                                                            onPress={() => handleLanguageChange('English')}
                                                            style={[styles.toggleBtn, language === 'English' && styles.toggleBtnActive]}
                                                        >
                                                            <Text style={[styles.toggleBtnText, language === 'English' && styles.toggleBtnTextActive]}>English</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleLanguageChange('Korean')}
                                                            style={[styles.toggleBtn, language === 'Korean' && styles.toggleBtnActive]}
                                                        >
                                                            <Text style={[styles.toggleBtnText, language === 'Korean' && styles.toggleBtnTextActive]}>한국어</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.inputLabel}>{t('nickname')}</Text>
                                                    <TextInput
                                                        style={styles.textInput}
                                                        placeholder={t('enterNickname')}
                                                        placeholderTextColor={theme.colors.text.muted}
                                                        value={nickname}
                                                        onChangeText={setNickname}
                                                        autoFocus
                                                        onFocus={() => {
                                                            setTimeout(() => {
                                                                scrollViewRef.current?.scrollTo({ y: 80, animated: true });
                                                            }, 500);
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        )}

                                        {steps[step].type === "phone" && (
                                            <View style={styles.inputBody}>
                                                <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                                                    <View style={styles.toggleContainer}>
                                                        <TouchableOpacity
                                                            onPress={() => handleLanguageChange('English')}
                                                            style={[styles.toggleBtn, language === 'English' && styles.toggleBtnActive]}
                                                        >
                                                            <Text style={[styles.toggleBtnText, language === 'English' && styles.toggleBtnTextActive]}>English (+1)</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleLanguageChange('Korean')}
                                                            style={[styles.toggleBtn, language === 'Korean' && styles.toggleBtnActive]}
                                                        >
                                                            <Text style={[styles.toggleBtnText, language === 'Korean' && styles.toggleBtnTextActive]}>한국어 (+82)</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {!isOtpSent ? (
                                                    <>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' }}>
                                                            <TextInput
                                                                style={[styles.textInput, { width: 75, textAlign: 'center', paddingHorizontal: 0 }]}
                                                                value={countryCode}
                                                                editable={false}
                                                                placeholderTextColor={theme.colors.text.muted}
                                                            />
                                                            <TextInput
                                                                style={[styles.textInput, { flex: 1, width: undefined, paddingHorizontal: 16 }]}
                                                                placeholder={countryCode === '+1' ? "(201) 555-0123" : "010-0000-0000"}
                                                                placeholderTextColor={theme.colors.text.muted}
                                                                value={phone}
                                                                onChangeText={handlePhoneChange}
                                                                keyboardType="phone-pad"
                                                                autoFocus
                                                            />
                                                        </View>
                                                        <TouchableOpacity
                                                            style={[styles.primaryBtn, { opacity: sendingOtp ? 0.7 : 1 }]}
                                                            onPress={handleSendOtp}
                                                            disabled={sendingOtp}
                                                        >
                                                            <Text style={styles.primaryBtnTxt}>{sendingOtp ? t('sending') : t('sendCode')}</Text>
                                                        </TouchableOpacity>

                                                        <Text style={styles.smsDisclaimer}>{t('smsDisclaimer')}</Text>

                                                        <View style={styles.legalLinksContainer}>
                                                            <TouchableOpacity onPress={() => Linking.openURL('https://food-coach-mu.vercel.app/privacy')}>
                                                                <Text style={styles.legalLink}>{t('privacyPolicy')}</Text>
                                                            </TouchableOpacity>
                                                            <Text style={styles.legalDivider}> • </Text>
                                                            <TouchableOpacity onPress={() => Linking.openURL('https://food-coach-mu.vercel.app/terms')}>
                                                                <Text style={styles.legalLink}>{t('termsOfService')}</Text>
                                                            </TouchableOpacity>
                                                        </View>

                                                        <TouchableOpacity onPress={() => setStep(s => s + 1)} style={{ marginTop: 24 }}>
                                                            <Text style={{ color: theme.colors.text.muted, textDecorationLine: 'underline', fontSize: 13 }}>{t('skipVerification')}</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                ) : (
                                                    <>
                                                        <View style={{ marginBottom: 16 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center' }}>
                                                                {phone}
                                                            </Text>
                                                        </View>
                                                        <TextInput
                                                            style={[styles.textInput, { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 'bold' }]}
                                                            placeholder="000000"
                                                            placeholderTextColor={theme.colors.text.muted}
                                                            value={otp}
                                                            onChangeText={setOtp}
                                                            keyboardType="number-pad"
                                                            maxLength={6}
                                                            autoFocus
                                                            textContentType="oneTimeCode"
                                                        />
                                                        <TouchableOpacity
                                                            style={[styles.primaryBtn, { opacity: otp.length < 6 || verifyingOtp ? 0.7 : 1 }]}
                                                            onPress={handleVerifyOtp}
                                                            disabled={otp.length < 6 || verifyingOtp}
                                                        >
                                                            <Text style={styles.primaryBtnTxt}>{verifyingOtp ? t('verifying') : t('verifyCode')}</Text>
                                                        </TouchableOpacity>

                                                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, alignItems: 'center' }}>
                                                            <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                                                                <Text style={{ color: theme.colors.text.secondary }}>{t('resendCode')}</Text>
                                                            </TouchableOpacity>
                                                            <View style={{ width: 1, height: 12, backgroundColor: theme.colors.text.muted }} />
                                                            <TouchableOpacity onPress={() => setStep(s => s + 1)}>
                                                                <Text style={{ color: theme.colors.text.muted }}>{t('skipVerification')}</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        )}

                                        {steps[step].type === "biometrics" && (
                                            <View style={{ width: '100%' }}>
                                                {/* Gender Section */}
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.inputLabel}>{t('gender')}</Text>
                                                    <View style={styles.toggleContainer}>
                                                        <TouchableOpacity
                                                            onPress={() => setGender('Male')}
                                                            style={[styles.toggleBtn, gender === 'Male' && styles.toggleBtnActive]}
                                                        >
                                                            <Text style={[styles.toggleBtnText, gender === 'Male' && styles.toggleBtnTextActive]}>{t('male')}</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => setGender('Female')}
                                                            style={[styles.toggleBtn, gender === 'Female' && styles.toggleBtnActive]}
                                                        >
                                                            <Text style={[styles.toggleBtnText, gender === 'Female' && styles.toggleBtnTextActive]}>{t('female')}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {/* Height Section */}
                                                <View style={styles.inputGroup}>
                                                    <View style={styles.labelRow}>
                                                        <Text style={styles.inputLabel}>{t('height')}</Text>
                                                        <View style={styles.unitToggleRowInline}>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    if (heightUnit === 'ft') {
                                                                        setHeightUnit('cm');
                                                                        const totalIn = feet * 12 + inches;
                                                                        setHeightVal(Math.round(totalIn * 2.54));
                                                                    }
                                                                }}
                                                                style={[styles.unitBtnSmall, heightUnit === 'cm' && styles.unitBtnActive]}
                                                            >
                                                                <Text style={[styles.unitBtnTextSmall, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
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
                                                                style={[styles.unitBtnSmall, heightUnit === 'ft' && styles.unitBtnActive]}
                                                            >
                                                                <Text style={[styles.unitBtnTextSmall, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft/in</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>

                                                    {heightUnit === 'cm' ? (
                                                        <>
                                                            <View style={styles.weightCenterRow}>
                                                                <Text style={styles.adjustValue}>{heightVal} cm</Text>
                                                            </View>
                                                            <View style={styles.weightBtnRow}>
                                                                {[-5, -1, 1, 5].map(val => (
                                                                    <TouchableOpacity
                                                                        key={val}
                                                                        onPress={() => setHeightVal((h: number) => Math.max(1, h + val))}
                                                                        style={styles.stepBtn}
                                                                    >
                                                                        <Text style={styles.stepBtnTxt}>{val > 0 ? `+` : ''}{val}</Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        </>
                                                    ) : (
                                                        <View style={styles.ftInContainer}>
                                                            <View style={styles.ftInBlock}>
                                                                <TouchableOpacity onPress={() => setFeet((f: number) => Math.max(1, f - 1))} style={styles.miniBtn}><Text style={styles.miniBtnText}>-</Text></TouchableOpacity>
                                                                <Text style={styles.ftInValue}>{feet} ft</Text>
                                                                <TouchableOpacity onPress={() => setFeet((f: number) => f + 1)} style={styles.miniBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                                                            </View>
                                                            <View style={styles.ftInBlock}>
                                                                <TouchableOpacity onPress={() => setInches((i: number) => Math.max(0, i - 1))} style={styles.miniBtn}><Text style={styles.miniBtnText}>-</Text></TouchableOpacity>
                                                                <Text style={styles.ftInValue}>{inches} in</Text>
                                                                <TouchableOpacity onPress={() => setInches((i: number) => i >= 11 ? 0 : i + 1)} style={styles.miniBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Weight Section */}
                                                <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                                                    <View style={styles.labelRow}>
                                                        <Text style={styles.inputLabel}>{t('weight')}</Text>
                                                        <View style={styles.unitToggleRowInline}>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    if (weightUnit === 'lb') {
                                                                        setWeightUnit('kg');
                                                                        setWeight(Math.round(weight * 0.453592));
                                                                    }
                                                                }}
                                                                style={[styles.unitBtnSmall, weightUnit === 'kg' && styles.unitBtnActive]}
                                                            >
                                                                <Text style={[styles.unitBtnTextSmall, weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    if (weightUnit === 'kg') {
                                                                        setWeightUnit('lb');
                                                                        setWeight(Math.round(weight * 2.20462));
                                                                    }
                                                                }}
                                                                style={[styles.unitBtnSmall, weightUnit === 'lb' && styles.unitBtnActive]}
                                                            >
                                                                <Text style={[styles.unitBtnTextSmall, weightUnit === 'lb' && styles.unitBtnTextActive]}>lb</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                    <View style={styles.weightCenterRow}>
                                                        <Text style={styles.adjustValue}>{weight} {weightUnit}</Text>
                                                    </View>
                                                    <View style={styles.weightBtnRow}>
                                                        {[-5, -1, 1, 5].map(val => (
                                                            <TouchableOpacity
                                                                key={val}
                                                                onPress={() => setWeight((w: number) => w + val)}
                                                                style={styles.stepBtn}
                                                            >
                                                                <Text style={styles.stepBtnTxt}>{val > 0 ? `+` : ''}{val}</Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
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
                                                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 20 }}>
                                                            <Text style={{ fontSize: 12, color: '#10b981', fontWeight: 'bold' }}>✨ {t('basedOnGenderHeightWeight') || "Based on Gender, Height & Weight"}</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <View style={styles.weightBtnRow}>
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
                                                        <Text style={{ fontSize: 13, color: '#6366f1', fontWeight: 'bold', textDecorationLine: 'underline' }}>{t('resetToRecommended')}</Text>
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
                                                    {cameraGranted && <Check size={18} color={theme.colors.primary} />}
                                                </View>
                                                <View style={styles.permissionItem}>
                                                    <View style={styles.permIconBox}>
                                                        <Bell size={18} color="#6366f1" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.permTitle}>{t('notificationAccess')}</Text>
                                                        <Text style={styles.permSub} numberOfLines={1}>{t('notificationAccessDesc')}</Text>
                                                    </View>
                                                    {notifGranted && <Check size={18} color={theme.colors.primary} />}
                                                </View>
                                                <View style={styles.permissionItem}>
                                                    <View style={styles.permIconBox}>
                                                        <ImageIcon size={18} color="#6366f1" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.permTitle}>{t('galleryAccess')}</Text>
                                                        <Text style={styles.permSub} numberOfLines={1}>{t('galleryAccessDesc')}</Text>
                                                    </View>
                                                    {libraryGranted && <Check size={18} color={theme.colors.primary} />}
                                                </View>
                                                <View style={styles.permissionItem}>
                                                    <View style={styles.permIconBox}>
                                                        <MapPin size={18} color="#6366f1" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.permTitle}>{t('locationAccess')}</Text>
                                                        <Text style={styles.permSub} numberOfLines={1}>{t('locationAccessDesc')}</Text>
                                                    </View>
                                                    {locationGranted && <Check size={18} color={theme.colors.primary} />}
                                                </View>

                                                <TouchableOpacity onPress={handleGrantPermissions} style={[styles.primaryBtn, { marginTop: 12 }]}>
                                                    <Text style={styles.primaryBtnTxt}>{t('grantAllPermissions')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {steps[step].type !== "permissions" && steps[step].type !== "phone" && (
                                            <View style={styles.buttonRow}>
                                                <TouchableOpacity onPress={nextStep} style={styles.primaryBtn}>
                                                    <Text style={styles.primaryBtnTxt}>{t('next')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </BlurView>
                            </Animated.View>
                        </View>
                        {/* Spacer for keyboard handling */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View >


    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    backIconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: theme.colors.background.overlay,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    mainContainer: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 24,
    },
    characterContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0,
        zIndex: 10,
    },
    characterGlow: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowEffect: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: theme.colors.primary,
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
    },
    characterImg: {
        width: isSmallDevice ? 120 : 150,
        height: isSmallDevice ? 120 : 150,
    },
    glassCard: {
        width: '100%',
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        backgroundColor: theme.colors.glass.card,
    },
    cardContent: {
        padding: 24,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 24,
        fontFamily: theme.typography.header.fontFamily,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    cardSub: {
        fontSize: 15,
        fontFamily: theme.typography.body.fontFamily,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    inputBody: {
        width: '100%',
        gap: 20,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: theme.typography.label.fontFamily,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    textInput: {
        width: '100%',
        height: 56,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.l,
        paddingHorizontal: 16,
        fontSize: 16,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.l,
        padding: 4,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.m,
    },
    toggleBtnActive: {
        backgroundColor: theme.colors.background.overlay,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 2,
    },
    toggleBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.muted,
    },
    toggleBtnTextActive: {
        color: theme.colors.text.primary,
    },

    // Units
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    unitToggleRowInline: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    unitBtnSmall: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    unitBtnSmallActive: {

    },
    unitBtnActive: {
        backgroundColor: theme.colors.background.overlay,
    },
    unitBtnTextSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.muted,
    },
    unitBtnTextActive: {
        color: theme.colors.text.primary,
    },

    // Adjustments
    adjustmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.l,
        padding: 8,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    adjustBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    adjustBtnText: {
        fontSize: 24,
        color: theme.colors.text.primary,
        lineHeight: 28,
    },
    adjustValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },

    // Ft/In
    ftInContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    ftInBlock: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.l,
        padding: 6,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    miniBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme.colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    miniBtnText: {
        fontSize: 18,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    ftInValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },

    // Weight Buttons
    weightCenterRow: {
        alignItems: 'center',
        marginVertical: 16,
    },
    weightBtnRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    stepBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    stepBtnTxt: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },

    // Slider / Kcal
    unitToggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    unitBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.background.secondary,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    unitBtnText: { // Added missing style
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.text.muted,
    },

    valueTxt: {
        fontSize: 40,
        fontWeight: '800',
        color: theme.colors.primary,
        marginBottom: 8,
    },

    // Permissions
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: 16,
        borderRadius: theme.borderRadius.l,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    permIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    permTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    permSub: {
        fontSize: 13,
        color: theme.colors.text.muted,
    },

    // Buttons
    buttonRow: {
        width: '100%',
        marginTop: 12,
    },
    primaryBtn: {
        width: '100%',
        height: 56,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.l,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnTxt: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    secondaryBtn: {
        marginTop: 16,
        paddingVertical: 12,
    },
    secondaryBtnTxt: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textDecorationLine: 'underline',
    },
    // Unused Styles Cleanup (previously genderBtn etc)
    genderBtn: { display: 'none' },
    genderBtnActive: { display: 'none' },
    genderBtnText: { display: 'none' },
    genderBtnTextActive: { display: 'none' },
    smsDisclaimer: {
        fontSize: 11,
        color: theme.colors.text.muted,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 16,
        paddingHorizontal: 8,
    },
    legalLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    legalLink: {
        fontSize: 12,
        color: theme.colors.primary,
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    legalDivider: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
});
