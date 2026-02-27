import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// User type definitions
export type UserType = 'therapist' | 'patient' | null;

// Therapist Profile
export interface TherapistProfile {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    organization?: string;
    specialization?: string;
    assigned_patients: string[]; // Array of patient IDs
    created_at: string;
    updated_at: string;
}

// Patient Profile
export interface PatientProfile {
    id: string;
    user_id?: string; // Optional - null for guest patients
    patient_type: 'guest' | 'hospital';
    therapist_id?: string; // null for guests
    full_name?: string;
    hospital_id?: string;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    userType: UserType;
    therapistProfile: TherapistProfile | null;
    patientProfile: PatientProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    loadTherapistProfile: (userId: string) => Promise<void>;
    loadPatientProfile: (userId: string) => Promise<void>;
    updateTherapistProfile: (updates: Partial<TherapistProfile>) => Promise<void>;
    updatePatientProfile: (updates: Partial<PatientProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    userType: null,
    therapistProfile: null,
    patientProfile: null,
    loading: true,
    signOut: async () => { },
    loadTherapistProfile: async () => { },
    loadPatientProfile: async () => { },
    updateTherapistProfile: async () => { },
    updatePatientProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userType, setUserType] = useState<UserType>(null);
    const [therapistProfile, setTherapistProfile] = useState<TherapistProfile | null>(null);
    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);

            // Load user profile if authenticated
            if (session?.user) {
                loadUserProfile(session.user);
            }

            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            // Load user profile on auth change
            if (session?.user) {
                loadUserProfile(session.user);
            } else {
                // Clear profiles on logout
                setUserType(null);
                setTherapistProfile(null);
                setPatientProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load user profile based on metadata
    const loadUserProfile = async (user: User) => {
        try {
            const userTypeFromMeta = user.user_metadata?.user_type as UserType;
            setUserType(userTypeFromMeta);

            if (userTypeFromMeta === 'therapist') {
                await loadTherapistProfile(user.id);
            } else if (userTypeFromMeta === 'patient') {
                await loadPatientProfile(user.id);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    // Load therapist profile from database
    const loadTherapistProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('therapist_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Error loading therapist profile:', error);
                return;
            }

            setTherapistProfile(data);
        } catch (error) {
            console.error('Error loading therapist profile:', error);
        }
    };

    // Load patient profile from database
    const loadPatientProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('patient_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Error loading patient profile:', error);
                return;
            }

            setPatientProfile(data);
        } catch (error) {
            console.error('Error loading patient profile:', error);
        }
    };

    // Update therapist profile
    const updateTherapistProfile = async (updates: Partial<TherapistProfile>) => {
        if (!therapistProfile) return;

        try {
            const { data, error } = await supabase
                .from('therapist_profiles')
                .update(updates)
                .eq('id', therapistProfile.id)
                .select()
                .single();

            if (error) throw error;
            setTherapistProfile(data);
        } catch (error) {
            console.error('Error updating therapist profile:', error);
            throw error;
        }
    };

    // Update patient profile
    const updatePatientProfile = async (updates: Partial<PatientProfile>) => {
        if (!patientProfile) return;

        try {
            const { data, error } = await supabase
                .from('patient_profiles')
                .update(updates)
                .eq('id', patientProfile.id)
                .select()
                .single();

            if (error) throw error;
            setPatientProfile(data);
        } catch (error) {
            console.error('Error updating patient profile:', error);
            throw error;
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setUserType(null);
        setTherapistProfile(null);
        setPatientProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                userType,
                therapistProfile,
                patientProfile,
                loading,
                signOut,
                loadTherapistProfile,
                loadPatientProfile,
                updateTherapistProfile,
                updatePatientProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
