/**
 * ==========================================
 * ORGANIZATION SERVICE
 * ==========================================
 * Service for managing organizations and validation
 */

import { supabase } from '../lib/supabase';

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

/**
 * Validate organization code
 */
export const validateOrganizationCode = async (code: string): Promise<Organization | null> => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('organization_code', code.trim().toUpperCase())
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error validating organization code:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error validating organization code:', error);
        return null;
    }
};

/**
 * Get organization by ID
 */
export const getOrganization = async (id: string): Promise<Organization | null> => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching organization:', error);
        return null;
    }
};

/**
 * Get all active organizations
 */
export const getActiveOrganizations = async (): Promise<Organization[]> => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return [];
    }
};
