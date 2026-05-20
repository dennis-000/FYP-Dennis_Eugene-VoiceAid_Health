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
     * Upload an audio file to Supabase storage.
     */
    uploadAudio: async (patientId: string, localUri: string): Promise<string | null> => {
        try {
            const fileName = `journal_${patientId}_${Date.now()}.wav`; // Assuming WAV format
            const filePath = `${patientId}/${fileName}`;

            // We must use expo-file-system uploadAsync for binary files in React Native
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
            
            const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/journals/${filePath}`;

            const uploadResult = await FileSystem.uploadAsync(uploadUrl, localUri, {
                httpMethod: 'POST',
                uploadType: 1 as any, // FileSystemUploadType.BINARY_CONTENT is 1
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'audio/wav',
                    'x-upsert': 'true',
                },
            });

            if (uploadResult.status !== 200) {
                console.error('[JournalService] Storage upload failed:', uploadResult.body);
                return null;
            }

            // Get the public URL
            const { data } = supabase.storage.from('journals').getPublicUrl(filePath);
            return data.publicUrl;

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
