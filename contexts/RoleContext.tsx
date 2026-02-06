/**
 * ==========================================
 * USER ROLE CONTEXT
 * ==========================================
 * Manages user roles (Patient vs Caregiver/Healthcare Worker)
 * Simple role management without complex authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'patient' | 'caregiver' | null;
export type PatientType = 'guest' | 'hospital' | null;

interface RoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    patientType: PatientType;
    setPatientType: (type: PatientType) => void;
    isFirstLaunch: boolean;
    setFirstLaunch: (value: boolean) => void;
}

const RoleContext = createContext<RoleContextType>({
    role: null,
    setRole: () => { },
    patientType: null,
    setPatientType: () => { },
    isFirstLaunch: true,
    setFirstLaunch: () => { },
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRoleState] = useState<UserRole>(null);
    const [patientType, setPatientTypeState] = useState<PatientType>(null);
    const [isFirstLaunch, setFirstLaunch] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved role from storage on app start
    useEffect(() => {
        loadRole();
    }, []);

    const loadRole = async () => {
        try {
            const savedRole = await AsyncStorage.getItem('@voiceaid_role');
            const savedPatientType = await AsyncStorage.getItem('@voiceaid_patient_type');
            const hasLaunchedBefore = await AsyncStorage.getItem('@voiceaid_has_launched');

            if (savedRole) {
                setRoleState(savedRole as UserRole);
            }

            if (savedPatientType) {
                setPatientTypeState(savedPatientType as PatientType);
            }

            if (hasLaunchedBefore) {
                setFirstLaunch(false);
            }
        } catch (error) {
            console.error('Failed to load role:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setRole = async (newRole: UserRole) => {
        try {
            setRoleState(newRole);

            if (newRole) {
                await AsyncStorage.setItem('@voiceaid_role', newRole);
                await AsyncStorage.setItem('@voiceaid_has_launched', 'true');
                setFirstLaunch(false);
            } else {
                await AsyncStorage.removeItem('@voiceaid_role');
            }
        } catch (error) {
            console.error('Failed to save role:', error);
        }
    };

    const setPatientType = async (newType: PatientType) => {
        try {
            setPatientTypeState(newType);

            if (newType) {
                await AsyncStorage.setItem('@voiceaid_patient_type', newType);
            } else {
                await AsyncStorage.removeItem('@voiceaid_patient_type');
            }
        } catch (error) {
            console.error('Failed to save patient type:', error);
        }
    };

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <RoleContext.Provider value={{ role, setRole, patientType, setPatientType, isFirstLaunch, setFirstLaunch }}>
            {children}
        </RoleContext.Provider>
    );
};
