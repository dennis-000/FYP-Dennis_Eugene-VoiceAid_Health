/**
 * Supabase Client for Admin Dashboard
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Organization {
    id: string;
    name: string;
    organization_code: string;
    type: 'hospital' | 'clinic' | 'private_practice';
    location?: string;
    contact_email?: string;
    contact_phone?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TherapistProfile {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    organization?: string;
    organization_id?: string;
    organization_code?: string;
    specialization?: string;
    assigned_patients: string[];
    created_at: string;
    updated_at: string;
}

export interface PatientProfile {
    id: string;
    user_id?: string;
    patient_type: 'guest' | 'hospital';
    therapist_id?: string;
    organization_id?: string;
    full_name?: string;
    hospital_id?: string;
    created_at: string;
    updated_at: string;
}

export interface AdminUser {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    role: 'super_admin' | 'org_admin';
    organization_id?: string;
    created_at: string;
    updated_at: string;
}
