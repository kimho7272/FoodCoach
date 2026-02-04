import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, PieChart } from 'lucide-react-native';

export default function StatsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]">
            <ScrollView className="flex-1 px-4 py-6">
                <View className="mb-8">
                    <Text className="text-2xl font-bold text-white mb-2">Weekly Summary</Text>
                    <Text className="text-slate-400">Great progress this week! You met your goals 5/7 days.</Text>
                </View>

                {/* Weekly Chart Placeholder */}
                <View className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700 mb-8 h-64 justify-center items-center">
                    <BarChart3 size={48} color="#10b981" />
                    <Text className="text-slate-500 mt-4 text-center">Chart visualization will be here</Text>
                </View>

                {/* Macro Distribution */}
                <View className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700 mb-8">
                    <Text className="text-lg font-bold text-white mb-6">Macro Distribution</Text>
                    <View className="flex-row items-center gap-6">
                        <View className="w-32 h-32 rounded-full border-8 border-[#10b981] justify-center items-center">
                            <PieChart size={32} color="#10b981" />
                        </View>
                        <View className="flex-1 space-y-4">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 bg-[#10b981] rounded-full mr-2" />
                                <Text className="text-slate-300 flex-1">Protein</Text>
                                <Text className="text-white font-bold">35%</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 bg-amber-400 rounded-full mr-2" />
                                <Text className="text-slate-300 flex-1">Carbs</Text>
                                <Text className="text-white font-bold">45%</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 bg-red-400 rounded-full mr-2" />
                                <Text className="text-slate-300 flex-1">Fat</Text>
                                <Text className="text-white font-bold">20%</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
