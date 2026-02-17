import React, { useState, useEffect, useRef } from 'react';
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

    const scrollViewRef = useRef<ScrollView>(null);

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
                const finalPhone = isVerified ? phone.replace(/[^\d]/g, '') : null;

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

    return (
        <Animated.View style={[styles.root, animatedBgStyle]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header Bar */}
                <View style={styles.header}>
                    {step > 1 ? (
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
                        ref={scrollViewRef}
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
                                                    value={nickname}
                                                    onChangeText={setNickname}
                                                    autoFocus
                                                    onFocus={() => {
                                                        setTimeout(() => {
                                                            // Scroll just enough to show button, around y=80 hides top character
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
                                                        />
                                                        <TextInput
                                                            style={[styles.textInput, { flex: 1, width: undefined, paddingHorizontal: 16 }]}
                                                            placeholder={countryCode === '+1' ? "(201) 555-0123" : "010-0000-0000"}
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
                                                        <Text style={styles.primaryBtnTxt}>{sendingOtp ? "Sending..." : t('sendCode')}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => setStep(s => s + 1)} style={{ marginTop: 16 }}>
                                                        <Text style={{ color: '#94a3b8', textDecorationLine: 'underline' }}>{t('skipVerification')}</Text>
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={{ marginBottom: 16 }}>
                                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#10b981', textAlign: 'center' }}>
                                                            {phone}
                                                        </Text>
                                                    </View>
                                                    <TextInput
                                                        style={[styles.textInput, { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 'bold' }]}
                                                        placeholder="000000"
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
                                                        <Text style={styles.primaryBtnTxt}>{verifyingOtp ? "Verifying..." : t('verifyCode')}</Text>
                                                    </TouchableOpacity>

                                                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, alignItems: 'center' }}>
                                                        <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                                                            <Text style={{ color: '#64748b' }}>{t('resendCode')}</Text>
                                                        </TouchableOpacity>
                                                        <View style={{ width: 1, height: 12, backgroundColor: '#cbd5e1' }} />
                                                        <TouchableOpacity onPress={() => setStep(s => s + 1)}>
                                                            <Text style={{ color: '#94a3b8' }}>{t('skipVerification')}</Text>
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
                                                    <View style={styles.adjustmentRow}>
                                                        <TouchableOpacity onPress={() => setHeightVal((h: number) => Math.max(1, h - 1))} style={styles.adjustBtn}><Text style={styles.adjustBtnText}>-</Text></TouchableOpacity>
                                                        <Text style={styles.adjustValue}>{heightVal} cm</Text>
                                                        <TouchableOpacity onPress={() => setHeightVal((h: number) => h + 1)} style={styles.adjustBtn}><Text style={styles.adjustBtnText}>+</Text></TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <View style={styles.ftInContainer}>
                                                        <View style={styles.ftInBlock}>
                                                            <TouchableOpacity onPress={() => setFeet((f: number) => Math.max(1, f - 1))} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                            <Text style={styles.ftInValue}>{feet} ft</Text>
                                                            <TouchableOpacity onPress={() => setFeet((f: number) => f + 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                                                        </View>
                                                        <View style={styles.ftInBlock}>
                                                            <TouchableOpacity onPress={() => setInches((i: number) => Math.max(0, i - 1))} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                                                            <Text style={styles.ftInValue}>{inches} in</Text>
                                                            <TouchableOpacity onPress={() => setInches((i: number) => i >= 11 ? 0 : i + 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
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
                                                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 20 }}>
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

                                    {steps[step].type !== "permissions" && steps[step].type !== "phone" && (
                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity onPress={nextStep} style={styles.primaryBtn}>
                                                <Text style={styles.primaryBtnTxt}>{t('next')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </BlurView>
                        </View>
                        {/* Spacer for keyboard handling */}
                        <View style={{ height: 100 }} />
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
        // justifyContent: 'center', // Removed to allow top alignment
    },
    mainContainer: {
        flex: 1,
        // justifyContent: 'center', // Removed
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 0, // Removed top padding
        paddingBottom: 20,
    },
    characterContainer: { alignItems: 'center', marginBottom: 0 }, // Removed bottom margin
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
    cardContent: { padding: 20, alignItems: 'center' },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 4, textAlign: 'center' },
    cardSub: { fontSize: 13, color: '#64748b', marginBottom: 12, textAlign: 'center' },
    textInput: {
        width: '100%',
        paddingVertical: 2, // Reduced to minimal
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 16,
        paddingHorizontal: 24,
        fontSize: 16, // Reduced from 18 to decrease intrinsic height
        color: '#1e293b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    inputBody: { width: '100%', alignItems: 'center' },
    valueTxt: { fontSize: 32, fontWeight: 'bold', color: '#6366f1', marginBottom: 16 },

    primaryBtn: {
        marginTop: 16,
        width: '100%',
        height: 42,
        backgroundColor: '#0f172a',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    buttonRow: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    // Styles for Biometrics matching Edit Profile geometry
    inputGroup: { marginBottom: 12, width: '100%' },
    inputLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },

    // Gender Toggle Styles
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9', // Updated to match input background
        borderRadius: 16,
        padding: 4,
        width: '100%',
        height: 44, // Standardized height
    },
    toggleBtn: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    toggleBtnTextActive: { color: '#6366f1', fontWeight: 'bold' }, // Keep Indigo for Gender as it's not in Edit Profile

    // Height/Weight Geometry adapted from Edit Profile
    unitToggleRowInline: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 2 },
    unitBtnSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    unitBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    unitBtnTextSmall: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
    unitBtnTextActive: { color: '#0f172a' },

    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%' },

    // Adjustment Row - Pill shaped buttons - Matched Colors to Edit Profile
    adjustmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '100%',
        height: 44, // Fixed Standardized Height
    },
    adjustBtn: {
        height: 32, // Fixed height to match miniBtn
        paddingVertical: 0,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        elevation: 1,
        minWidth: 44,
    },
    adjustBtnText: { fontSize: 20, fontWeight: 'bold', color: '#10b981' }, // Changed to Green to match Edit Profile
    adjustValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },

    ftInContainer: { flexDirection: 'row', gap: 12, width: '100%' },
    ftInBlock: {
        flex: 1,
        flexDirection: 'row', // Changed to row to match adjustmentRow
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 8,
        // paddingVertical: 4, // Removed
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 44, // Fixed Standardized Height
    },
    ftInValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' }, // Removed margin bottom
    miniBtnRow: { display: 'none' }, // No longer needed
    miniBtn: {
        width: 32, // Increased from 28 to match adjustmentRow buttons roughly
        height: 32,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },

    weightCenterRow: { alignItems: 'center', marginBottom: 8 },
    weightBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 8 },
    stepBtn: {
        flex: 1,
        paddingVertical: 4, // Matches Edit Profile
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)', // Using translucent border for consistency
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        marginHorizontal: 0
    },
    stepBtnTxt: { fontSize: 12, fontWeight: '700', color: '#1e293b' }, // Matches Edit Profile fontSize

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
    unitBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
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
    permTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
    permSub: { fontSize: 13, color: '#64748b' },
    // Unused Styles Cleanup (previously genderBtn etc)
    genderBtn: { display: 'none' },
    genderBtnActive: { display: 'none' },
    genderBtnText: { display: 'none' },
    genderBtnTextActive: { display: 'none' },
});
