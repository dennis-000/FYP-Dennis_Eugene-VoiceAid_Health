import { Platform } from 'react-native';

// WARNING: expo-notifications Push Notification support was completely removed from Expo Go SDK 53+.
// To prevent the application from crashing instantly on startup during presentations, we have stubbed this out.
// Once you build a standalone APK (.apk) for Production, you can restore the real imports!

export const NotificationService = {
    requestPermission: async (): Promise<boolean> => {
        return true; // Mocked for Expo Go
    },

    scheduleDailyAssignmentReminder: async (
        hour: number = 9,
        minute: number = 0,
        patientName: string = 'there'
    ): Promise<string | null> => {
        console.log(`[Notification MOCK] Scheduled daily reminder for ${patientName} at ${hour}:${minute}`);
        return 'mock-notification-id';
    },

    sendImmediateAlert: async (title: string, body: string): Promise<void> => {
        console.log(`[Notification MOCK] Immediate Alert Sent: ${title} - ${body}`);
    },

    cancelAssignmentReminders: async (): Promise<void> => {
        console.log(`[Notification MOCK] Cancelled assignment reminders.`);
    },
};
