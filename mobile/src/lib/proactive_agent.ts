import { getMealLogs } from './meal_service';
import { scheduleLocalNotification, cancelAllNotifications } from './notification_service';
import { supabase } from './supabase';

export type UserPreferences = {
    reminders_enabled: boolean;
    lunch_reminder_time: { hour: number; minute: number }; // e.g., 13:00
    dinner_reminder_time: { hour: number; minute: number }; // e.g., 19:00
};

const DEFAULT_PREFS: UserPreferences = {
    reminders_enabled: true,
    lunch_reminder_time: { hour: 13, minute: 0 },
    dinner_reminder_time: { hour: 19, minute: 0 },
};

/**
 * The Proactive Agent checks the user's meal state and schedules reminders.
 * This should be called:
 * 1. On app launch
 * 2. After logging a meal
 */
export const runProactiveAgent = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get today's logs
        const { data: logs, error } = await getMealLogs(user.id);
        if (error) throw error;

        const today = new Date().toDateString();
        const todayLogs = (logs || []).filter(log => new Date(log.created_at).toDateString() === today);

        const lunchLogged = todayLogs.some(l => l.meal_type === 'Lunch');
        const dinnerLogged = todayLogs.some(l => l.meal_type === 'Dinner');

        // 2. Clear existing reminders to avoid duplicates
        await cancelAllNotifications();

        if (!DEFAULT_PREFS.reminders_enabled) return;

        // 3. Schedule Lunch Reminder if not logged
        if (!lunchLogged) {
            const now = new Date();
            const lunchTime = new Date();
            lunchTime.setHours(DEFAULT_PREFS.lunch_reminder_time.hour, DEFAULT_PREFS.lunch_reminder_time.minute, 0);

            // Only schedule if the time hasn't passed yet today
            if (lunchTime > now) {
                await scheduleLocalNotification(
                    "🍛 Time for Lunch?",
                    "You haven't logged your lunch yet. Take a quick photo to stay on track!",
                    { hour: DEFAULT_PREFS.lunch_reminder_time.hour, minute: DEFAULT_PREFS.lunch_reminder_time.minute, repeats: false }
                );
                console.log("Agent: Scheduled lunch reminder");
            }
        }

        // 4. Schedule Dinner Reminder if not logged
        if (!dinnerLogged) {
            const now = new Date();
            const dinnerTime = new Date();
            dinnerTime.setHours(DEFAULT_PREFS.dinner_reminder_time.hour, DEFAULT_PREFS.dinner_reminder_time.minute, 0);

            if (dinnerTime > now) {
                await scheduleLocalNotification(
                    "🥗 Dinner Reflection",
                    "Ready for dinner? Don't forget to scan your meal for an AI health score!",
                    { hour: DEFAULT_PREFS.dinner_reminder_time.hour, minute: DEFAULT_PREFS.dinner_reminder_time.minute, repeats: false }
                );
                console.log("Agent: Scheduled dinner reminder");
            }
        }

        // 5. Proactive Motivation (if everything is logged)
        if (lunchLogged && dinnerLogged) {
            console.log("Agent: Daily goals met, no reminders needed.");
        }

    } catch (err) {
        console.error("Proactive Agent Error:", err);
    }
};
