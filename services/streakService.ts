import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreakInfo {
    currentStreak: number;
    lastPracticeDate: string | null; // Format: 'YYYY-MM-DD'
    badges: string[]; // List of unlocked badge IDs
    practiceHistory: string[]; // List of dates 'YYYY-MM-DD' that the user practiced
}

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    twiTitle?: string;
    twiDescription?: string;
    gaTitle?: string;
    gaDescription?: string;
}

export const AVAILABLE_BADGES: Badge[] = [
    {
        id: 'first_step',
        title: 'First Step',
        twiTitle: 'Anamɔn Akyi',
        gaTitle: 'Shishijee',
        description: 'Recorded your very first voice journal entry!',
        twiDescription: 'Wotwaa wo mfitiaseɛ kasa ho mfonini!',
        gaDescription: 'Ofee okwɛmɔ gbee gbɛee klɛŋklɛŋ!',
        icon: 'footsteps',
        color: '#3b82f6'
    },
    {
        id: 'streak_3',
        title: '3-Day Fire',
        twiTitle: 'Nda 3 Nyaado',
        gaTitle: 'Gbi 3 La',
        description: 'Maintained a 3-day practice streak!',
        twiDescription: 'Wokuraa da biara da adesua mu nda 3!',
        gaDescription: 'Okɛ gbi etɛ yaa nɔ daa gbi!',
        icon: 'flame',
        color: '#f97316'
    },
    {
        id: 'streak_7',
        title: '7-Day Champion',
        twiTitle: 'Dapɛn Mu Hene',
        gaTitle: 'Gbi 7 Otsi Kunimyeli',
        description: 'Maintained a 7-day practice streak!',
        twiDescription: 'Wokuraa da biara da adesua mu nnanson!',
        gaDescription: 'Okɛ otsi muu nɔ yaa nɔ daa gbi!',
        icon: 'trophy',
        color: '#eab308'
    },
    {
        id: 'word_smith',
        title: 'Speech Master',
        twiTitle: 'Kasa Hene',
        gaTitle: 'Wiemɔ Shikwɛlɔ',
        description: 'Recorded a total of 5 voice journal entries!',
        twiDescription: 'Wotwaa kasa ho mfonini anan-nnum!',
        gaDescription: 'Okwɛ gbee gbi 5 yɛ tsomɔ-nɔ!',
        icon: 'mic',
        color: '#22c55e'
    },
    {
        id: 'word_wizard',
        title: 'Word Wizard',
        twiTitle: 'Nsɛmfua Adebɔfo',
        gaTitle: 'Wiemɔ Saji Nyɛlɔ',
        description: 'Got a perfect 3-star rating in the Word Game!',
        twiDescription: 'Wotwaa nkatasoɔ 3 yɛ Nsɛmfua Agofua no mu!',
        gaDescription: 'Oná 3-star shwɛmɔ he yɛ Wiemɔ Shwɛmɔ lɛ mli!',
        icon: 'star',
        color: '#a855f7'
    },
    {
        id: 'phrase_scout',
        title: 'Sentence Scout',
        twiTitle: 'Kasa Hwehwɛfo',
        gaTitle: 'Kaa Wiemɔ Sɔlemɔ',
        description: 'Successfully completed the Phrase Builder Quest!',
        twiDescription: 'Wowiee Kasa-Nsɛmfua Nhyehyɛeɛ Nhwehwɛmu no yie!',
        gaDescription: 'Ofee Wiemɔ Saji Kpeemɔ shwɛmɔ yɛ shishi yie!',
        icon: 'compass',
        color: '#06b6d4'
    }
];

export const StreakService = {
    /**
     * Retrieves the streak and badge information for the current user
     */
    getStreakInfo: async (): Promise<StreakInfo> => {
        try {
            const data = await AsyncStorage.getItem('@voiceaid_streak_info');
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('[StreakService] Error loading streak info:', e);
        }
        return {
            currentStreak: 0,
            lastPracticeDate: null,
            badges: [],
            practiceHistory: []
        };
    },

    /**
     * Logs a practice event (e.g. voice journal recorded, game completed)
     * and calculates updated streaks and unlocked badges.
     * Returns the updated StreakInfo and any newly unlocked badges in this session.
     */
    recordPractice: async (type: 'journal' | 'word_game' | 'phrase_quest'): Promise<{ streakInfo: StreakInfo; newlyUnlocked: string[] }> => {
        try {
            const streakInfo = await StreakService.getStreakInfo();
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const newlyUnlocked: string[] = [];

            // 1. Update practice history
            if (!streakInfo.practiceHistory.includes(today)) {
                streakInfo.practiceHistory.push(today);
            }

            // 2. Calculate streaks
            if (streakInfo.lastPracticeDate === null) {
                // First practice ever!
                streakInfo.currentStreak = 1;
            } else {
                const lastDate = new Date(streakInfo.lastPracticeDate);
                const currentDate = new Date(today);
                const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // practiced consecutive day
                    streakInfo.currentStreak += 1;
                } else if (diffDays > 1) {
                    // missed a day, reset streak to 1
                    streakInfo.currentStreak = 1;
                }
                // If diffDays === 0, practiced on the same day, so streak remains unchanged
            }
            streakInfo.lastPracticeDate = today;

            // 3. Evaluate and unlock badges
            const checkAndUnlock = (badgeId: string) => {
                if (!streakInfo.badges.includes(badgeId)) {
                    streakInfo.badges.push(badgeId);
                    newlyUnlocked.push(badgeId);
                }
            };

            // Rule A: Record first practice
            checkAndUnlock('first_step');

            // Rule B: Streak of 3 or 7
            if (streakInfo.currentStreak >= 3) {
                checkAndUnlock('streak_3');
            }
            if (streakInfo.currentStreak >= 7) {
                checkAndUnlock('streak_7');
            }

            // Rule C: Total number of voice journals recorded
            if (type === 'journal') {
                const journalCount = streakInfo.practiceHistory.length; // Approximate with unique practice days
                if (journalCount >= 5) {
                    checkAndUnlock('word_smith');
                }
            }

            // Rule D: Game specific
            if (type === 'word_game') {
                checkAndUnlock('word_wizard');
            }
            if (type === 'phrase_quest') {
                checkAndUnlock('phrase_scout');
            }

            // Save updated state
            await AsyncStorage.setItem('@voiceaid_streak_info', JSON.stringify(streakInfo));
            return { streakInfo, newlyUnlocked };
        } catch (e) {
            console.error('[StreakService] Error recording practice:', e);
            // Return defaults on error
            return {
                streakInfo: {
                    currentStreak: 0,
                    lastPracticeDate: null,
                    badges: [],
                    practiceHistory: []
                },
                newlyUnlocked: []
            };
        }
    }
};
