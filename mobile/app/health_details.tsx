import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp, Flame, Zap, BarChart2, Calendar, Utensils, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect } from 'react-native-svg';
import { supabase } from '../src/lib/supabase';
import { getWeeklyStats } from '../src/lib/meal_service';

const { width } = Dimensions.get('window');

const AnalysisCard = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: any }) => (
    <View style={{ backgroundColor: '#1e293b', borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 12, marginRight: 12 }}>
                <Icon size={18} color="#10b981" />
            </View>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{title}</Text>
        </View>
        {children}
    </View>
);

export default function HealthDetailsScreen() {
    const router = useRouter();
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
                console.error('Failed to load health details:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    // Calculation for Weekday vs Weekend
    const weekendLabels = ['Sat', 'Sun'];
    const weekdayTrends = weeklyData.trends.filter((t: any) => !weekendLabels.includes(t.label));
    const weekendTrends = weeklyData.trends.filter((t: any) => weekendLabels.includes(t.label));

    const avgWeekdayScore = weekdayTrends.length > 0
        ? (weekdayTrends.reduce((acc: number, t: any) => acc + t.avgScore, 0) / weekdayTrends.length).toFixed(1)
        : "N/A";
    const avgWeekendScore = weekendTrends.length > 0
        ? (weekendTrends.reduce((acc: number, t: any) => acc + t.avgScore, 0) / weekendTrends.length).toFixed(1)
        : "N/A";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <ChevronLeft color="white" size={28} />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Health Deep Dive</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {/* Score vs Calorie Correlation */}
                <AnalysisCard title="Correlation: Score vs Calories" icon={TrendingUp}>
                    <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
                        How your health score relates to your daily energy intake.
                    </Text>
                    <View style={{ height: 180, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 20 }}>
                        {weeklyData.trends.map((day: any, i: number) => {
                            const scoreHeight = (day.avgScore / 10) * 140;
                            const calHeight = Math.min((day.totalCalories / 2500) * 140, 140);
                            return (
                                <View key={i} style={{ alignItems: 'center', width: (width - 100) / 7 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                                        <View style={{ width: 6, height: scoreHeight, backgroundColor: '#10b981', borderRadius: 3 }} />
                                        <View style={{ width: 6, height: calHeight, backgroundColor: '#3b82f6', borderRadius: 3, opacity: 0.5 }} />
                                    </View>
                                    <Text style={{ color: '#64748b', fontSize: 10, marginTop: 8 }}>{day.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' }} />
                            <Text style={{ color: 'white', fontSize: 12 }}>Health Score</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6', opacity: 0.5 }} />
                            <Text style={{ color: 'white', fontSize: 12 }}>Calories</Text>
                        </View>
                    </View>
                </AnalysisCard>

                {/* Weekday vs Weekend Analysis */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                    <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 24, padding: 20 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>WEEKDAY AVG</Text>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{avgWeekdayScore}</Text>
                        <View style={{ height: 4, backgroundColor: '#10b981', borderRadius: 2, marginTop: 8, width: '80%' }} />
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 24, padding: 20 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>WEEKEND AVG</Text>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{avgWeekendScore}</Text>
                        <View style={{ height: 4, backgroundColor: '#f59e0b', borderRadius: 2, marginTop: 8, width: '60%' }} />
                    </View>
                </View>

                {/* AI Verdict */}
                <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    style={{ borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Zap size={20} color="#10b981" />
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>AI Behavioral Verdict</Text>
                    </View>
                    <Text style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 22 }}>
                        {parseFloat(avgWeekendScore as string) < parseFloat(avgWeekdayScore as string)
                            ? "Your health scores tend to dip by " + (parseFloat(avgWeekdayScore as string) - parseFloat(avgWeekendScore as string)).toFixed(1) + " points during the weekend. Focus on pre-planning your Saturday meals for better consistency."
                            : "Excellent consistency! You maintain a steady health performance regardless of the day. You're building a sustainable lifestyle."}
                    </Text>
                </LinearGradient>

                {/* Meal Type Performance */}
                <AnalysisCard title="Performance by Meal Type" icon={Utensils}>
                    <View style={{ gap: 16 }}>
                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => {
                            const typeLogs = (weeklyData.raw || []).filter((l: any) => l.meal_type === type);
                            const avgScore = typeLogs.length > 0
                                ? (typeLogs.reduce((acc: number, l: any) => acc + (l.health_score || 0), 0) / typeLogs.length).toFixed(1)
                                : "0.0";
                            const percentage = (parseFloat(avgScore) / 10) * 100;

                            return (
                                <View key={type} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ color: '#94a3b8', fontSize: 14 }}>{type}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{ width: 120, height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                                            <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: parseFloat(avgScore) >= 7 ? '#10b981' : '#f59e0b' }} />
                                        </View>
                                        <Text style={{ color: 'white', fontWeight: 'bold', minWidth: 32, textAlign: 'right' }}>{avgScore}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </AnalysisCard>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
