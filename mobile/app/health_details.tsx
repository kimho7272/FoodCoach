import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp, Zap, Utensils, Award, Target, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../src/lib/supabase';
import { getWeeklyStats } from '../src/lib/meal_service';
import { theme } from '../src/constants/theme';
import { useTranslation } from '../src/lib/i18n';

const { width } = Dimensions.get('window');

const AnalysisCard = ({ title, children, icon: Icon, color }: { title: string, children: React.ReactNode, icon: any, color?: string }) => {
    const { t } = useTranslation();
    return (
        <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: `${color || theme.colors.primary}15` }]}>
                    <Icon size={18} color={color || theme.colors.primary} />
                </View>
                <Text style={styles.cardTitle}>{t(title as any) || title}</Text>
            </View>
            {children}
        </BlurView>
    );
};

export default function HealthDetailsScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const data = await getWeeklyStats(user.id);
                    setWeeklyData(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading || !weeklyData) {
        return (
            <View style={styles.loading}>
                <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const weekendLabels = ['Sat', 'Sun'];
    const weekdayTrends = weeklyData.trends.filter((t: any) => !weekendLabels.includes(t.label));
    const weekendTrends = weeklyData.trends.filter((t: any) => weekendLabels.includes(t.label));

    const avgWeekdayScore = weekdayTrends.length > 0
        ? (weekdayTrends.reduce((acc: number, t: any) => acc + t.avgScore, 0) / weekdayTrends.length).toFixed(1)
        : "0.0";
    const avgWeekendScore = weekendTrends.length > 0
        ? (weekendTrends.reduce((acc: number, t: any) => acc + t.avgScore, 0) / weekendTrends.length).toFixed(1)
        : "0.0";

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                            <ChevronLeft color={theme.colors.text.primary} size={24} />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('healthIntelligence')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Correlation Chart Card */}
                    <AnalysisCard title={t('quantityVsQuality')} icon={TrendingUp} color={theme.colors.secondary}>
                        <Text style={styles.cardSub}>{t('correlationDesc')}</Text>
                        <View style={styles.chartArea}>
                            {weeklyData.trends.map((day: any, i: number) => {
                                const scoreH = (day.avgScore / 10) * 120;
                                const calH = Math.min((day.totalCalories / 2500) * 120, 120);
                                return (
                                    <View key={i} style={styles.chartCol}>
                                        <View style={styles.barPair}>
                                            <View style={[styles.bar, { height: scoreH, backgroundColor: theme.colors.primary }]} />
                                            <View style={[styles.bar, { height: calH, backgroundColor: theme.colors.secondary, opacity: 0.5 }]} />
                                        </View>
                                        <Text style={styles.chartLabel}>{day.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.legend}>
                            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: theme.colors.primary }]} /><Text style={styles.legendText}>{t('score')}</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: theme.colors.secondary, opacity: 0.5 }]} /><Text style={styles.legendText}>{t('kcal')}</Text></View>
                        </View>
                    </AnalysisCard>

                    {/* Comparative Analysis */}
                    <View style={styles.statsRow}>
                        <BlurView intensity={30} tint="light" style={styles.statBox}>
                            <Text style={styles.statLabel}>{t('weekdayAvg')}</Text>
                            <Text style={styles.statVal}>{avgWeekdayScore}</Text>
                            <View style={styles.statBar}><View style={[styles.statFill, { width: `${parseFloat(avgWeekdayScore) * 10}%`, backgroundColor: theme.colors.primary }]} /></View>
                        </BlurView>
                        <BlurView intensity={30} tint="light" style={styles.statBox}>
                            <Text style={styles.statLabel}>{t('weekendAvg')}</Text>
                            <Text style={styles.statVal}>{avgWeekendScore}</Text>
                            <View style={styles.statBar}><View style={[styles.statFill, { width: `${parseFloat(avgWeekendScore) * 10}%`, backgroundColor: theme.colors.secondary }]} /></View>
                        </BlurView>
                    </View>

                    {/* Behavioral Verdict */}
                    <LinearGradient colors={theme.colors.gradients.primary as any} style={styles.verdictCard}>
                        <View style={styles.verdictHead}>
                            <Zap size={20} color={theme.colors.text.inverse} />
                            <Text style={styles.verdictTitle}>{t('behavioralVerdict')}</Text>
                        </View>
                        <Text style={styles.verdictText}>
                            {parseFloat(avgWeekendScore) < parseFloat(avgWeekdayScore)
                                ? t('weekendDipAdvice').replace('%{points}', (parseFloat(avgWeekdayScore) - parseFloat(avgWeekendScore)).toFixed(1))
                                : t('consistencyAdvice')}
                        </Text>
                    </LinearGradient>

                    {/* Meal Performance */}
                    <AnalysisCard title={t('strategicPerformance')} icon={Utensils} color={theme.colors.accent}>
                        <View style={styles.mealList}>
                            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => {
                                const typeLogs = (weeklyData.raw || []).filter((l: any) => l.meal_type === type);
                                const avgS = typeLogs.length > 0 ? (typeLogs.reduce((acc: number, l: any) => acc + (l.health_score || 0), 0) / typeLogs.length).toFixed(1) : "0.0";
                                const per = (parseFloat(avgS) / 10) * 100;
                                return (
                                    <View key={type} style={styles.mealRow}>
                                        <Text style={styles.mealName}>{t(type.toLowerCase() as any)}</Text>
                                        <View style={styles.mealProgressArea}>
                                            <View style={styles.mealTrack}><View style={[styles.mealFill, { width: `${per}%`, backgroundColor: per >= 70 ? theme.colors.primary : theme.colors.secondary }]} /></View>
                                            <Text style={styles.mealScore}>{avgS}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </AnalysisCard>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    iconBlur: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
    backBtn: {},
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    scroll: { padding: 24, paddingTop: 12 },
    card: { borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    cardIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text.primary },
    cardSub: { fontSize: 13, color: theme.colors.text.muted, marginBottom: 20, lineHeight: 18 },
    chartArea: { height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 10 },
    chartCol: { alignItems: 'center', width: (width - 100) / 7 },
    barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    bar: { width: 6, borderRadius: 3 },
    chartLabel: { fontSize: 10, color: theme.colors.text.muted, marginTop: 8, fontWeight: '700' },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statBox: { flex: 1, borderRadius: 24, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    statLabel: { fontSize: 10, fontWeight: '900', color: theme.colors.text.muted, marginBottom: 8, letterSpacing: 1 },
    statVal: { fontSize: 28, fontWeight: '900', color: theme.colors.text.primary },
    statBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
    statFill: { height: '100%', borderRadius: 2 },
    verdictCard: { padding: 24, borderRadius: 32, marginBottom: 20, elevation: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    verdictHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    verdictTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.inverse },
    verdictText: { fontSize: 14, color: theme.colors.text.inverse, lineHeight: 22, opacity: 0.9 },
    mealList: { gap: 16 },
    mealRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mealName: { fontSize: 14, fontWeight: '700', color: theme.colors.text.secondary },
    mealProgressArea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    mealTrack: { width: 100, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
    mealFill: { height: '100%', borderRadius: 3 },
    mealScore: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary, width: 30, textAlign: 'right' }
});
