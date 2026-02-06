/**
 * ==========================================
 * PROFILE SERVICE
 * ==========================================
 * Service for managing therapist and patient profiles
 */

import { PatientProfile, TherapistProfile } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// ==========================================
// THERAPIST PROFILE OPERATIONS
// ==========================================

/**
 * Create a new therapist profile
 */
export const createTherapistProfile = async (
    userId: string,
    email: string,
    fullName: string,
    organizationId?: string,
    organizationCode?: string,
    organization?: string,
    specialization?: string
): Promise<TherapistProfile | null> => {
    try {
        console.log('Creating therapist profile with data:', {
            userId,
            email,
            fullName,
            organizationId,
            organizationCode,
            organization,
            specialization
        });

        const { data, error } = await supabase
            .from('therapist_profiles')
            .insert({
                user_id: userId,
                email,
                full_name: fullName,
                organization: organization,
                organization_id: organizationId,
                organization_code: organizationCode,
                specialization,
                assigned_patients: [],
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating therapist profile:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('Therapist profile created successfully:', data);
        return data;
    } catch (error) {
        console.error('Error creating therapist profile:', error);
        return null;
    }
};

/**
 * Get therapist profile by user ID
 */
export const getTherapistProfile = async (userId: string): Promise<TherapistProfile | null> => {
    try {
        const { data, error } = await supabase
            .from('therapist_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching therapist profile:', error);
        return null;
    }
};

/**
 * Assign a patient to a therapist
 */
export const assignPatientToTherapist = async (
    therapistId: string,
    patientId: string
): Promise<boolean> => {
    try {
        // Get current therapist profile
        const { data: therapist, error: fetchError } = await supabase
            .from('therapist_profiles')
            .select('assigned_patients')
            .eq('id', therapistId)
            .single();

        if (fetchError) throw fetchError;

        // Add patient to assigned_patients array
        const updatedPatients = [...(therapist.assigned_patients || []), patientId];

        // Update therapist profile
        const { error: updateError } = await supabase
            .from('therapist_profiles')
            .update({ assigned_patients: updatedPatients })
            .eq('id', therapistId);

        if (updateError) throw updateError;

        // Update patient profile with therapist_id
        const { error: patientError } = await supabase
            .from('patient_profiles')
            .update({ therapist_id: therapistId })
            .eq('id', patientId);

        if (patientError) throw patientError;

        return true;
    } catch (error) {
        console.error('Error assigning patient to therapist:', error);
        return false;
    }
};

/**
 * Remove a patient from a therapist
 */
export const removePatientFromTherapist = async (
    therapistId: string,
    patientId: string
): Promise<boolean> => {
    try {
        // Get current therapist profile
        const { data: therapist, error: fetchError } = await supabase
            .from('therapist_profiles')
            .select('assigned_patients')
            .eq('id', therapistId)
            .single();

        if (fetchError) throw fetchError;

        // Remove patient from assigned_patients array
        const updatedPatients = (therapist.assigned_patients || []).filter(
            (id: string) => id !== patientId
        );

        // Update therapist profile
        const { error: updateError } = await supabase
            .from('therapist_profiles')
            .update({ assigned_patients: updatedPatients })
            .eq('id', therapistId);

        if (updateError) throw updateError;

        // Remove therapist_id from patient profile
        const { error: patientError } = await supabase
            .from('patient_profiles')
            .update({ therapist_id: null })
            .eq('id', patientId);

        if (patientError) throw patientError;

        return true;
    } catch (error) {
        console.error('Error removing patient from therapist:', error);
        return false;
    }
};

// ==========================================
// PATIENT PROFILE OPERATIONS
// ==========================================

/**
 * Create a new patient profile
 */
export const createPatientProfile = async (
    patientType: 'guest' | 'hospital',
    userId?: string,
    fullName?: string,
    therapistId?: string,
    hospitalId?: string
): Promise<PatientProfile | null> => {
    try {
        const { data, error } = await supabase
            .from('patient_profiles')
            .insert({
                user_id: userId || null,
                patient_type: patientType,
                therapist_id: therapistId || null,
                full_name: fullName,
                hospital_id: hospitalId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating patient profile:', error);
        return null;
    }
};

/**
 * Get patient profile by user ID
 */
export const getPatientProfile = async (userId: string): Promise<PatientProfile | null> => {
    try {
        const { data, error } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        return null;
    }
};

/**
 * Get all patients assigned to a therapist
 */
export const getTherapistPatients = async (therapistId: string): Promise<PatientProfile[]> => {
    try {
        const { data, error } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('therapist_id', therapistId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching therapist patients:', error);
        return [];
    }
};

/**
 * Link a guest patient to a therapist (upgrade to hospital patient)
 */
export const linkPatientToTherapist = async (
    patientId: string,
    therapistId: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('patient_profiles')
            .update({
                patient_type: 'hospital',
                therapist_id: therapistId,
            })
            .eq('id', patientId);

        if (error) throw error;

        // Also add to therapist's assigned_patients
        await assignPatientToTherapist(therapistId, patientId);

        return true;
    } catch (error) {
        console.error('Error linking patient to therapist:', error);
        return false;
    }
};
