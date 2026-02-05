import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, StyleSheet, BackHandler, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Plus, TrendingUp, Zap, Settings, Heart, BarChart2, Camera } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../src/lib/supabase';

const { width, height } = Dimensions.get('window');

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <BlurView intensity={60} tint="light" style={[styles.glassCard, style]}>
        <View style={styles.glassCardInner}>
            {children}
        </View>
    </BlurView>
);

import { runProactiveAgent } from '../../src/lib/proactive_agent';

export default function HomeScreen() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [totals, setTotals] = useState({ protein: '0g', carbs: '0g', fat: '0g', calories: 0 });
    const [loading, setLoading] = useState(true);

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
                    protein: `${stats.protein}g`,
                    carbs: `${stats.carbs}g`,
                    fat: `${stats.fat}g`
                });

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

    const targetKcal = 1800;
    const percentage = Math.min(totals.calories / targetKcal, 1);
    const strokeWidth = 12;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    // AI Insight Generator
    const getInsight = () => {
        if (logs.length === 0) return "Start by scanning your first meal to get personalized AI coaching!";
        const latest = logs[0];
        if (latest.health_score >= 8) return "Legendary choice! That meal was packed with nutrients. Keep the momentum!";
        if (latest.health_score <= 4) return "Your last meal was a bit heavy. Try a light salad or a 20-min walk now.";
        return "Good balance today. Hydrate well and aim for some fiber in your next snack.";
    };

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
                                <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                                <Text style={styles.greetingText}>
                                    Hey, {userProfile?.nickname || userProfile?.full_name?.split(' ')[0] || 'Friend'}!
                                </Text>
                            </View>
                        </View>
                        <BlurView intensity={80} tint="light" style={styles.streakBadge}>
                            <Text style={styles.streakLabel}>🔥 Streak</Text>
                            <View style={styles.streakCountBox}>
                                <Text style={styles.streakCount}>{logs.length > 0 ? '3' : '0'}</Text>
                            </View>
                        </BlurView>
                    </View>

                    <Text style={styles.sectionTitle}>Daily Summary</Text>

                    {/* Main Chart Card */}
                    <GlassCard style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.chartMock}>
                                <View style={[styles.bar, { height: '30%', backgroundColor: '#f87171' }]} />
                                <View style={[styles.bar, { height: '50%', backgroundColor: '#fb923c' }]} />
                                <View style={[styles.bar, { height: '75%', backgroundColor: '#facc15' }]} />
                                <View style={[styles.bar, { height: '95%', backgroundColor: '#34d399' }]} />
                            </View>

                            <View style={styles.ringContainer}>
                                <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
                                    <Circle
                                        cx={radius + strokeWidth / 2}
                                        cy={radius + strokeWidth / 2}
                                        r={radius}
                                        stroke="rgba(255,255,255,0.4)"
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    <Circle
                                        cx={radius + strokeWidth / 2}
                                        cy={radius + strokeWidth / 2}
                                        r={radius}
                                        stroke="#10b981"
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circumference * (1 - percentage)}
                                        strokeLinecap="round"
                                        fill="none"
                                        transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
                                    />
                                </Svg>
                                <View style={styles.ringCenterText}>
                                    <Text style={styles.kcalValue}>{totals.calories.toLocaleString()}</Text>
                                    <Text style={styles.kcalTarget}>/ {targetKcal} kcal</Text>
                                </View>
                            </View>

                            <View style={styles.statusBox}>
                                <View style={styles.statusIcon}>
                                    <TrendingUp size={20} color="#10b981" />
                                </View>
                                <Text style={styles.statusText}>{percentage > 0.8 ? 'Near Target' : 'On Track'}</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Macro Cards */}
                    <View style={styles.macroRow}>
                        <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(251, 146, 60, 0.1)' }]}>
                            <BarChart2 size={16} color="#fb923c" />
                            <Text style={styles.macroLabel}>Carbs</Text>
                            <Text style={styles.macroValue}>{totals.carbs}</Text>
                        </BlurView>
                        <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Zap size={16} color="#10b981" />
                            <Text style={styles.macroLabel}>Protein</Text>
                            <Text style={styles.macroValue}>{totals.protein}</Text>
                        </BlurView>
                        <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                            <Flame size={16} color="#6366f1" />
                            <Text style={styles.macroLabel}>Fats</Text>
                            <Text style={styles.macroValue}>{totals.fat}</Text>
                        </BlurView>
                    </View>

                    <Text style={styles.sectionTitle}>Your Meals Today</Text>

                    {/* Meal Slider */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealSlider} contentContainerStyle={{ paddingRight: 20 }}>
                        {logs.slice(0, 5).map((meal, idx) => (
                            <View key={meal.id} style={styles.mealCard}>
                                <View style={styles.mealCardContent}>
                                    <View style={styles.mealInfo}>
                                        <Text style={styles.mealType}>{meal.meal_type}</Text>
                                        <Text style={styles.mealName} numberOfLines={1}>{meal.food_name}</Text>
                                        <Text style={styles.mealKcal}>{meal.calories} kcal</Text>
                                        <Text style={styles.mealTime}>🕒 {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    <View style={styles.mealImagePlaceholder}>
                                        {meal.image_url ? (
                                            <Image source={{ uri: meal.image_url }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <Text style={styles.mealEmoji}>🍱</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addMealCard}
                            onPress={() => router.push('/(tabs)/analysis' as any)}
                        >
                            <View style={styles.addIconCircle}>
                                <Plus size={24} color="#64748b" />
                            </View>
                            <Text style={styles.addMealLabel}>Log Meal</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Proactive Insight */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>AI Coach Insight</Text>
                    <GlassCard style={styles.activityCard}>
                        <View style={styles.activityInner}>
                            <View style={styles.activityIcon}>
                                <Heart size={24} color="#ef4444" />
                            </View>
                            <View style={styles.activityTextContainer}>
                                <Text style={styles.activityText}>
                                    {getInsight()}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.goBtn}>
                                <Text style={styles.goBtnTxt}>Tip</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Floating Navigation Bar */}
            <View style={styles.navigationWrapper}>
                <BlurView intensity={90} tint="light" style={styles.navigationBlur}>
                    <View style={styles.navInner}>
                        <TouchableOpacity
                            style={styles.cameraBtn}
                            onPress={() => router.push('/(tabs)/analysis' as any)}
                        >
                            <LinearGradient
                                colors={['#34d399', '#10b981']}
                                style={styles.cameraGradient}
                            >
                                <Camera color="white" size={24} />
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem}>
                            <BarChart2 size={24} color="#64748b" />
                            <Text style={styles.navLabel}>Stats</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem}>
                            <Heart size={24} color="#64748b" />
                            <Text style={styles.navLabel}>Coach</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem}>
                            <Settings size={24} color="#64748b" />
                            <Text style={styles.navLabel}>Me</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
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
    sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
    summaryCard: { marginBottom: 20 },
    glassCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
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
    mealImagePlaceholder: { width: 100, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
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
});

