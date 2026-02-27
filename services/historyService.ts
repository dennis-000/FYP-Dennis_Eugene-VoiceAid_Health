import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

export interface TranscriptionLog {
  id: string;
  timestamp: number;
  text: string;           // The original or refined text
  intentCategory: string; // e.g., "Pain", "Needs"
  detectedLanguage: string;
}

const STORAGE_KEY = 'voiceaid_transcription_logs';

export const HistoryService = {

  /**
   * Saves a new transcription log to local storage.
   * Newest logs are prepended to the top of the list.
   */
  addLog: async (log: Omit<TranscriptionLog, 'id' | 'timestamp'>) => {
    try {
      const newEntry: TranscriptionLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        ...log
      };

      // Get existing logs
      const existing = await HistoryService.getLogs();
      // Add new one to the top
      const updated = [newEntry, ...existing];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("[History] Log saved:", newEntry.id);
    } catch (e) {
      console.error("[History] Failed to save log", e);
    }
  },

  /**
   * Retrieves all logs from local storage.
   */
  getLogs: async (): Promise<TranscriptionLog[]> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json != null ? JSON.parse(json) : [];
    } catch (e) {
      console.error("[History] Failed to fetch logs", e);
      return [];
    }
  },

  /**
   * Clear all logs (Caregiver function)
   */
  clearLogs: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("[History] Logs cleared");
    } catch (e) {
      console.error("[History] Failed to clear logs", e);
    }
  },

  /**
   * Alias for addLog - saves transcription to history
   * For backward compatibility
   */
  saveTranscription: async (data: { text: string; detectedLanguage: string; timestamp: string }) => {
    // 1. Save locally first (optimistic update)
    await HistoryService.addLog({
      text: data.text,
      detectedLanguage: data.detectedLanguage,
      intentCategory: 'General',
    });

    // 2. Sync to Backend DB
    try {
      // Get user ID from stored session
      const userSession = await AsyncStorage.getItem('supabase-auth-token');

      // If no session, we can't save to DB (RLS restricted)
      // But for development/demo, we might want to allow it?
      // For now, only proceed if we have a session or rely on backend handling logic if needed.
      // Assuming a valid session structure:
      let userId: string | null = null;
      if (userSession) {
        const session = JSON.parse(userSession);
        userId = session.user?.id;
      }

      if (!userId) {
        console.log("[History] No user session found, skipping DB sync");
        return;
      }

      await fetch(`${API_BASE_URL}/transcriptions/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          text: data.text,
          language: data.detectedLanguage,
          metadata: {
            is_live: true,
            source: 'app_history'
          }
        })
      });
      console.log("[History] Log synced to DB");

    } catch (e) {
      console.error("[History] Failed to sync to DB:", e);
    }
  }
};