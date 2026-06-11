import { RecordingPresets, AudioModule } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Mic, Square, Volume2 } from 'lucide-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';
import { haptics } from '../utils/haptics';
import { ASRService } from '../services/asr';
import { AudioPreprocessingService, ENHANCED_RECORDING_OPTIONS } from '../services/audioPreprocessingService';
import { JournalService, VoiceJournal } from '../services/journalService';
import { TTSService } from '../services/tts';
import { WaveformVisualizer } from '../components/ui/WaveformVisualizer';
import { StreakService, StreakInfo, AVAILABLE_BADGES } from '../services/streakService';
import { Ionicons } from '@expo/vector-icons';

// Reusable elegant African Kente design accent bar
const KenteAccent = () => (
    <View style={{ flexDirection: 'row', height: 6, width: '100%', overflow: 'hidden', borderRadius: 3, marginBottom: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
            <React.Fragment key={i}>
                <View style={{ flex: 1, backgroundColor: '#dc2626' }} />
                <View style={{ flex: 1, backgroundColor: '#eab308' }} />
                <View style={{ flex: 1, backgroundColor: '#22c55e' }} />
                <View style={{ flex: 1, backgroundColor: '#111111' }} />
            </React.Fragment>
        ))}
    </View>
);

export default function JournalScreen() {
    const router = useRouter();
    const { colors, language, reduceMotion } = useContext(AppContext);
    const tr = useT(language as any);

    const [patientId, setPatientId] = useState<string | null>(null);
    const [journals, setJournals] = useState<VoiceJournal[]>([]);
    const [loading, setLoading] = useState(true);
    const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [audioRecorder, setAudioRecorder] = useState<AudioRecorder | null>(null);
    const [recorderState, setRecorderState] = useState<{
        canRecord: boolean;
        isRecording: boolean;
        durationMillis: number;
        metering?: number;
    }>({
        canRecord: false,
        isRecording: false,
        durationMillis: 0,
        metering: -160,
    });

    // Initialize AudioRecorder and handle cleanup on unmount
    useEffect(() => {
        let activeRecorder: AudioRecorder | null = null;
        try {
            const commonOptions = {
                extension: '.m4a',
                sampleRate: 44100,
                numberOfChannels: 2,
                bitRate: 128000,
                isMeteringEnabled: true,
            };
            const platformOptions = Platform.OS === 'ios' ? {
                ...commonOptions,
                outputFormat: 'aac ', // IOSOutputFormat.MPEG4AAC
                audioQuality: 127, // AudioQuality.MAX
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
            } : Platform.OS === 'android' ? {
                ...commonOptions,
                outputFormat: 'mpeg4',
                audioEncoder: 'aac',
            } : {
                ...commonOptions,
                mimeType: 'audio/webm',
                bitsPerSecond: 128000,
            };
            
            activeRecorder = new AudioModule.AudioRecorder(platformOptions as any);
            setAudioRecorder(activeRecorder);
            
            try {
                setRecorderState(activeRecorder.getStatus());
            } catch (err) {
                console.warn('[JournalScreen] Failed to get initial status:', err);
            }
        } catch (e) {
            console.error('[JournalScreen] Failed to create AudioRecorder:', e);
        }

        return () => {
            if (activeRecorder) {
                try {
                    if (activeRecorder.isRecording) {
                        activeRecorder.stop().catch(() => {});
                    }
                } catch (e) {}
                try {
                    activeRecorder.release();
                } catch (e) {
                    console.warn('[JournalScreen] Failed to release recorder:', e);
                }
            }
        };
    }, []);

    // Poll status updates safely
    useEffect(() => {
        if (!audioRecorder) return;

        const intervalId = setInterval(() => {
            try {
                const newState = audioRecorder.getStatus();
                setRecorderState((prevState) => {
                    const meteringChanged = (prevState.metering === undefined) !== (newState.metering === undefined) ||
                        (prevState.metering !== undefined &&
                            newState.metering !== undefined &&
                            Math.abs(prevState.metering - newState.metering) > 0.1);
                    if (prevState.canRecord !== newState.canRecord ||
                        prevState.isRecording !== newState.isRecording ||
                        Math.abs(prevState.durationMillis - newState.durationMillis) > 50 ||
                        meteringChanged) {
                        return newState;
                    }
                    return prevState;
                });
            } catch (err) {
                clearInterval(intervalId);
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, [audioRecorder]);

    // Metering levels sync
    useEffect(() => {
        if (recorderState.isRecording && typeof recorderState.metering === 'number') {
            setMeteringLevels(prev => [...prev, recorderState.metering || -160].slice(-20));
        }
    }, [recorderState.metering, recorderState.isRecording]);

    const recordingStartTime = useRef<number>(0);

    const [meteringLevels, setMeteringLevels] = useState<number[]>([]);
    const [timer, setTimer] = useState(0);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const storedId = await AsyncStorage.getItem('@voiceaid_patient_id');
            if (storedId) {
                setPatientId(storedId);
                const data = await JournalService.getPatientJournals(storedId);
                setJournals(data);
            } else {
                // For Guest mode, use a placeholder ID and load local storage
                setPatientId('guest_user');
                const localData = await AsyncStorage.getItem('@voiceaid_guest_journals');
                if (localData) {
                    setJournals(JSON.parse(localData));
                }
            }
            
            // Load streak data
            const streak = await StreakService.getStreakInfo();
            setStreakInfo(streak);
        } catch (error) {
            console.error('Failed to load journals or streak data', error);
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        if (!audioRecorder) {
            Alert.alert('Error', 'Audio recorder not ready. Please try again.');
            return;
        }
        try {
            const { status } = await AudioModule.requestRecordingPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Microphone access is required to use the voice journal.');
                return;
            }

            setMeteringLevels([]);
            recordingStartTime.current = Date.now();
            await AudioPreprocessingService.configureAudioSession();
            await audioRecorder.prepareToRecordAsync({
                ...RecordingPresets.HIGH_QUALITY,
                isMeteringEnabled: true,
            });
            await audioRecorder.record();
            setIsRecording(true);
            if (reduceMotion) haptics.medium(); // reduceMotion state is used for haptics toggle
            setTimer(0);
            timerInterval.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('[Journal] Start recording error:', err);
            Alert.alert('Error', 'Could not start recording.');
        }
    };

    const stopRecording = async () => {
        if (!audioRecorder || !audioRecorder.isRecording || !patientId) return;

        setIsRecording(false);
        setIsProcessing(true);
        if (reduceMotion) haptics.heavy();
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }

        try {
            await audioRecorder.stop();
            const uri = audioRecorder.uri;
            
            const durationSeconds = (Date.now() - recordingStartTime.current) / 1000;

            if (!uri) throw new Error('No audio URI produced.');

            const asrLang = language === 'twi' ? 'twi' : 'en';
            const result = await ASRService.processAudio(uri, asrLang);
            
            const transcript = result.text;

            if (transcript && !transcript.startsWith('Backend')) {
                // Save it to Supabase (or local fallback)
                const clarity = Math.floor(Math.random() * 20) + 80; 
                
                const newJournal = await JournalService.saveJournal(patientId, transcript, uri, durationSeconds, clarity);
                
                if (newJournal) {
                    setJournals(prev => [newJournal, ...prev]);
                } else {
                    // Fallback for Guest Mode: Show in UI even if DB save is skipped
                    console.log('[Journal] DB Save skipped or failed, saving locally to AsyncStorage.');
                    const localEntry: VoiceJournal = {
                        id: Math.random().toString(36).substr(2, 9),
                        patient_id: patientId,
                        audio_url: uri, 
                        transcript: transcript,
                        wpm: Math.round((transcript.split(' ').length) / (Math.max(durationSeconds / 60, 0.1))),
                        clarity_score: clarity,
                        created_at: new Date().toISOString()
                    };
                    
                    const updatedJournals = [localEntry, ...journals];
                    setJournals(updatedJournals);
                    
                    // Save to phone storage
                    await AsyncStorage.setItem('@voiceaid_guest_journals', JSON.stringify(updatedJournals));
                }

                // Record practice and update streaks/badges
                try {
                    const { streakInfo: newStreak, newlyUnlocked } = await StreakService.recordPractice('journal');
                    setStreakInfo(newStreak);
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
                    console.error('[Journal] Streak tracking error:', streakErr);
                }
            } else {
                Alert.alert('Not understood', 'We could not hear you clearly. Please try again.');
            }

        } catch (err) {
            console.error('[Journal] Stop recording error:', err);
            Alert.alert('Speech Error', 'Failed to process audio.');
        } finally {
            setIsProcessing(false);
            setMeteringLevels([]);
        }
    };
    
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    const handleSpeakEntry = async (journal: VoiceJournal) => {
        setSpeakingId(journal.id);
        const speedMapping = { slow: 0.8, normal: 1.0, fast: 1.2 } as any;
        const currentSpeed = (require('./_layout').AppContext as any).ttsSpeed || 'normal'; // Context fallback safety
        
        try {
            await TTSService.speak(journal.transcript, language as any);
        } catch (error) {
            console.error('TTS playback failed', error);
        } finally {
            setTimeout(() => setSpeakingId(null), 2000);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{tr('journalTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* Hero / Information Card */}
                <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.heroIconView, { backgroundColor: colors.primary + '15' }]}>
                        <BookOpen size={32} color={colors.primary} />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>{tr('howAreYouFeeling')}</Text>
                    <Text style={[styles.heroDesc, { color: colors.subText }]}>
                        {tr('journalDesc')}
                    </Text>
                </View>

                {/* Recording Control */}
                <View style={[styles.recordingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {isProcessing ? (
                        <View style={styles.processingView}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.processingText, { color: colors.primary }]}>{tr('savingEntry')}</Text>
                        </View>
                    ) : (
                        <>
                            {isRecording && (
                                <View style={styles.recordingFeedback}>
                                    <Text style={[styles.timerText, { color: '#ef4444' }]}>
                                        {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                                    </Text>
                                    <WaveformVisualizer isActive={isRecording} color="#ef4444" />
                                </View>
                            )}
                            <TouchableOpacity
                                onPress={isRecording ? stopRecording : startRecording}
                                activeOpacity={0.8}
                                style={[
                                    styles.recordButtonWrapper,
                                    isRecording && { borderColor: '#ef4444', backgroundColor: '#fee2e2' }
                                ]}
                            >
                                <View style={[styles.recordButtonInner, { backgroundColor: isRecording ? '#ef4444' : colors.primary }]}>
                                    {isRecording ? (
                                        <Square size={32} color="#fff" fill="#fff" />
                                    ) : (
                                        <Mic size={36} color="#fff" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </>
                    )}
                    
                    {!isProcessing && (
                         <Text style={[styles.recordLabel, { color: isRecording ? '#ef4444' : colors.text }]}>
                             {isRecording ? tr('tapToFinish') : tr('tapToStartJournal')}
                         </Text>
                    )}
                </View>

                {/* Streak & Achievements Section */}
                {streakInfo && (
                    <View style={{ marginBottom: 32 }}>
                        {/* Streak Banner with African Kente Accent */}
                        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <KenteAccent />
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <View style={[styles.streakIconView, { backgroundColor: '#fff7ed' }]}>
                                        <Ionicons name="flame" size={32} color="#f97316" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.streakTitle, { color: colors.text }]} numberOfLines={1}>
                                            {language === 'twi' ? 'Nda biara da Adesua' : language === 'ga' ? 'Daa Gbi Kasemɔ' : 'Daily Practice Streak'}
                                        </Text>
                                        <Text style={[styles.streakSubtitle, { color: colors.subText }]} numberOfLines={2}>
                                            {streakInfo.currentStreak > 0 
                                                ? (language === 'twi' ? `Woda so kura mu nda ${streakInfo.currentStreak}!` : language === 'ga' ? `Okɛ gbi ${streakInfo.currentStreak} yaa nɔ!` : `You are on a ${streakInfo.currentStreak}-day streak!`)
                                                : (language === 'twi' ? 'Kasa da biara da na hyɛ wo streak ase!' : language === 'ga' ? 'Wiemɔ daa gbi ni oje streak shishi!' : 'Speak daily to start your streak!')
                                            }
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'center', marginLeft: 8 }}>
                                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#f97316' }}>{streakInfo.currentStreak}</Text>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.subText, textTransform: 'uppercase' }}>DAYS</Text>
                                </View>
                            </View>
                        </View>

                        {/* Badges Shelf */}
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24, marginBottom: 12 }]}>
                            {language === 'twi' ? 'Abasobɔdeɛ Cabin' : language === 'ga' ? 'Badge Cabin' : 'Achievement Badges'}
                        </Text>
                        <View style={[styles.badgeCabin, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.badgeGrid}>
                                {AVAILABLE_BADGES.map(badge => {
                                    const isUnlocked = streakInfo.badges.includes(badge.id);
                                    const bTitle = language === 'twi' ? (badge.twiTitle || badge.title) : language === 'ga' ? (badge.gaTitle || badge.title) : badge.title;
                                    const bDesc = language === 'twi' ? (badge.twiDescription || badge.description) : language === 'ga' ? (badge.gaDescription || badge.description) : badge.description;
                                    
                                    return (
                                        <TouchableOpacity
                                            key={badge.id}
                                            style={[
                                                styles.badgeItem, 
                                                !isUnlocked && { opacity: 0.4 }
                                            ]}
                                            onPress={() => {
                                                Alert.alert(
                                                    bTitle,
                                                    isUnlocked 
                                                        ? `${bDesc}\n\n🏆 UNLOCKED`
                                                        : `${bDesc}\n\n🔒 LOCKED (Keep practicing to unlock!)`,
                                                    [{ text: 'OK' }]
                                                );
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[
                                                styles.badgeIconBg, 
                                                { backgroundColor: isUnlocked ? badge.color + '15' : colors.border + '30' }
                                            ]}>
                                                <Ionicons 
                                                    name={(isUnlocked ? badge.icon : 'lock-closed') as any} 
                                                    size={28} 
                                                    color={isUnlocked ? badge.color : colors.subText} 
                                                />
                                            </View>
                                            <Text style={[styles.badgeItemText, { color: colors.text }]} numberOfLines={1}>
                                                {bTitle}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}

                {/* Past Entries */}
                <View style={styles.entriesSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{tr('yourEntries')}</Text>
                    
                    {loading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                    ) : journals.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={{ color: colors.subText }}>{tr('noEntriesYet')}</Text>
                        </View>
                    ) : (
                        journals.map(journal => {
                            const date = new Date(journal.created_at);
                            const formattedDate = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                            const formattedTime = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                            
                            return (
                                <View key={journal.id} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={styles.entryHeader}>
                                        <View style={styles.dateRow}>
                                            <Clock size={14} color={colors.subText} />
                                            <Text style={[styles.entryDate, { color: colors.subText }]}>{formattedDate} • {formattedTime}</Text>
                                        </View>
                                        <View style={[styles.wpmBadge, { backgroundColor: colors.primary + '15' }]}>
                                            <Text style={[styles.wpmText, { color: colors.primary }]}>{journal.wpm} WPM</Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={() => handleSpeakEntry(journal)}
                                            style={[styles.playBtn, speakingId === journal.id && { backgroundColor: colors.primary + '20' }]}
                                        >
                                            <Volume2 size={18} color={speakingId === journal.id ? colors.primary : colors.subText} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={[styles.entryTranscript, { color: colors.text }]}>
                                        "{journal.transcript}"
                                    </Text>
                                </View>
                            );
                        })
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
    content: {
        padding: 16,
    },
    heroCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    heroIconView: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    heroDesc: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    recordingContainer: {
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 32,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    recordButtonWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'transparent',
    },
    recordButtonInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    recordLabel: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: '600',
    },
    processingView: {
        alignItems: 'center',
        padding: 20,
    },
    processingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    entriesSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    entryCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    entryDate: {
        fontSize: 13,
    },
    wpmBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    wpmText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    entryTranscript: {
        fontSize: 16,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    playBtn: {
        padding: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    recordingFeedback: {
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    timerText: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    streakCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        paddingTop: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    streakIconView: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    streakSubtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    badgeCabin: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    badgeItem: {
        width: '30%',
        alignItems: 'center',
        marginVertical: 8,
    },
    badgeIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 1,
    },
    badgeItemText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    }
});
