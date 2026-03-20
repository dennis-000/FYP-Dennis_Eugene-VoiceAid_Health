import { supabase } from '../lib/supabase';

export interface Phrase {
    id: string;
    patient_id: string;
    therapist_id: string;
    text: string;
    twi_translation: string | null;
    icon: string;
    color: string;
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
     * Add a new custom phrase for a patient (Therapist only)
     */
    addPhrase: async (
        patientId: string,
        therapistProfileId: string,
        text: string,
        twiTranslation: string | null,
        icon: string = 'chatbox-ellipses',
        color: string = '#8b5cf6'
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
                    color: color
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
     * Delete a custom phrase
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
