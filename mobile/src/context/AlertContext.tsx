import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info, HelpCircle, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

type AlertType = 'success' | 'error' | 'info' | 'confirm';

interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface AlertContextData {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<AlertOptions | null>(null);

    const showAlert = useCallback((opts: AlertOptions) => {
        setOptions(opts);
        setVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
    }, []);

    const handleConfirm = () => {
        if (options?.onConfirm) options.onConfirm();
        hideAlert();
    };

    const handleCancel = () => {
        if (options?.onCancel) options.onCancel();
        hideAlert();
    };

    const getIcon = () => {
        const type = options?.type || 'info';
        switch (type) {
            case 'success': return <CheckCircle2 size={40} color="#10b981" />;
            case 'error': return <AlertCircle size={40} color="#ef4444" />;
            case 'confirm': return <HelpCircle size={40} color="#f59e0b" />;
            default: return <Info size={40} color="#3b82f6" />;
        }
    };

    const getColors = () => {
        const type = options?.type || 'info';
        switch (type) {
            case 'success': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
            case 'error': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
            case 'confirm': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
            default: return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
        }
    };

    const colors = getColors();

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <Modal
                transparent
                visible={visible}
                animationType="none"
                onRequestClose={hideAlert}
            >
                <View style={styles.overlay}>
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                    >
                        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={options?.type !== 'confirm' ? hideAlert : undefined} />
                    </Animated.View>

                    <Animated.View
                        entering={ZoomIn}
                        exiting={ZoomOut}
                        style={styles.modalContainer}
                    >
                        <View style={styles.innerContent}>
                            <View style={[styles.iconWrapper, { backgroundColor: colors.bg }]}>
                                {getIcon()}
                            </View>

                            <Text style={styles.title}>{options?.title}</Text>
                            <Text style={styles.message}>{options?.message}</Text>

                            <View style={styles.buttonRow}>
                                {options?.type === 'confirm' && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={handleCancel}
                                    >
                                        <Text style={styles.cancelButtonText}>{options?.cancelText || 'Cancel'}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.button, styles.confirmButton, { backgroundColor: colors.text }]}
                                    onPress={handleConfirm}
                                >
                                    <Text style={styles.confirmButtonText}>
                                        {options?.confirmText || (options?.type === 'confirm' ? 'Confirm' : 'OK')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    innerContent: {
        padding: 32,
        alignItems: 'center',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
