/**
 * Speech Session Analytics Service
 * Tracks session metrics for speech-impaired patients:
 * - Words per session
 * - Session duration
 * - Session frequency (daily/weekly)
 * - Most used phrases
 * 
 * Data stored locally via AsyncStorage for offline-first operation.
 * Can be synced to Supabase when online.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const ANALYTICS_KEY = '@voiceaid_analytics';

export interface SessionRecord {
    id: string;
    date: string;           // ISO date
    duration: number;       // seconds
    wordCount: number;
    messageCount: number;
    language: string;
    mode: 'batch' | 'streaming' | 'EMERGENCY' | 'CLINICAL_PRIORITY';
    metadata?: any;
}

export interface AnalyticsSummary {
    totalSessions: number;
    totalWords: number;
    totalDuration: number;         // seconds
    avgWordsPerSession: number;
    avgSessionDuration: number;    // seconds
    sessionsThisWeek: number;
    sessionsToday: number;
    streak: number;                // consecutive days with at least 1 session
    weeklyData: { day: string; sessions: number; words: number }[];
    recentSessions: SessionRecord[];
}

class AnalyticsServiceClass {
    /**
     * Log a completed speech session.
     */
    async logSession(session: Omit<SessionRecord, 'id' | 'date'> & { patientId?: string }): Promise<void> {
        try {
            const sessions = await this.getAllSessions();
            const newSession: SessionRecord = {
                ...session,
                id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                date: new Date().toISOString(),
            };
            sessions.push(newSession);

            // 1. Local Save
            const trimmed = sessions.slice(-200);
            await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));

            // 2. Cloud Sync (Real-time for Therapist)
            const targetId = session.patientId || await AsyncStorage.getItem('@voiceaid_patient_id');
            if (targetId && targetId !== 'guest_user') {
                await supabase.from('patient_analytics').insert({
                    patient_profile_id: targetId, // Use the profile ID directly
                    duration: session.duration,
                    word_count: session.wordCount,
                    message_count: session.messageCount,
                    language: session.language,
                    mode: session.mode,
                    metadata: session.metadata,
                    created_at: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error('[Analytics] Error logging session:', e);
        }
    }

    /**
     * Get all stored sessions.
     */
    async getAllSessions(): Promise<SessionRecord[]> {
        try {
            const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    /**
     * Get a full analytics summary.
     */
    async getSummary(): Promise<AnalyticsSummary> {
        const sessions = await this.getAllSessions();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Sessions today
        const sessionsToday = sessions.filter(s =>
            s.date.split('T')[0] === todayStr
        ).length;

        // Sessions this week (last 7 days)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeek = sessions.filter(s => new Date(s.date) >= weekAgo);

        // Weekly data (last 7 days breakdown)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStr = d.toISOString().split('T')[0];
            const daySessions = sessions.filter(s => s.date.split('T')[0] === dayStr);
            weeklyData.push({
                day: dayNames[d.getDay()],
                sessions: daySessions.length,
                words: daySessions.reduce((sum, s) => sum + s.wordCount, 0),
            });
        }

        // Streak calculation
        let streak = 0;
        const checkDate = new Date(now);
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasSessions = sessions.some(s => s.date.split('T')[0] === dateStr);
            if (!hasSessions) break;
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
        const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

        return {
            totalSessions: sessions.length,
            totalWords,
            totalDuration,
            avgWordsPerSession: sessions.length > 0 ? Math.round(totalWords / sessions.length) : 0,
            avgSessionDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0,
            sessionsThisWeek: thisWeek.length,
            sessionsToday,
            streak,
            weeklyData,
            recentSessions: sessions.slice(-10).reverse(),
        };
    }

    /**
     * Get analytics for a specific patient (for caregivers).
     */
    async getPatientAnalytics(patientId: string): Promise<SessionRecord[]> {
        try {
            const { data } = await supabase
                .from('patient_analytics')
                .select('*')
                .or(`user_id.eq.${patientId},patient_profile_id.eq.${patientId}`)
                .order('created_at', { ascending: false })
                .limit(100);
            
            return (data || []).map(d => ({
                id: d.id,
                date: d.created_at,
                duration: d.duration,
                wordCount: d.word_count,
                messageCount: d.message_count,
                language: d.language,
                mode: d.mode,
                metadata: d.metadata
            }));
        } catch (e) {
            console.error('[Analytics] Error fetching patient analytics:', e);
            return [];
        }
    }

    /**
     * Get active emergencies for a list of patients.
     * An emergency is active if the latest CLINICAL_PRIORITY or CLINICAL_RESOLVED event is CLINICAL_PRIORITY.
     */
    async getActiveEmergencies(patientIds: string[]): Promise<{ patientId: string, metadata: any }[]> {
        if (!patientIds || patientIds.length === 0) return [];
        try {
            const { data, error } = await supabase
                .from('patient_analytics')
                .select('patient_profile_id, mode, metadata, created_at')
                .in('patient_profile_id', patientIds)
                .in('mode', ['CLINICAL_PRIORITY', 'CLINICAL_RESOLVED'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Analytics] Error fetching emergencies:', error);
                return [];
            }

            const activeEmergencies = [];
            const checkedPatients = new Set<string>();

            for (const row of (data || [])) {
                if (checkedPatients.has(row.patient_profile_id)) continue;
                checkedPatients.add(row.patient_profile_id);
                
                if (row.mode === 'CLINICAL_PRIORITY') {
                    activeEmergencies.push({
                        patientId: row.patient_profile_id,
                        metadata: row.metadata
                    });
                }
            }
            return activeEmergencies;
        } catch (e) {
            console.error('[Analytics] Error computing active emergencies:', e);
            return [];
        }
    }

    /**
     * Resolve an active emergency by inserting a CLINICAL_RESOLVED event.
     */
    async resolveEmergency(patientId: string, resolver: 'Patient' | 'Therapist'): Promise<void> {
        try {
            await supabase.from('patient_analytics').insert({
                patient_profile_id: patientId,
                mode: 'CLINICAL_RESOLVED',
                duration: 0,
                word_count: 0,
                message_count: 0,
                language: 'en',
                metadata: { status: `Alert Stopped by ${resolver}` },
                created_at: new Date().toISOString()
            });
        } catch (e) {
            console.error('[Analytics] Error resolving emergency:', e);
        }
    }

    /**
     * Clear all analytics data.
     */
    async clearAll(): Promise<void> {
        await AsyncStorage.removeItem(ANALYTICS_KEY);
    }
}

export const AnalyticsService = new AnalyticsServiceClass();
