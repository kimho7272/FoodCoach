import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useHealth } from '../../src/context/HealthContext';
import { Activity, Moon, Footprints, Weight, ChevronLeft, TrendingUp, Heart } from 'lucide-react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { BlurView } from 'expo-blur';
import { useTranslation } from '../../src/lib/i18n';

const { width } = Dimensions.get('window');

// Mock data for charts (in a real app, this would come from healthService history)
const weeklyStepsMock = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{ data: [6500, 7200, 8100, 5900, 11200, 9500, 7800] }]
};

const sleepTrendMock = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{ data: [6.5, 7.0, 5.8, 7.2, 8.1, 7.5, 6.8] }]
};

export default function HealthDetailsScreen() {
    const { healthData, refreshData } = useHealth();
    const router = useRouter();
    const { t, language } = useTranslation();

    const isSamsung = healthData?.isConnected; // Simplification, ideally we know provider
    const providerName = isSamsung ? "Samsung Health" : "Apple Health";
    const themeColor = isSamsung ? "#3b82f6" : "#f43f5e"; // Blue for Samsung/Health Connect, Red/Pink for Apple

    const [chartParentWidth, setChartParentWidth] = useState(width - 32);

    if (!healthData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No health data available. Please connect first.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const getSleepInsight = (mins: number) => {
        if (mins < 360) return "Your sleep is below recommended levels (6h). Try to wind down earlier.";
        if (mins > 540) return "You slept quite a lot! Make sure you are staying active during the day.";
        return "Your sleep duration is in a healthy range (6-9h). Keep it up!";
    };

    const getStepInsight = (steps: number) => {
        if (steps < 5000) return "You're a bit sedentary today. Try a 10-minute walk!";
        if (steps > 10000) return "Excellent! You hit the 10k step goal.";
        return "Good activity level. A little more walking could hit 10k!";
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <ChevronLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{providerName} Insights</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Readiness Card */}
            {typeof healthData.readinessScore === 'number' && (
                <View style={styles.insightCard}>
                    <View style={[styles.insightIconBox, { backgroundColor: healthData.readinessScore > 50 ? '#ecfdf5' : '#fef2f2' }]}>
                        <Activity size={24} color={healthData.readinessScore > 50 ? '#10b981' : '#ef4444'} />
                    </View>
                    <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>Daily Readiness: {healthData.readinessScore}/100</Text>
                        <Text style={styles.insightText}>
                            {healthData.readinessScore > 80 ? 'Your body is primed for intense activity today.'
                                : healthData.readinessScore > 50 ? 'You are in a maintenance state. Moderate exercise is best.'
                                    : 'Your recovery is low. Focus on rest, hydration, and nutrient-dense meals.'}
                        </Text>
                        <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                                <Text style={{ fontSize: 10, color: '#64748b' }}>Sleep Contribution: 60%</Text>
                            </View>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                                <Text style={{ fontSize: 10, color: '#64748b' }}>Activity Contribution: 40%</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* AI Insight Card */}
            <View style={styles.insightCard}>
                <View style={[styles.insightIconBox, { backgroundColor: `${themeColor}20` }]}>
                    <Activity size={24} color={themeColor} />
                </View>
                <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>Daily Analysis</Text>
                    <Text style={styles.insightText}>
                        {getStepInsight(healthData.steps)} {'\n'}
                        {getSleepInsight(healthData.sleepMinutes)}
                    </Text>
                </View>
            </View>

            {/* Steps Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Footprints size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>Activity & Steps</Text>
                </View>
                <View style={styles.statRow}>
                    <View>
                        <Text style={styles.bigStat}>{healthData.steps.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Steps Today</Text>
                    </View>
                    <View>
                        <Text style={[styles.bigStat, { color: '#f97316' }]}>{healthData.caloriesBurned}</Text>
                        <Text style={styles.statLabel}>Kcal Burned</Text>
                    </View>
                </View>

                {/* Chart */}
                <View style={styles.chartContainer} onLayout={(e) => setChartParentWidth(e.nativeEvent.layout.width)}>
                    <Text style={styles.chartTitle}>Weekly Trend (Mock)</Text>
                    <BarChart
                        data={weeklyStepsMock}
                        width={chartParentWidth}
                        height={180}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                            barPercentage: 0.6,
                        }}
                        style={styles.chart}
                        showBarTops={false}
                        fromZero
                    />
                </View>
            </View>

            {/* Sleep Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Moon size={20} color="#3b82f6" />
                    <Text style={styles.sectionTitle}>Sleep Analysis</Text>
                </View>
                <View style={styles.statRow}>
                    <View>
                        <Text style={[styles.bigStat, { color: '#3b82f6' }]}>{formatDuration(healthData.sleepMinutes)}</Text>
                        <Text style={styles.statLabel}>Total Sleep</Text>
                    </View>
                </View>

                {healthData.sleepStages && (
                    <View style={styles.stagesContainer}>
                        <View style={styles.stageItem}>
                            <View style={[styles.stageBar, { height: 8, width: '100%', backgroundColor: '#e2e8f0', overflow: 'hidden', borderRadius: 4 }]}>
                                <View style={{ width: `${(healthData.sleepStages.deep / healthData.sleepMinutes) * 100}%`, height: '100%', backgroundColor: '#1e3a8a' }} />
                            </View>
                            <Text style={styles.stageLabel}>Deep ({Math.round(healthData.sleepStages.deep)}m)</Text>
                        </View>
                        <View style={styles.stageItem}>
                            <View style={[styles.stageBar, { height: 8, width: '100%', backgroundColor: '#e2e8f0', overflow: 'hidden', borderRadius: 4 }]}>
                                <View style={{ width: `${(healthData.sleepStages.rem / healthData.sleepMinutes) * 100}%`, height: '100%', backgroundColor: '#818cf8' }} />
                            </View>
                            <Text style={styles.stageLabel}>REM ({Math.round(healthData.sleepStages.rem)}m)</Text>
                        </View>
                        <View style={styles.stageItem}>
                            <View style={[styles.stageBar, { height: 8, width: '100%', backgroundColor: '#e2e8f0', overflow: 'hidden', borderRadius: 4 }]}>
                                <View style={{ width: `${(healthData.sleepStages.light / healthData.sleepMinutes) * 100}%`, height: '100%', backgroundColor: '#bfdbfe' }} />
                            </View>
                            <Text style={styles.stageLabel}>Light ({Math.round(healthData.sleepStages.light)}m)</Text>
                        </View>
                    </View>
                )}

                {/* Chart */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Sleep Duration Trend (Hours)</Text>
                    <LineChart
                        data={sleepTrendMock}
                        width={chartParentWidth}
                        height={180}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: "#3b82f6"
                            }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>
            </View>

            {/* Weight Section */}
            {healthData.weight && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Weight size={20} color="#64748b" />
                        <Text style={styles.sectionTitle}>Body Measurements</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={[styles.bigStat, { color: '#475569' }]}>{healthData.weight} kg</Text>
                    </View>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 100,
        fontSize: 16,
        color: '#64748b',
    },
    backButton: {
        alignSelf: 'center',
        marginTop: 20,
        padding: 12,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    insightCard: {
        margin: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        flexDirection: 'row',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    insightIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    insightText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statRow: {
        flexDirection: 'row',
        gap: 32,
        marginBottom: 16,
    },
    bigStat: {
        fontSize: 28,
        fontWeight: '800',
        color: '#10b981',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 4,
    },
    chartContainer: {
        marginTop: 8,
    },
    chartTitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    chart: {
        borderRadius: 16,
        paddingRight: 40, // Chart kit needs padding
    },
    stagesContainer: {
        gap: 12,
        marginBottom: 16,
    },
    stageItem: {},
    stageBar: {
        marginBottom: 4,
    },
    stageLabel: {
        fontSize: 12,
        color: '#64748b',
    },
});
