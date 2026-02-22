import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Heart, Zap, Flame, ShieldCheck, Award, TrendingUp, Info, ChevronLeft, BarChart2, Activity, Target } from 'lucide-react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring, withTiming } from 'react-native-reanimated';
import { useTranslation } from '../src/lib/i18n';
import { theme } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function MetabolicReport() {
    const router = useRouter();
    const { t, language } = useTranslation();
    const params = useLocalSearchParams();

    // Parse params
    const headline = params.headline as string || 'Steady Energy';
    const grade = params.grade as string || 'B';
    const healthScore = parseInt(params.healthScore as string) || 7;
    const calories = parseInt(params.calories as string) || 1250;
    const targetKcal = parseInt(params.targetKcal as string) || 2000;
    const protein = parseInt(params.protein as string) || 45;
    const carbs = parseInt(params.carbs as string) || 120;
    const fat = parseInt(params.fat as string) || 35;

    const readiness = Math.min(calories / targetKcal, 1);
    const quality = healthScore / 10;

    // Animations
    const ringProgress = useSharedValue(0);
    const qualityProgress = useSharedValue(0);
    const scaleValue = useSharedValue(0.9);

    useEffect(() => {
        ringProgress.value = withSpring(readiness, { damping: 15 });
        qualityProgress.value = withSpring(quality, { damping: 12 });
        scaleValue.value = withTiming(1, { duration: 800 });
    }, []);

    const animatedRingProps = useAnimatedProps(() => {
        const circ = 2 * Math.PI * 60;
        return { strokeDashoffset: circ * (1 - ringProgress.value) };
    });

    const animatedQualityProps = useAnimatedProps(() => {
        const circ = 2 * Math.PI * 45;
        return { strokeDashoffset: circ * (1 - qualityProgress.value) };
    });

    const getIcon = () => {
        const iconSize = 32;
        if (headline.includes('Peak')) return <Flame size={iconSize} color={theme.colors.accent} />;
        if (headline.includes('Surplus')) return <Zap size={iconSize} color={theme.colors.secondary} />;
        if (headline.includes('Energy')) return <Heart size={iconSize} color={theme.colors.primary} />;
        return <Award size={iconSize} color="#fcd34d" />;
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                            <ChevronLeft size={24} color={theme.colors.text.primary} />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Intelligence Report</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroIconBox}>
                            <BlurView intensity={30} tint="light" style={styles.heroBlur}>
                                {getIcon()}
                            </BlurView>
                        </View>
                        <Text style={styles.heroHeadline}>
                            {language === 'Korean' ? (headline === 'Steady Energy' ? '안정적 에너지' : headline === 'Metabolic Peak' ? '대사 피크' : headline) : headline}
                        </Text>
                        <BlurView intensity={20} tint="light" style={styles.gradeBadge}>
                            <Text style={styles.gradeText}>GRADE {grade}</Text>
                        </BlurView>
                    </View>

                    {/* Impact Analysis */}
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <Info size={16} color={theme.colors.primary} />
                            <Text style={styles.sectionTitle}>Impact Analysis</Text>
                        </View>
                        <BlurView intensity={40} tint="light" style={styles.glassCard}>
                            <Text style={styles.insightTitle}>🔥 What is {headline}?</Text>
                            <Text style={styles.insightDesc}>
                                {headline === 'Steady Energy' ? (
                                    language === 'Korean' ? "본인의 식사 타이밍과 식이섬유 섭취가 안정적인 포도당 반응을 만들어냈습니다. 이는 에너지 급락을 최소화합니다." : "Your meal timing and fiber intake have created a stable glucose response. This minimizes energy crashes and keeps focus sharp."
                                ) : (
                                    language === 'Korean' ? "영양 밀도가 결합되어 대사 준비 수준이 최고치에 도달했습니다. 안정적인 흐름을 유지하고 있습니다." : "High nutrient density has pushed your metabolic readiness to the peak range. You are maintaining a steady flow."
                                )}
                            </Text>
                            <View style={styles.adviceBox}>
                                <Text style={styles.adviceTitle}>PRO TIP</Text>
                                <Text style={styles.adviceText}>
                                    {language === 'Korean' ? "당분이 높은 간식을 피하여 현재의 에너지 안정성을 유지하세요." : "Avoid high-sugar snacks between meals to sustain this metabolic state."}
                                </Text>
                            </View>
                        </BlurView>
                    </View>

                    {/* Metrics Breakdown */}
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <BarChart2 size={16} color={theme.colors.secondary} />
                            <Text style={styles.sectionTitle}>Metabolic Pulse</Text>
                        </View>

                        <View style={styles.metricsGrid}>
                            <BlurView intensity={30} tint="light" style={styles.metricItem}>
                                <View style={styles.itemHeader}>
                                    <Target size={14} color={theme.colors.primary} />
                                    <Text style={styles.itemLabel}>READINESS</Text>
                                </View>
                                <Text style={styles.itemValue}>{healthScore * 10}%</Text>
                                <View style={styles.miniProgress}><View style={[styles.miniFill, { width: `${healthScore * 10}%`, backgroundColor: theme.colors.primary }]} /></View>
                            </BlurView>

                            <BlurView intensity={30} tint="light" style={styles.metricItem}>
                                <View style={styles.itemHeader}>
                                    <Activity size={14} color={theme.colors.accent} />
                                    <Text style={styles.itemLabel}>FUEL LEVEL</Text>
                                </View>
                                <Text style={styles.itemValue}>{Math.round(readiness * 100)}%</Text>
                                <View style={styles.miniProgress}><View style={[styles.miniFill, { width: `${Math.min(readiness * 100, 100)}%`, backgroundColor: theme.colors.accent }]} /></View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Blueprint Visual */}
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <TrendingUp size={16} color="#818cf8" />
                            <Text style={styles.sectionTitle}>Composition Audit</Text>
                        </View>
                        <BlurView intensity={40} tint="light" style={styles.glassCard}>
                            <View style={styles.blueprintRow}>
                                <View style={styles.visualContainer}>
                                    <Svg width={120} height={120} viewBox="0 0 140 140">
                                        <Circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                                        <AnimatedCircle
                                            cx="70" cy="70" r="60"
                                            stroke={theme.colors.primary} strokeWidth="10" fill="none"
                                            strokeDasharray={`${2 * Math.PI * 60}`}
                                            animatedProps={animatedRingProps}
                                            strokeLinecap="round" transform="rotate(-90 70 70)"
                                        />
                                        <Circle cx="70" cy="70" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                                        <AnimatedCircle
                                            cx="70" cy="70" r="45"
                                            stroke={theme.colors.secondary} strokeWidth="8" fill="none"
                                            strokeDasharray={`${2 * Math.PI * 45}`}
                                            animatedProps={animatedQualityProps}
                                            strokeLinecap="round" transform="rotate(-90 70 70)"
                                        />
                                    </Svg>
                                </View>
                                <View style={styles.legend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                                        <Text style={styles.legendText}>Quantity (Fuel)</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary }]} />
                                        <Text style={styles.legendText}>Quality (Intel)</Text>
                                    </View>
                                    <Text style={styles.blueprintVerdict}>
                                        Balance is {readiness > 0.8 && quality > 0.8 ? 'Optimized' : 'Improving'}.
                                    </Text>
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {/* How to reach S */}
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <Award size={16} color="#fcd34d" />
                            <Text style={styles.sectionTitle}>Road to Elite Status</Text>
                        </View>
                        <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.goalCard}>
                            <Text style={styles.goalHint}>To reach <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Grade S</Text>, focus on these key metabolic drivers:</Text>
                            <View style={styles.checkItem}>
                                <ShieldCheck size={18} color={theme.colors.primary} />
                                <Text style={styles.checkText}>Increase food diversity (Targets: 15+ weekly)</Text>
                            </View>
                            <View style={styles.checkItem}>
                                <ShieldCheck size={18} color={theme.colors.primary} />
                                <Text style={styles.checkText}>Front-load protein for muscle preservation</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    iconBlur: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
    backBtn: {},
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    scrollContent: { padding: 24, paddingTop: 12 },
    heroSection: { alignItems: 'center', marginBottom: 32 },
    heroIconBox: { width: 100, height: 100, borderRadius: 50, padding: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
    heroBlur: { flex: 1, borderRadius: 47, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    heroHeadline: { fontSize: 32, fontWeight: '900', color: theme.colors.text.primary, marginVertical: 12 },
    gradeBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    gradeText: { fontSize: 14, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1 },
    section: { marginBottom: 32 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 4 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: theme.colors.text.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
    glassCard: { borderRadius: 28, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    insightTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 8 },
    insightDesc: { fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22, opacity: 0.9 },
    adviceBox: { marginTop: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
    adviceTitle: { fontSize: 11, fontWeight: '900', color: theme.colors.primary, marginBottom: 4, letterSpacing: 1 },
    adviceText: { fontSize: 14, color: theme.colors.text.primary, fontWeight: '600' },
    metricsGrid: { flexDirection: 'row', gap: 12 },
    metricItem: { flex: 1, borderRadius: 24, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    itemLabel: { fontSize: 10, fontWeight: '900', color: theme.colors.text.muted },
    itemValue: { fontSize: 24, fontWeight: '900', color: theme.colors.text.primary, marginBottom: 12 },
    miniProgress: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
    miniFill: { height: '100%', borderRadius: 2 },
    blueprintRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    visualContainer: { width: 120, height: 120 },
    legend: { flex: 1 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 14, fontWeight: '700', color: theme.colors.text.secondary },
    blueprintVerdict: { fontSize: 12, color: theme.colors.text.muted, marginTop: 12, fontStyle: 'italic' },
    goalCard: { borderRadius: 28, padding: 24, borderWidth: 1, borderColor: theme.colors.glass.border },
    goalHint: { fontSize: 15, color: theme.colors.text.primary, marginBottom: 20, lineHeight: 22 },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    checkText: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary }
});
