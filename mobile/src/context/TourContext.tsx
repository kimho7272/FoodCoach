import React, { createContext, useContext, useState, useCallback } from 'react';
import { LayoutRectangle } from 'react-native';

import { useRouter } from 'expo-router';

export type TourStep = {
    id: string;
    titleKey: string;
    descKey: string;
    targetId: string;
    screen: string;
};

type TourContextType = {
    currentStep: number;
    isActive: boolean;
    steps: TourStep[];
    targets: Record<string, LayoutRectangle>;
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    registerTarget: (id: string, layout: LayoutRectangle) => void;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targets, setTargets] = useState<Record<string, LayoutRectangle>>({});

    const steps: TourStep[] = [
        { id: 'welcome', titleKey: 'tourWelcomeTitle', descKey: 'tourWelcomeDesc', targetId: 'screen_center', screen: '/' },
        { id: 'readiness', titleKey: 'tourReadinessTitle', descKey: 'tourReadinessDesc', targetId: 'readiness_score', screen: '/' },
        { id: 'rings', titleKey: 'tourRingsTitle', descKey: 'tourRingsDesc', targetId: 'progress_rings', screen: '/' },
        { id: 'triangle', titleKey: 'tourTriangleTitle', descKey: 'tourTriangleDesc', targetId: 'macro_triangle', screen: '/' },
        { id: 'log_food', titleKey: 'tourLogFoodTitle', descKey: 'tourLogFoodDesc', targetId: 'log_food_area', screen: '/' },
        { id: 'stats_highlight', titleKey: 'tourStatsHighlightTitle', descKey: 'tourStatsHighlightDesc', targetId: 'stats_highlight', screen: '/stats' },
        { id: 'stats_trend', titleKey: 'tourStatsTrendTitle', descKey: 'tourStatsTrendDesc', targetId: 'stats_trend', screen: '/stats' },
        { id: 'stats_diversity', titleKey: 'tourStatsDiversityTitle', descKey: 'tourStatsDiversityDesc', targetId: 'stats_diversity', screen: '/stats' },
        { id: 'completed', titleKey: 'tourCompletedTitle', descKey: 'tourCompletedDesc', targetId: 'screen_center', screen: '/profile' }
    ];

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
        router.push(steps[0].screen as any);
    }, [router, steps]);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            const nextIdx = currentStep + 1;
            if (steps[nextIdx].screen !== steps[currentStep].screen) {
                router.push(steps[nextIdx].screen as any);
            }
            setCurrentStep(nextIdx);
        } else {
            setIsActive(false);
        }
    }, [currentStep, steps, router]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            const prevIdx = currentStep - 1;
            if (steps[prevIdx].screen !== steps[currentStep].screen) {
                router.push(steps[prevIdx].screen as any);
            }
            setCurrentStep(prevIdx);
        }
    }, [currentStep, steps, router]);

    const skipTour = useCallback(() => {
        setIsActive(false);
    }, []);

    const registerTarget = useCallback((id: string, layout: LayoutRectangle) => {
        setTargets(prev => ({ ...prev, [id]: layout }));
    }, []);

    return (
        <TourContext.Provider value={{
            currentStep,
            isActive,
            steps,
            targets,
            startTour,
            nextStep,
            prevStep,
            skipTour,
            registerTarget
        }}>
            {children}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) throw new Error('useTour must be used within a TourProvider');
    return context;
};
