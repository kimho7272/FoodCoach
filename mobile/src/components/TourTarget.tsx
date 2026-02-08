import React, { useRef, useEffect } from 'react';
import { View, LayoutRectangle, ViewProps } from 'react-native';
import { useTour } from '../context/TourContext';

interface TourTargetProps extends ViewProps {
    id: string;
    children?: React.ReactNode;
}

export const TourTarget: React.FC<TourTargetProps> = ({ id, children, style, ...props }) => {
    const { registerTarget, isActive } = useTour();
    const viewRef = useRef<View>(null);

    const measure = () => {
        if (viewRef.current) {
            viewRef.current.measureInWindow((x, y, width, height) => {
                registerTarget(id, { x, y, width, height });
            });
        }
    };

    useEffect(() => {
        if (isActive) {
            // Give layout a moment to settle
            const timer = setTimeout(measure, 500);
            return () => clearTimeout(timer);
        }
    }, [isActive, id]);

    return (
        <View
            ref={viewRef}
            onLayout={measure}
            style={style}
            {...props}
        >
            {children}
        </View>
    );
};
