import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export interface Phrase {
    id: string;
    patient_id: string;
    therapist_id: string;
    text: string;
    twi_translation: string | null;
    icon: string;
    color: string;
    image_url: string | null; // ← real photo/symbol URL from Supabase Storage
    created_at: string;
}

export const PhraseService = {
    /**
     * Get all custom phrases for a specific patient
     */
    getPatientPhrases: async (patientId: string): Promise<Phrase[]> => {
        try {
            const { data, error } = await supabase
                .from('phrases')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('[PhraseService] Error fetching phrases:', error);
            return [];
        }
    },

    /**
     * Upload a phrase image to Supabase Storage and returns the public URL.
     * Bucket: 'phrase-images' (must be created in Supabase dashboard — public bucket)
     * Path:  phrase-images/{patientId}/{timestamp}.jpg
     */
    uploadPhraseImage: async (
        patientId: string,
        localUri: string
    ): Promise<string | null> => {
        try {
            // Use expo-file-system instead of fetch() to avoid React Native Network Errors on local files
            const base64 = await FileSystem.readAsStringAsync(localUri, {
                encoding: 'base64',
            });

            const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
            const filePath = `${patientId}/${Date.now()}.${ext}`;
            const contentType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

            const { data, error } = await supabase.storage
                .from('phrase-images')
                .upload(filePath, decode(base64), {
                    contentType,
                    upsert: false,
                });

            if (error) throw error;

            // Get the public URL
            const { data: urlData } = supabase.storage
                .from('phrase-images')
                .getPublicUrl(filePath);

            return urlData?.publicUrl ?? null;
        } catch (error) {
            console.error('[PhraseService] Error uploading image:', error);
            return null;
        }
    },

    /**
     * Add a new custom phrase for a patient (Therapist only)
     * image_url is optional — falls back to icon if not provided.
     */
    addPhrase: async (
        patientId: string,
        therapistProfileId: string,
        text: string,
        twiTranslation: string | null,
        icon: string = 'chatbox-ellipses',
        color: string = '#8b5cf6',
        imageUrl: string | null = null
    ): Promise<Phrase | null> => {
        try {
            if (!therapistProfileId) throw new Error('Missing Therapist ID');

            const { data, error } = await supabase
                .from('phrases')
                .insert([{
                    patient_id: patientId,
                    therapist_id: therapistProfileId,
                    text: text.trim(),
                    twi_translation: twiTranslation ? twiTranslation.trim() : null,
                    icon: icon,
                    color: color,
                    image_url: imageUrl,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[PhraseService] Error adding phrase:', error);
            return null;
        }
    },

    /**
     * Delete a custom phrase (and its storage image if any)
     */
    deletePhrase: async (phraseId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('phrases')
                .delete()
                .eq('id', phraseId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[PhraseService] Error deleting phrase:', error);
            return false;
        }
    }
};
