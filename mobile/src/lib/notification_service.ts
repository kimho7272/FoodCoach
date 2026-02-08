// import * as Notifications from 'expo-notifications'; // Temporarily disabled due to Expo Go Android SDK 54 crash
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Mock Notifications object to prevent errors
const Notifications: any = {
    setNotificationHandler: () => { },
    scheduleNotificationAsync: async () => { },
    cancelAllScheduledNotificationsAsync: async () => { },
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getPermissionsAsync: async () => ({ status: 'granted' }),
    setNotificationChannelAsync: async () => { },
    AndroidImportance: { MAX: 4 },
};

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const registerForPushNotificationsAsync = async () => {
    console.log('Notifications: Skip registration to prevent crash in Expo Go Android');
    return null;
};

export const scheduleLocalNotification = async (title: string, body: string, trigger: any) => {
    // console.log('Notifications (Stub):', title, body);
};

export const cancelAllNotifications = async () => {
    // console.log('Notifications (Stub): Cancel all');
};
