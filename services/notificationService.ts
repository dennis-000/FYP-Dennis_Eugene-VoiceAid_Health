import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const NotificationService = {
    /**
     * Request permission and return whether granted
     */
    requestPermission: async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('assignments', {
                name: 'Daily Assignments',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6366f1',
            });
        }

        const { status: existing } = await Notifications.getPermissionsAsync();
        if (existing === 'granted') return true;

        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    },

    /**
     * Schedule a daily reminder at a given hour (24h format) for patients
     */
    scheduleDailyAssignmentReminder: async (
        hour: number = 9,
        minute: number = 0,
        patientName: string = 'there'
    ): Promise<string | null> => {
        try {
            // Cancel previous scheduled assignment reminders first
            await NotificationService.cancelAssignmentReminders();

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🗣️ VoiceAid – Time for your exercises!',
                    body: `Hi ${patientName}! Your therapist has assignments waiting for you. Tap to check them.`,
                    sound: true,
                    data: { screen: 'assignments' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                } as Notifications.DailyTriggerInput,
            });
            return id;
        } catch (err) {
            console.error('[NotificationService] Failed to schedule:', err);
            return null;
        }
    },

    /**
     * Send an immediate notification (e.g. when therapist assigns something new)
     */
    sendImmediateAlert: async (title: string, body: string): Promise<void> => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: { title, body, sound: true },
                trigger: null, // fires immediately
            });
        } catch (err) {
            console.error('[NotificationService] sendImmediateAlert error:', err);
        }
    },

    /**
     * Cancel all previously scheduled assignment reminders
     */
    cancelAssignmentReminders: async (): Promise<void> => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
            if (n.content.data?.screen === 'assignments') {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
        }
    },
};
