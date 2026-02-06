import React, { createContext, useContext, useState, useCallback } from 'react';
import { LayoutRectangle } from 'react-native';

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
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targets, setTargets] = useState<Record<string, LayoutRectangle>>({});

    const steps: TourStep[] = [
        { id: 'welcome', titleKey: 'tourWelcomeTitle', descKey: 'tourWelcomeDesc', targetId: 'screen_center', screen: '/(tabs)' },
        { id: 'readiness', titleKey: 'tourReadinessTitle', descKey: 'tourReadinessDesc', targetId: 'readiness_score', screen: '/(tabs)' },
        { id: 'rings', titleKey: 'tourRingsTitle', descKey: 'tourRingsDesc', targetId: 'progress_rings', screen: '/(tabs)' },
        { id: 'triangle', titleKey: 'tourTriangleTitle', descKey: 'tourTriangleDesc', targetId: 'macro_triangle', screen: '/(tabs)' },
        { id: 'log_food', titleKey: 'tourLogFoodTitle', descKey: 'tourLogFoodDesc', targetId: 'log_food_area', screen: '/(tabs)' },
        { id: 'strategy', titleKey: 'tourStrategyTitle', descKey: 'tourStrategyDesc', targetId: 'strategy_item', screen: '/profile' }
    ];

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsActive(false);
        }
    }, [currentStep, steps.length]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

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
