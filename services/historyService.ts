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
    addLog: async (log: TranscriptionLog | Omit<TranscriptionLog, 'id' | 'timestamp'>) => {
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            const isGuest = !patientId || patientId === 'guest_user' || patientId === 'guest';

            if (isGuest) {
                console.log("[History] Guest session detected, saving to local AsyncStorage.");
                const localLog: TranscriptionLog = {
                    id: `guest-log-${Date.now()}`,
                    timestamp: Date.now(),
                    text: log.text,
                    detectedLanguage: log.detectedLanguage || 'en',
                    intentCategory: log.intentCategory || 'Transcription'
                };
                const currentLocal = await AsyncStorage.getItem('@voiceaid_guest_history');
                const history = currentLocal ? JSON.parse(currentLocal) : [];
                await AsyncStorage.setItem('@voiceaid_guest_history', JSON.stringify([localLog, ...history]));
                return localLog;
            }

            // For Hospital Patients (Connected via Code)
            const { data, error } = await supabase
                .from('transcriptions')
                .insert({
                    patient_profile_id: patientId,
                    text: log.text,
                    language: log.detectedLanguage || 'en'
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

    getLogs: async (): Promise<TranscriptionLog[]> => {
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            if (!patientId || patientId === 'guest_user' || patientId === 'guest') {
                const localData = await AsyncStorage.getItem('@voiceaid_guest_history');
                return localData ? JSON.parse(localData) : [];
            }

            const { data, error } = await supabase
                .from('transcriptions')
                .select('*')
                .or(`user_id.eq.${patientId},patient_profile_id.eq.${patientId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(row => ({
                id: row.id,
                timestamp: new Date(row.created_at).getTime(),
                text: row.text,
                detectedLanguage: row.language,
                intentCategory: 'Transcription',
                user_id: row.user_id || row.patient_profile_id
            }));
        } catch (e) {
            console.error("[History] Failed to fetch logs from Supabase", e);
            return [];
        }
    },

    getPatientLogs: async (patientId: string): Promise<TranscriptionLog[]> => {
        try {
            const { data, error } = await supabase
                .from('transcriptions')
                .select('*')
                .or(`user_id.eq.${patientId},patient_profile_id.eq.${patientId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(row => ({
                id: row.id,
                timestamp: new Date(row.created_at).getTime(),
                text: row.text,
                detectedLanguage: row.language,
                intentCategory: 'Transcription',
                user_id: row.user_id || row.patient_profile_id
            }));
        } catch (e) {
            console.error("[History] Failed to fetch patient logs", e);
            return [];
        }
    },

    getLogsForPatients: async (patientIds: string[]): Promise<(TranscriptionLog & { patientName?: string })[]> => {
        try {
            if (!patientIds || patientIds.length === 0) return [];

            const { data: logsData, error: logsError } = await supabase
                .from('transcriptions')
                .select('*')
                .or(`user_id.in.(${patientIds.join(',')}),patient_profile_id.in.(${patientIds.join(',')})`)
                .order('created_at', { ascending: false });

            if (logsError) throw logsError;

            const { data: profilesData } = await supabase
                .from('patient_profiles')
                .select('id, user_id, full_name')
                .or(`id.in.(${patientIds.join(',')}),user_id.in.(${patientIds.join(',')})`);

            const nameMap: Record<string, string> = {};
            if (profilesData) {
                profilesData.forEach(p => {
                    if (p.id) nameMap[p.id] = p.full_name || 'Patient';
                    if (p.user_id) nameMap[p.user_id] = p.full_name || 'Patient';
                });
            }

            return logsData.map(row => {
                const pid = row.patient_profile_id || row.user_id;
                return {
                    id: row.id,
                    timestamp: new Date(row.created_at).getTime(),
                    text: row.text,
                    detectedLanguage: row.language,
                    intentCategory: 'Transcription',
                    user_id: pid,
                    patientName: nameMap[pid] || 'Patient'
                };
            });
        } catch (e) {
            console.error("[History] Failed to fetch multi-patient logs", e);
            return [];
        }
    },

    clearLogs: async () => {
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            if (!patientId || patientId === 'guest_user' || patientId === 'guest') {
                await AsyncStorage.removeItem('@voiceaid_guest_history');
                return;
            }

            const { error } = await supabase
                .from('transcriptions')
                .delete()
                .or(`user_id.eq.${patientId},patient_profile_id.eq.${patientId}`);

            if (error) throw error;
        } catch (e) {
            console.error("[History] Failed to clear Supabase logs", e);
        }
    },

    saveTranscription: async (data: { text: string; detectedLanguage: string; timestamp: string, targetUserId?: string }) => {
        await HistoryService.addLog({
            text: data.text,
            detectedLanguage: data.detectedLanguage,
            intentCategory: 'General',
            user_id: data.targetUserId
        });
    }
};