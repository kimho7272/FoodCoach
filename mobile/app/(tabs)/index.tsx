import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Plus, TrendingUp, Zap, Settings, Heart, BarChart2 } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <BlurView intensity={40} tint="light" className={`overflow-hidden rounded-3xl border border-white/20 ${className}`}>
        <View className="bg-white/10 p-5">
            {children}
        </View>
    </BlurView>
);

export default function HomeScreen() {
    const dailyKcal = 1450;
    const targetKcal = 1800;
    const percentage = dailyKcal / targetKcal;
    const strokeWidth = 10;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    return (
        <View className="flex-1">
            {/* Main Background Gradient */}
            <LinearGradient
                colors={['#fef3c7', '#dcfce7', '#d1fae5', '#e0e7ff', '#fae8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
            />

            <SafeAreaView className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6">
                    {/* Top Header */}
                    <View className="flex-row justify-between items-center mt-4 mb-8">
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                                <Text className="text-2xl text-center mt-1">👦</Text>
                            </View>
                            <View className="ml-3">
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">Mon, Feb 2</Text>
                                <Text className="text-slate-800 text-sm font-medium">Hey, [User]! What's cooking?</Text>
                            </View>
                        </View>
                        <View className="bg-white/30 px-3 py-1 rounded-full border border-white/40 items-center flex-row">
                            <Text className="text-xs font-bold text-orange-500 mr-1">Streak</Text>
                            <View className="bg-orange-100 px-2 py-0.5 rounded-lg">
                                <Text className="text-orange-600 font-bold text-xs">5</Text>
                            </View>
                        </View>
                    </View>

                    <Text className="text-2xl font-bold text-slate-800 mb-6">Daily Summary</Text>

                    {/* Daily Summary Ring Card */}
                    <GlassCard className="mb-6">
                        <View className="flex-row items-center justify-between">
                            {/* Bar Chart Mock */}
                            <View className="flex-row items-end gap-1 h-20 w-20">
                                <View className="w-2 bg-red-400 h-[30%] rounded-t-full" />
                                <View className="w-2 bg-orange-400 h-[50%] rounded-t-full" />
                                <View className="w-2 bg-amber-400 h-[70%] rounded-t-full" />
                                <View className="w-2 bg-emerald-400 h-[100%] rounded-t-full" />
                            </View>

                            {/* Center Nutrients Ring */}
                            <View className="items-center justify-center">
                                <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
                                    <Circle
                                        cx={radius + strokeWidth / 2}
                                        cy={radius + strokeWidth / 2}
                                        r={radius}
                                        stroke="#e2e8f0"
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
                                    />
                                </Svg>
                                <View className="absolute items-center">
                                    <Text className="text-2xl font-bold text-slate-800">{dailyKcal.toLocaleString()}</Text>
                                    <Text className="text-slate-400 text-xs">/ {targetKcal} kcal</Text>
                                </View>
                            </View>

                            <View className="items-center">
                                <View className="bg-emerald-100 p-2 rounded-xl mb-2">
                                    <TrendingUp size={24} color="#10b981" />
                                </View>
                                <Text className="text-xs text-slate-400">On Track</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Nutrient Mini Cards */}
                    <View className="flex-row gap-4 mb-8">
                        <BlurView intensity={30} tint="light" className="flex-1 rounded-3xl border border-white/20 bg-orange-100/20 p-4">
                            <View className="flex-row items-center mb-1">
                                <BarChart2 size={16} color="#fb923c" />
                                <Text className="text-slate-600 text-[10px] font-bold ml-1">Breakfast</Text>
                            </View>
                            <Text className="text-slate-800 font-bold">180g</Text>
                            <Text className="text-orange-500 text-[10px] font-bold">(40%)</Text>
                        </BlurView>
                        <BlurView intensity={30} tint="light" className="flex-1 rounded-3xl border border-white/20 bg-emerald-100/20 p-4">
                            <View className="flex-row items-center mb-1">
                                <Zap size={16} color="#10b981" />
                                <Text className="text-slate-600 text-[10px] font-bold ml-1">Protein</Text>
                            </View>
                            <Text className="text-slate-800 font-bold">920g</Text>
                            <Text className="text-emerald-500 text-[10px] font-bold">(20%)</Text>
                        </BlurView>
                        <BlurView intensity={30} tint="light" className="flex-1 rounded-3xl border border-white/20 bg-indigo-100/20 p-4">
                            <View className="flex-row items-center mb-1">
                                <Flame size={16} color="#6366f1" />
                                <Text className="text-slate-600 text-[10px] font-bold ml-1">Dinner</Text>
                            </View>
                            <Text className="text-slate-800 font-bold">Fats</Text>
                            <Text className="text-indigo-500 text-[10px] font-bold">55%</Text>
                        </BlurView>
                    </View>

                    <Text className="text-xl font-bold text-slate-800 mb-4">Your Meals Today!</Text>

                    {/* Horizontal Meal Slider */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4 overflow-visible h-40">
                        {/* Lunch Item */}
                        <View className="w-56 h-36 rounded-[32px] overflow-hidden bg-white/20 border border-white/30 mr-4">
                            <View className="flex-row h-full">
                                <View className="p-4 flex-1 justify-center">
                                    <Text className="text-slate-500 text-[10px] mb-1">Lunch</Text>
                                    <Text className="text-slate-800 font-bold text-sm">Balanced Salad</Text>
                                    <Text className="text-blue-500 text-xs font-bold mt-1">420g</Text>
                                    <View className="flex-row items-center mt-2">
                                        <Text className="text-[10px] text-slate-400">🕒 8:30 AM</Text>
                                    </View>
                                </View>
                                <View className="w-24 h-full">
                                    <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)']} className="absolute inset-0 z-10" />
                                    <View className="bg-slate-200 h-full w-full justify-center items-center">
                                        <Text className="text-3xl">🥗</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Add Meal Button */}
                        <TouchableOpacity className="w-40 h-36 rounded-[32px] overflow-hidden bg-white/40 border border-dashed border-slate-400 items-center justify-center mr-4">
                            <View className="bg-white/60 p-3 rounded-2xl">
                                <Plus size={24} color="#64748b" />
                            </View>
                            <Text className="text-slate-500 text-xs font-bold mt-2">Add Lunch</Text>
                        </TouchableOpacity>

                        {/* Snack Item */}
                        <View className="w-40 h-36 rounded-[32px] overflow-hidden bg-white/20 border border-white/30 p-4 items-center justify-center">
                            <Text className="text-slate-500 text-[10px] absolute top-4 left-4">Snack</Text>
                            <Text className="text-3xl">🍌</Text>
                            <Text className="text-slate-800 font-bold text-xs mt-2">Add your dinner!</Text>
                        </View>
                    </ScrollView>

                    {/* Activity Exchange Card */}
                    <View className="mt-8 mb-10">
                        <Text className="text-xl font-bold text-slate-800 mb-4">Activity Exchange</Text>
                        <GlassCard>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="bg-slate-800/10 p-2 rounded-full mr-3">
                                        <Text className="text-xl">🏃‍♂️</Text>
                                    </View>
                                    <View>
                                        <Text className="text-xs text-slate-800 font-bold w-40 leading-4">
                                            Walk 30 min to balance your snack!
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity className="bg-orange-500 px-5 py-2 rounded-full">
                                    <Text className="text-white font-bold text-sm">Let's Go</Text>
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Bottom Nav Mock (Floating) */}
            <View className="absolute bottom-6 left-6 right-6 h-16">
                <BlurView intensity={80} tint="light" className="flex-1 rounded-full border border-white/40 overflow-hidden">
                    <View className="flex-1 bg-white/30 flex-row justify-around items-center px-4">
                        <TouchableOpacity className="bg-indigo-100 p-2 rounded-full">
                            <Text className="text-lg">📷</Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <BarChart2 size={24} color="#64748b" />
                        </TouchableOpacity>
                        <Text className="text-slate-400 font-bold text-xs">Trends</Text>
                        <TouchableOpacity>
                            <Heart size={24} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Settings size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
        </View>
    );
}
