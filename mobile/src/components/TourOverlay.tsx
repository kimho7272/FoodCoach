import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, LayoutRectangle } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTour } from '../context/TourContext';
import { useTranslation } from '../lib/i18n';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export const TourOverlay: React.FC = () => {
    const { isActive, currentStep, steps, targets, nextStep, skipTour } = useTour();
    const { t } = useTranslation();

    if (!isActive) return null;

    const currentStepData = steps[currentStep];
    const targetLayout = targets[currentStepData.targetId];

    // Special case for welcome step (screen center)
    const isWelcome = currentStepData.targetId === 'screen_center';

    const getHole = () => {
        if (isWelcome || !targetLayout) return { cx: 0, cy: 0, r: 0 };
        return {
            cx: targetLayout.x + targetLayout.width / 2,
            cy: targetLayout.y + targetLayout.height / 2,
            r: Math.max(targetLayout.width, targetLayout.height) / 2 + 10
        };
    };

    const hole = getHole();

    const tooltipStyle = useAnimatedStyle(() => {
        if (isWelcome || !targetLayout) {
            return {
                top: height / 2 - 100,
                left: 20,
                right: 20,
            };
        }

        const isLow = hole.cy > height / 2;
        return {
            top: withTiming(isLow ? hole.cy - hole.r - 180 : hole.cy + hole.r + 20),
            left: 20,
            right: 20,
        };
    });

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
                        {!isWelcome && (
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
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#mask)"
                />
            </Svg>

            <Animated.View style={[styles.tooltipContainer, tooltipStyle]}>
                <BlurView intensity={80} tint="light" style={styles.glassCard}>
                    <View style={styles.cardContent}>
                        <Text style={styles.title}>{t(currentStepData.titleKey as any)}</Text>
                        <Text style={styles.desc}>{t(currentStepData.descKey as any)}</Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity onPress={skipTour} style={styles.skipBtn}>
                                <Text style={styles.skipText}>{t('skipTour')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={nextStep} style={styles.nextBtn}>
                                <Text style={styles.nextText}>
                                    {currentStep === steps.length - 1 ? t('finishTour') : t('nextStep')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    nextText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
