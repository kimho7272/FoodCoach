import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export const authenticateBiometric = async (): Promise<boolean> => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
            return true; // Fallback if no biometrics available
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Lock FoodCoach',
            fallbackLabel: 'Use Passcode',
            disableDeviceFallback: false,
        });

        return result.success;
    } catch (error) {
        console.error('Biometric Auth Error:', error);
        return false;
    }
};
