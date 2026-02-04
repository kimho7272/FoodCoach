import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Image, TextInput } from 'react-native';
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

const { width, height } = Dimensions.get('window');
const fruitCharacter = require('../assets/applei.png');

export default function EnhancedOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState('');
    const [weight, setWeight] = useState(70);
    const [heightVal, setHeightVal] = useState(170);

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
        { title: "Your Weight", sub: "Slide to adjust", type: "slider_weight" },
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

    const nextStep = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            router.replace('/(tabs)');
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

    return (
        <Animated.View style={[styles.root, animatedBgStyle]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header Bar */}
                <View style={styles.header}>
                    {step > 0 ? (
                        <TouchableOpacity onPress={prevStep}>
                            <ArrowLeft color="#64748b" size={24} />
                        </TouchableOpacity>
                    ) : <View style={{ width: 24 }} />}

                    <View style={styles.progressRow}>
                        {steps.map((_, i) => (
                            <View key={i} style={[styles.progressDot, { backgroundColor: i === step ? '#6366f1' : '#e2e8f0' }]} />
                        ))}
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.mainContainer}>
                    {/* Character */}
                    <View style={styles.characterContainer}>
                        <Animated.View style={[characterStyle, styles.characterShadow]}>
                            <Image source={fruitCharacter} style={styles.characterImg} resizeMode="contain" />
                        </Animated.View>
                        <BlurView intensity={20} tint="light" style={styles.labelWrapper}>
                            <Text style={styles.labelTxt}>애플이</Text>
                        </BlurView>
                    </View>

                    {/* Setup Card */}
                    <BlurView intensity={40} tint="light" style={styles.glassCard}>
                        <View style={styles.cardContent}>
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
                                    <Text style={styles.valueTxt}>{heightVal} cm</Text>
                                    <View style={styles.sliderMock}>
                                        <TouchableOpacity onPress={() => setHeightVal(h => Math.max(100, h - 1))} style={styles.sliderBtn}>
                                            <Text>-</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setHeightVal(h => Math.min(220, h + 1))} style={styles.sliderBtn}>
                                            <Text>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {steps[step].type === "slider_weight" && (
                                <View style={styles.inputBody}>
                                    <Text style={[styles.valueTxt, { color: '#F43F5E' }]}>{weight} kg</Text>
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

                            <TouchableOpacity onPress={nextStep} style={styles.primaryBtn}>
                                <Text style={styles.primaryBtnTxt}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    progressRow: { flexDirection: 'row', gap: 8 },
    progressDot: { height: 6, width: 24, borderRadius: 3 },
    mainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    characterContainer: { alignItems: 'center', marginBottom: 40 },
    characterImg: { width: 160, height: 160 },
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
    cardContent: { padding: 32, alignItems: 'center' },
    cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
    cardSub: { fontSize: 16, color: '#64748b', marginBottom: 32, textAlign: 'center' },
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
    valueTxt: { fontSize: 40, fontWeight: 'bold', color: '#6366f1', marginBottom: 24 },
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
        marginTop: 32,
        width: '100%',
        height: 64,
        backgroundColor: '#0f172a',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});
