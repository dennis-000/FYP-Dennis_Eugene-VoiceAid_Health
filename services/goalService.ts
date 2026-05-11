import { supabase } from '../lib/supabase';

export type GoalCategory = 'communication' | 'language' | 'social' | 'fluency' | 'voice' | 'speech_sound';

export interface PatientGoal {
    id: string;
    patient_id: string;
    therapist_id: string;
    title: string;
    description: string | null;
    category: GoalCategory;
    completed: boolean;
    assigned_date: string;          // YYYY-MM-DD — which day this goal belongs to
    requires_recording: boolean;    // therapist marks if a verbal response is needed
    voice_transcript: string | null; // stored when patient speaks their response
    created_at: string;
}

/** Get today's date string in local YYYY-MM-DD format */
export const todayDate = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const GoalService = {

    /**
     * Get TODAY's goals assigned to a patient.
     * Old days' goals do NOT appear here — they go to history.
     */
    getPatientGoals: async (patientId: string): Promise<PatientGoal[]> => {
        try {
            const today = todayDate();
            const { data, error } = await supabase
                .from('patient_goals')
                .select('*')
                .eq('patient_id', patientId)
                .eq('assigned_date', today)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('[GoalService] Error fetching goals:', error);
            return [];
        }
    },

    /**
     * Get goals for a specific date (therapist uses this to review past days).
     */
    getGoalsByDate: async (patientId: string, date: string): Promise<PatientGoal[]> => {
        try {
            const { data, error } = await supabase
                .from('patient_goals')
                .select('*')
                .eq('patient_id', patientId)
                .eq('assigned_date', date)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('[GoalService] Error fetching goals by date:', error);
            return [];
        }
    },

    /**
     * Get ALL goals for a patient across all dates (for therapist overview).
     */
    getAllPatientGoals: async (patientId: string): Promise<PatientGoal[]> => {
        try {
            const { data, error } = await supabase
                .from('patient_goals')
                .select('*')
                .eq('patient_id', patientId)
                .order('assigned_date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('[GoalService] Error fetching all goals:', error);
            return [];
        }
    },

    /**
     * Add a new goal assigned for today (Therapist only).
     */
    addGoal: async (
        patientId: string,
        therapistProfileId: string,
        title: string,
        description: string | null,
        category: GoalCategory,
        requiresRecording: boolean = false,
        date?: string  // optional — defaults to today
    ): Promise<PatientGoal | null> => {
        try {
            const { data, error } = await supabase
                .from('patient_goals')
                .insert([{
                    patient_id: patientId,
                    therapist_id: therapistProfileId,
                    title: title.trim(),
                    description: description ? description.trim() : null,
                    category: category,
                    completed: false,
                    assigned_date: date || todayDate(),
                    requires_recording: requiresRecording,
                    voice_transcript: null,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[GoalService] Error adding goal:', error);
            return null;
        }
    },

    /**
     * Toggle a goal's completed status (used from patient side).
     */
    toggleGoal: async (goalId: string, completed: boolean): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('patient_goals')
                .update({ completed })
                .eq('id', goalId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[GoalService] Error toggling goal:', error);
            return false;
        }
    },

    /**
     * Save the patient's voice transcript to a goal and mark it complete.
     * Called after Whisper transcribes the patient's spoken response.
     */
    saveTranscript: async (goalId: string, transcript: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('patient_goals')
                .update({
                    voice_transcript: transcript,
                    completed: true,
                })
                .eq('id', goalId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[GoalService] Error saving transcript:', error);
            return false;
        }
    },

    /**
     * Delete a goal (Therapist only).
     */
    deleteGoal: async (goalId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('patient_goals')
                .delete()
                .eq('id', goalId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[GoalService] Error deleting goal:', error);
            return false;
        }
    },

    /**
     * Get all unique dates that have goals for a patient (for calendar/history).
     */
    getGoalDates: async (patientId: string): Promise<string[]> => {
        try {
            const { data, error } = await supabase
                .from('patient_goals')
                .select('assigned_date')
                .eq('patient_id', patientId)
                .order('assigned_date', { ascending: false });

            if (error) throw error;
            const unique = [...new Set((data || []).map(d => d.assigned_date))];
            return unique;
        } catch (error) {
            console.error('[GoalService] Error fetching goal dates:', error);
            return [];
        }
    },
};
