import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Zap, PieChart, Shield, Award, Info, RefreshCcw, Utensils } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { getWeeklyStats } from '../src/lib/meal_service';

const { width } = Dimensions.get('window');

// Enhanced Classification Helper
const classifyFoodGroup = (foodName: string) => {
    const name = foodName.toLowerCase();
    if (/apple|banana|berry|orange|grape|fruit|mango|melon|pineapple|salad|smoothie/.test(name)) return 'Fruits';
    if (/broccoli|carrot|spinach|kale|tomato|cucumber|onion|garlic|vegetable|pepper|cabbage/.test(name)) return 'Vegetables';
    if (/beef|chicken|pork|fish|egg|protein|tofu|bean|steak|meat|tuna|salmon/.test(name)) return 'Proteins';
    if (/rice|bread|pasta|grain|quinoa|oats|cereal|noodle|wheat/.test(name)) return 'Grains';
    if (/milk|cheese|yogurt|dairy|butter|cream/.test(name)) return 'Dairy';
    return 'Other';
};

// Category Colors & Icons Configuration
const CATEGORY_CONFIG: Record<string, { color: string, icon: any }> = {
    Proteins: { color: '#ef4444', icon: <Zap size={14} color="white" /> },
    Vegetables: { color: '#10b981', icon: <Utensils size={14} color="white" /> },
    Grains: { color: '#f59e0b', icon: <PieChart size={14} color="white" /> },
    Fruits: { color: '#ec4899', icon: <Shield size={14} color="white" /> },
    Dairy: { color: '#3b82f6', icon: <Award size={14} color="white" /> },
    Other: { color: '#94a3b8', icon: <Info size={14} color="white" /> }
};

const RadarChart = ({ data }: { data: Record<string, number> }) => {
    const categories = ['Proteins', 'Vegetables', 'Grains', 'Fruits', 'Dairy'];
    const maxValue = 8; // Target goal for each group
    const centerX = 100;
    const centerY = 100;
    const radius = 80;

    const points = categories.map((cat, i) => {
        const val = Math.min(data[cat] || 0, maxValue);
        const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
        const r = (val / maxValue) * radius;
        return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    }).join(' ');

    return (
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
            <Svg width={220} height={220} viewBox="0 0 200 200">
                {/* Concentric Circular Grid */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
                    <Circle
                        key={i}
                        cx={centerX}
                        cy={centerY}
                        r={radius * scale}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                        strokeDasharray={scale === 1 ? "0" : "4,4"}
                    />
                ))}

                {/* Axis Lines with Color Tips */}
                {categories.map((cat, i) => {
                    const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
                    const color = CATEGORY_CONFIG[cat].color;
                    return (
                        <G key={i}>
                            <Path
                                d={`M ${centerX} ${centerY} L ${centerX + radius * Math.cos(angle)} ${centerY + radius * Math.sin(angle)}`}
                                stroke="rgba(255,255,255,0.15)"
                                strokeWidth="1"
                            />
                            <Circle
                                cx={centerX + radius * Math.cos(angle)}
                                cy={centerY + radius * Math.sin(angle)}
                                r={3}
                                fill={color}
                            />
                        </G>
                    );
                })}

                {/* Data Area with Glow */}
                <Path
                    d={`M ${points} Z`}
                    fill="rgba(59, 130, 246, 0.25)"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <Path
                    d={`M ${points} Z`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeOpacity={0.15}
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
};

export default function DiversityDetailsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<any>(null);
    const [idOrder, setIdOrder] = useState<string[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const data = await getWeeklyStats(user.id);
                    setWeeklyData(data);

                    // Fetch Today's Order
                    const today = new Date().toDateString();
                    const orderKey = `meal_order_${user.id}_${today}`;
                    const savedOrder = await AsyncStorage.getItem(orderKey);
                    if (savedOrder) {
                        setIdOrder(JSON.parse(savedOrder));
                    }
                }
            } catch (error) {
                console.error('Failed to load diversity details:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const analysis = useMemo(() => {
        if (!weeklyData || !weeklyData.raw) return null;

        const groups: Record<string, number> = { Proteins: 0, Vegetables: 0, Grains: 0, Fruits: 0, Dairy: 0, Other: 0 };
        const uniqueItems: any[] = [];
        const seen = new Set();

        let logs = [...weeklyData.raw];
        const today = new Date().toDateString();

        // Sort logs to respect Today's custom order
        if (idOrder.length > 0) {
            logs.sort((a, b) => {
                const dateA = new Date(a.created_at).toDateString();
                const dateB = new Date(b.created_at).toDateString();

                if (dateA === today && dateB === today) {
                    const idxA = idOrder.indexOf(a.id);
                    const idxB = idOrder.indexOf(b.id);
                    if (idxA === -1 && idxB === -1) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    if (idxA === -1) return -1; // New items first
                    if (idxB === -1) return 1;
                    return idxA - idxB;
                }
                // For other days, or mixed, standard reverse chronological (or user pref)
                // Existing code reversed it later. Let's sort by Time Descending generally first?
                // The original code did `[...weeklyData.raw].reverse()`. `raw` usually comes ASC or DESC from DB.
                // Assuming `raw` is ASC (oldest first)? `reverse()` makes it Newest First.
                // Let's assume we want Newest First (Top of list).
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        } else {
            // Fallback to standard time sort desc
            logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        logs.forEach((item: any) => {
            const group = classifyFoodGroup(item.food_name);
            groups[group]++;

            if (!seen.has(item.food_name.toLowerCase())) {
                seen.add(item.food_name.toLowerCase());
                uniqueItems.push(item);
            }
        });

        const missing = Object.entries(groups)
            .filter(([key, val]) => val === 0 && key !== 'Other')
            .map(([key]) => key);

        return { groups, uniqueItems, missing };
    }, [weeklyData, idOrder]);

    if (loading || !analysis) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <ChevronLeft color="white" size={28} />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Food Exploration</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {/* Balance Score & Radar Chart Card */}
                <View style={{ backgroundColor: '#1e293b', borderRadius: 32, padding: 24, marginBottom: 20, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Food Group Balance</Text>
                            <Text style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Nutritional coverage audit.</Text>
                        </View>
                        <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                            <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 13 }}>SCORE: {Math.round((Object.values(analysis.groups).filter(v => v > 0).length / 5) * 100)}%</Text>
                        </View>
                    </View>

                    <RadarChart data={analysis.groups} />

                    {/* Category Metric Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {['Proteins', 'Vegetables', 'Grains', 'Fruits', 'Dairy'].map((cat) => {
                            const count = analysis.groups[cat] || 0;
                            const target = 5;
                            const progress = Math.min(count / target, 1);
                            const config = CATEGORY_CONFIG[cat];

                            return (
                                <View key={cat} style={{ width: (width - 100) / 2, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <View style={{ backgroundColor: config.color, padding: 4, borderRadius: 6 }}>
                                            {React.cloneElement(config.icon, { size: 12 })}
                                        </View>
                                        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}>{cat.toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{count}</Text>
                                        <Text style={{ color: '#64748b', fontSize: 10 }}>Target: {target}</Text>
                                    </View>
                                    <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                        <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: config.color }} />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Achievement Card */}
                <LinearGradient
                    colors={['#3b82f6', '#1d4ed8']}
                    style={{ borderRadius: 24, padding: 20, marginBottom: 20 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <Award color="white" size={24} />
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Diversity Status</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22 }}>
                        You've discovered <Text style={{ fontWeight: 'bold' }}>{analysis.uniqueItems.length}</Text> unique food items this week.
                        Your diet is <Text style={{ fontWeight: 'bold' }}>{analysis.uniqueItems.length > 15 ? 'Highly Diverse' : (analysis.uniqueItems.length > 7 ? 'Moderate' : 'Developing')}</Text>.
                    </Text>
                </LinearGradient>

                {/* Missing Nutrients / Coach Advice */}
                <View style={{ backgroundColor: '#1e293b', padding: 20, borderRadius: 24, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#3b82f6' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Info color="#3b82f6" size={18} />
                        <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' }}>Missing for Balance</Text>
                    </View>
                    {analysis.missing.length > 0 ? (
                        <Text style={{ color: 'white', fontSize: 15, lineHeight: 22 }}>
                            We haven't detected many <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>{analysis.missing.join(', ')}</Text> in your diet this week.
                            Try adding a {analysis.missing[0] === 'Vegetables' ? 'fresh green salad' : (analysis.missing[0] === 'Proteins' ? 'lean protein source' : 'serving of fruit')} to your next meal.
                        </Text>
                    ) : (
                        <Text style={{ color: 'white', fontSize: 15, lineHeight: 22 }}>
                            Perfect balance! You've touched all main food groups this week. Consistency is key to long-term gut health.
                        </Text>
                    )}
                </View>

                {/* Unique Inventory Gallery */}
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Discovery Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 40 }}>
                    {analysis.uniqueItems.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={{ width: 120, marginRight: 16 }}
                            onPress={() => {
                                // Extract YYYY-MM-DD in local time
                                const localDate = new Date(item.created_at);
                                const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                                router.push({
                                    pathname: '/meal_history',
                                    params: { date: dateStr, highlightId: item.id }
                                });
                            }}
                        >
                            <View style={{ width: 120, height: 120, borderRadius: 20, backgroundColor: '#0f172a', overflow: 'hidden', marginBottom: 8 }}>
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 32 }}>🍱</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{item.food_name}</Text>
                            <Text style={{ color: '#64748b', fontSize: 10 }}>{classifyFoodGroup(item.food_name)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </ScrollView>
        </SafeAreaView>
    );
}
