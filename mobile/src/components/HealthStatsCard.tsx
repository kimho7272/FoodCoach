import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '../lib/i18n';
import { BlurView } from 'expo-blur';
import { HealthData } from '../services/health_service';
import { useHealth } from '../context/HealthContext';
import { Footprints, Moon, Flame, TrendingUp, Weight, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, withTiming, useSharedValue, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HealthStatsCardProps {
    refreshTrigger?: number; // Prop to trigger refresh from parent
}

export const HealthStatsCard: React.FC<HealthStatsCardProps> = () => {
    const { healthData } = useHealth();
    const { t } = useTranslation();
    const router = useRouter(); // Initialize router

    const stepsProgress = useSharedValue(0);
    const sleepProgress = useSharedValue(0);

    const radius = 25;
    const circumference = 2 * Math.PI * radius;

    const animatedStepProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - stepsProgress.value),
    }));

    const animatedSleepProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - sleepProgress.value),
    }));

    useEffect(() => {
        if (healthData) {
            // Animate rings
            const stepGoal = 10000;
            stepsProgress.value = withTiming(Math.min(healthData.steps / stepGoal, 1), { duration: 1500 });

            const sleepGoal = 480; // 8 hours
            sleepProgress.value = withTiming(Math.min(healthData.sleepMinutes / sleepGoal, 1), { duration: 1500 });
        }
    }, [healthData]);

    // User requested to HIDE card if disconnected
    if (!healthData || !healthData.isConnected) {
        return null;
    }

    const data = healthData; // Alias for easier refactoring below

    const formatSleep = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/health/details')}>
            <Animated.View entering={FadeIn} style={styles.container}>
                <View style={styles.row}>
                    {/* Steps Item */}
                    <View style={styles.statItem}>
                        <View style={styles.ringContainer}>
                            <Svg width={60} height={60} viewBox="0 0 60 60">
                                <Circle cx="30" cy="30" r={radius} stroke="rgba(16, 185, 129, 0.15)" strokeWidth="5.5" fill="none" />
                                <AnimatedCircle
                                    cx="30" cy="30" r={radius}
                                    stroke="#10b981"
                                    strokeWidth="5.5"
                                    fill="none"
                                    strokeDasharray={`${circumference}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 30 30)"
                                    animatedProps={animatedStepProps}
                                />
                            </Svg>
                            <View style={styles.iconCenter}>
                                <Footprints size={16} color="#10b981" />
                            </View>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.label}>{t('steps')}</Text>
                            <Text style={styles.value}>{data.steps.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Sleep Item */}
                    <View style={styles.statItem}>
                        <View style={styles.ringContainer}>
                            <Svg width={60} height={60} viewBox="0 0 60 60">
                                <Circle cx="30" cy="30" r={radius} stroke="rgba(59, 130, 246, 0.15)" strokeWidth="5.5" fill="none" />
                                <AnimatedCircle
                                    cx="30" cy="30" r={radius}
                                    stroke="#3b82f6"
                                    strokeWidth="5.5"
                                    fill="none"
                                    strokeDasharray={`${circumference}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 30 30)"
                                    animatedProps={animatedSleepProps}
                                />
                            </Svg>
                            <View style={styles.iconCenter}>
                                <Moon size={16} color="#3b82f6" />
                            </View>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.label}>{t('sleep')}</Text>
                            <Text style={styles.value}>{formatSleep(data.sleepMinutes)}</Text>
                        </View>
                    </View>

                    {/* Active Calories (Burned vs Intake handled in main ring, this is just burn) */}
                    <View style={styles.statItem}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                            <Flame size={20} color="#f97316" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.label}>{t('burned')}</Text>
                            <Text style={[styles.value, { color: '#f97316' }]}>{data.caloriesBurned}</Text>
                        </View>
                    </View>
                </View>

                {/* Readiness Score Row */}
                {/* Readiness Score Row */}
                {typeof data.readinessScore === 'number' && (
                    <LinearGradient
                        colors={
                            data.readinessScore > 80 ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'] :
                                data.readinessScore > 50 ? ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)'] :
                                    ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.readinessCard, {
                            borderColor: data.readinessScore > 80 ? 'rgba(16, 185, 129, 0.3)' :
                                data.readinessScore > 50 ? 'rgba(245, 158, 11, 0.3)' :
                                    'rgba(239, 68, 68, 0.3)'
                        }]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <View style={[styles.iconBoxSmall, { backgroundColor: data.readinessScore > 80 ? theme.colors.primary : data.readinessScore > 50 ? theme.colors.accent : theme.colors.danger }]}>
                                        <Activity size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.readinessLabel}>{t('dailyReadiness')}</Text>
                                </View>
                                <Text style={styles.readinessInsight}>
                                    {data.readinessScore > 80 ? t('primeState') : data.readinessScore > 50 ? t('steadyPace') : t('focusOnRecovery')}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.readinessScore, { color: data.readinessScore > 80 ? theme.colors.primary : data.readinessScore > 50 ? theme.colors.accent : theme.colors.danger }]}>
                                    {data.readinessScore}
                                </Text>
                                <Text style={styles.readinessScale}>/100</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarBg}>
                            <Animated.View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${data.readinessScore}%`,
                                        backgroundColor: data.readinessScore > 80 ? theme.colors.primary : data.readinessScore > 50 ? theme.colors.accent : theme.colors.danger
                                    }
                                ]}
                            />
                        </View>
                    </LinearGradient>
                )}

                {/* Expanded Details Row (Weight, etc.) */}
                {data.weight && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Weight size={14} color="#64748b" />
                            <Text style={styles.detailText}>{data.weight} kg</Text>
                        </View>
                        {data.exerciseSessions && data.exerciseSessions.length > 0 && (
                            <View style={styles.detailItem}>
                                <TrendingUp size={14} color="#64748b" />
                                <Text style={styles.detailText}>{data.exerciseSessions[0].type} ({Math.round(data.exerciseSessions[0].duration)}m)</Text>
                            </View>
                        )}
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.glass.card,
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Changed to space-around for even distribution
        alignItems: 'flex-start', // Align tops if heights differ, or center
        paddingVertical: 10,
    },
    statItem: {
        flex: 1,
        flexDirection: 'column', // Stack vertically to save horizontal space
        alignItems: 'center',
        gap: 8,
    },
    ringContainer: {
        width: 60, // Match SVG width
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCenter: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'center', // Center text
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
        textAlign: 'center',
    },
    value: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    iconBox: {
        width: 50, // Match ring visual size roughly
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5, // Visual alignment with rings
    },
    connectContainer: {
        marginBottom: 20,
    },
    connectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.3)',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
    },
    connectText: {
        fontWeight: 'bold',
        color: '#10b981',
        fontSize: 14,
    },
    detailRow: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    readinessCard: {
        marginTop: 20,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    iconBoxSmall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    readinessLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    readinessScore: {
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 32,
    },
    readinessScale: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    readinessInsight: {
        fontSize: 13,
        color: theme.colors.text.primary,
        fontWeight: '600',
        maxWidth: 200,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: theme.colors.glass.highlight,
        borderRadius: 3,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    }
});
