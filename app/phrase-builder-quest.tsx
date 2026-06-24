import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, RefreshCw, Star } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';
import { haptics } from '../utils/haptics';
import { StreakService, AVAILABLE_BADGES } from '../services/streakService';
import { TTSService } from '../services/tts';
import { useRole } from '../contexts/RoleContext';
import { useNetworkStatus } from '../utils/network';
import { supabase } from '../lib/supabase';
import { AnalyticsService } from '../services/analyticsService';

// African Kente Theme Accent Divider
const KenteAccent = () => (
    <View style={{ flexDirection: 'row', height: 6, width: '100%', overflow: 'hidden', borderRadius: 3, marginBottom: 12 }}>
        {Array.from({ length: 8 }).map((_, i) => (
            <React.Fragment key={i}>
                <View style={{ flex: 1, backgroundColor: '#dc2626' }} />
                <View style={{ flex: 1, backgroundColor: '#eab308' }} />
                <View style={{ flex: 1, backgroundColor: '#22c55e' }} />
                <View style={{ flex: 1, backgroundColor: '#111111' }} />
            </React.Fragment>
        ))}
    </View>
);

interface QuestScenario {
    id: string;
    englishTitle: string;
    twiTitle: string;
    gaTitle: string;
    englishDesc: string;
    twiDesc: string;
    gaDesc: string;
    targetEnglish: string;
    targetTwi: string;
    targetGa: string;
    poolEnglish: string[];
    poolTwi: string[];
    poolGa: string[];
    twiAnswer: string[];
    gaAnswer: string[];
    englishAnswer: string[];
}

const QUEST_SCENARIOS: QuestScenario[] = [
    {
        id: 'quest-1',
        englishTitle: 'Hospital Thirst',
        twiTitle: 'Nsuokɔm wɔ Ayaresabea',
        gaTitle: 'Nu Kɔm yɛ Helatsɛmɛi Ahe',
        englishDesc: 'You are in the hospital ward and feeling very thirsty. Assemble the correct phrase to ask for water.',
        twiDesc: 'Wɔwɔ ayaresabea na sukɔm de wo paa. Hyehye nsɛmfua no yie na bisa nsuo.',
        gaDesc: 'Oye helatsɛmɛi ahe ni nu kpeɔ bo waa. Kpeemɔ wiemɔi lɛ ni obi nu.',
        targetEnglish: 'Give me water',
        targetTwi: 'Ma me nsuo',
        targetGa: 'Kɛ nu ha mi',
        poolEnglish: ['Give', 'water', 'me', 'food', 'doctor'],
        poolTwi: ['Ma', 'nsuo', 'me', 'aduane', 'dɔkota'],
        poolGa: ['Kɛ', 'nu', 'ha', 'mi', 'ammm', 'dɔkɔta'],
        englishAnswer: ['Give', 'me', 'water'],
        twiAnswer: ['Ma', 'me', 'nsuo'],
        gaAnswer: ['Kɛ', 'nu', 'ha', 'mi']
    },
    {
        id: 'quest-2',
        englishTitle: 'Call Caregiver',
        twiTitle: 'Frɛ wo Hwɛsofo',
        gaTitle: 'Tsɛmɔ onɔhwɛlɔ',
        englishDesc: 'You need assistance and want to call your caregiver.',
        twiDesc: 'Wo pɛ mmoa na wopɛ sɛ wowo frɛ wo hwɛsofo.',
        gaDesc: 'Ohia yelikɛbuamɔ ni oha otsɛmɔ onɔhwɛlɔ.',
        targetEnglish: 'Call my family',
        targetTwi: "Frɛ m'abusua",
        targetGa: 'Frɛ mi wekumɛi',
        poolEnglish: ['Call', 'family', 'my', 'food', 'nurse'],
        poolTwi: ['Frɛ', "m'abusua", 'nsuo', 'boa', 'me'],
        poolGa: ['Frɛ', 'mi', 'wekumɛi', 'nu', 'boa', 'mi'],
        englishAnswer: ['Call', 'my', 'family'],
        twiAnswer: ['Frɛ', "m'abusua"],
        gaAnswer: ['Frɛ', 'mi', 'wekumɛi']
    },
    {
        id: 'quest-3',
        englishTitle: 'Hungry Ward',
        twiTitle: 'Ɔkɔm de me',
        gaTitle: 'Hɔmɔ yeɔ mi',
        englishDesc: 'You want to tell the caregiver you are hungry.',
        twiDesc: 'Wopɛ sɛ woka kyerɛ hwɛsofo no sɛ ɔkɔm de wo.',
        gaDesc: 'Osuɔ ni okɛɛ onɔhwɛlɔ lɛ akɛ hɔmɔ yeɔ bo.',
        targetEnglish: 'I am hungry',
        targetTwi: 'Ɔkɔm de me',
        targetGa: 'Hɔmɔ yeɔ mi',
        poolEnglish: ['I', 'hungry', 'am', 'sleep', 'water'],
        poolTwi: ['Ɔkɔm', 'de', 'me', 'da', 'nsuo'],
        poolGa: ['Hɔmɔ', 'yeɔ', 'mi', 'nu', 'hee'],
        englishAnswer: ['I', 'am', 'hungry'],
        twiAnswer: ['Ɔkɔm', 'de', 'me'],
        gaAnswer: ['Hɔmɔ', 'yeɔ', 'mi']
    },
    {
        id: 'quest-4',
        englishTitle: 'Need Medicine',
        twiTitle: 'Mehia Aduro',
        gaTitle: 'Mihia Tsofã',
        englishDesc: 'You are feeling dizzy and need your medicine.',
        twiDesc: 'Wo ti repin wo na wopɛ sɛ wɔma wo aduro.',
        gaDesc: 'Oyitsɔ yeɔ bo ni ohia tsofã.',
        targetEnglish: 'Give me medicine',
        targetTwi: 'Ma me aduro',
        targetGa: 'Kɛ tsofã ha mi',
        poolEnglish: ['Give', 'medicine', 'me', 'toilet', 'sleep'],
        poolTwi: ['Ma', 'aduro', 'me', 'da', 'nsuo'],
        poolGa: ['Kɛ', 'tsofã', 'ha', 'mi', 'nu', 'hee'],
        englishAnswer: ['Give', 'me', 'medicine'],
        twiAnswer: ['Ma', 'me', 'aduro'],
        gaAnswer: ['Kɛ', 'tsofã', 'ha', 'mi']
    }
];

export default function PhraseBuilderQuestScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const tr = useT(language as any);

    const { role, patientType } = useRole();
    const isOnline = useNetworkStatus();
    const [isGuestLocked, setIsGuestLocked] = useState(false);
    const [dynamicQuests, setDynamicQuests] = useState<QuestScenario[]>(QUEST_SCENARIOS);
    const [isWrongAnswer, setIsWrongAnswer] = useState(false);
    const [incorrectAttempts, setIncorrectAttempts] = useState(0);

    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [points, setPoints] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(30);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [scrambledPool, setScrambledPool] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [isWon, setIsWon] = useState<boolean | null>(null);

    const activeQuest = dynamicQuests[scenarioIndex] || QUEST_SCENARIOS[scenarioIndex] || QUEST_SCENARIOS[0];

    // Fetch dynamic quests from Supabase when online
    useEffect(() => {
        const fetchQuests = async () => {
            try {
                const { data, error } = await supabase
                    .from('phrase_quest_challenges')
                    .select('*');
                if (data && data.length > 0 && !error) {
                    const formatted = data.map(d => ({
                        id: d.id,
                        englishTitle: d.english_title || d.title,
                        twiTitle: d.twi_title || d.title,
                        gaTitle: d.ga_title || d.title,
                        englishDesc: d.english_desc || d.description,
                        twiDesc: d.twi_desc || d.description,
                        gaDesc: d.ga_desc || d.description,
                        targetEnglish: d.target_english || '',
                        targetTwi: d.target_twi || '',
                        targetGa: d.target_ga || '',
                        poolEnglish: d.pool_english || [],
                        poolTwi: d.pool_twi || [],
                        poolGa: d.pool_ga || [],
                        twiAnswer: d.twi_answer || [],
                        gaAnswer: d.ga_answer || [],
                        englishAnswer: d.english_answer || [],
                    }));
                    setDynamicQuests(formatted);
                }
            } catch (e) {
                console.log('Error fetching dynamic phrase quests, falling back to local', e);
            }
        };
        fetchQuests();
    }, []);

    // Guest practice limit check
    const checkGuestPracticeLimit = async () => {
        if (patientType === 'guest') {
            const today = new Date().toDateString();
            const stored = await AsyncStorage.getItem('@voiceaid_guest_practice_count');
            if (stored) {
                const { date, count } = JSON.parse(stored);
                if (date === today && count >= 3) {
                    setIsGuestLocked(true);
                    return true;
                }
            }
        }
        setIsGuestLocked(false);
        return false;
    };

    const incrementGuestPracticeCount = async () => {
        if (patientType === 'guest') {
            const today = new Date().toDateString();
            const stored = await AsyncStorage.getItem('@voiceaid_guest_practice_count');
            let count = 1;
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.date === today) {
                    count = parsed.count + 1;
                }
            }
            await AsyncStorage.setItem('@voiceaid_guest_practice_count', JSON.stringify({ date: today, count }));
        }
    };

    // Load initial score and check guest limit
    useEffect(() => {
        checkGuestPracticeLimit();
        const loadScore = async () => {
            const savedPoints = await AsyncStorage.getItem('@voiceaid_game_points');
            if (savedPoints) {
                setPoints(parseInt(savedPoints, 10));
            }
        };
        loadScore();
    }, []);

    // Set up word pool on scenario, language, or quest pool switch
    useEffect(() => {
        setupScenario();
    }, [scenarioIndex, language, dynamicQuests]);

    // Game timer
    useEffect(() => {
        if (gameOver || isWon) return;

        if (secondsLeft === 0) {
            setGameOver(true);
            setIsWon(false);
            haptics.heavy();
            return;
        }

        const timerId = setTimeout(() => {
            setSecondsLeft(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timerId);
    }, [secondsLeft, gameOver, isWon]);

    const setupScenario = () => {
        let pool: string[] = [];
        if (language === 'twi') pool = [...activeQuest.poolTwi];
        else if (language === 'ga') pool = [...activeQuest.poolGa];
        else pool = [...activeQuest.poolEnglish];

        // Shuffle pool
        const shuffled = pool.sort(() => Math.random() - 0.5);
        setScrambledPool(shuffled);
        setSelectedWords([]);
        setSecondsLeft(30);
        setGameOver(false);
        setIsWon(null);
        setIsWrongAnswer(false);
        setIncorrectAttempts(0);
    };

    const handleWordTap = (word: string) => {
        if (gameOver || isWon) return;
        haptics.selection();
        
        setIsWrongAnswer(false); // Clear error on interaction
        
        // Remove from pool, move to selected
        setScrambledPool(prev => prev.filter(w => w !== word));
        setSelectedWords(prev => [...prev, word]);
    };

    const handleSelectedTap = (word: string) => {
        if (gameOver || isWon) return;
        haptics.selection();
        
        setIsWrongAnswer(false); // Clear error on interaction
        
        // Remove from selected, return to pool
        setSelectedWords(prev => prev.filter(w => w !== word));
        setScrambledPool(prev => [...prev, word]);
    };

    const handleCheckSentence = async () => {
        if (gameOver || isWon) return;

        let targetAnswer: string[] = [];
        if (language === 'twi') targetAnswer = activeQuest.twiAnswer;
        else if (language === 'ga') targetAnswer = activeQuest.gaAnswer;
        else targetAnswer = activeQuest.englishAnswer;

        const isCorrect = selectedWords.length === targetAnswer.length &&
            selectedWords.every((val, index) => val === targetAnswer[index]);

        if (isCorrect) {
            setIsWon(true);
            setGameOver(true);
            haptics.success();
            
            const textToSpeak = selectedWords.join(' ');
            const langCode = language === 'twi' ? 'twi' : language === 'ga' ? 'ga' : 'en';
            try {
                await TTSService.speak(textToSpeak, langCode as any);
            } catch (e) {
                console.error(e);
            }

            // Award points
            const newPoints = points + 50;
            setPoints(newPoints);
            await AsyncStorage.setItem('@voiceaid_game_points', newPoints.toString());

            // 1. Increment Guest practice count
            await incrementGuestPracticeCount();

            // 2. Log Speech Analytics Session
            try {
                await AnalyticsService.logSession({
                    duration: 30 - secondsLeft,
                    wordCount: targetAnswer.length,
                    messageCount: 1,
                    language: language as string,
                    mode: 'batch',
                    metadata: {
                        isOffline: !isOnline,
                        incorrectAttempts: incorrectAttempts,
                        struggles: incorrectAttempts > 0 ? [{
                            questTitle: activeQuest.englishTitle,
                            attempts: incorrectAttempts,
                            detail: 'Incorrect word arrangement during sentence building'
                        }] : [],
                        questId: activeQuest.id,
                        title: activeQuest.englishTitle
                    }
                });
            } catch (analyticsErr) {
                console.error('Analytics logging error inside phrase quest:', analyticsErr);
            }

            // Check streak / badge
            try {
                const { newlyUnlocked } = await StreakService.recordPractice('phrase_quest');
                if (newlyUnlocked.length > 0) {
                    const newlyUnlockedBadges = AVAILABLE_BADGES.filter(b => newlyUnlocked.includes(b.id));
                    const badgeTitles = newlyUnlockedBadges.map(b => language === 'twi' ? (b.twiTitle || b.title) : language === 'ga' ? (b.gaTitle || b.title) : b.title).join(', ');
                    Alert.alert(
                        language === 'twi' ? 'Abasobɔdeɛ Foforo Nyaado!' : language === 'ga' ? 'Badge Foforo Hele!' : 'New Badge Unlocked!',
                        language === 'twi' ? `Woanya abasobɔdeɛ foforo: ${badgeTitles}` : language === 'ga' ? `Ona badge foforo: ${badgeTitles}` : `You have unlocked new badges: ${badgeTitles}`,
                        [{ text: 'Woohoo!' }]
                    );
                }
            } catch (streakErr) {
                console.error('Streak update error inside phrase quest:', streakErr);
            }
        } else {
            haptics.error();
            setIsWrongAnswer(true);
            setIncorrectAttempts(prev => prev + 1);
        }
    };

    const handleNextQuest = async () => {
        haptics.selection();
        
        // Check guest locks before moving to the next level
        const isLocked = await checkGuestPracticeLimit();
        if (isLocked) return;

        setScenarioIndex(prev => (prev + 1) % dynamicQuests.length);
    };

    const getQuestTitle = () => {
        if (language === 'twi') return activeQuest.twiTitle;
        if (language === 'ga') return activeQuest.gaTitle;
        return activeQuest.englishTitle;
    };

    const getQuestDesc = () => {
        if (language === 'twi') return activeQuest.twiDesc;
        if (language === 'ga') return activeQuest.gaDesc;
        return activeQuest.englishDesc;
    };

    if (isGuestLocked) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {language === 'twi' ? 'Kasa Kpeemɔ' : language === 'ga' ? 'Wiemɔ Saji Kpeemɔ' : 'Sentence Builder Quest'}
                    </Text>
                </View>
                <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
                    <KenteAccent />
                </View>
                <View style={{ padding: 24, justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <View style={{ backgroundColor: colors.primary + '12', width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                        <Ionicons name="lock-closed" size={54} color={colors.primary} />
                    </View>
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 16 }}>
                        🔒 Guest Practice Limit Reached!
                    </Text>
                    <Text style={{ color: colors.subText, fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 12 }}>
                        You have completed your 3 free daily practices today. Connect with a caregiver or therapist at your hospital to unlock unlimited custom caregiver-assigned quests, real-time analytics syncing, and clinical therapy milestone tracking!
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: colors.primary, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                        onPress={() => router.push('/hospital-connect')}
                    >
                        <Text style={{ color: colors.bg === '#111111' ? '#111111' : '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                            🔗 Link Hospital Account
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ marginTop: 20 }}
                        onPress={() => router.back()}
                    >
                        <Text style={{ color: colors.subText, fontSize: 14, fontWeight: '600' }}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {language === 'twi' ? 'Kasa Kpeemɔ' : language === 'ga' ? 'Wiemɔ Saji Kpeemɔ' : 'Sentence Builder Quest'}
                </Text>
                <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                    <Star size={16} color="#eab308" fill="#eab308" />
                    <Text style={[styles.pointsText, { color: colors.primary }]}>{points} XP</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Visual African Kente Accent Divider */}
                <KenteAccent />

                {/* Connection Status Badge */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16 }}>
                    <View style={{
                        backgroundColor: isOnline ? '#e6fdfa' : '#f3f4f6', 
                        borderColor: isOnline ? '#2ee7c3' : '#d1d5db',
                        borderWidth: 1,
                        borderRadius: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? '#0d9488' : '#6b7280' }} />
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: isOnline ? '#0f766e' : '#4b5563' }}>
                            {isOnline ? '🟢 Online Sync' : '🟡 Offline Mode'}
                        </Text>
                    </View>
                </View>

                {/* Level / Scenario Progress */}
                <View style={styles.levelRow}>
                    <Text style={[styles.levelLabel, { color: colors.primary }]}>
                        {language === 'twi' ? `Adesua ${scenarioIndex + 1} afiri ${dynamicQuests.length}` : language === 'ga' ? `Kasemɔ ${scenarioIndex + 1} kɛjɛ ${dynamicQuests.length}` : `Quest ${scenarioIndex + 1} of ${dynamicQuests.length}`}
                    </Text>
                    <View style={styles.timerRow}>
                        <Clock size={16} color={secondsLeft < 10 ? '#ef4444' : colors.subText} />
                        <Text style={[styles.timerText, { color: secondsLeft < 10 ? '#ef4444' : colors.text }]}>
                            {secondsLeft}s
                        </Text>
                    </View>
                </View>

                {/* Scenario Board */}
                <View style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.questHeader}>
                        <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
                        <Text style={[styles.scenarioTitle, { color: colors.text }]}>{getQuestTitle()}</Text>
                    </View>
                    <Text style={[styles.scenarioText, { color: colors.subText }]}>{getQuestDesc()}</Text>
                </View>

                {/* Sentence Building Slots */}
                <View style={[
                    styles.builderBox, 
                    { 
                        backgroundColor: colors.card, 
                        borderColor: isWrongAnswer ? '#ef4444' : colors.border,
                        borderWidth: isWrongAnswer ? 2 : 1 
                    }
                ]}>
                    <Text style={[styles.slotLabel, { color: colors.subText }]}>
                        {language === 'twi' ? 'Wo Kasa-nsɛm:' : language === 'ga' ? 'O Wiemɔ Saji:' : 'Your Sentence:'}
                    </Text>
                    
                    <View style={styles.chipsSlotRow}>
                        {selectedWords.length === 0 ? (
                            <Text style={styles.placeholderSlotText}>
                                {language === 'twi' ? 'Sɔ nsɛmfua no mu wɔ aseɛ' : language === 'ga' ? 'Mɔ wiemɔi lɛ awo shishi' : 'Tap words below to assemble...'}
                            </Text>
                        ) : (
                            selectedWords.map(word => (
                                <TouchableOpacity
                                    key={word}
                                    style={[styles.wordChip, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    onPress={() => handleSelectedTap(word)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.wordChipText}>{word}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>

                {/* On-screen Wrong Answer Warning Card */}
                {isWrongAnswer && (
                    <View style={[styles.resultCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5', marginBottom: 20 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <Ionicons
                                name="alert-circle"
                                size={24}
                                color="#ef4444"
                            />
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#ef4444' }}>
                                {language === 'twi' ? 'Kasa-nsɛm Mfomsoɔ!' : language === 'ga' ? 'Wiemɔ Saji Mfomsoɔ!' : 'Incorrect Word Arrangement!'}
                            </Text>
                        </View>
                        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                            {language === 'twi' 
                                ? 'Nsɛmfua no nhyehyɛeɛ nte tenenee. Kɔ so di nsɛmfua no so na hyehyɛ bio.' 
                                : language === 'ga' 
                                    ? 'Wiemɔi lɛ gbɛjianɔtoo lɛ ehiii. Ta wiemɔi lɛ anɔ ni okpe bio.' 
                                    : 'The sentence is out of order. Tap chips to rearrange them and try again.'
                            }
                        </Text>
                    </View>
                )}

                {/* Scrambled Word Pool */}
                <View style={styles.wordPoolSection}>
                    <Text style={[styles.poolLabel, { color: colors.text }]}>
                        {language === 'twi' ? 'Nsɛmfua pool:' : language === 'ga' ? 'Wiemɔ pool:' : 'Available Words:'}
                    </Text>
                    
                    <View style={styles.poolChipsRow}>
                        {scrambledPool.map(word => (
                            <TouchableOpacity
                                key={word}
                                style={[styles.poolChip, { backgroundColor: colors.border + '35', borderColor: colors.border }]}
                                onPress={() => handleWordTap(word)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.poolChipText, { color: colors.text }]}>{word}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Evaluation State Card */}
                {isWon !== null && (
                    <View style={[styles.resultCard, { backgroundColor: isWon ? colors.success + '12' : '#fef2f2', borderColor: isWon ? colors.success : '#fca5a5' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <Ionicons
                                name={isWon ? "checkmark-circle" : "alert-circle"}
                                size={24}
                                color={isWon ? colors.success : '#ef4444'}
                            />
                            <Text style={{ fontSize: 18, fontWeight: '800', color: isWon ? colors.success : '#ef4444' }}>
                                {isWon 
                                    ? (language === 'twi' ? 'Woawie Nyaado! 🎉' : language === 'ga' ? 'Ofeee he yie! 🎉' : 'Quest Completed! 🎉')
                                    : (language === 'twi' ? 'Mmɔdenbɔ no aso!' : language === 'ga' ? 'Okpa shi!' : 'Out of Time!')
                                }
                            </Text>
                        </View>
                        <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
                            {isWon
                                ? (language === 'twi' ? `Mepa wo kyɛw kasa pa! Woanya +50 XP.` : language === 'ga' ? `Ofeee he yie waa! Ona +50 XP.` : `Terrific job building the phrase! You earned +50 XP and played correct audio.`)
                                : (language === 'twi' ? 'Timer no aso. Sɔ mfitiase na bɔ mmɔden bio!' : language === 'ga' ? 'Gbi no kpa shi. Shwɛ eko bio!' : 'The countdown timer expired. Reset the level and try again!')
                            }
                        </Text>
                    </View>
                )}

                {/* Actions Row */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.resetBtn, { borderColor: colors.border }]}
                        onPress={setupScenario}
                        activeOpacity={0.8}
                    >
                        <RefreshCw size={18} color={colors.text} />
                        <Text style={[styles.resetBtnText, { color: colors.text }]}>Reset</Text>
                    </TouchableOpacity>

                    {isWon ? (
                        <TouchableOpacity
                            style={[styles.nextBtn, { backgroundColor: colors.success }]}
                            onPress={handleNextQuest}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.nextBtnText}>
                                {language === 'twi' ? 'Adesua Foforo' : language === 'ga' ? 'Kasemɔ Foforo' : 'Next Quest'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.checkBtn, { backgroundColor: colors.primary }]}
                            onPress={handleCheckSentence}
                            activeOpacity={0.8}
                            disabled={selectedWords.length === 0}
                        >
                            <Text style={[styles.checkBtnText, { color: colors.bg === '#111111' ? '#111111' : '#FFFFFF' }]}>
                                {language === 'twi' ? 'Sɔ Hwɛ' : language === 'ga' ? 'Kaa Hwɛ' : 'Verify'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    pointsText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    content: {
        padding: 16,
    },
    levelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelLabel: {
        fontWeight: '800',
        fontSize: 15,
        textTransform: 'uppercase',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timerText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    scenarioCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        marginBottom: 20,
    },
    questHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    scenarioTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    scenarioText: {
        fontSize: 15,
        lineHeight: 22,
    },
    builderBox: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        minHeight: 120,
        marginBottom: 24,
    },
    slotLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    placeholderSlotText: {
        color: '#9ca3af',
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 10,
    },
    chipsSlotRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    wordChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        elevation: 1,
    },
    wordChipText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    wordPoolSection: {
        marginBottom: 30,
    },
    poolLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
    },
    poolChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    poolChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    poolChipText: {
        fontWeight: '600',
        fontSize: 15,
    },
    resultCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        gap: 8,
    },
    resetBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
    checkBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
    },
    checkBtnText: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    nextBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
    }
});
