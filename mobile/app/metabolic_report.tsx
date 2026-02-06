import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Zap, Flame, ShieldCheck, Award, TrendingUp, Info, ChevronLeft, BarChart2, Activity } from 'lucide-react-native';
import Svg, { Circle, Polygon, Path, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring, withTiming, withRepeat, withSequence, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useTranslation } from '../src/lib/i18n';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

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
        if (headline.includes('Peak')) return <Flame size={32} color="#f97316" />;
        if (headline.includes('Surplus')) return <Zap size={32} color="#fbbf24" />;
        if (headline.includes('Energy')) return <Heart size={32} color="#10b981" />;
        return <Award size={32} color="#6366f1" />;
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#f8fafc', '#f1f5f9']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('intelligenceReport')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <BlurView intensity={40} style={styles.heroIconBox}>
                            {getIcon()}
                        </BlurView>
                        <Text style={styles.heroHeadline}>{language === 'Korean' ? (headline === 'Steady Energy' ? '안정적 에너지' : headline === 'Metabolic Peak' ? '대사 피크' : headline) : headline}</Text>
                        <View style={[styles.gradeBadge, { backgroundColor: grade === 'S' ? '#fef3c7' : '#dcfce7' }]}>
                            <Text style={styles.gradeText}>{t('currentGrade')}: {grade}</Text>
                        </View>
                    </View>

                    {/* The Why Section */}
                    <View style={styles.reportSection}>
                        <View style={styles.sectionTitleRow}>
                            <Info size={18} color="#10b981" />
                            <Text style={styles.sectionTitle}>{t('statusBreakdown')}</Text>
                        </View>
                        <BlurView intensity={60} tint="light" style={styles.insightCard}>
                            <Text style={styles.insightTitle}>🔥 What is {headline}?</Text>
                            <Text style={styles.insightDescription}>
                                {headline === 'Steady Energy' ? (
                                    language === 'Korean' ? "회원님의 식사 타이밍과 식이섬유 섭취가 안정적인 포도당 반응을 만들어냈습니다. 이는 에너지 급락을 최소화하고 집중력을 날카롭게 유지해 줍니다." : "Your meal timing and fiber intake have created a stable glucose response. This minimizes energy crashes and keeps your focus sharp."
                                ) : headline === 'Metabolic Peak' ? (
                                    language === 'Korean' ? "최적의 단백질 섭취와 높은 영양 밀도가 결합되어 대사 준비 수준이 최고치에 도달했습니다." : "High nutrient density combined with optimal protein intake has pushed your metabolic readiness to the peak range."
                                ) : (
                                    language === 'Korean' ? "현재 패턴은 균형 잡힌 섭취를 보여주고 있으나, 다양성을 최적화할 여지가 있습니다." : "Your current patterns show balanced intake, though there is room to optimize your variety."
                                )
                                }
                            </Text>
                            <View style={styles.improveBox}>
                                <Text style={styles.improveTitle}>✨ {t('proTipToMaintain')}</Text>
                                <Text style={styles.improveText}>
                                    {headline === 'Steady Energy' ?
                                        (language === 'Korean' ? "이 수준을 유지하려면 식간에 당분이 높은 간식을 피하세요." : "Keep avoiding high-sugar snacks between meals to sustain this level.") :
                                        (language === 'Korean' ? "단백질 대 탄수화물 비율을 꾸준히 유지하세요." : "Stay consistent with your protein-to-carb ratio.")}
                                </Text>
                            </View>
                        </BlurView>
                    </View>

                    {/* Readiness & Fuel Section - Stacked Vertically */}
                    <View style={styles.reportSection}>
                        <View style={styles.sectionTitleRow}>
                            <TrendingUp size={18} color="#10b981" />
                            <Text style={styles.sectionTitle}>{t('metabolicMetrics')}</Text>
                        </View>

                        {/* Readiness Item */}
                        <BlurView intensity={60} tint="light" style={styles.insightCard}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.insightTitle}>🎯 {t('readiness')}: {healthScore * 10}</Text>
                                <View style={styles.improveTag}><Text style={styles.improveTagText}>{t('success')}</Text></View>
                            </View>
                            <Text style={styles.insightDescription}>
                                {t('readinessDesc')}
                            </Text>
                            <View style={styles.improveBox}>
                                <Text style={styles.improveTitle}>🚀 {t('howToImproveReadiness')}</Text>
                                <Text style={styles.improveText}>{language === 'Korean' ? "가공된 간식 대신 생땅콩이나 베리류를 선택하여 미세 영양소 밀도를 즉시 높여보세요." : "Switch processed snacks for raw nuts or dark berries to increase micronutrient density instantly."}</Text>
                            </View>
                        </BlurView>

                        {/* Fuel Item */}
                        <BlurView intensity={60} tint="light" style={[styles.insightCard, { marginTop: 16 }]}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.insightTitle}>⛽ {t('fuel')}: {Math.round(readiness * 100)}%</Text>
                                <View style={styles.improveTag}><Text style={styles.improveTagText}>{t('success')}</Text></View>
                            </View>
                            <Text style={styles.insightDescription}>
                                {t('fuelDesc').replace('%{target}', targetKcal.toString())}
                            </Text>
                            <View style={styles.improveBox}>
                                <Text style={styles.improveTitle}>🚀 {t('howToBalanceFuel')}</Text>
                                <Text style={styles.improveText}>
                                    {readiness < 0.7 ?
                                        (language === 'Korean' ? "영양이 부족합니다. 200kcal 정도의 고단백 간식을 추가하세요." : "You're under-fueled. Add a 200kcal high-protein snack.") :
                                        readiness > 1 ?
                                            (language === 'Korean' ? "영양 섭취가 초과되었습니다. 다음 4시간 동안은 고식이섬유 저칼로리 음식을 드세요." : "You've exceeded your fuel. Prioritize high-fiber low-kcal foods for the next 4 hours.") :
                                            (language === 'Korean' ? "완벽한 섭취량입니다. 이대로 유지하세요!" : "Perfectly fueled. Stay the course!")}
                                </Text>
                            </View>
                        </BlurView>
                    </View>

                    {/* Metabolic Pulse Deep-dive */}
                    <View style={styles.reportSection}>
                        <View style={styles.sectionTitleRow}>
                            <Activity size={18} color="#ef4444" />
                            <Text style={styles.sectionTitle}>{t('metabolicPulseAnalysis')}</Text>
                        </View>
                        <BlurView intensity={60} tint="light" style={styles.insightCard}>
                            <Text style={styles.insightTitle}>📈 {t('volatilityCurve')}</Text>
                            <Text style={styles.insightDescription}>
                                {t('volatilityDesc')}
                            </Text>
                            <View style={styles.improveBox}>
                                <Text style={styles.improveTitle}>🚀 {t('howToFlattenCurve')}</Text>
                                <Text style={styles.improveText}>{language === 'Korean' ? "탄수화물보다 식이섬유(채소)를 먼저 섭취하여 포도당 흡수를 늦추고 스파이크를 방지하세요." : "Start meals with fiber (greens) before carbs to slow down glucose absorption and prevent spikes."}</Text>
                            </View>
                        </BlurView>
                    </View>

                    {/* Chart Anatomy Section */}
                    <View style={styles.reportSection}>
                        <View style={styles.sectionTitleRow}>
                            <BarChart2 size={18} color="#3b82f6" />
                            <Text style={styles.sectionTitle}>{t('chartIntelligence')}</Text>
                        </View>

                        <View style={styles.blueprintRow}>
                            <View style={styles.blueprintVisual}>
                                <Svg width={140} height={140} viewBox="0 0 140 140">
                                    <Circle cx="70" cy="70" r="60" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                                    <AnimatedCircle
                                        cx="70" cy="70" r="60"
                                        stroke="#10b981" strokeWidth="10" fill="none"
                                        strokeDasharray={`${2 * Math.PI * 60}`}
                                        animatedProps={animatedRingProps}
                                        strokeLinecap="round" transform="rotate(-90 70 70)"
                                    />
                                    <Circle cx="70" cy="70" r="45" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                                    <AnimatedCircle
                                        cx="70" cy="70" r="45"
                                        stroke="#3b82f6" strokeWidth="8" fill="none"
                                        strokeDasharray={`${2 * Math.PI * 45}`}
                                        animatedProps={animatedQualityProps}
                                        strokeLinecap="round" transform="rotate(-90 70 70)"
                                    />
                                </Svg>
                            </View>
                            <View style={styles.blueprintLegend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                                    <Text style={styles.legendText}>{t('quantityCalories')}</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                                    <Text style={styles.legendText}>{t('qualityNutrients')}</Text>
                                </View>
                                <Text style={styles.legendSubtext}>
                                    {language === 'Korean' ? `현재 양(Quantity)은 ${Math.round(readiness * 100)}%, 질(Quality)은 ${Math.round(quality * 100)}% 수준입니다.` : `Your quantity is at ${Math.round(readiness * 100)}%, while quality is at ${Math.round(quality * 100)}%.`}
                                </Text>
                            </View>
                        </View>

                        <BlurView intensity={60} tint="light" style={styles.insightCard}>
                            <Text style={styles.insightTitle}>📐 {t('macroTriangleBalance')}</Text>
                            <Text style={styles.insightDescription}>
                                {language === 'Korean' ?
                                    `내부 삼각형은 영양 밸런스를 추적합니다. 현재 ${carbs > protein + fat ? " 탄수화물" : protein > carbs + fat ? " 단백질" : " 균형 잡힌"} 비율로 치우쳐 있습니다.` :
                                    `The inner triangle tracks your balance. Currently, you are leaning towards ${carbs > protein + fat ? " Carbs" : protein > carbs + fat ? " Protein" : " a Balanced ratio"}.`}
                            </Text>
                            <View style={styles.improveBox}>
                                <Text style={styles.improveTitle}>🚀 {t('howToCenterTriangle')}</Text>
                                <Text style={styles.improveText}>
                                    {carbs > protein + fat ?
                                        (language === 'Korean' ? "다음 간식으로는 순수 단백질원(계란 흰자, 닭가슴살)을 추가하세요." : "Add a source of pure protein (egg whites, chicken breast) to your next snack.") :
                                        (language === 'Korean' ? "정말 잘하고 계십니다! 이상적인 대사 건강을 위해 이 밸런스를 유지하세요." : "You're doing great! Maintain this balance for sustained metabolic health.")}
                                </Text>
                            </View>
                        </BlurView>
                    </View>

                    {/* How to reach Grade S */}
                    <View style={styles.reportSection}>
                        <View style={styles.sectionTitleRow}>
                            <TrendingUp size={18} color="#f59e0b" />
                            <Text style={styles.sectionTitle}>{t('goalReachGradeS')}</Text>
                        </View>
                        <LinearGradient colors={['#fff', '#fffbeb']} style={styles.goalCard}>
                            <Text style={styles.goalHint}>
                                {t('reachSLevelHint').replace('%{grade}', grade)}
                            </Text>
                            <View style={styles.checkItem}>
                                <ShieldCheck size={16} color="#10b981" />
                                <Text style={styles.checkText}>{t('vegetableDiversity')}</Text>
                            </View>
                            <View style={styles.checkItem}>
                                <ShieldCheck size={16} color="#10b981" />
                                <Text style={styles.checkText}>{t('proteinGoal').replace('%{count}', Math.max(20, Math.round(protein * 0.5)).toString())}</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    scrollContent: { padding: 24, paddingBottom: 60 },
    row: { flexDirection: 'row', alignItems: 'stretch' },
    heroSection: { alignItems: 'center', marginVertical: 20 },
    heroIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#fff' },
    heroHeadline: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginTop: 16 },
    gradeBadge: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    gradeText: { fontSize: 14, fontWeight: '800', color: '#10b981' },
    reportSection: { marginTop: 32 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
    insightCard: { padding: 20, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: '#fff' },
    insightTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
    insightDescription: { fontSize: 14, color: '#64748b', lineHeight: 20 },
    metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    improveTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    improveTagText: { fontSize: 10, fontWeight: '800', color: '#10b981', textTransform: 'uppercase' },
    improveBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    improveTitle: { fontSize: 13, fontWeight: '800', color: '#10b981', marginBottom: 4 },
    improveText: { fontSize: 13, color: '#334155', lineHeight: 18, fontWeight: '500' },
    blueprintRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 },
    blueprintVisual: { width: 140, height: 140 },
    blueprintLegend: { flex: 1 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    legendSubtext: { fontSize: 12, color: '#94a3b8', marginTop: 10, lineHeight: 18 },
    goalCard: { padding: 24, borderRadius: 32, borderWidth: 1, borderColor: '#fef3c7', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
    goalHint: { fontSize: 16, color: '#92400e', marginBottom: 20, lineHeight: 24 },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    checkText: { fontSize: 14, fontWeight: '600', color: '#451a03' },
});
