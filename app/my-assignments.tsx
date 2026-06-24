/**
 * ==========================================
 * MY ASSIGNMENTS SCREEN — With ASR + TTS
 * ==========================================
 * Patient view of their therapist-assigned exercises.
 * 
 * 🔊 TTS: Tap the speaker icon on any assignment to hear it read aloud.
 * 🎤 ASR: Hold the mic button to speak a verbal response to an assignment.
 *         Whisper transcribes it; the text is shown and the assignment is marked done.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordingPresets, AudioModule } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
} from 'lucide-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Platform,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalCategory, GoalService, PatientGoal, todayDate } from '../services/goalService';
import { ASRService } from '../services/asr';
import { AudioPreprocessingService, ENHANCED_RECORDING_OPTIONS } from '../services/audioPreprocessingService';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

const CATEGORY_LABELS: Record<GoalCategory, string> = {
    communication: 'Communication',
    language: 'Language',
    social: 'Social',
    fluency: 'Fluency',
    voice: 'Voice',
    speech_sound: 'Speech Sound',
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
    communication: '#3b82f6',
    language: '#8b5cf6',
    social: '#ec4899',
    fluency: '#f59e0b',
    voice: '#10b981',
    speech_sound: '#ef4444',
};

const CATEGORY_ICONS: Record<GoalCategory, string> = {
    communication: 'chatbubble-ellipses',
    language: 'book',
    social: 'people',
    fluency: 'timer',
    voice: 'musical-notes',
    speech_sound: 'mic',
};

/** Format a YYYY-MM-DD date string into a friendly label */
const formatDateLabel = (dateStr: string): string => {
    const today = todayDate();
    const yesterday = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function MyAssignmentsScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const tr = useT(language as any);

    const [goals, setGoals] = useState<PatientGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientName, setPatientName] = useState('');
    const [patientId, setPatientId] = useState<string | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);

    // Date browsing
    const [selectedDate, setSelectedDate] = useState<string>(todayDate());
    const [availableDates, setAvailableDates] = useState<string[]>([todayDate()]);
    const isToday = selectedDate === todayDate();

    // TTS state
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    // ASR state
    const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState<Record<string, string>>({});
    
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
                console.warn('[MyAssignments] Failed to get initial status:', err);
            }
        } catch (e) {
            console.error('[MyAssignments] Failed to create AudioRecorder:', e);
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
                    console.warn('[MyAssignments] Failed to release recorder:', e);
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

    const hasAnnouncedRef = useRef(false);

    // Pulsing animation for mic button
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadData();
        requestMicPermission();
    }, []);

    // Reload goals when selected date changes
    useEffect(() => {
        if (patientId) loadGoalsForDate(patientId, selectedDate);
    }, [selectedDate, patientId]);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    const requestMicPermission = async () => {
        const { status } = await AudioModule.requestRecordingPermissionsAsync();
        if (status !== 'granted') {
            console.warn('[Assignments] Microphone permission denied');
        }
    };

    const loadData = async () => {
        const id = await AsyncStorage.getItem('@voiceaid_patient_id');
        const name = await AsyncStorage.getItem('@voiceaid_patient_name');
        if (name) setPatientName(name);
        if (id) {
            setPatientId(id);
            // Always show the last 7 days so the strip is always populated
            const last7: string[] = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                last7.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            }
            setAvailableDates(last7);
            // Load today's goals
            await loadGoalsForDate(id, last7[0]);

        } else {
            setLoading(false);
        }
    };

    const loadGoalsForDate = async (pid: string, date: string) => {
        setLoading(true);
        const data = await GoalService.getGoalsByDate(pid, date);
        setGoals(data);
        // Seed transcript map
        const t: Record<string, string> = {};
        data.forEach(g => { if (g.voice_transcript) t[g.id] = g.voice_transcript; });
        setTranscript(t);
        setLoading(false);

        // Auto-announce today's assignments via TTS when first loaded
        if (date === todayDate() && data.length > 0 && !hasAnnouncedRef.current) {
            const pending = data.filter(g => !g.completed);
            const greeting = pending.length > 0
                ? tr('dailyGreetingPending').replace('{count}', tr.formatCount(pending.length))
                : tr('dailyGreetingDone');
            hasAnnouncedRef.current = true;
            setTimeout(() => TTSService.speak(greeting, language as any), 800);
        }
    };

    const handleToggle = async (goal: PatientGoal) => {
        setToggling(goal.id);
        const newState = !goal.completed;
        const success = await GoalService.toggleGoal(goal.id, newState);
        if (success) {
            setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completed: newState } : g));
        }
        setToggling(null);
    };

    // ─── TTS: Read assignment aloud ────────────────────────────────────────
    const handleSpeak = async (goal: PatientGoal) => {
        if (speakingId === goal.id) {
            await TTSService.stop();
            setSpeakingId(null);
            return;
        }
        setSpeakingId(goal.id);
        const translatedTitle = tr.translateText(goal.title);
        const translatedDesc = goal.description ? tr.translateText(goal.description) : '';
        const text = translatedDesc ? `${translatedTitle}. ${translatedDesc}` : translatedTitle;
        await TTSService.speak(text, language as any);
        // expo-speech doesn't provide completion callback reliably, so clear after a delay
        setTimeout(() => setSpeakingId(null), (text.length / 12) * 1000 + 1000);
    };

    // ─── ASR: Start recording for a specific goal ──────────────────────────
    const startRecording = async (goalId: string) => {
        if (!audioRecorder) return;
        try {
            await TTSService.stop();
            setSpeakingId(null);
            setActiveGoalId(goalId);
            await AudioPreprocessingService.configureAudioSession();
            await audioRecorder.prepareToRecordAsync({
                ...RecordingPresets.HIGH_QUALITY,
                isMeteringEnabled: false,
            });
            await audioRecorder.record();
            setIsRecording(true);
        } catch (err) {
            console.error('[Assignments ASR] Start error:', err);
        }
    };

    const stopAndTranscribe = async () => {
        if (!audioRecorder || !audioRecorder.isRecording || !activeGoalId) return;

        setIsRecording(false);
        setIsProcessing(true);

        try {
            await audioRecorder.stop();
            const uri = audioRecorder.uri;

            if (!uri) throw new Error('No audio URI');

            const result = await ASRService.processAudio(uri, language === 'twi' ? 'twi' : language === 'ga' ? 'ga' : 'en');
            const text = result.text;

            if (text && !text.startsWith('Backend')) {
                // Persist transcript to Supabase AND mark goal complete
                const success = await GoalService.saveTranscript(activeGoalId, text);
                if (success) {
                    setTranscript(prev => ({ ...prev, [activeGoalId]: text }));
                    setGoals(prev => prev.map(g =>
                        g.id === activeGoalId
                            ? { ...g, completed: true, voice_transcript: text }
                            : g
                    ));
                }
                // Read back what was transcribed
                const heardMsg = language === 'twi' ? `Mete: ${text}` : language === 'ga' ? `Minu: ${text}` : `I heard: ${text}`;
                await TTSService.speak(heardMsg, language as any);
            } else {
                const failMsg = language === 'twi' 
                    ? "Mente yie. San bɔ." 
                    : language === 'ga' 
                        ? "Minuu jogbaŋŋ. Ka he eko." 
                        : "Sorry, I couldn't hear that clearly. Please try again.";
                await TTSService.speak(failMsg, language as any);
            }
        } catch (err) {
            console.error('[Assignments ASR] Stop error:', err);
        } finally {
            setIsProcessing(false);
            setActiveGoalId(null);
        }
    };

    const completedCount = goals.filter(g => g.completed).length;
    const totalCount = goals.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const grouped = goals.reduce((acc, goal) => {
        if (!acc[goal.category]) acc[goal.category] = [];
        acc[goal.category].push(goal);
        return acc;
    }, {} as Record<GoalCategory, PatientGoal[]>);

    // Reusable elegant African Kente design accent bar
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {language === 'twi' ? 'Me Nnwuma (Missions)' : language === 'ga' ? 'Missions' : 'My Active Missions'}
                    </Text>
                    <Text style={[styles.headerSub, { color: colors.subText }]}>
                        {language === 'twi' ? 'Adesua a wo dɔkota de ama wo' : language === 'ga' ? 'Kasemɔ kɛjɛ odɔkɔta ŋɔɔ' : 'Assigned by your speech therapist'}
                    </Text>
                </View>
            </View>

            {/* ── Date Selector Strip ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}
            >
                {availableDates.map(date => {
                    const isSelected = date === selectedDate;
                    const isT = date === todayDate();
                    return (
                        <TouchableOpacity
                            key={date}
                            onPress={() => setSelectedDate(date)}
                            activeOpacity={0.85}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                                borderWidth: 2,
                                alignItems: 'center',
                                backgroundColor: isSelected ? colors.primary : colors.card,
                                borderColor: isSelected ? colors.primary : colors.border,
                            }}
                        >
                            <Text style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: isSelected ? (colors.bg === '#111111' ? '#111111' : '#fff') : (isT ? colors.primary : colors.subText),
                            }}>
                                {formatDateLabel(date)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Past date notice */}
            {!isToday && (
                <View style={{ backgroundColor: '#fef9c3', paddingVertical: 8, paddingHorizontal: 16 }}>
                    <Text style={{ color: '#92400e', fontSize: 13, textAlign: 'center' }}>
                        📖 {language === 'twi' ? 'Worehwɛ Missions a atwam' : language === 'ga' ? 'Okwɛɔ Missions pɛŋ' : 'Viewing completed past missions'}
                    </Text>
                </View>
            )}

            {/* ASR Active Banner */}
            {(isRecording || isProcessing) && (
                <View style={[styles.asrBanner, { backgroundColor: isProcessing ? '#fef3c7' : '#fef2f2' }]}>
                    {isProcessing ? (
                        <>
                            <ActivityIndicator size="small" color="#f59e0b" />
                            <Text style={{ color: '#92400e', marginLeft: 10, fontWeight: '600', fontSize: 14 }}>
                                {tr('whisperTranscribing')}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <Mic size={20} color="#ef4444" />
                            </Animated.View>
                            <Text style={{ color: '#991b1b', marginLeft: 10, fontWeight: '600', fontSize: 14 }}>
                                {tr('listeningTapToStop')}
                            </Text>
                        </>
                    )}
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                {/* Horizontal Kente Bar */}
                <KenteAccent />

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
                ) : totalCount === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={{ fontSize: 60 }}>📋</Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {language === 'twi' ? 'Nnwuma (Missions) biara nni ha' : language === 'ga' ? 'Missions koom yɛɔ' : 'No Active Missions Today'}
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                            {language === 'twi' ? 'Wo dɔkota mmae wo nnwuma biara ndɛ.' : language === 'ga' ? 'Odɔkɔta kɛ weɔ kasemɔ koom ha bo daa gbi.' : 'Your therapist has not assigned any speech missions for this day.'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Progress Card */}
                        <View style={[styles.progressCard, { backgroundColor: colors.primary }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.progressGreeting}>
                                    {tr('keepItUp')}{patientName ? `, ${patientName.split(' ')[0]}` : ''}! 💪
                                </Text>
                                <Text style={styles.progressText}>
                                    {completedCount} of {totalCount} Missions Completed
                                </Text>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                                </View>
                            </View>
                            <View style={styles.progressCircle}>
                                <Text style={styles.progressPercent}>{percent}%</Text>
                            </View>
                        </View>

                        {/* Instruction hint */}
                        <View style={[styles.hintBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={{ fontSize: 13, color: colors.subText, textAlign: 'center', lineHeight: 18 }}>
                                🔊 Hear Mission Instructions{'   '}•{'   '}🎤 Speak to Answer
                            </Text>
                        </View>

                        {/* Grouped by Category */}
                        {(Object.keys(grouped) as GoalCategory[]).map(cat => (
                            <View key={cat} style={{ marginBottom: 20 }}>
                                <View style={styles.catHeader}>
                                    <View style={[styles.catIconBg, { backgroundColor: CATEGORY_COLORS[cat] + '20' }]}>
                                        <Ionicons name={CATEGORY_ICONS[cat] as any} size={16} color={CATEGORY_COLORS[cat]} />
                                    </View>
                                    <Text style={[styles.catTitle, { color: colors.text }]}>
                                        {(() => {
                                            const catKey = `cat${cat.charAt(0).toUpperCase()}${cat.slice(1).replace(/_([a-z])/g, (_, m) => m.toUpperCase())}`;
                                            const translatedCat = tr(catKey as any);
                                            return translatedCat && translatedCat !== catKey ? translatedCat : CATEGORY_LABELS[cat];
                                        })()}
                                    </Text>
                                    <Text style={[styles.catCount, { color: colors.subText }]}>
                                        {grouped[cat].filter(g => g.completed).length}/{grouped[cat].length}
                                    </Text>
                                </View>

                                {grouped[cat].map(goal => (
                                    <View
                                        key={goal.id}
                                        style={[
                                            styles.goalCard,
                                            {
                                                backgroundColor: goal.completed ? CATEGORY_COLORS[goal.category] + '12' : colors.card,
                                                borderColor: goal.completed ? CATEGORY_COLORS[goal.category] + '50' : colors.border,
                                                borderLeftColor: CATEGORY_COLORS[goal.category],
                                            }
                                        ]}
                                    >
                                        {/* Top row: checkbox + text */}
                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', flex: 1 }}
                                            onPress={() => handleToggle(goal)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ marginRight: 12, marginTop: 2 }}>
                                                {toggling === goal.id ? (
                                                    <ActivityIndicator size="small" color={CATEGORY_COLORS[goal.category]} />
                                                ) : goal.completed ? (
                                                    <CheckCircle2 size={24} color={CATEGORY_COLORS[goal.category]} />
                                                ) : (
                                                    <Circle size={24} color={colors.subText} />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[
                                                    styles.goalTitle,
                                                    { color: colors.text },
                                                    goal.completed && { textDecorationLine: 'line-through', color: colors.subText }
                                                ]}>
                                                    {tr.translateText(goal.title)}
                                                </Text>
                                                {goal.description ? (
                                                    <Text style={[styles.goalDesc, { color: colors.subText }]}>
                                                        {tr.translateText(goal.description)}
                                                    </Text>
                                                ) : null}

                                                {/* Transcribed voice response */}
                                                {transcript[goal.id] && (
                                                    <View style={[styles.transcriptBubble, { borderColor: CATEGORY_COLORS[goal.category] + '40' }]}>
                                                        <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2, fontWeight: '600' }}>
                                                            {tr('patientSaid')}
                                                        </Text>
                                                        <Text style={{ fontSize: 13, color: colors.text, fontStyle: 'italic' }}>
                                                            "{transcript[goal.id]}"
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>

                                        {/* Action buttons: TTS + ASR — only for today */}
                                        {isToday && (
                                            <View style={{ gap: 8 }}>
                                                {/* Full-width HEAR INSTRUCTIONS button */}
                                                <TouchableOpacity
                                                    style={[
                                                        styles.hearBtn,
                                                        {
                                                            backgroundColor: speakingId === goal.id
                                                                ? '#fef2f2'
                                                                : colors.primary + '10',
                                                            borderColor: speakingId === goal.id
                                                                ? '#ef4444'
                                                                : colors.primary + '30',
                                                        }
                                                    ]}
                                                    onPress={() => handleSpeak(goal)}
                                                    activeOpacity={0.7}
                                                >
                                                    {speakingId === goal.id ? (
                                                        <VolumeX size={18} color="#ef4444" />
                                                    ) : (
                                                        <Volume2 size={18} color={colors.primary} />
                                                    )}
                                                    <Text style={[styles.hearBtnText, { color: speakingId === goal.id ? '#ef4444' : colors.primary }]}>
                                                        {speakingId === goal.id
                                                            ? tr('stopReading')
                                                            : `🔊 ${tr('hearInstructions')}`
                                                        }
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* ASR Mic button */}
                                                <View style={styles.goalActions}>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.iconBtn,
                                                            {
                                                                backgroundColor:
                                                                    activeGoalId === goal.id && isRecording
                                                                        ? '#fef2f2'
                                                                        : isProcessing && activeGoalId === goal.id
                                                                            ? '#fef3c7'
                                                                            : '#f0fdf4',
                                                            }
                                                        ]}
                                                        onPress={() => {
                                                            if (activeGoalId === goal.id && isRecording) {
                                                                stopAndTranscribe();
                                                            } else if (!isRecording && !isProcessing) {
                                                                startRecording(goal.id);
                                                            }
                                                        }}
                                                        disabled={isProcessing || (isRecording && activeGoalId !== goal.id)}
                                                    >
                                                        {isProcessing && activeGoalId === goal.id ? (
                                                            <ActivityIndicator size="small" color="#f59e0b" />
                                                        ) : activeGoalId === goal.id && isRecording ? (
                                                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                                                <MicOff size={18} color="#ef4444" />
                                                            </Animated.View>
                                                        ) : (
                                                            <Mic size={18} color="#22c55e" />
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}


                                    </View>
                                ))}
                            </View>
                        ))}

                        {percent === 100 && (
                            <View style={[styles.celebCard, { borderColor: '#22c55e' }]}>
                                <Text style={{ fontSize: 40 }}>🎉</Text>
                                <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>
                                    {language === 'twi' ? 'Nnwuma (Missions) nyinaa awie! 🎉' : language === 'ga' ? 'Missions fɛɛ egbe naa! 🎉' : 'All Missions Completed! 🎉'}
                                </Text>
                                <Text style={{ color: colors.subText, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                                    {language === 'twi' ? 'Abɔ mmɔden pa ara ndɛ adesua no mu.' : language === 'ga' ? 'Ofee he yie waa kɛha gbii nɛ.' : 'Excellent work finishing your speech exercises for today. Keep it up!'}
                                </Text>
                            </View>
                        )}
                    </>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            {percent === 100 && (
                <ConfettiCannon
                    count={150}
                    origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
                    fadeOut={true}
                    fallSpeed={3000}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSub: { fontSize: 13, marginTop: 2 },
    asrBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    emptyContainer: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    progressCard: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressGreeting: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    progressText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 10 },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
    },
    progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
    progressCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },
    progressPercent: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    hintBox: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginBottom: 20,
    },
    catHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    catIconBg: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
    catCount: { fontSize: 13 },
    goalCard: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderLeftWidth: 4,
    },
    goalTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
    goalDesc: { fontSize: 13, lineHeight: 18 },
    transcriptBubble: {
        marginTop: 8,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    goalActions: {
        flexDirection: 'column',
        gap: 8,
        marginLeft: 8,
        justifyContent: 'center',
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
        marginTop: 12,
    },
    hearBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    celebCard: {
        borderRadius: 16,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center',
        marginTop: 8,
    },
});
