import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface TranscriptionLog {
    id: string;
    timestamp: number;
    text: string;
    intentCategory?: string;
    detectedLanguage?: string;
    user_id?: string;
}

export const HistoryService = {

    /**
     * Saves a new transcription log to Supabase.
     */
    addLog: async (log: Omit<TranscriptionLog, 'id' | 'timestamp'>) => {
        try {
            // First check if this is a hospital patient, they have a dedicated ID
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            const guestSession = await AsyncStorage.getItem('@voiceaid_role');

            let userIdToSave = patientId;

            // If no patient ID but we have a user session from Supabase, use that
            if (!userIdToSave) {
                const sessionStr = await AsyncStorage.getItem('supabase-auth-token');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    userIdToSave = session.user?.id;
                }
            }

            const { data, error } = await supabase
                .from('transcriptions')
                .insert({
                    user_id: userIdToSave || 'guest',
                    text: log.text,
                    language: log.detectedLanguage || 'en',
                    metadata: {
                        intentCategory: log.intentCategory || 'Transcription',
                        source: 'app_history'
                    }
                })
                .select()
                .single();

            if (error) throw error;
            console.log("[History] Log saved to Supabase:", data.id);
            return data;
        } catch (e) {
            console.error("[History] Failed to save log to Supabase", e);
            throw e;
        }
    },

    /**
     * Retrieves all logs for the current user from Supabase.
     */
    getLogs: async (): Promise<TranscriptionLog[]> => {
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            let userIdToFetch = patientId;

            if (!userIdToFetch) {
                const sessionStr = await AsyncStorage.getItem('supabase-auth-token');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    userIdToFetch = session.user?.id;
                }
            }

            if (!userIdToFetch) {
                console.log("[History] No user ID to fetch logs for");
                return [];
            }

            const { data, error } = await supabase
                .from('transcriptions')
                .select('*')
                .eq('user_id', userIdToFetch)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(row => ({
                id: row.id,
                timestamp: new Date(row.created_at).getTime(),
                text: row.text,
                detectedLanguage: row.language,
                intentCategory: row.metadata?.intentCategory || 'Transcription',
                user_id: row.user_id
            }));

        } catch (e) {
            console.error("[History] Failed to fetch logs from Supabase", e);
            return [];
        }
    },

    /**
     * Get logs for a specific patient (Used by Therapists in the dashboard)
     */
    getPatientLogs: async (patientId: string): Promise<TranscriptionLog[]> => {
        try {
            const { data, error } = await supabase
                .from('transcriptions')
                .select('*')
                .eq('user_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(row => ({
                id: row.id,
                timestamp: new Date(row.created_at).getTime(),
                text: row.text,
                detectedLanguage: row.language,
                intentCategory: row.metadata?.intentCategory || 'Transcription',
                user_id: row.user_id
            }));

        } catch (e) {
            console.error("[History] Failed to fetch patient logs", e);
            return [];
        }
    },

    /**
     * Clear all logs for current user
     */
    clearLogs: async () => {
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            let userIdToClear = patientId;

            if (!userIdToClear) {
                const sessionStr = await AsyncStorage.getItem('supabase-auth-token');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    userIdToClear = session.user?.id;
                }
            }

            if (!userIdToClear) return;

            const { error } = await supabase
                .from('transcriptions')
                .delete()
                .eq('user_id', userIdToClear);

            if (error) throw error;
            console.log("[History] Supabase logs cleared");
        } catch (e) {
            console.error("[History] Failed to clear Supabase logs", e);
        }
    },

    /**
     * Alias for addLog - saves transcription to history
     */
    saveTranscription: async (data: { text: string; detectedLanguage: string; timestamp: string }) => {
        await HistoryService.addLog({
            text: data.text,
            detectedLanguage: data.detectedLanguage,
            intentCategory: 'General',
        });
    }
};