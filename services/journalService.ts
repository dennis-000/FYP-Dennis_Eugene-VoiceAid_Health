import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

export interface VoiceJournal {
    id: string;
    patient_id: string;
    audio_url: string | null;
    transcript: string;
    wpm: number;
    clarity_score: number;
    created_at: string;
}

export const JournalService = {
    /**
     * Get all journal entries for a patient, ordered by newest first.
     */
    getPatientJournals: async (patientId: string): Promise<VoiceJournal[]> => {
        try {
            const { data, error } = await supabase
                .from('voice_journals')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[JournalService] Supabase select error:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('[JournalService] Error fetching journals:', error);
            return [];
        }
    },

    /**
     * Upload an audio file to Supabase storage using the JS SDK.
     * Uses the SDK's storage client which correctly attaches auth/anon tokens
     * and handles RLS policies properly without needing manual URL construction.
     */
    uploadAudio: async (patientId: string, localUri: string): Promise<string | null> => {
        try {
            const fileName = `journal_${patientId}_${Date.now()}.wav`;
            const filePath = `${patientId}/${fileName}`;

            // Read the file as base64, then convert to Uint8Array for SDK upload
            const base64 = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Convert base64 → binary Uint8Array
            const binaryStr = atob(base64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            // Upload via Supabase SDK — automatically attaches correct auth/anon headers
            const { error } = await supabase.storage
                .from('journals')
                .upload(filePath, bytes, {
                    contentType: 'audio/wav',
                    upsert: true,
                });

            if (error) {
                console.error('[JournalService] Storage upload failed:', error.message);
                return null;
            }

            // Get the public URL
            const { data: urlData } = supabase.storage.from('journals').getPublicUrl(filePath);
            console.log('[JournalService] Upload success:', urlData.publicUrl);
            return urlData.publicUrl;

        } catch (error) {
            console.error('[JournalService] Error uploading audio:', error);
            return null;
        }
    },

    /**
     * Save a new journal entry.
     */
    saveJournal: async (
        patientId: string,
        transcript: string,
        audioUri: string | null,
        durationSeconds: number,
        clarityScore: number = 85 // Default or calculated by Whisper
    ): Promise<VoiceJournal | null> => {
        try {
            // 1. Only attempt Supabase save if we have a valid looking UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patientId);
            
            if (!isUuid) {
                console.log('[JournalService] Not a valid UUID, skipping cloud upload and database insert (Guest Mode).');
                return null; 
            }

            // 2. Proceed with cloud upload for real users
            let audioUrl = null;
            if (audioUri) {
                audioUrl = await JournalService.uploadAudio(patientId, audioUri);
            }

            // Calculate WPM dynamically
            const words = transcript.trim().split(/\s+/).filter(Boolean).length;
            const calculatedWpm = durationSeconds > 0 ? Math.round((words / durationSeconds) * 60) : 0;

            const { data, error } = await supabase
                .from('voice_journals')
                .insert([
                    {
                        patient_id: patientId,
                        audio_url: audioUrl,
                        transcript: transcript,
                        wpm: calculatedWpm,
                        clarity_score: clarityScore,
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('[JournalService] Supabase insert error:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('[JournalService] Error saving journal:', error);
            return null;
        }
    },
    
    /**
     * Delete a journal entry
     */
    deleteJournal: async (journalId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('voice_journals')
                .delete()
                .eq('id', journalId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[JournalService] Error deleting journal:', error);
            return false;
        }
    }
};
