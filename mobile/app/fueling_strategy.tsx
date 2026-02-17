import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Zap, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../src/lib/i18n';

const { width } = Dimensions.get('window');

// Type Definition (Same as in profile.tsx for now, ideally moved to types file)
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

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('fuelingStrategyTitle')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Metabolic Goal */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('metabolicGoal')}</Text>
                        <View style={styles.optionsList}>
                            {[
                                { id: 'steady', title: t('goalSteadyEnergy'), desc: t('goalSteadyEnergyDesc'), emoji: '💎' },
                                { id: 'peak', title: t('goalMetabolicPeak'), desc: t('goalMetabolicPeakDesc'), emoji: '🔥' },
                                { id: 'weight', title: t('goalWeightLoss'), desc: t('goalWeightLossDesc'), emoji: '🥗' },
                                { id: 'muscle', title: t('goalMuscleBuild'), desc: t('goalMuscleBuildDesc'), emoji: '💪' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.optionItem, strategy.goal === item.id && styles.optionItemActive]}
                                    onPress={() => handleSaveStrategy({ ...strategy, goal: item.id as any })}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionTitle, strategy.goal === item.id && styles.optionTitleActive]}>
                                            {item.emoji} {item.title}
                                        </Text>
                                        <Text style={styles.optionDesc}>{item.desc}</Text>
                                    </View>
                                    {strategy.goal === item.id && <Zap size={18} color="#10b981" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Calorie Target */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('calorieTarget')}</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                onPress={() => handleSaveStrategy({ ...strategy, calorieTargetType: 'smart' })}
                                style={[styles.toggleBtn, strategy.calorieTargetType === 'smart' && styles.toggleBtnActive]}
                            >
                                <Text style={[styles.toggleBtnText, strategy.calorieTargetType === 'smart' && styles.toggleBtnTextActive]}>{t('smartTarget')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleSaveStrategy({ ...strategy, calorieTargetType: 'manual' })}
                                style={[styles.toggleBtn, strategy.calorieTargetType === 'manual' && styles.toggleBtnActive]}
                            >
                                <Text style={[styles.toggleBtnText, strategy.calorieTargetType === 'manual' && styles.toggleBtnTextActive]}>{t('manualTarget')}</Text>
                            </TouchableOpacity>
                        </View>

                        {strategy.calorieTargetType === 'manual' && (
                            <View style={styles.manualAdjustRow}>
                                <TouchableOpacity onPress={() => handleSaveStrategy({ ...strategy, manualCalorieTarget: Math.max(1200, strategy.manualCalorieTarget - 50) })} style={styles.adjustBtn}>
                                    <Text style={styles.adjustBtnText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.adjustValue}>{strategy.manualCalorieTarget} kcal</Text>
                                <TouchableOpacity onPress={() => handleSaveStrategy({ ...strategy, manualCalorieTarget: strategy.manualCalorieTarget + 50 })} style={styles.adjustBtn}>
                                    <Text style={styles.adjustBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Macro Profile */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('macroProfile')}</Text>
                        <View style={styles.optionsList}>
                            {[
                                { id: 'balanced', title: t('balancedMacros') },
                                { id: 'performance', title: t('performanceMacros') },
                                { id: 'keto', title: t('ketoMacros') },
                                { id: 'protein', title: t('highProteinMacros') },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.optionItem, strategy.macroProfile === item.id && styles.optionItemActive]}
                                    onPress={() => handleSaveStrategy({ ...strategy, macroProfile: item.id as any })}
                                >
                                    <Text style={[styles.optionTitle, strategy.macroProfile === item.id && styles.optionTitleActive, { fontSize: 15 }]}>
                                        {item.title}
                                    </Text>
                                    {strategy.macroProfile === item.id && <Zap size={16} color="#10b981" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Activity Level */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('activityLevel')}</Text>
                        <View style={styles.toggleRow}>
                            {[
                                { id: 'sedentary', title: t('sedentary') },
                                { id: 'moderate', title: t('moderate') },
                                { id: 'elite', title: t('eliteAthlete') },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleSaveStrategy({ ...strategy, activityLevel: item.id as any })}
                                    style={[styles.toggleBtn, strategy.activityLevel === item.id && styles.toggleBtnActive]}
                                >
                                    <Text style={[styles.toggleBtnText, strategy.activityLevel === item.id && styles.toggleBtnTextActive, { fontSize: 11 }]}>
                                        {item.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    scrollContent: { padding: 20 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    optionsList: { gap: 12 },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    optionItemActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
    optionTitle: { fontSize: 16, fontWeight: '600', color: '#475569', marginBottom: 2 },
    optionTitleActive: { color: '#0f172a', fontWeight: '700' },
    optionDesc: { fontSize: 12, color: '#94a3b8' },
    toggleRow: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, gap: 4 },
    toggleBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    toggleBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' },
    toggleBtnTextActive: { color: '#0f172a', fontWeight: '700' },
    manualAdjustRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 8, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    adjustBtn: { width: 36, height: 36, backgroundColor: '#f1f5f9', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    adjustBtnText: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
    adjustValue: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
});
