import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, StyleSheet, BackHandler, Alert, Modal, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Plus, TrendingUp, Zap, Settings, Heart, BarChart2, Camera, Activity, Award, ShieldCheck } from 'lucide-react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, Polygon, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring, withTiming, withRepeat, withSequence, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { useTranslation } from '../../src/lib/i18n';
import { useTour } from '../../src/context/TourContext';
import { TourTarget } from '../../src/components/TourTarget';
import * as ImagePicker from 'expo-image-picker';
import { Camera as CameraIcon, Image as ImageIcon, X as CloseIcon } from 'lucide-react-native';

import { HealthStatsCard } from '../../src/components/HealthStatsCard';
import { FriendsCard } from '../../src/components/FriendsCard';

const { width, height } = Dimensions.get('window');

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <BlurView intensity={40} tint="light" style={[styles.glassCard, style]}>
        <View style={styles.glassCardInner}>
            {children}
        </View>
    </BlurView>
);

import { runProactiveAgent } from '../../src/lib/proactive_agent';

import { useHealth } from '../../src/context/HealthContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export default function HomeScreen() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const { t, language } = useTranslation();
    const { registerTarget } = useTour();
    const { healthData } = useHealth(); // Get Health Data
    const [logs, setLogs] = useState<any[]>([]);
    const [totals, setTotals] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0, healthScore: 0 });
    const [hourlyDistribution, setHourlyDistribution] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
    const [showLogOptions, setShowLogOptions] = useState(false);
    const [streak, setStreak] = useState(0);

    // Reanimated Shared Values
    const readinessProgress = useSharedValue(0);
    const qualityProgress = useSharedValue(0);
    const triangleRotation = useSharedValue(0);
    const triangleScale = useSharedValue(0);

    const fetchData = React.useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setUserProfile(profile);

                const { data: mealLogs } = await supabase
                    .from('food_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                let sortedLogs = mealLogs || [];
                const todayForOrder = new Date().toDateString();
                const orderKey = `meal_order_${user.id}_${todayForOrder}`;
                const savedOrder = await AsyncStorage.getItem(orderKey);

                if (savedOrder && sortedLogs.length > 0) {
                    const idOrder = JSON.parse(savedOrder);
                    sortedLogs = [...sortedLogs].sort((a, b) => {
                        const dateA = new Date(a.created_at).toDateString();
                        const dateB = new Date(b.created_at).toDateString();
                        if (dateA === todayForOrder && dateB === todayForOrder) {
                            const idxA = idOrder.indexOf(a.id);
                            const idxB = idOrder.indexOf(b.id);
                            if (idxA === -1 && idxB === -1) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                            if (idxA === -1) return -1;
                            if (idxB === -1) return 1;
                            return idxA - idxB;
                        }
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    });
                }
                setLogs(sortedLogs);

                // Calculate Streak
                if (mealLogs && mealLogs.length > 0) {
                    const uniqueDates = Array.from(new Set(mealLogs.map((log: any) =>
                        new Date(log.created_at).toLocaleDateString('en-CA')
                    )));
                    let currentStreak = 0;
                    const today = new Date();
                    const todayStr = today.toLocaleDateString('en-CA');
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toLocaleDateString('en-CA');
                    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
                        setStreak(0);
                    } else {
                        let checkDate = uniqueDates.includes(todayStr) ? today : yesterday;
                        while (uniqueDates.includes(checkDate.toLocaleDateString('en-CA'))) {
                            currentStreak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        }
                        setStreak(currentStreak);
                    }
                } else {
                    setStreak(0);
                }

                // Calculate today's totals
                const today = new Date().toDateString();
                const todayLogs = (mealLogs || []).filter(log => new Date(log.created_at).toDateString() === today);

                const stats = todayLogs.reduce((acc: any, log: any) => {
                    acc.calories += log.calories || 0;
                    acc.protein += parseInt(log.protein) || 0;
                    acc.carbs += parseInt(log.carbs) || 0;
                    acc.fat += parseInt(log.fat) || 0;
                    return acc;
                }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

                setTotals({
                    calories: stats.calories,
                    protein: stats.protein,
                    carbs: stats.carbs,
                    fat: stats.fat,
                    healthScore: todayLogs.length > 0 ? todayLogs.reduce((a, b) => a + (b.health_score || 0), 0) / todayLogs.length : 0
                });

                // Update Animations using profile's target_calories
                const targetKcal = profile?.target_calories || 2000;
                readinessProgress.value = withSpring(Math.min(stats.calories / targetKcal, 1.2), { damping: 15 });

                const avgHealth = todayLogs.length > 0 ? todayLogs.reduce((a, b) => a + (b.health_score || 0), 0) / todayLogs.length : 0;
                qualityProgress.value = withSpring(avgHealth / 10, { damping: 12 });

                triangleScale.value = withSpring(todayLogs.length > 0 ? 1 : 0);

                // Macro Balance Tilt
                const totalMacros = stats.protein + stats.carbs + stats.fat || 1;
                const balanceTilt = (stats.protein / totalMacros) - (stats.carbs / totalMacros);
                triangleRotation.value = withSpring(balanceTilt * 30);

                // Calculate hourly distribution (6am - 12am)
                const distribution = Array(6).fill(0);
                todayLogs.forEach(log => {
                    const hour = new Date(log.created_at).getHours();
                    const slot = Math.floor((hour - 6) / 4);
                    if (slot >= 0 && slot < 6) {
                        distribution[slot] += log.calories || 0;
                    }
                });
                setHourlyDistribution(distribution);

                // Trigger Proactive Agent with Health Context
                if (healthData && healthData.isConnected) {
                    await runProactiveAgent({
                        readinessScore: healthData.readinessScore,
                        steps: healthData.steps,
                        sleepMinutes: healthData.sleepMinutes
                    });
                } else {
                    await runProactiveAgent();
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [readinessProgress, qualityProgress, triangleScale, triangleRotation, healthData]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            setShowLogOptions(false);
            router.push({
                pathname: '/analysis',
                params: {
                    imageUri: result.assets[0].uri,
                    imageBase64: result.assets[0].base64
                }
            });
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    // Prevent back navigation
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => true;
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );

    const targetKcal = userProfile?.target_calories || 2000;
    const percentage = Math.min(totals.calories / targetKcal, 1);
    const strokeWidth = 12;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;



    const getHeadline = () => {
        const score = totals.healthScore;
        const calPercent = totals.calories / targetKcal;

        if (logs.length === 0) return t('readyToFuel');
        if (score >= 8 && calPercent < 1) return t('metabolicPeak');
        if (calPercent > 1.1) return t('fuelSurplus');
        if (score < 5) return t('recoveryMode');
        return t('steadyEnergy');
    };

    const animatedRingProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: circumference * (1 - readinessProgress.value),
        };
    });

    const animatedQualityProps = useAnimatedProps(() => {
        const innerCirc = 2 * Math.PI * 45;
        return {
            strokeDashoffset: innerCirc * (1 - qualityProgress.value),
        };
    });

    const animatedGProps = useAnimatedProps(() => {
        return {
            transform: [
                { translateX: 70 },
                { translateY: 70 },
                { rotate: `${triangleRotation.value}deg` },
                { scale: triangleScale.value }
            ],
            opacity: triangleScale.value
        };
    });

    const breathValue = useSharedValue(1);

    useEffect(() => {
        breathValue.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 2000 }),
                withTiming(1, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedBreathStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: breathValue.value }],
            opacity: interpolate(breathValue.value, [1, 1.05], [0.9, 1])
        };
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#fef3c7', '#dcfce7', '#d1fae5', '#e0e7ff', '#fae8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.userInfo}>
                            <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
                                <View style={styles.avatarContainer}>
                                    {userProfile?.avatar_url ? (
                                        <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar as any} />
                                    ) : (
                                        <Text style={styles.avatarEmoji}>👦</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                            <View style={styles.userTextContainer}>
                                <TouchableOpacity
                                    onPress={() => router.push('/edit_profile')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.greetingText}>
                                        {t('hello')}, {userProfile?.nickname || userProfile?.full_name?.split(' ')[0] || (language === 'Korean' ? '친구' : 'Friend')}{language === 'Korean' ? '님' : ''}!
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <BlurView intensity={80} tint="light" style={styles.streakBadge}>
                            <Text style={styles.streakLabel}>🔥 {t('streak')}</Text>
                            <View style={styles.streakCountBox}>
                                <Text style={styles.streakCount}>{streak}</Text>
                            </View>
                        </BlurView>
                    </View>

                    {/* NEW: My Meals Today Section (Moved to Top) */}
                    <View style={[styles.sectionHeader, { marginTop: 0 }]}>
                        <Text style={styles.sectionTitle}>My Meals Today</Text>
                        <TouchableOpacity onPress={() => router.push('/meal_history' as any)}>
                            <Text style={styles.seeAllText}>{t('viewAll')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Meal Slider */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealSlider} contentContainerStyle={{ paddingRight: 20 }}>
                        <TourTarget id="log_food_area">
                            <TouchableOpacity
                                style={styles.addMealCard}
                                onPress={() => setShowLogOptions(true)}
                            >
                                <View style={styles.addIconCircle}>
                                    <Plus size={24} color="#64748b" />
                                </View>
                                <Text style={styles.addMealLabel}>{t('logMeal')}</Text>
                            </TouchableOpacity>
                        </TourTarget>

                        {logs.filter(meal => new Date(meal.created_at).toDateString() === new Date().toDateString()).map((meal, idx) => (
                            <TouchableOpacity
                                key={meal.id}
                                style={styles.mealCard}
                                onPress={() => {
                                    const d = new Date(meal.created_at);
                                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    router.push({
                                        pathname: '/meal_history',
                                        params: {
                                            date: dateStr,
                                            highlightId: meal.id
                                        }
                                    } as any);
                                }}
                            >
                                <View style={styles.mealCardContent}>
                                    <View style={styles.mealInfo}>
                                        <Text style={styles.mealType}>{meal.meal_type}</Text>
                                        <Text style={styles.mealName} numberOfLines={1}>{meal.food_name}</Text>
                                        <Text style={styles.mealKcal}>{meal.calories} kcal</Text>
                                        <Text style={styles.mealTime}>🕒 {new Date(meal.created_at).toLocaleTimeString(language === 'Korean' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    <View style={styles.mealImagePlaceholder}>
                                        {meal.image_url ? (
                                            <Image source={{ uri: meal.image_url }} style={styles.mealImage} resizeMode="cover" />
                                        ) : (
                                            <Text style={styles.mealEmoji}>🍱</Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>



                    {/* Macro Cards */}
                    <View style={[styles.macroRow, { marginTop: 16 }]}>
                        <TouchableOpacity
                            style={styles.macroTouch}
                            onPress={() => setSelectedMacro('Calories')}
                        >
                            <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Activity size={16} color="#ef4444" />
                                <Text style={styles.macroLabel}>{t('calories') || 'Calories'}</Text>
                                <Text style={styles.macroValue}>
                                    {totals.calories} <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold' }}>kcal</Text>
                                </Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.macroTouch}
                            onPress={() => setSelectedMacro('Carbs')}
                        >
                            <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(251, 146, 60, 0.1)' }]}>
                                <BarChart2 size={16} color="#fb923c" />
                                <Text style={styles.macroLabel}>{t('carbs')}</Text>
                                <Text style={styles.macroValue}>
                                    {totals.carbs} <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold' }}>g</Text>
                                </Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.macroTouch}
                            onPress={() => setSelectedMacro('Protein')}
                        >
                            <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Zap size={16} color="#10b981" />
                                <Text style={styles.macroLabel}>{t('protein')}</Text>
                                <Text style={styles.macroValue}>
                                    {totals.protein} <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold' }}>g</Text>
                                </Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.macroTouch}
                            onPress={() => setSelectedMacro('Fats')}
                        >
                            <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <Flame size={16} color="#6366f1" />
                                <Text style={styles.macroLabel}>{t('fat')}</Text>
                                <Text style={styles.macroValue}>
                                    {totals.fat} <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'bold' }}>g</Text>
                                </Text>
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.sectionHeader, { marginTop: 0 }]}
                        onPress={() => {
                            router.push({
                                pathname: '/metabolic_report',
                                params: {
                                    headline: getHeadline(),
                                    grade: totals.healthScore >= 8 ? 'S' : totals.healthScore >= 6 ? 'A' : 'B',
                                    healthScore: Math.round(totals.healthScore),
                                    calories: totals.calories,
                                    targetKcal: targetKcal,
                                    protein: totals.protein,
                                    carbs: totals.carbs,
                                    fat: totals.fat
                                }
                            });
                        }}
                    >
                        <View>
                            <Text style={[styles.sectionTitle, { fontSize: 22, color: '#0f172a' }]}>{getHeadline()}</Text>
                        </View>
                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#059669' }}>{t('gradeLabel')}: {totals.healthScore >= 8 ? 'S' : totals.healthScore >= 6 ? 'A' : 'B'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Main Intelligence Report Card */}
                    <View style={styles.summaryCard}>
                        {/* ... existing hero card content ... */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                                router.push({
                                    pathname: '/metabolic_report',
                                    params: {
                                        headline: getHeadline(),
                                        grade: totals.healthScore >= 8 ? 'S' : totals.healthScore >= 6 ? 'A' : 'B',
                                        healthScore: Math.round(totals.healthScore),
                                        calories: totals.calories,
                                        targetKcal: targetKcal,
                                        protein: totals.protein,
                                        carbs: totals.carbs,
                                        fat: totals.fat
                                    }
                                });
                            }}
                        >
                            <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, animatedBreathStyle]}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ padding: 10 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>{t('readinessScore')}</Text>
                                        <TourTarget id="readiness_score" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                                            <Text style={{ fontSize: 48, fontWeight: '900', color: '#0f172a' }}>{Math.round(totals.healthScore * 10)}</Text>
                                            <TrendingUp size={18} color="#10b981" style={{ marginBottom: 12 }} />
                                        </TourTarget>

                                        {/* Metabolic Pulse (Area Chart) */}
                                        <View style={{ height: 30, width: 100, marginTop: 5 }}>
                                            <Svg width="100" height="30" viewBox="0 0 100 30">
                                                <Path
                                                    d={`M 0 30 Q 25 ${30 - (hourlyDistribution[0] / 20 || 5)}, 50 ${30 - (hourlyDistribution[2] / 20 || 15)} T 100 ${30 - (hourlyDistribution[5] / 20 || 10)} L 100 30 L 0 30`}
                                                    fill="rgba(16, 185, 129, 0.05)"
                                                />
                                                <Path
                                                    d={`M 0 30 Q 25 ${30 - (hourlyDistribution[0] / 20 || 5)}, 50 ${30 - (hourlyDistribution[2] / 20 || 15)} T 100 ${30 - (hourlyDistribution[5] / 20 || 10)}`}
                                                    fill="none"
                                                    stroke="#10b981"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                                {/* Forecast Dotted Line */}
                                                <Path
                                                    d={`M 100 ${30 - (hourlyDistribution[5] / 20 || 10)} L 140 ${30 - (percentage * 20)}`}
                                                    fill="none"
                                                    stroke="#10b981"
                                                    strokeWidth="2"
                                                    strokeDasharray="4 4"
                                                    opacity={0.4}
                                                />
                                            </Svg>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                                            <View style={{ width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                                <View style={{ width: `${percentage * 100}%`, height: '100%', backgroundColor: '#10b981' }} />
                                            </View>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748b' }}>{Math.round(percentage * 100)}% {t('fuelLabel')}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={[styles.ringContainer, { padding: 10 }]}>
                                    <TourTarget id="progress_rings" style={StyleSheet.absoluteFill} />
                                    <Svg width={140} height={140} viewBox="0 0 140 140">
                                        <Defs>
                                            <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <Stop offset="0%" stopColor="#10b981" />
                                                <Stop offset="100%" stopColor="#34d399" />
                                            </SvgGradient>
                                            <SvgGradient id="qualityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <Stop offset="0%" stopColor="#3b82f6" />
                                                <Stop offset="100%" stopColor="#60a5fa" />
                                            </SvgGradient>
                                        </Defs>

                                        {/* Outer Ring: Quantity (Calories) */}
                                        <Circle cx="70" cy="70" r="60" stroke="rgba(0,0,0,0.03)" strokeWidth="12" fill="none" />
                                        <AnimatedCircle
                                            cx="70" cy="70" r="60"
                                            stroke="url(#ringGrad)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 60}`}
                                            animatedProps={animatedRingProps}
                                            strokeLinecap="round"
                                            transform="rotate(-90 70 70)"
                                        />

                                        {/* Inner Ring: Quality (Health Score) */}
                                        <Circle cx="70" cy="70" r="45" stroke="rgba(0,0,0,0.03)" strokeWidth="8" fill="none" />
                                        <AnimatedCircle
                                            cx="70" cy="70" r="45"
                                            stroke="url(#qualityGrad)"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 45}`}
                                            animatedProps={animatedQualityProps}
                                            strokeLinecap="round"
                                            transform="rotate(-90 70 70)"
                                        />

                                        {/* Center Macro Triangle */}
                                        <AnimatedG animatedProps={animatedGProps}>
                                            <Polygon
                                                points="0,-18 16,10 -16,10"
                                                fill="#1e293b"
                                                opacity={0.1}
                                            />
                                            <Circle r="4" fill="#fb923c" cx="0" cy="-18" />
                                            <Circle r="4" fill="#10b981" cx="16" cy="10" />
                                            <Circle r="4" fill="#6366f1" cx="-16" cy="10" />
                                        </AnimatedG>
                                    </Svg>
                                    <TourTarget id="macro_triangle" style={{ position: 'absolute', width: 40, height: 40, top: 60, left: 60 }} />
                                </View>
                            </Animated.View>
                        </TouchableOpacity>
                    </View>

                    {/* NEW: Health Stats Card (Samsung Health Integration) */}
                    <HealthStatsCard refreshTrigger={logs.length} />

                    {/* NEW: Friends Card (Below Health Stats) */}
                    <FriendsCard refreshTrigger={logs.length} />

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
            {/* Macro Detail Modal */}
            <Modal
                visible={!!selectedMacro}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedMacro(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedMacro(null)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{String(selectedMacro)} {t('breakdown')}</Text>
                                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 4 }}>
                                    {language === 'Korean' ? '오늘의 섭취량 분석' : "Today's Intake Analysis"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedMacro(null)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 32, fontWeight: '900', color: '#1e293b', marginBottom: 20 }}>
                            {selectedMacro === 'Calories' ? totals.calories :
                                selectedMacro === 'Carbs' ? totals.carbs :
                                    selectedMacro === 'Protein' ? totals.protein :
                                        totals.fat}
                            <Text style={{ fontSize: 16, color: '#94a3b8', fontWeight: 'bold' }}>
                                {selectedMacro === 'Calories' ? ' kcal' : ' g'}
                            </Text>
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.breakdownList}>
                            {logs
                                .filter(log => {
                                    const today = new Date().toDateString();
                                    return new Date(log.created_at).toDateString() === today;
                                })
                                .map((log) => {
                                    let value = '0';
                                    let totalForMacro = 1; // prevent division by zero

                                    if (selectedMacro === 'Calories') { value = String(log.calories); totalForMacro = totals.calories || 1; }
                                    if (selectedMacro === 'Carbs') { value = String(log.carbs); totalForMacro = totals.carbs || 1; }
                                    if (selectedMacro === 'Protein') { value = String(log.protein); totalForMacro = totals.protein || 1; }
                                    if (selectedMacro === 'Fats') { value = String(log.fat); totalForMacro = totals.fat || 1; }

                                    const numericValue = parseInt(value) || 0;
                                    if (numericValue === 0) return null;

                                    const percentageShare = Math.min((numericValue / totalForMacro), 1);

                                    return (
                                        <TouchableOpacity
                                            key={log.id}
                                            style={styles.breakdownItem}
                                            onPress={() => {
                                                setSelectedMacro(null);
                                                const d = new Date(log.created_at);
                                                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                router.push({
                                                    pathname: '/meal_history',
                                                    params: {
                                                        date: dateStr,
                                                        highlightId: log.id
                                                    }
                                                } as any);
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.breakdownLeft}>
                                                    <View>
                                                        <Text style={styles.breakdownName}>{log.food_name}</Text>
                                                        <Text style={styles.breakdownTime}>
                                                            {new Date(log.created_at).toLocaleTimeString(language === 'Korean' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.breakdownValue}>{numericValue} <Text style={{ fontSize: 12, color: '#94a3b8' }}>{selectedMacro === 'Calories' ? 'kcal' : 'g'}</Text></Text>
                                                </View>
                                                {/* Visual Bar */}
                                                <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 8, width: '100%', overflow: 'hidden' }}>
                                                    <View style={{
                                                        height: '100%',
                                                        width: `${percentageShare * 100}%`,
                                                        backgroundColor:
                                                            selectedMacro === 'Calories' ? '#ef4444' :
                                                                selectedMacro === 'Carbs' ? '#fb923c' :
                                                                    selectedMacro === 'Protein' ? '#10b981' : '#6366f1',
                                                        borderRadius: 3
                                                    }} />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Selection Modal for Log Meal */}
            <Modal
                visible={showLogOptions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogOptions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLogOptions(false)}
                >
                    <View style={[styles.modalContent, { minHeight: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('logMeal')}</Text>
                            <TouchableOpacity onPress={() => setShowLogOptions(false)} style={styles.closeBtn}>
                                <CloseIcon size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 16, marginTop: 10 }}>
                            <TouchableOpacity
                                style={styles.selectionBtn}
                                onPress={() => {
                                    setShowLogOptions(false);
                                    router.push('/analysis');
                                }}
                            >
                                <View style={[styles.selectionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <CameraIcon size={24} color="#10b981" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.selectionTitle}>{t('takePhoto')}</Text>
                                    <Text style={styles.selectionDesc}>{language === 'Korean' ? '카메라로 식단을 촬영하여 분석합니다' : 'Take a photo of your meal to analyze'}</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.selectionBtn}
                                onPress={handlePickImage}
                            >
                                <View style={[styles.selectionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                    <ImageIcon size={24} color="#3b82f6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.selectionTitle}>{t('chooseGallery')}</Text>
                                    <Text style={styles.selectionDesc}>{language === 'Korean' ? '갤러리에서 사진을 선택하여 분석합니다' : 'Select a photo from your library'}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>


        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    avatar: { width: '100%', height: '100%', borderRadius: 27 },
    avatarEmoji: { fontSize: 24 },
    userTextContainer: { marginLeft: 10 },
    dateText: { fontSize: 12, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    greetingText: { fontSize: 16, color: '#1e293b', fontWeight: '700' },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    streakLabel: { fontSize: 12, fontWeight: 'bold', color: '#f97316', marginRight: 6 },
    streakCountBox: { backgroundColor: '#ffedd5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    streakCount: { color: '#ea580c', fontWeight: 'bold', fontSize: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    seeAllText: { fontSize: 13, fontWeight: '700', color: '#10b981' },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    glassCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
    glassCardInner: { padding: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chartMock: { height: 80, width: 60, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    bar: { width: 10, borderRadius: 5 },
    ringContainer: { alignItems: 'center', justifyContent: 'center' },
    ringCenterText: { position: 'absolute', alignItems: 'center' },
    kcalValue: { fontSize: 24, fontWeight: '800', color: '#10b981' },
    kcalTarget: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
    statusBox: { alignItems: 'center' },
    statusIcon: { backgroundColor: '#dcfce7', padding: 10, borderRadius: 16, marginBottom: 4 },
    statusText: { fontSize: 10, color: '#10b981', fontWeight: 'bold' },
    macroRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    macroCard: { flex: 1, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center' },
    macroLabel: { fontSize: 9, color: '#64748b', fontWeight: '800', marginTop: 4 },
    macroValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    macroPercent: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
    mealSlider: { marginHorizontal: -24, paddingLeft: 24 },
    mealCard: { width: 260, height: 140, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginRight: 16, overflow: 'hidden' },
    mealCardContent: { flex: 1, flexDirection: 'row' },
    mealInfo: { flex: 1, padding: 20, justifyContent: 'center' },
    mealType: { fontSize: 10, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
    mealName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    mealKcal: { fontSize: 14, fontWeight: '700', color: '#10b981', marginTop: 2 },
    mealTime: { fontSize: 10, color: '#94a3b8', marginTop: 10 },
    mealImagePlaceholder: { width: 100, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    mealImage: { width: '100%', height: '100%' },
    mealEmoji: { fontSize: 40 },
    addMealCard: { width: 140, height: 140, borderRadius: 32, borderStyle: 'dashed', borderWidth: 2, borderColor: '#94a3b8', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    addIconCircle: { backgroundColor: '#fff', padding: 12, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 5 },
    addMealLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 10 },
    activityCard: { marginBottom: 30 },
    activityInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    activityIcon: { backgroundColor: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 18 },
    activityTextContainer: { flex: 1, marginLeft: 16 },
    activityText: { fontSize: 14, fontWeight: '600', color: '#1e293b', lineHeight: 20 },
    goBtn: { backgroundColor: '#f97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    goBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    navigationWrapper: { position: 'absolute', bottom: 30, left: 24, right: 24, height: 80, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 20 },
    navigationBlur: { flex: 1, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
    navInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
    cameraBtn: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', shadowColor: '#10b981', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10 },
    cameraGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    navItem: { alignItems: 'center', flex: 1 },
    navLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginTop: 4 },
    macroTouch: { flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: 400 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
    closeBtn: { padding: 4 },
    closeBtnText: { fontSize: 24, color: '#64748b', fontWeight: 'bold' },
    breakdownList: { marginTop: 10 },
    breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    breakdownLeft: { flex: 1 },
    breakdownName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    breakdownTime: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    breakdownValue: { fontSize: 18, fontWeight: '800', color: '#10b981' },
    selectionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 16,
    },
    selectionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    selectionDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
});

