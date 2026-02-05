import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, PieChart, Utensils, Flame } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { getMealLogs } from '../../src/lib/meal_service';

export default function StatsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [totals, setTotals] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0 });

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await getMealLogs(user.id);
            if (error) throw error;

            setLogs(data || []);

            // Calculate totals
            const calc = (data || []).reduce((acc: any, log: any) => {
                acc.calories += log.calories || 0;
                acc.protein += parseInt(log.protein) || 0;
                acc.carbs += parseInt(log.carbs) || 0;
                acc.fat += parseInt(log.fat) || 0;
                return acc;
            }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

            setTotals(calc);
        } catch (error) {
            console.error('Stats fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]">
            <ScrollView
                className="flex-1 px-4 py-6"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
            >
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-white mb-2">My Nutrition</Text>
                    <Text className="text-slate-400">Overview of your meal history and macro balance.</Text>
                </View>

                {/* Daily Total Card */}
                <View className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 mb-6 flex-row items-center justify-between">
                    <View>
                        <Text className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-1">Today's Calories</Text>
                        <View className="flex-row items-baseline">
                            <Text className="text-white text-4xl font-bold">{totals.calories}</Text>
                            <Text className="text-emerald-500/70 ml-2 font-medium">kcal</Text>
                        </View>
                    </View>
                    <View className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-500/50">
                        <Flame color="white" size={32} />
                    </View>
                </View>

                {/* Macro Distribution */}
                <View className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700 mb-8">
                    <Text className="text-lg font-bold text-white mb-6">Macro Distribution</Text>
                    <View className="flex-row items-center gap-6">
                        <View className="w-24 h-24 rounded-full border-[6px] border-[#10b981] justify-center items-center">
                            <PieChart size={24} color="#10b981" />
                        </View>
                        <View className="flex-1 space-y-3">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-2.5 h-2.5 bg-[#10b981] rounded-full mr-2" />
                                    <Text className="text-slate-300">Protein</Text>
                                </View>
                                <Text className="text-white font-bold">{macroPercentages.protein}%</Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-2.5 h-2.5 bg-amber-400 rounded-full mr-2" />
                                    <Text className="text-slate-300">Carbs</Text>
                                </View>
                                <Text className="text-white font-bold">{macroPercentages.carbs}%</Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-2.5 h-2.5 bg-rose-400 rounded-full mr-2" />
                                    <Text className="text-slate-300">Fat</Text>
                                </View>
                                <Text className="text-white font-bold">{macroPercentages.fat}%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recent History */}
                <View className="mb-10">
                    <Text className="text-xl font-bold text-white mb-4">Recent Meals</Text>
                    {logs.length === 0 ? (
                        <View className="bg-[#1e293b]/50 p-10 rounded-3xl border border-dashed border-slate-700 items-center">
                            <Utensils size={40} color="#475569" />
                            <Text className="text-slate-500 mt-4 text-center">No meals logged yet today.</Text>
                        </View>
                    ) : (
                        logs.map((log) => (
                            <View key={log.id} className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 mb-3 flex-row items-center">
                                {log.image_url ? (
                                    <Image source={{ uri: log.image_url }} className="w-16 h-16 rounded-xl mr-4" />
                                ) : (
                                    <View className="w-16 h-16 bg-slate-800 rounded-xl mr-4 items-center justify-center">
                                        <Utensils size={24} color="#475569" />
                                    </View>
                                )}
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-lg" numberOfLines={1}>{log.food_name}</Text>
                                    <Text className="text-slate-400 text-xs uppercase">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.meal_type}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-emerald-500 font-bold text-lg">{log.calories}</Text>
                                    <Text className="text-slate-500 text-[10px]">KCAL</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
