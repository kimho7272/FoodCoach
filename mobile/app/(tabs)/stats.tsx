import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, PieChart, Utensils, Flame, Zap, BarChart2, TrendingUp, Info, Heart, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path } from 'react-native-svg';
import { supabase } from '../../src/lib/supabase';
import { getMealLogs, getWeeklyStats } from '../../src/lib/meal_service';
import { useTranslation } from '../../src/lib/i18n';
import { theme } from '../../src/constants/theme';

import { TourTarget } from '../../src/components/TourTarget';

const { width } = Dimensions.get('window');

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <BlurView intensity={40} tint="light" style={[styles.glassCard, style]}>
        <View style={{ padding: 20 }}>
            {children}
        </View>
    </BlurView>
);

export default function StatsScreen() {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [weeklyData, setWeeklyData] = useState<any>({ trends: [], diversity: 0 });
    const [totals, setTotals] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0 });

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: todayData } = await getMealLogs(user.id);
            const today = new Date().toDateString();
            const filteredToday = (todayData || []).filter((l: any) => new Date(l.created_at).toDateString() === today);

            // Respect Custom Order (Same logic as Meal History)
            const orderKey = `meal_order_${user.id}_${today}`;
            const savedOrder = await AsyncStorage.getItem(orderKey);

            let sortedLogs = [...filteredToday];
            if (savedOrder) {
                const idOrder = JSON.parse(savedOrder);
                sortedLogs.sort((a, b) => {
                    const idxA = idOrder.indexOf(a.id);
                    const idxB = idOrder.indexOf(b.id);
                    if (idxA === -1 && idxB === -1) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    if (idxA === -1) return -1;
                    if (idxB === -1) return 1;
                    return idxA - idxB;
                });
            } else {
                sortedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }

            setLogs(sortedLogs);

            const calc = sortedLogs.reduce((acc: any, log: any) => {
                acc.calories += log.calories || 0;
                acc.protein += parseInt(log.protein) || 0;
                acc.carbs += parseInt(log.carbs) || 0;
                acc.fat += parseInt(log.fat) || 0;
                acc.health_score += log.health_score || 0;
                return acc;
            }, { protein: 0, carbs: 0, fat: 0, calories: 0, health_score: 0 });
            setTotals(calc);

            // Weekly Stats
            const weekly = await getWeeklyStats(user.id);
            setWeeklyData(weekly);

        } catch (error) {
            console.error('Stats fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const totalMacros = totals.protein + totals.carbs + totals.fat || 1;
    const macroPercentages = {
        protein: Math.round((totals.protein / totalMacros) * 100),
        carbs: Math.round((totals.carbs / totalMacros) * 100),
        fat: Math.round((totals.fat / totalMacros) * 100),
    };

    // AI Highlight Generator
    const getDynamicHighlight = () => {
        // 1. Check for Streaks (Health Score >= 7)
        let streak = 0;
        const sortedTrends = [...weeklyData.trends].reverse();
        for (const day of sortedTrends) {
            if (day.avgScore >= 7) streak++;
            else break;
        }

        if (streak >= 3) {
            return {
                title: t('consistencyKing'),
                value: `${streak} ${t('days')} ${t('streak')}`,
                message: language === 'Korean' ? `${streak}일 연속으로 높은 건강 점수를 유지하고 계시네요! 멋집니다.` : `You've maintained a high health score for ${streak} consecutive days!`,
                icon: <Award color="white" size={24} />,
                colors: theme.colors.gradients.primary as [string, string]
            };
        }

        // 2. Check for Diversity Milestone
        if (weeklyData.diversity >= 10) {
            return {
                title: t('foodExplorer'),
                value: `${weeklyData.diversity} ${t('itemsReached')}`,
                message: language === 'Korean' ? `대단해요! 이번 주에 10가지 이상의 다양한 음식을 섭취하셨습니다.` : "Great job! You've tried over 10 different types of food this week.",
                icon: <Zap color="white" size={24} />,
                colors: theme.colors.gradients.secondary as [string, string]
            };
        }

        // 3. Macro Balance Insight
        if (totals.protein > totals.fat && totals.protein > 30) {
            return {
                title: t('muscleFuel'),
                value: t('protein'),
                message: language === 'Korean' ? "오늘 단백질 섭취가 아주 훌륭합니다! 근육 회복에 큰 도움이 될 거예요." : "Excellent protein intake today! Your muscles will thank you for this recovery fuel.",
                icon: <TrendingUp color="white" size={24} />,
                colors: theme.colors.gradients.primary as [string, string]
            };
        }

        // Default: General Motivation
        return {
            title: t('dailyProgress'),
            value: t('active'),
            message: language === 'Korean' ? "식단을 더 많이 분석할수록 더 깊은 AI 통계를 확인하실 수 있습니다." : "Analyze more meals to unlock deeper AI insights into your health journey.",
            icon: <Heart color="white" size={24} />,
            colors: theme.colors.gradients.primary as [string, string]
        };
    };

    const highlight = getDynamicHighlight();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={theme.colors.gradients.background as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 24 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                >
                    <View style={{ marginBottom: 32 }}>
                        <Text style={styles.headerTitle}>{t('healthIntelligence')}</Text>
                        <Text style={styles.headerSubtitle}>{t('nutritionalPatterns')}</Text>
                    </View>

                    {/* Main Dynamic Highlight Card */}
                    <TourTarget id="stats_highlight">
                        <LinearGradient
                            colors={highlight.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.highlightCard}
                        >
                            <View style={styles.highlightHeader}>
                                <View style={styles.highlightIconBox}>
                                    {highlight.icon}
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.highlightLabel}>{highlight.title}</Text>
                                    <Text style={styles.highlightValue}>{highlight.value}</Text>
                                </View>
                            </View>
                            <Text style={styles.highlightMessage}>
                                {highlight.message}
                            </Text>
                        </LinearGradient>
                    </TourTarget>

                    <View style={styles.gridRow}>
                        {/* Health Score Trend - Clickable for details */}
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => router.push('/health_details')}
                        >
                            <TourTarget id="stats_trend">
                                <GlassCard>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{t('healthTrend')}</Text>
                                        <TrendingUp color={theme.colors.primary} size={14} />
                                    </View>
                                    <View style={styles.trendRow}>
                                        {weeklyData.trends.length > 0 ? (
                                            weeklyData.trends.map((day: any, i: number) => (
                                                <View key={i} style={{ alignItems: 'center' }}>
                                                    <View style={[
                                                        styles.trendBar,
                                                        {
                                                            height: `${Math.max(day.avgScore * 10, 5)}%`,
                                                            backgroundColor: i === weeklyData.trends.length - 1 ? theme.colors.primary : 'rgba(16, 185, 129, 0.2)'
                                                        }
                                                    ]} />
                                                    <Text style={styles.trendLabel}>{day.label}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            [4, 6, 8, 5, 9, 7, 8].map((v, i) => (
                                                <View key={i} style={[styles.trendBar, { width: 8, height: `${v * 10}%`, backgroundColor: 'rgba(148, 163, 184, 0.1)' }]} />
                                            ))
                                        )}
                                    </View>
                                    <Text style={styles.cardFooterText}>
                                        {weeklyData.trends.length > 3 ? t('detailedAnalysis') : t('stabilizing')}
                                    </Text>
                                </GlassCard>
                            </TourTarget>
                        </TouchableOpacity>

                        {/* Diversity Meter - Clickable for details */}
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => router.push('/diversity_details')}
                        >
                            <TourTarget id="stats_diversity">
                                <GlassCard>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{t('diversity')}</Text>
                                        <Zap color={theme.colors.secondary} size={14} />
                                    </View>
                                    <View style={styles.diversityContainer}>
                                        <Svg width={80} height={80}>
                                            <Circle cx={40} cy={40} r={35} stroke="rgba(255,255,255,0.05)" strokeWidth={8} fill="none" />
                                            <Circle
                                                cx={40} cy={40} r={35} stroke={theme.colors.secondary} strokeWidth={8} fill="none"
                                                strokeDasharray={220} strokeDashoffset={220 * (1 - Math.min(weeklyData.diversity / 20, 1))}
                                                strokeLinecap="round"
                                            />
                                        </Svg>
                                        <Text style={styles.diversityValueText}>{weeklyData.diversity}</Text>
                                    </View>
                                    <Text style={[styles.cardFooterText, { textAlign: 'center' }]}>{t('uniqueItems')}</Text>
                                </GlassCard>
                            </TourTarget>
                        </TouchableOpacity>
                    </View>

                    {/* AI Coach Insight */}
                    <BlurView intensity={20} tint="light" style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <Heart color={theme.colors.primary} size={16} fill={theme.colors.primary} />
                            <Text style={styles.insightLabelText}>{t('coachInsight')}</Text>
                        </View>
                        <Text style={styles.insightMessage}>
                            {getDynamicHighlight().message}
                        </Text>
                    </BlurView>

                    {/* Recent History Header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('todayTimeline')}</Text>
                        <BarChart2 color={theme.colors.primary} size={20} />
                    </View>

                    {logs.length === 0 ? (
                        <BlurView intensity={10} tint="light" style={styles.emptyContainer}>
                            <Utensils size={40} color={theme.colors.text.muted} />
                            <Text style={styles.emptyText}>{t('noFuelLogged')}</Text>
                        </BlurView>
                    ) : (
                        logs.map((log) => (
                            <TouchableOpacity
                                key={log.id}
                                style={styles.logItem}
                                onPress={() => {
                                    const localDate = new Date();
                                    const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                                    router.push({
                                        pathname: '/meal_history',
                                        params: { date: dateStr, highlightId: log.id }
                                    });
                                }}
                            >
                                <View style={styles.logImageWrapper}>
                                    {log.image_url ? (
                                        <Image source={{ uri: log.image_url }} style={styles.logImage} />
                                    ) : (
                                        <View style={styles.logEmojiWrapper}>
                                            <Text style={{ fontSize: 24 }}>🍱</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.logInfo}>
                                    <Text style={styles.logFoodName} numberOfLines={1}>{log.food_name}</Text>
                                    <View style={styles.logMeta}>
                                        <View style={[styles.healthDot, { backgroundColor: log.health_score >= 7 ? theme.colors.primary : theme.colors.accent }]} />
                                        <Text style={styles.logMetaText}>{t(log.meal_type.toLowerCase() as any)} • {log.calories} kcal</Text>
                                    </View>
                                </View>
                                <View style={styles.scoreBadgeInner}>
                                    <Text style={styles.scoreBadgeValue}>{log.health_score}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    safeArea: { flex: 1 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: theme.colors.text.primary, letterSpacing: -1 },
    headerSubtitle: { color: theme.colors.text.secondary, marginTop: 4 },
    highlightCard: { borderRadius: 32, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    highlightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    highlightIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 16 },
    highlightLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    highlightValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    highlightMessage: { color: 'white', fontSize: 20, fontWeight: 'bold', lineHeight: 28 },
    gridRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    glassCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border, backgroundColor: theme.colors.glass.card },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { color: theme.colors.text.secondary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    trendRow: { height: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    trendBar: { width: 8, borderRadius: 4 },
    trendLabel: { color: theme.colors.text.muted, fontSize: 8, marginTop: 4 },
    cardFooterText: { color: theme.colors.text.primary, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
    diversityContainer: { alignItems: 'center', justifyContent: 'center', height: 100 },
    diversityValueText: { position: 'absolute', color: theme.colors.text.primary, fontWeight: 'bold', fontSize: 20 },
    insightCard: { borderLeftWidth: 4, borderLeftColor: theme.colors.primary, padding: 20, borderRadius: 16, marginBottom: 32, backgroundColor: 'rgba(30, 41, 59, 0.3)' },
    insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    insightLabelText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12, marginLeft: 8, textTransform: 'uppercase' },
    insightMessage: { color: theme.colors.text.primary, fontSize: 15, lineHeight: 22 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text.primary },
    emptyContainer: { padding: 40, borderRadius: 32, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.text.muted },
    emptyText: { color: theme.colors.text.muted, marginTop: 16, textAlign: 'center', fontWeight: 'bold' },
    logItem: { backgroundColor: theme.colors.glass.card, padding: 16, borderRadius: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    logImageWrapper: { width: 60, height: 60, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.background.primary },
    logImage: { width: '100%', height: '100%' },
    logEmojiWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logInfo: { flex: 1, marginLeft: 16 },
    logFoodName: { color: theme.colors.text.primary, fontWeight: 'bold', fontSize: 16 },
    logMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    healthDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    logMetaText: { color: theme.colors.text.secondary, fontSize: 12 },
    scoreBadgeInner: { backgroundColor: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    scoreBadgeValue: { color: theme.colors.primary, fontWeight: 'bold' }
});
