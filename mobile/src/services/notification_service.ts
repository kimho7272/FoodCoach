import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification behavior ONLY IF NOT IN EXPO GO (to avoid SDK 53+ warnings)
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export const notificationService = {
    /**
     * Get the Expo Push Token for the current device and update it in the user's profile.
     */
    async registerForPushNotifications(): Promise<string | null> {
        // Expo Go on Android no longer supports remote push notifications as of SDK 53.
        if (isExpoGo) {
            console.log('Skipping push token registration: Push notifications are not supported in Expo Go.');
            return null;
        }

        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

        try {
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Push Token Obtained:', token);

            // Update profile with the token
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await (supabase as any)
                    .from('profiles')
                    .update({ push_token: token })
                    .eq('id', user.id);
            }

            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            return token;
        } catch (e) {
            console.error('Error getting push token:', e);
            return null;
        }
    },

    /**
     * Send a push notification using Expo Push API
     */
    async sendFriendRequestNotification(targetToken: string, requesterName: string) {
        if (!targetToken) return;

        const message = {
            to: targetToken,
            sound: 'default',
            title: '🤝 New Friend Request',
            body: `${requesterName} wants to connect with you!`,
            data: { type: 'friend_request' },
        };

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
            const res = await response.json();
            console.log('Notification Response:', res);
        } catch (e) {
            console.error('Error sending notification:', e);
        }
    }
};
