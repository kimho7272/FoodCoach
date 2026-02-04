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

export default function HomeScreen() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setUserProfile(data);
            }
        };
        fetchProfile();
    }, []);

    // Prevent back navigation to login screen
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                // Return true to prevent default back action
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => subscription.remove();
        }, [])
    );

    const dailyKcal = 1450;
    const targetKcal = 1800;
    const percentage = dailyKcal / targetKcal;
    const strokeWidth = 12;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    return (
        <View style={styles.container}>
            {/* Dynamic Background */}
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
                                <Text style={styles.dateText}>Tuesday, Feb 3</Text>
                                <Text style={styles.greetingText}>
                                    Hey, {userProfile?.nickname || userProfile?.full_name?.split(' ')[0] || 'Friend'}!
                                </Text>
                            </View>
                        </View>
                        <BlurView intensity={80} tint="light" style={styles.streakBadge}>
                            <Text style={styles.streakLabel}>Streak</Text>
                            <View style={styles.streakCountBox}>
                                <Text style={styles.streakCount}>5</Text>
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
                                    <Text style={styles.kcalValue}>{dailyKcal.toLocaleString()}</Text>
                                    <Text style={styles.kcalTarget}>/ {targetKcal} kcal</Text>
                                </View>
                            </View>

                            <View style={styles.statusBox}>
                                <View style={styles.statusIcon}>
                                    <TrendingUp size={20} color="#10b981" />
                                </View>
                                <Text style={styles.statusText}>On Track</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Macro Cards */}
                    <View style={styles.macroRow}>
                        <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(251, 146, 60, 0.1)' }]}>
                            <BarChart2 size={16} color="#fb923c" />
                            <Text style={styles.macroLabel}>Carbs</Text>
                            <Text style={styles.macroValue}>180g</Text>
                            <Text style={styles.macroPercent}>(40%)</Text>
                        </BlurView>
                        <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Zap size={16} color="#10b981" />
                            <Text style={styles.macroLabel}>Protien</Text>
                            <Text style={styles.macroValue}>92g</Text>
                            <Text style={styles.macroPercent}>(20%)</Text>
                        </BlurView>
                        <BlurView intensity={40} tint="light" style={[styles.macroCard, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                            <Flame size={16} color="#6366f1" />
                            <Text style={styles.macroLabel}>Fats</Text>
                            <Text style={styles.macroValue}>55g</Text>
                            <Text style={styles.macroPercent}>(25%)</Text>
                        </BlurView>
                    </View>

                    <Text style={styles.sectionTitle}>Your Meals Today</Text>

                    {/* Meal Slider */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealSlider} contentContainerStyle={{ paddingRight: 20 }}>
                        <View style={styles.mealCard}>
                            <View style={styles.mealCardContent}>
                                <View style={styles.mealInfo}>
                                    <Text style={styles.mealType}>Lunch</Text>
                                    <Text style={styles.mealName}>Cobb Salad</Text>
                                    <Text style={styles.mealKcal}>420 kcal</Text>
                                    <Text style={styles.mealTime}>🕒 12:30 PM</Text>
                                </View>
                                <View style={styles.mealImagePlaceholder}>
                                    <Text style={styles.mealEmoji}>🥗</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.addMealCard}>
                            <View style={styles.addIconCircle}>
                                <Plus size={24} color="#64748b" />
                            </View>
                            <Text style={styles.addMealLabel}>Log Lunch</Text>
                        </TouchableOpacity>

                        <View style={[styles.mealCard, { opacity: 0.6 }]}>
                            <View style={styles.mealCardContent}>
                                <View style={styles.mealInfo}>
                                    <Text style={styles.mealType}>Dinner</Text>
                                    <Text style={styles.mealName}>Grilled Salmon</Text>
                                    <Text style={styles.mealKcal}>--- kcal</Text>
                                    <Text style={styles.mealTime}>🕒 Pending</Text>
                                </View>
                                <View style={styles.mealImagePlaceholder}>
                                    <Text style={styles.mealEmoji}>🐟</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Activity Exchange */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Activity Exchange</Text>
                    <GlassCard style={styles.activityCard}>
                        <View style={styles.activityInner}>
                            <View style={styles.activityIcon}>
                                <Text style={{ fontSize: 24 }}>🏃‍♂️</Text>
                            </View>
                            <View style={styles.activityTextContainer}>
                                <Text style={styles.activityText}>
                                    Walk 30 min to balance{"\n"}your afternoon snack!
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.goBtn}>
                                <Text style={styles.goBtnTxt}>Go</Text>
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

