import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Pause, Play, RotateCcw, Timer } from 'lucide-react-native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalService, PatientGoal } from '../services/goalService';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { SpeechBuddy } from '../components/ui/SpeechBuddy';
import { useT } from '../utils/i18n';

type TrainerState = 'selecting' | 'active' | 'resting' | 'complete';

const DEFAULT_HOLD_SECONDS = 5;
const DEFAULT_REPS = 10;
const REST_SECONDS = 3;

export default function ExerciseTrainerScreen() {
    const router = useRouter();
    const { colors, language, ttsSpeed, ttsVoice } = useContext(AppContext);
    const tr = useT(language as any);

    const [patientId, setPatientId] = useState<string | null>(null);
    const [exercises, setExercises] = useState<PatientGoal[]>([]);
    const [loading, setLoading] = useState(true);

    // Active exercise state
    const [selectedExercise, setSelectedExercise] = useState<PatientGoal | null>(null);
    const [trainerState, setTrainerState] = useState<TrainerState>('selecting');
    const [currentRep, setCurrentRep] = useState(1);
    const [totalReps] = useState(DEFAULT_REPS);
    const [countdown, setCountdown] = useState(DEFAULT_HOLD_SECONDS);
    const [isPaused, setIsPaused] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadData();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const loadData = async () => {
        const id = await AsyncStorage.getItem('@voiceaid_patient_id');
        setPatientId(id);
        if (id) {
            const goals = await GoalService.getPatientGoals(id);
            // Filter to exercise-type categories
            const exerciseGoals = goals.filter(g =>
                ['speech_sound', 'voice', 'fluency'].includes(g.category) && !g.completed
            );
            setExercises(exerciseGoals);
        }
        setLoading(false);
    };

    const startExercise = (exercise: PatientGoal) => {
        setSelectedExercise(exercise);
        setCurrentRep(1);
        setCountdown(DEFAULT_HOLD_SECONDS);
        setTrainerState('active');
        setIsPaused(false);

        const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
        const msg = tr('exerciseStartPrefix') + exercise.title + ". " + tr('exerciseStartHold') + DEFAULT_HOLD_SECONDS + " " + tr('seconds');
        TTSService.speak(msg, language as any, { 
            speed: speedMapping[ttsSpeed], 
            gender: ttsVoice 
        });

        startTimer();
    };

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Timer hit zero
                    clearInterval(timerRef.current!);
                    handleRepComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [currentRep, totalReps]);

    const handleRepComplete = () => {
        if (currentRep >= totalReps) {
            // All reps done!
            setTrainerState('complete');
            const msg = tr('completedAll');
            const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
            TTSService.speak(msg, language as any, { 
                speed: speedMapping[ttsSpeed], 
                gender: ttsVoice 
            });

            // Mark the goal as completed
            if (selectedExercise) {
                GoalService.toggleGoal(selectedExercise.id, true);
            }
        } else {
            // Rest period between reps
            setTrainerState('resting');
            setCountdown(REST_SECONDS);

            const nextRep = currentRep + 1;
            const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
            const msg = tr('exerciseRestPrefix') + tr('exerciseRestRepPrefix') + nextRep + " " + tr('of') + " " + totalReps + ".";
            TTSService.speak(msg, language as any, { 
                speed: speedMapping[ttsSpeed], 
                gender: ttsVoice 
            });

            // Start rest countdown
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        // Start next rep
                        setCurrentRep(nextRep);
                        setCountdown(DEFAULT_HOLD_SECONDS);
                        setTrainerState('active');

                        TTSService.speak(
                            tr('exerciseGo'),
                            language as any,
                            { speed: speedMapping[ttsSpeed], gender: ttsVoice }
                        );
                        startTimer();
                        return DEFAULT_HOLD_SECONDS;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const togglePause = () => {
        if (isPaused) {
            setIsPaused(false);
            startTimer();
        } else {
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const resetExercise = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTrainerState('selecting');
        setSelectedExercise(null);
        setCurrentRep(1);
        setCountdown(DEFAULT_HOLD_SECONDS);
        setIsPaused(false);
    };

    const progressPercent = ((currentRep - 1) / totalReps) * 100 + ((DEFAULT_HOLD_SECONDS - countdown) / DEFAULT_HOLD_SECONDS) * (100 / totalReps);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => { resetExercise(); router.back(); }} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {tr('exerciseTrainer')}
                    </Text>
                    <Text style={[styles.headerSub, { color: colors.subText }]}>
                        {tr('oralExercises')}
                    </Text>
                </View>
            </View>

            {/* SELECTING STATE — Choice of exercises */}
            {trainerState === 'selecting' && (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {loading ? (
                        <Text style={[styles.emptyText, { color: colors.subText }]}>Loading exercises...</Text>
                    ) : exercises.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Timer size={48} color={colors.subText} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {tr('noExercises')}
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.subText }]}>
                                {tr('noExercisesSub')}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {tr('chooseExercise')}
                            </Text>
                            {exercises.map(exercise => (
                                <TouchableOpacity
                                    key={exercise.id}
                                    style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => startExercise(exercise)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.exerciseIcon, { backgroundColor: colors.primary + '15' }]}>
                                        <Timer size={24} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.exerciseTitle, { color: colors.text }]}>{exercise.title}</Text>
                                        {exercise.description && (
                                            <Text style={[styles.exerciseDesc, { color: colors.subText }]}>{exercise.description}</Text>
                                        )}
                                        <Text style={[styles.exerciseMeta, { color: colors.primary }]}>
                                            {DEFAULT_REPS} {tr('repsHold')} {DEFAULT_HOLD_SECONDS}s
                                        </Text>
                                    </View>
                                    <Play size={20} color={colors.primary} />
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </ScrollView>
            )}

            {/* ACTIVE / RESTING STATE — Timer */}
            {(trainerState === 'active' || trainerState === 'resting') && (
                <View style={styles.timerContainer}>
                    {/* Progress Bar */}
                    <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: colors.primary }]} />
                    </View>

                    {/* Exercise Name */}
                    <Text style={[styles.activeTitle, { color: colors.text }]}>
                        {selectedExercise?.title}
                    </Text>

                    {/* State Label */}
                    <Text style={[styles.stateLabel, { color: trainerState === 'resting' ? '#f59e0b' : colors.primary }]}>
                        {trainerState === 'resting' ? tr('rest') : tr('hold')}
                    </Text>

                    {/* Animated Speech Buddy */}
                    <View style={styles.buddyWrapper}>
                        <SpeechBuddy
                            state={trainerState}
                            colors={colors}
                            size={220}
                        />
                        <View style={[styles.countdownOverlay, { borderColor: trainerState === 'resting' ? '#f59e0b' : colors.primary }]}>
                            <Text style={[styles.countdownNum, { color: trainerState === 'resting' ? '#f59e0b' : colors.primary, fontSize: 48 }]}>
                                {countdown}
                            </Text>
                        </View>
                    </View>

                    {/* Rep Counter */}
                    <Text style={[styles.repCounter, { color: colors.text }]}>
                        {tr('repOf')} {currentRep} {tr('of')} {totalReps}
                    </Text>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={resetExercise}>
                            <RotateCcw size={24} color={colors.subText} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlBtnPrimary, { backgroundColor: colors.primary }]} onPress={togglePause}>
                            {isPaused
                                ? <Play size={28} color="#fff" />
                                : <Pause size={28} color="#fff" />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* COMPLETE STATE */}
            {trainerState === 'complete' && (
                <View style={styles.completeContainer}>
                    <SpeechBuddy 
                        state="complete"
                        colors={colors}
                        size={180}
                    />
                    <Text style={[styles.completeTitle, { color: colors.text, marginTop: 16 }]}>
                        {tr('greatJob')}
                    </Text>
                    <Text style={[styles.completeSubtitle, { color: colors.subText }]}>
                        {tr('completedAll')}
                    </Text>

                    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.subText }]}>Exercise</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedExercise?.title}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.subText }]}>Reps</Text>
                            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{totalReps}/{totalReps} ✓</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.subText }]}>Hold Time</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{DEFAULT_HOLD_SECONDS}s per rep</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={resetExercise}>
                        <Text style={styles.doneBtnText}>
                            {tr('backToExercises')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSub: { fontSize: 13 },
    scroll: { padding: 20, paddingBottom: 60 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    emptyCard: {
        alignItems: 'center',
        padding: 40,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    exerciseIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    exerciseDesc: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
    exerciseMeta: { fontSize: 12, fontWeight: '600' },

    // Timer
    timerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
    },
    progressBarFill: {
        height: 6,
        borderRadius: 3,
    },
    activeTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    stateLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: 2 },
    buddyWrapper: {
        width: 220,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    countdownOverlay: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    countdownNum: {
        fontSize: 72,
        fontWeight: '900',
        letterSpacing: -2,
    },
    repCounter: { fontSize: 18, fontWeight: '600', marginBottom: 40 },
    controls: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    controlBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlBtnPrimary: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },

    // Complete
    completeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    completeTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
    completeSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    summaryCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 32,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    summaryLabel: { fontSize: 14, fontWeight: '500' },
    summaryValue: { fontSize: 15, fontWeight: '700' },
    doneBtn: {
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
