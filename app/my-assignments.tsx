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
import { Audio } from 'expo-av';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalCategory, GoalService, PatientGoal, todayDate } from '../services/goalService';
import { ASRService } from '../services/asr';
import { AudioPreprocessingService, ENHANCED_RECORDING_OPTIONS } from '../services/audioPreprocessingService';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';

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
    const recordingRef = useRef<Audio.Recording | null>(null);

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
        const { status } = await Audio.requestPermissionsAsync();
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
        const text = goal.description
            ? `${goal.title}. ${goal.description}`
            : goal.title;
        await TTSService.speak(text, language as any);
        // expo-speech doesn't provide completion callback reliably, so clear after a delay
        setTimeout(() => setSpeakingId(null), (text.length / 12) * 1000 + 1000);
    };

    // ─── ASR: Start recording for a specific goal ──────────────────────────
    const startRecording = async (goalId: string) => {
        try {
            await TTSService.stop();
            setSpeakingId(null);
            setActiveGoalId(goalId);
            await AudioPreprocessingService.configureAudioSession();
            const { recording } = await Audio.Recording.createAsync(ENHANCED_RECORDING_OPTIONS);
            recordingRef.current = recording;
            setIsRecording(true);
        } catch (err) {
            console.error('[Assignments ASR] Start error:', err);
        }
    };

    const stopAndTranscribe = async () => {
        const currentRecording = recordingRef.current;
        if (!currentRecording || !activeGoalId) return;

        setIsRecording(false);
        setIsProcessing(true);

        try {
            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();
            recordingRef.current = null;

            if (!uri) throw new Error('No audio URI');

            const result = await ASRService.processAudio(uri, language === 'twi' ? 'twi' : 'en');
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
                await TTSService.speak(`I heard: ${text}`, 'en');
            } else {
                await TTSService.speak("Sorry, I couldn't hear that clearly. Please try again.", 'en');
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>My Assignments</Text>
                    <Text style={[styles.headerSub, { color: colors.subText }]}>From your therapist</Text>
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
                                borderColor: isSelected ? colors.primary : 'transparent',
                            }}
                        >
                            <Text style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: isSelected ? '#fff' : isT ? colors.primary : colors.subText,
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
                        📖 Viewing past assignments — read-only
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
                                Whisper is transcribing...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <Mic size={20} color="#ef4444" />
                            </Animated.View>
                            <Text style={{ color: '#991b1b', marginLeft: 10, fontWeight: '600', fontSize: 14 }}>
                                Listening... Tap the mic again to stop
                            </Text>
                        </>
                    )}
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
                ) : totalCount === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={{ fontSize: 60 }}>📋</Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Assignments Yet</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                            Your therapist hasn't assigned any exercises yet. Check back soon!
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Progress Card */}
                        <View style={[styles.progressCard, { backgroundColor: colors.primary }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.progressGreeting}>
                                    Keep it up{patientName ? `, ${patientName.split(' ')[0]}` : ''}! 💪
                                </Text>
                                <Text style={styles.progressText}>
                                    {completedCount} of {totalCount} assignments done
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
                                🔊 Tap <Text style={{ fontWeight: '700' }}>speaker</Text> to hear an exercise read aloud{'  '}•{'  '}
                                🎤 Tap <Text style={{ fontWeight: '700' }}>mic</Text> to speak your response
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
                                        {CATEGORY_LABELS[cat]}
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
                                                    {goal.title}
                                                </Text>
                                                {goal.description ? (
                                                    <Text style={[styles.goalDesc, { color: colors.subText }]}>
                                                        {goal.description}
                                                    </Text>
                                                ) : null}

                                                {/* Transcribed voice response */}
                                                {transcript[goal.id] && (
                                                    <View style={[styles.transcriptBubble, { borderColor: CATEGORY_COLORS[goal.category] + '40' }]}>
                                                        <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2, fontWeight: '600' }}>
                                                            🎤 Your response:
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
                                            <View style={styles.goalActions}>
                                                {/* TTS Speaker button */}
                                                <TouchableOpacity
                                                    style={[
                                                        styles.iconBtn,
                                                        {
                                                            backgroundColor: speakingId === goal.id
                                                                ? '#fef2f2'
                                                                : colors.primary + '12',
                                                        }
                                                    ]}
                                                    onPress={() => handleSpeak(goal)}
                                                >
                                                    {speakingId === goal.id ? (
                                                        <VolumeX size={18} color="#ef4444" />
                                                    ) : (
                                                        <Volume2 size={18} color={colors.primary} />
                                                    )}
                                                </TouchableOpacity>

                                                {/* ASR Mic button */}
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
                                        )}

                                    </View>
                                ))}
                            </View>
                        ))}

                        {percent === 100 && (
                            <View style={[styles.celebCard, { borderColor: '#22c55e' }]}>
                                <Text style={{ fontSize: 40 }}>🎉</Text>
                                <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>
                                    All done for today!
                                </Text>
                                <Text style={{ color: colors.subText, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                                    Amazing work! Your therapist will see your progress.
                                </Text>
                            </View>
                        )}
                    </>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>
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
        flexDirection: 'row',
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
    celebCard: {
        borderRadius: 16,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center',
        marginTop: 8,
    },
});
