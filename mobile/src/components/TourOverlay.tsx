import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, LayoutRectangle, Platform } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTour } from '../context/TourContext';
import { useTranslation } from '../lib/i18n';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, ChevronLeft, X, Sparkles, Target, Activity, PieChart, Camera, BarChart3, TrendingUp, Zap, Settings } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const StepIcon = ({ id, color = "#10b981", size = 24 }: { id: string, color?: string, size?: number }) => {
    switch (id) {
        case 'welcome': return <Sparkles size={size} color={color} />;
        case 'readiness': return <Activity size={size} color={color} />;
        case 'rings': return <Target size={size} color={color} />;
        case 'triangle': return <PieChart size={size} color={color} />;
        case 'log_food': return <Camera size={size} color={color} />;
        case 'stats_highlight': return <BarChart3 size={size} color={color} />;
        case 'stats_trend': return <TrendingUp size={size} color={color} />;
        case 'stats_diversity': return <Zap size={size} color={color} />;
        case 'strategy': return <Settings size={size} color={color} />;
        default: return <Sparkles size={size} color={color} />;
    }
};

export const TourOverlay: React.FC = () => {
    const { isActive, currentStep, steps, targets, nextStep, prevStep, skipTour } = useTour();
    const { t, language } = useTranslation();

    const currentStepData = steps[currentStep] || steps[0];
    const targetLayout = targets[currentStepData?.targetId];
    const isWelcome = currentStepData?.targetId === 'screen_center' && currentStepData?.id === 'welcome';
    const isCompleted = currentStepData?.id === 'completed';
    const isCenter = isWelcome || isCompleted;

    const getHole = () => {
        if (!isActive || isCenter || !targetLayout) return { cx: 0, cy: 0, r: 0 };
        return {
            cx: targetLayout.x + targetLayout.width / 2,
            cy: targetLayout.y + targetLayout.height / 2,
            r: Math.max(targetLayout.width, targetLayout.height) / 2 + 15
        };
    };

    const hole = getHole();

    const tooltipStyle = useAnimatedStyle(() => {
        if (!isActive) return { opacity: 0 };

        if (isCenter || !targetLayout) {
            return {
                top: withTiming(height / 2 - 140),
                left: 24,
                right: 24,
                opacity: 1
            };
        }

        const isLow = hole.cy > height / 2;
        // Adjust for small targets to ensure tooltip is visible
        const offset = hole.r < 40 ? 40 : hole.r;
        return {
            top: withTiming(isLow ? hole.cy - offset - 320 : hole.cy + offset + 20),
            left: 24,
            right: 24,
            opacity: 1
        };
    });

    if (!isActive) return null;

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none"
        >
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <Mask id="mask">
                        <Rect height="100%" width="100%" fill="white" />
                        {!isCenter && (
                            <Circle
                                cx={hole.cx}
                                cy={hole.cy}
                                r={hole.r}
                                fill="black"
                            />
                        )}
                    </Mask>
                </Defs>
                <Rect
                    height="100%"
                    width="100%"
                    fill="rgba(0,0,0,0.8)"
                    mask="url(#mask)"
                />
            </Svg>

            <Animated.View style={[styles.tooltipContainer, tooltipStyle]}>
                {isWelcome ? (
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.welcomeCard}
                    >
                        <View style={styles.welcomeEmojiContainer}>
                            <StepIcon id="welcome" color="white" size={40} />
                        </View>
                        <Text style={styles.welcomeTitle}>{t(currentStepData.titleKey as any)}</Text>
                        <Text style={styles.welcomeDesc}>{t(currentStepData.descKey as any)}</Text>

                        <TouchableOpacity onPress={nextStep} style={styles.welcomeBtn}>
                            <Text style={styles.welcomeBtnText}>{t('nextStep')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={skipTour} style={styles.welcomeSkipBtn}>
                            <Text style={styles.welcomeSkipText}>{t('skipTour')}</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                ) : isCompleted ? (
                    <LinearGradient
                        colors={['#3b82f6', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.welcomeCard}
                    >
                        <View style={styles.welcomeEmojiContainer}>
                            <Sparkles size={40} color="white" />
                        </View>
                        <Text style={styles.welcomeTitle}>{t(currentStepData.titleKey as any)}</Text>
                        <Text style={styles.welcomeDesc}>{t(currentStepData.descKey as any)}</Text>

                        <TouchableOpacity onPress={skipTour} style={styles.welcomeBtn}>
                            <Text style={[styles.welcomeBtnText, { color: '#2563eb' }]}>{t('finishTour')}</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                ) : (
                    <BlurView intensity={90} tint="light" style={styles.glassCard}>
                        {/* Progress Bar */}
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.headerRow}>
                                <View style={styles.iconContainer}>
                                    <StepIcon id={currentStepData.id} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.stepIndicator}>{currentStep + 1} / {steps.length}</Text>
                                    <Text style={styles.title}>{t(currentStepData.titleKey as any)}</Text>
                                </View>
                                <TouchableOpacity onPress={skipTour} style={styles.closeIconBtn}>
                                    <X size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.desc}>{t(currentStepData.descKey as any)}</Text>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity onPress={prevStep} style={[styles.navBtn, currentStep === 0 && { opacity: 0 }]} disabled={currentStep === 0}>
                                    <ChevronLeft size={20} color="#64748b" />
                                    <Text style={styles.navBtnText}>{language === 'Korean' ? '이전' : 'Back'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={nextStep} style={styles.nextBtn}>
                                    <Text style={styles.nextBtnText}>
                                        {currentStep === steps.length - 1 ? t('finishTour') : t('nextStep')}
                                    </Text>
                                    <ChevronRight size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                )}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    tooltipContainer: {
        position: 'absolute',
        zIndex: 1000,
    },
    glassCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardContent: {
        padding: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    desc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    skipText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    nextBtn: {
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    navBtnText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        marginRight: 4,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10b981',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIndicator: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    closeIconBtn: {
        padding: 8,
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    welcomeCard: {
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 10,
    },
    welcomeEmojiContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 32,
    },
    welcomeDesc: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontWeight: '600',
    },
    welcomeBtn: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    welcomeBtnText: {
        color: '#059669',
        fontSize: 18,
        fontWeight: '800',
    },
    welcomeSkipBtn: {
        marginTop: 20,
        padding: 10,
    },
    welcomeSkipText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '700',
    },
});
