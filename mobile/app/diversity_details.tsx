import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Zap, PieChart, Shield, Award, Info, Utensils, Target, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { getWeeklyStats } from '../src/lib/meal_service';
import { theme } from '../src/constants/theme';
import { useTranslation } from '../src/lib/i18n';

const { width } = Dimensions.get('window');

// Classification Helper (Simplified/Extracted)
const classifyFoodGroup = (foodName: string) => {
    const name = foodName.toLowerCase();
    if (/apple|banana|berry|orange|grape|fruit|mango|melon|pineapple|salad|smoothie/.test(name)) return 'Fruits';
    if (/broccoli|carrot|spinach|kale|tomato|cucumber|onion|garlic|vegetable|pepper|cabbage/.test(name)) return 'Vegetables';
    if (/beef|chicken|pork|fish|egg|protein|tofu|bean|steak|meat|tuna|salmon/.test(name)) return 'Proteins';
    if (/rice|bread|pasta|grain|quinoa|oats|cereal|noodle|wheat/.test(name)) return 'Grains';
    if (/milk|cheese|yogurt|dairy|butter|cream/.test(name)) return 'Dairy';
    return 'Other';
};

const CATEGORY_CONFIG: Record<string, { color: string, icon: any }> = {
    Proteins: { color: '#ef4444', icon: Zap },
    Vegetables: { color: '#10b981', icon: Utensils },
    Grains: { color: '#f59e0b', icon: PieChart },
    Fruits: { color: '#ec4899', icon: Shield },
    Dairy: { color: '#3b82f6', icon: Award },
    Other: { color: '#94a3b8', icon: Info }
};

const RadarChart = ({ data }: { data: Record<string, number> }) => {
    const categories = ['Proteins', 'Vegetables', 'Grains', 'Fruits', 'Dairy'];
    const maxValue = 8;
    const centerX = 100;
    const centerY = 100;
    const radius = 70; // Slightly smaller to fit labels

    const points = categories.map((cat, i) => {
        const val = Math.max(0.5, Math.min(data[cat] || 0, maxValue)); // Min value for visibility
        const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
        const r = (val / maxValue) * radius;
        return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    }).join(' ');

    return (
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
            <Svg width={250} height={220} viewBox="0 0 200 200">
                {/* Background Grid */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
                    <Circle
                        key={i}
                        cx={centerX}
                        cy={centerY}
                        r={radius * scale}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                        strokeDasharray={i === 4 ? "" : "4,4"}
                    />
                ))}
                {categories.map((cat, i) => {
                    const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    const labelX = centerX + (radius + 22) * Math.cos(angle);
                    const labelY = centerY + (radius + 22) * Math.sin(angle);

                    return (
                        <G key={i}>
                            <Path
                                d={`M ${centerX} ${centerY} L ${x} ${y}`}
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="1"
                            />
                            {/* Category Labels inside Chart */}
                            <SvgText
                                x={labelX}
                                y={labelY}
                                fill={theme.colors.text.secondary}
                                fontSize="9"
                                fontWeight="800"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {cat.toUpperCase()}
                            </SvgText>
                        </G>
                    );
                })}
                {/* Data Polygon */}
                <Path
                    d={`M ${points} Z`}
                    fill="rgba(16, 185, 129, 0.3)"
                    stroke={theme.colors.primary}
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
};

export default function DiversityDetailsScreen() {
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

    const analysis = useMemo(() => {
        if (!weeklyData || !weeklyData.raw) return null;
        const groups: Record<string, number> = { Proteins: 0, Vegetables: 0, Grains: 0, Fruits: 0, Dairy: 0, Other: 0 };
        const uniqueItems: any[] = [];
        const seen = new Set();

        [...weeklyData.raw].forEach((item: any) => {
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
    }, [weeklyData]);

    if (loading || !analysis) {
        return (
            <View style={styles.loading}>
                <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const diversityScore = Math.round((Object.values(analysis.groups).filter(v => v > 0).length / 5) * 100);

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
                    <Text style={styles.headerTitle}>Diversity Audit</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Main Analysis Card */}
                    <BlurView intensity={40} tint="light" style={styles.mainCard}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.cardTitle}>Food Group Balance</Text>
                                <Text style={styles.cardSub}>7-day nutritional coverage</Text>
                            </View>
                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreText}>{diversityScore}%</Text>
                            </View>
                        </View>

                        <RadarChart data={analysis.groups} />

                        <View style={styles.metricGrid}>
                            {['Proteins', 'Vegetables', 'Grains', 'Fruits', 'Dairy'].map((cat) => {
                                const count = analysis.groups[cat] || 0;
                                const config = CATEGORY_CONFIG[cat];
                                const Icon = config.icon;
                                return (
                                    <View key={cat} style={styles.metricItem}>
                                        <View style={styles.metricHead}>
                                            <Icon size={12} color={config.color} />
                                            <Text style={styles.metricLabel}>{cat}</Text>
                                        </View>
                                        <Text style={styles.metricValue}>{count}</Text>
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${Math.min(count * 20, 100)}%`, backgroundColor: config.color }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </BlurView>

                    {/* Status Insight */}
                    <LinearGradient colors={theme.colors.gradients.primary as any} style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <Award color={theme.colors.text.inverse} size={22} />
                            <Text style={styles.insightTitle}>Exploration Status</Text>
                        </View>
                        <Text style={styles.insightText}>
                            You've discovered <Text style={{ fontWeight: '900' }}>{analysis.uniqueItems.length}</Text> unique ingredients this week.
                            Your metabolic variety is <Text style={{ fontWeight: '900' }}>{analysis.uniqueItems.length > 15 ? 'Excellent' : 'Improving'}</Text>.
                        </Text>
                    </LinearGradient>

                    {/* Advice Card */}
                    <BlurView intensity={20} tint="light" style={styles.adviceCard}>
                        <View style={styles.adviceHead}>
                            <Target size={18} color={theme.colors.primary} />
                            <Text style={styles.adviceTitle}>NUTRITIONAL ADVICE</Text>
                        </View>
                        {analysis.missing.length > 0 ? (
                            <Text style={styles.adviceText}>
                                We haven't detected many <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{analysis.missing.join(', ')}</Text> lately.
                                Try incorporating some in your next meal to boost gut microbiome diversity.
                            </Text>
                        ) : (
                            <Text style={styles.adviceText}>
                                Phenomenal balance! You are hitting all core food groups. This is the gold standard for metabolic health.
                            </Text>
                        )}
                    </BlurView>

                    <Text style={styles.sectionHeading}>Discovery Gallery</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                        {analysis.uniqueItems.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.galleryItem}
                                onPress={() => {
                                    const d = new Date(item.created_at);
                                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    router.push({ pathname: '/meal_history', params: { date: dateStr, highlightId: item.id } });
                                }}
                            >
                                <View style={styles.imageOverlay}>
                                    <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                                    {item.image_url ? (
                                        <Image source={{ uri: item.image_url }} style={styles.galleryImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}><Utensils size={24} color={theme.colors.text.muted} /></View>
                                    )}
                                </View>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.food_name}</Text>
                                <Text style={styles.itemGroup}>{classifyFoodGroup(item.food_name)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={{ height: 40 }} />
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
    mainCard: { borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    cardSub: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
    scoreBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    scoreText: { color: theme.colors.primary, fontWeight: '900', fontSize: 14 },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, justifyContent: 'space-between' },
    metricItem: { width: '48%', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.glass.border },
    metricHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    metricLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.text.secondary, textTransform: 'uppercase' },
    metricValue: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 8 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },
    insightCard: { padding: 20, borderRadius: 24, marginBottom: 20, elevation: 4, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    insightTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text.inverse },
    insightText: { fontSize: 14, color: theme.colors.text.inverse, opacity: 0.9, lineHeight: 20 },
    adviceCard: { padding: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border, marginBottom: 30 },
    adviceHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    adviceTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.text.secondary, letterSpacing: 1 },
    adviceText: { fontSize: 14, color: theme.colors.text.primary, lineHeight: 22, opacity: 0.8 },
    sectionHeading: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 16, marginLeft: 4 },
    gallery: { gap: 16, paddingRight: 40 },
    galleryItem: { width: 140 },
    imageOverlay: { width: 140, height: 140, borderRadius: 24, overflow: 'hidden', backgroundColor: theme.colors.background.secondary, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.glass.border },
    galleryImage: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    itemTitle: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '700' },
    itemGroup: { color: theme.colors.text.secondary, fontSize: 11, fontWeight: '600', marginTop: 2 }
});
