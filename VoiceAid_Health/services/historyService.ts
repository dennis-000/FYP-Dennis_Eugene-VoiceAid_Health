import AsyncStorage from '@react-native-async-storage/async-storage';

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
  }
};