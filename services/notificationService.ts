import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  /**
   * Request permissions and get Expo Push Token
   */
  registerForPushNotificationsAsync: async () => {
    let token;

    if (Platform.OS === 'web') return null;

    // Simplified check: only proceed on mobile
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.warn('Project ID not found in expo config. Push notifications might not work in dev.');
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId
      })).data;
      console.log('[Notifications] Token:', token);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  },

  /**
   * Save token to Supabase for the current therapist
   */
  saveTokenToBackend: async (therapistId: string, token: string) => {
    try {
      const { error } = await supabase
        .from('therapist_push_tokens')
        .upsert({
          therapist_id: therapistId,
          push_token: token,
          device_type: Platform.OS,
          last_updated: new Date().toISOString()
        }, { onConflict: 'therapist_id, push_token' });

      if (error) throw error;
      console.log('[Notifications] Token saved to backend successfully');
    } catch (e) {
      console.error('[Notifications] Error saving token to backend:', e);
    }
  },

  /**
   * Save token to Supabase for the current patient
   */
  savePatientTokenToBackend: async (patientId: string, token: string) => {
    try {
      const { error } = await supabase
        .from('patient_push_tokens')
        .upsert({
          patient_id: patientId,
          push_token: token,
          device_type: Platform.OS,
          last_updated: new Date().toISOString()
        }, { onConflict: 'patient_id, push_token' });

      if (error) throw error;
      console.log('[Notifications] Patient token saved to backend successfully');
    } catch (e) {
      console.error('[Notifications] Error saving patient token to backend:', e);
    }
  }
};
