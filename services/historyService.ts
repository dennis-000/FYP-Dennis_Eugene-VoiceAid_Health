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
            // If log has a specific user_id, it is targeted at a patient (e.g. from caregiver view)
            const targetPatientId = ('user_id' in log && log.user_id) ? log.user_id : patientId;
            
            const isGuest = !targetPatientId || targetPatientId === 'guest_user' || targetPatientId === 'guest';

            const localLog: TranscriptionLog = {
                id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                timestamp: Date.now(),
                text: log.text,
                detectedLanguage: log.detectedLanguage || 'en',
                intentCategory: log.intentCategory || 'Transcription',
                user_id: targetPatientId || undefined
            };

            // Always save to local history for the patient's own UI (unless caregiver is logging for a patient on another device)
            const isCaregiverTargeted = 'user_id' in log && log.user_id && log.user_id !== patientId;
            if (!isCaregiverTargeted) {
                const storageKey = isGuest ? '@voiceaid_guest_history' : `@voiceaid_patient_history_${targetPatientId}`;
                const currentLocal = await AsyncStorage.getItem(storageKey);
                const history = currentLocal ? JSON.parse(currentLocal) : [];
                await AsyncStorage.setItem(storageKey, JSON.stringify([localLog, ...history]));
            }

            if (!isGuest) {
                // For Hospital Patients (Connected via Code)
                // Insert to Supabase for therapist's visibility, but do NOT select/read back to avoid SELECT RLS policy issues for anonymous patients.
                const { error } = await supabase
                    .from('transcriptions')
                    .insert({
                        patient_profile_id: targetPatientId,
                        text: log.text,
                        language: log.detectedLanguage || 'en'
                    });

                if (error) {
                    console.warn("[History] Supabase sync pending (Ensure Migration 018 is run on your Supabase SQL Editor):", error.message);
                } else {
                    console.log("[History] Log successfully synced to Supabase");
                }
            }

            return localLog;
        } catch (e) {
            console.error("[History] Failed to add log", e);
            throw e;
        }
    },

    getLogs: async (): Promise<TranscriptionLog[]> => {
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            const isGuest = !patientId || patientId === 'guest_user' || patientId === 'guest';
            
            const storageKey = isGuest ? '@voiceaid_guest_history' : `@voiceaid_patient_history_${patientId}`;
            const localData = await AsyncStorage.getItem(storageKey);
            return localData ? JSON.parse(localData) : [];
        } catch (e) {
            console.error("[History] Failed to fetch local logs", e);
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
            const isGuest = !patientId || patientId === 'guest_user' || patientId === 'guest';
            
            const storageKey = isGuest ? '@voiceaid_guest_history' : `@voiceaid_patient_history_${patientId}`;
            await AsyncStorage.removeItem(storageKey);

            if (!isGuest) {
                const { error } = await supabase
                    .from('transcriptions')
                    .delete()
                    .or(`user_id.eq.${patientId},patient_profile_id.eq.${patientId}`);

                if (error) {
                    console.error("[History] Failed to clear Supabase logs:", error);
                }
            }
        } catch (e) {
            console.error("[History] Failed to clear logs", e);
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