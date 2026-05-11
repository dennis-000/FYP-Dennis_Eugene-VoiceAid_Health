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

const ANALYTICS_KEY = '@voiceaid_analytics';

export interface SessionRecord {
    id: string;
    date: string;           // ISO date
    duration: number;       // seconds
    wordCount: number;
    messageCount: number;
    language: string;
    mode: 'batch' | 'streaming';
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
    async logSession(session: Omit<SessionRecord, 'id' | 'date'>): Promise<void> {
        try {
            const sessions = await this.getAllSessions();
            const newSession: SessionRecord = {
                ...session,
                id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                date: new Date().toISOString(),
            };
            sessions.push(newSession);

            // Keep last 200 sessions max
            const trimmed = sessions.slice(-200);
            await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
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
     * Clear all analytics data.
     */
    async clearAll(): Promise<void> {
        await AsyncStorage.removeItem(ANALYTICS_KEY);
    }
}

export const AnalyticsService = new AnalyticsServiceClass();
