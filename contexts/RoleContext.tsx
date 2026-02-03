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

interface RoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    isFirstLaunch: boolean;
    setFirstLaunch: (value: boolean) => void;
}

const RoleContext = createContext<RoleContextType>({
    role: null,
    setRole: () => { },
    isFirstLaunch: true,
    setFirstLaunch: () => { },
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRoleState] = useState<UserRole>(null);
    const [isFirstLaunch, setFirstLaunch] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved role from storage on app start
    useEffect(() => {
        loadRole();
    }, []);

    const loadRole = async () => {
        try {
            const savedRole = await AsyncStorage.getItem('@voiceaid_role');
            const hasLaunchedBefore = await AsyncStorage.getItem('@voiceaid_has_launched');

            if (savedRole) {
                setRoleState(savedRole as UserRole);
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

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <RoleContext.Provider value={{ role, setRole, isFirstLaunch, setFirstLaunch }}>
            {children}
        </RoleContext.Provider>
    );
};
