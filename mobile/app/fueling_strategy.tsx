import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Zap, Target, Activity, Flame, Dumbbell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../src/lib/i18n';
import { theme } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export type FuelingStrategy = {
    goal: 'steady' | 'peak' | 'weight' | 'muscle';
    calorieTargetType: 'smart' | 'manual';
    manualCalorieTarget: number;
    macroProfile: 'balanced' | 'performance' | 'keto' | 'protein';
    activityLevel: 'sedentary' | 'moderate' | 'elite';
};

const STRATEGY_KEY = 'user_fueling_strategy';
const DEFAULT_STRATEGY: FuelingStrategy = {
    goal: 'steady',
    calorieTargetType: 'smart',
    manualCalorieTarget: 2000,
    macroProfile: 'balanced',
    activityLevel: 'moderate',
};

export default function FuelingStrategyScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [strategy, setStrategy] = useState<FuelingStrategy>(DEFAULT_STRATEGY);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
        loadStrategy();
    }, []);

    const loadSettings = async () => {
        try {
            const haptics = await AsyncStorage.getItem('haptics_enabled');
            if (haptics !== null) setHapticsEnabled(JSON.parse(haptics));
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const loadStrategy = async () => {
        try {
            const stored = await AsyncStorage.getItem(STRATEGY_KEY);
            if (stored) setStrategy(JSON.parse(stored));
        } catch (e) {
            console.error("Failed to load strategy", e);
        }
    };

    const triggerHaptic = (type: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
        if (hapticsEnabled) {
            Haptics.impactAsync(type);
        }
    };

    const handleSaveStrategy = async (newStrategy: FuelingStrategy) => {
        triggerHaptic();
        setStrategy(newStrategy);
        await AsyncStorage.setItem(STRATEGY_KEY, JSON.stringify(newStrategy));
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.colors.gradients.background as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                            <ArrowLeft size={24} color={theme.colors.text.primary} />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('fuelingStrategyTitle') || 'Fueling Strategy'}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Metabolic Goal */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('metabolicGoal') || 'Metabolic Goal'}</Text>
                        <View style={styles.optionsList}>
                            {[
                                { id: 'steady', title: t('goalSteadyEnergy') || 'Steady Energy', desc: t('goalSteadyEnergyDesc'), icon: Target, color: theme.colors.primary },
                                { id: 'peak', title: t('goalMetabolicPeak') || 'Metabolic Peak', desc: t('goalMetabolicPeakDesc'), icon: Flame, color: theme.colors.accent },
                                { id: 'weight', title: t('goalWeightLoss') || 'Weight Control', desc: t('goalWeightLossDesc'), icon: Activity, color: theme.colors.secondary },
                                { id: 'muscle', title: t('goalMuscleBuild') || 'Muscle Growth', desc: t('goalMuscleBuildDesc'), icon: Dumbbell, color: '#f87171' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleSaveStrategy({ ...strategy, goal: item.id as any })}
                                >
                                    <BlurView
                                        intensity={40}
                                        tint="light"
                                        style={[styles.optionItem, strategy.goal === item.id && styles.optionItemActive]}
                                    >
                                        <View style={[styles.optionIcon, { backgroundColor: `${item.color}15` }]}>
                                            <item.icon size={22} color={item.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.optionTitle, strategy.goal === item.id && styles.optionTitleActive]}>
                                                {item.title}
                                            </Text>
                                            <Text style={styles.optionDesc} numberOfLines={2}>{item.desc}</Text>
                                        </View>
                                        {strategy.goal === item.id && (
                                            <View style={styles.activeCheck}>
                                                <Zap size={14} color={theme.colors.text.inverse} />
                                            </View>
                                        )}
                                    </BlurView>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Calorie Target */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('calorieTarget') || 'Calorie Target'}</Text>
                        <BlurView intensity={40} tint="light" style={styles.adjustCard}>
                            <View style={styles.toggleRow}>
                                <TouchableOpacity
                                    onPress={() => handleSaveStrategy({ ...strategy, calorieTargetType: 'smart' })}
                                    style={[styles.toggleBtn, strategy.calorieTargetType === 'smart' && styles.toggleBtnActive]}
                                >
                                    <Text style={[styles.toggleBtnText, strategy.calorieTargetType === 'smart' && styles.toggleBtnTextActive]}>{t('smartTarget') || 'Smart AI'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleSaveStrategy({ ...strategy, calorieTargetType: 'manual' })}
                                    style={[styles.toggleBtn, strategy.calorieTargetType === 'manual' && styles.toggleBtnActive]}
                                >
                                    <Text style={[styles.toggleBtnText, strategy.calorieTargetType === 'manual' && styles.toggleBtnTextActive]}>{t('manualTarget') || 'Manual'}</Text>
                                </TouchableOpacity>
                            </View>

                            {strategy.calorieTargetType === 'manual' && (
                                <View style={styles.manualAdjustRow}>
                                    <TouchableOpacity
                                        onPress={() => handleSaveStrategy({ ...strategy, manualCalorieTarget: Math.max(1200, strategy.manualCalorieTarget - 50) })}
                                        style={styles.adjustBtn}
                                    >
                                        <Text style={styles.adjustBtnText}>-</Text>
                                    </TouchableOpacity>
                                    <View style={styles.valueDisplay}>
                                        <Text style={styles.adjustValue}>{strategy.manualCalorieTarget}</Text>
                                        <Text style={styles.adjustUnit}>kcal</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleSaveStrategy({ ...strategy, manualCalorieTarget: strategy.manualCalorieTarget + 50 })}
                                        style={styles.adjustBtn}
                                    >
                                        <Text style={styles.adjustBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </BlurView>
                    </View>

                    {/* Macro Profile */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('macroProfile') || 'Macro Profile'}</Text>
                        <View style={styles.macroGrid}>
                            {[
                                { id: 'balanced', title: t('balancedMacros') || 'Balanced' },
                                { id: 'performance', title: t('performanceMacros') || 'Performance' },
                                { id: 'keto', title: t('ketoMacros') || 'Ketogenic' },
                                { id: 'protein', title: t('highProteinMacros') || 'High Protein' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={{ width: '48%' }}
                                    onPress={() => handleSaveStrategy({ ...strategy, macroProfile: item.id as any })}
                                >
                                    <BlurView
                                        intensity={30}
                                        tint="light"
                                        style={[styles.macroItem, strategy.macroProfile === item.id && styles.macroItemActive]}
                                    >
                                        <Text style={[styles.macroTitle, strategy.macroProfile === item.id && styles.macroTitleActive]}>
                                            {item.title}
                                        </Text>
                                        {strategy.macroProfile === item.id && <Zap size={14} color={theme.colors.primary} style={{ marginTop: 4 }} />}
                                    </BlurView>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Activity Level */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('activityLevel') || 'Daily Activity'}</Text>
                        <BlurView intensity={30} tint="light" style={styles.activityCard}>
                            <View style={styles.activityToggle}>
                                {[
                                    { id: 'sedentary', title: t('sedentary') || 'Low' },
                                    { id: 'moderate', title: t('moderate') || 'Active' },
                                    { id: 'elite', title: t('eliteAthlete') || 'Elite' },
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => handleSaveStrategy({ ...strategy, activityLevel: item.id as any })}
                                        style={[styles.activityBtn, strategy.activityLevel === item.id && styles.activityBtnActive]}
                                    >
                                        <Text style={[styles.activityBtnText, strategy.activityLevel === item.id && styles.activityBtnTextActive]}>
                                            {item.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </BlurView>
                    </View>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    iconBlur: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    scrollContent: { padding: 24, paddingTop: 12 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.text.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 4 },
    optionsList: { gap: 12 },
    optionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    optionItemActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    optionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    optionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.secondary, marginBottom: 2 },
    optionTitleActive: { color: theme.colors.text.primary },
    optionDesc: { fontSize: 12, color: theme.colors.text.muted, lineHeight: 16 },
    activeCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    adjustCard: { borderRadius: 24, padding: 8, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 4 },
    toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    toggleBtnActive: { backgroundColor: theme.colors.background.secondary },
    toggleBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.text.muted },
    toggleBtnTextActive: { color: theme.colors.text.primary },
    manualAdjustRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
    adjustBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.glass.border },
    adjustBtnText: { fontSize: 24, color: theme.colors.primary, fontWeight: '500' },
    valueDisplay: { alignItems: 'center' },
    adjustValue: { fontSize: 28, fontWeight: '900', color: theme.colors.text.primary },
    adjustUnit: { fontSize: 12, color: theme.colors.text.muted, fontWeight: '700', textTransform: 'uppercase' },
    macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    macroItem: { padding: 20, borderRadius: 20, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    macroItemActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    macroTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.secondary, textAlign: 'center' },
    macroTitleActive: { color: theme.colors.text.primary },
    activityCard: { borderRadius: 20, padding: 6, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.glass.border },
    activityToggle: { flexDirection: 'row', gap: 6 },
    activityBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    activityBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    activityBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.text.muted },
    activityBtnTextActive: { color: theme.colors.primary }
});
