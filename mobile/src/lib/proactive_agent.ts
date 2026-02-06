import { getMealLogs } from './meal_service';
import { scheduleLocalNotification, cancelAllNotifications } from './notification_service';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserPreferences = {
    lunch_enabled: boolean;
    lunch_time: { hour: number; minute: number };
    dinner_enabled: boolean;
    dinner_time: { hour: number; minute: number };
};

const PREFS_KEY = 'user_notification_prefs';

const DEFAULT_PREFS: UserPreferences = {
    lunch_enabled: true,
    lunch_time: { hour: 13, minute: 0 },
    dinner_enabled: true,
    dinner_time: { hour: 19, minute: 0 },
};

export const getPreferences = async (): Promise<UserPreferences> => {
    try {
        const stored = await AsyncStorage.getItem(PREFS_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_PREFS;
    } catch {
        return DEFAULT_PREFS;
    }
};

export const savePreferences = async (prefs: UserPreferences) => {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};

/**
 * The Proactive Agent checks the user's meal state and schedules reminders.
 */
export const runProactiveAgent = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await getPreferences();

        // 1. Get today's logs
        const { data: logs, error } = await getMealLogs(user.id);
        if (error) throw error;

        const today = new Date().toDateString();
        const todayLogs = (logs || []).filter(log => new Date(log.created_at).toDateString() === today);

        const lunchLogged = todayLogs.some(l => l.meal_type === 'Lunch');
        const dinnerLogged = todayLogs.some(l => l.meal_type === 'Dinner');

        // 2. Clear existing reminders
        await cancelAllNotifications();

        const now = new Date();

        // 3. Schedule Lunch Reminder
        if (prefs.lunch_enabled && !lunchLogged) {
            const lunchTime = new Date();
            lunchTime.setHours(prefs.lunch_time.hour, prefs.lunch_time.minute, 0);

            if (lunchTime > now) {
                await scheduleLocalNotification(
                    "🍛 Time for Lunch?",
                    "You haven't logged your lunch yet. Take a quick photo to stay on track!",
                    { hour: prefs.lunch_time.hour, minute: prefs.lunch_time.minute, repeats: false }
                );
            }
        }

        // 4. Schedule Dinner Reminder
        if (prefs.dinner_enabled && !dinnerLogged) {
            const dinnerTime = new Date();
            dinnerTime.setHours(prefs.dinner_time.hour, prefs.dinner_time.minute, 0);

            if (dinnerTime > now) {
                await scheduleLocalNotification(
                    "🥗 Dinner Reflection",
                    "Ready for dinner? Don't forget to scan your meal for an AI health score!",
                    { hour: prefs.dinner_time.hour, minute: prefs.dinner_time.minute, repeats: false }
                );
            }
        }

    } catch (err) {
        console.error("Proactive Agent Error:", err);
    }
};
