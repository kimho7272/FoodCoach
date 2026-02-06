import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, StyleSheet, BackHandler, Alert, Modal } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Plus, TrendingUp, Zap, Settings, Heart, BarChart2, Camera, Activity, Award, ShieldCheck } from 'lucide-react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, Polygon, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring, withTiming, withRepeat, withSequence, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { supabase } from '../../src/lib/supabase';
import { useTranslation } from '../../src/lib/i18n';
import { useTour } from '../../src/context/TourContext';
import { TourTarget } from '../../src/components/TourTarget';

const { width, height } = Dimensions.get('window');

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <BlurView intensity={60} tint="light" style={[styles.glassCard, style]}>
        <View style={styles.glassCardInner}>
            {children}
        </View>
    </BlurView>
);

import { runProactiveAgent } from '../../src/lib/proactive_agent';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export default function HomeScreen() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const { t, language } = useTranslation();
    const { registerTarget } = useTour();
    const [logs, setLogs] = useState<any[]>([]);
    const [totals, setTotals] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0, healthScore: 0 });
    const [hourlyDistribution, setHourlyDistribution] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMacro, setSelectedMacro] = useState<string | null>(null);

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

                setLogs(mealLogs || []);

                // Calculate today's totals
                const today = new Date().toDateString();
                const todayLogs = (mealLogs || []).filter(log => new Date(log.created_at).toDateString() === today);

                const stats = todayLogs.reduce((acc, log) => {
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

                // Update Animations
                const targetKcal = userProfile?.target_calories || 2000;
                readinessProgress.value = withSpring(Math.min(stats.calories / targetKcal, 1.2), { damping: 15 });

                const avgHealth = todayLogs.length > 0 ? todayLogs.reduce((a, b) => a + (b.health_score || 0), 0) / todayLogs.length : 0;
                qualityProgress.value = withSpring(avgHealth / 10, { damping: 12 });

                triangleScale.value = withSpring(todayLogs.length > 0 ? 1 : 0);

                // Macro Balance Tilt
                const totalMacros = stats.protein + stats.carbs + stats.fat || 1;
                const balanceTilt = (stats.protein / totalMacros) - (stats.carbs / totalMacros);
                triangleRotation.value = withSpring(balanceTilt * 30);

                // Calculate hourly distribution (6am - 12am)
                const distribution = Array(6).fill(0); // 4-hour slots: 6-10, 10-14, 14-18, 18-22, 22-02
                todayLogs.forEach(log => {
                    const hour = new Date(log.created_at).getHours();
                    const slot = Math.floor((hour - 6) / 4);
                    if (slot >= 0 && slot < 6) {
                        distribution[slot] += log.calories || 0;
                    }
                });
                setHourlyDistribution(distribution);

                // Trigger Proactive Agent
                await runProactiveAgent();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

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
                            <View style={styles.avatarContainer}>
                                {userProfile?.avatar_url ? (
                                    <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar as any} />
                                ) : (
                                    <Text style={styles.avatarEmoji}>👦</Text>
                                )}
                            </View>
                            <View style={styles.userTextContainer}>
                                <Text style={styles.dateText}>{new Date().toLocaleDateString(language === 'Korean' ? 'ko-KR' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                                <Text style={styles.greetingText}>
                                    {t('hello')}, {userProfile?.nickname || userProfile?.full_name?.split(' ')[0] || (language === 'Korean' ? '친구' : 'Friend')}{language === 'Korean' ? '님' : ''}!
                                </Text>
                            </View>
                        </View>
                        <BlurView intensity={80} tint="light" style={styles.streakBadge}>
                            <Text style={styles.streakLabel}>🔥 {t('streak')}</Text>
                            <View style={styles.streakCountBox}>
                                <Text style={styles.streakCount}>{logs.length > 0 ? '3' : '0'}</Text>
                            </View>
                        </BlurView>
                    </View>

                    <TouchableOpacity
                        style={styles.sectionHeader}
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
                            <Text style={[styles.sectionTitle, { fontSize: 28, color: '#0f172a' }]}>{getHeadline()}</Text>
                        </View>
                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#059669' }}>{t('gradeLabel')}: {totals.healthScore >= 8 ? 'S' : totals.healthScore >= 6 ? 'A' : 'B'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Main Extreme Hero Card */}
                    <GlassCard style={[styles.summaryCard, { paddingVertical: 10 }]}>
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
                                                    fill="rgba(16, 185, 129, 0.1)"
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

                                <TourTarget id="progress_rings" style={[styles.ringContainer, { padding: 10 }]}>
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
                                        <TourTarget id="macro_triangle">
                                            <AnimatedG animatedProps={animatedGProps}>
                                                <Polygon
                                                    points="0,-18 16,10 -16,10"
                                                    fill="#1e293b"
                                                    opacity={0.1}
                                                />
                                                <Circle r="4" fill="#fb923c" cx="0" cy="-18" /> {/* Carbs */}
                                                <Circle r="4" fill="#10b981" cx="16" cy="10" />  {/* Protein */}
                                                <Circle r="4" fill="#6366f1" cx="-16" cy="10" /> {/* Fat */}
                                            </AnimatedG>
                                        </TourTarget>
                                    </Svg>
                                </TourTarget>
                            </Animated.View>
                        </TouchableOpacity>
                    </GlassCard>



                    {/* Macro Cards */}
                    <View style={styles.macroRow}>
                        <TouchableOpacity
                            style={styles.macroTouch}
                            onPress={() => setSelectedMacro('Carbs')}
                        >
                            <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(251, 146, 60, 0.1)' }]}>
                                <BarChart2 size={16} color="#fb923c" />
                                <Text style={styles.macroLabel}>{t('carbs')}</Text>
                                <Text style={styles.macroValue}>{totals.carbs}g</Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.macroTouch}
                            onPress={() => setSelectedMacro('Protein')}
                        >
                            <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Zap size={16} color="#10b981" />
                                <Text style={styles.macroLabel}>{t('protein')}</Text>
                                <Text style={styles.macroValue}>{totals.protein}g</Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.macroTouch}
                            onPress={() => setSelectedMacro('Fats')}
                        >
                            <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <Flame size={16} color="#6366f1" />
                                <Text style={styles.macroLabel}>{t('fat')}</Text>
                                <Text style={styles.macroValue}>{totals.fat}g</Text>
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                        <Text style={styles.sectionTitle}>{t('yourMealsToday')}</Text>
                        <TouchableOpacity onPress={() => router.push('/meal_history' as any)}>
                            <Text style={styles.seeAllText}>{t('viewAll')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Meal Slider */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealSlider} contentContainerStyle={{ paddingRight: 20 }}>
                        <TourTarget id="log_food_area">
                            <TouchableOpacity
                                style={styles.addMealCard}
                                onPress={() => router.push('/(tabs)/analysis' as any)}
                            >
                                <View style={styles.addIconCircle}>
                                    <Plus size={24} color="#64748b" />
                                </View>
                                <Text style={styles.addMealLabel}>{t('logMeal')}</Text>
                            </TouchableOpacity>
                        </TourTarget>

                        {logs.slice(0, 5).map((meal, idx) => (
                            <View key={meal.id} style={styles.mealCard}>
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
                            </View>
                        ))}
                    </ScrollView>

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
                            <Text style={styles.modalTitle}>{String(selectedMacro)} {t('breakdown')}</Text>
                            <TouchableOpacity onPress={() => setSelectedMacro(null)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.breakdownList}>
                            {logs
                                .filter(log => {
                                    const today = new Date().toDateString();
                                    return new Date(log.created_at).toDateString() === today;
                                })
                                .map((log) => {
                                    let value = '0';
                                    if (selectedMacro === 'Carbs') value = String(log.carbs);
                                    if (selectedMacro === 'Protein') value = String(log.protein);
                                    if (selectedMacro === 'Fats') value = String(log.fat);

                                    if (parseInt(value) === 0) return null;

                                    return (
                                        <View key={log.id} style={styles.breakdownItem}>
                                            <View style={styles.breakdownLeft}>
                                                <Text style={styles.breakdownName}>{log.food_name}</Text>
                                                <Text style={styles.breakdownTime}>
                                                    {new Date(log.created_at).toLocaleTimeString(language === 'Korean' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            <Text style={styles.breakdownValue}>{parseInt(value) || 0}g</Text>
                                        </View>
                                    );
                                })}
                        </ScrollView>
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
        marginBottom: 30,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
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
    avatarEmoji: { fontSize: 28 },
    userTextContainer: { marginLeft: 12 },
    dateText: { fontSize: 12, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    greetingText: { fontSize: 17, color: '#1e293b', fontWeight: '700' },
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
    sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    seeAllText: { fontSize: 14, fontWeight: '700', color: '#10b981' },
    summaryCard: { marginBottom: 20, shadowColor: '#10b981', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
    glassCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
    glassCardInner: { padding: 24 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chartMock: { height: 80, width: 60, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    bar: { width: 10, borderRadius: 5 },
    ringContainer: { alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
    ringCenterText: { position: 'absolute', alignItems: 'center' },
    kcalValue: { fontSize: 24, fontWeight: '800', color: '#10b981' },
    kcalTarget: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
    statusBox: { alignItems: 'center' },
    statusIcon: { backgroundColor: '#dcfce7', padding: 10, borderRadius: 16, marginBottom: 4 },
    statusText: { fontSize: 10, color: '#10b981', fontWeight: 'bold' },
    macroRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
    macroCard: { flex: 1, padding: 15, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center' },
    macroLabel: { fontSize: 10, color: '#64748b', fontWeight: '800', marginTop: 4 },
    macroValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
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
});

