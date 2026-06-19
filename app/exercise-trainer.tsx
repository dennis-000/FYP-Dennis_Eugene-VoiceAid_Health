import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Pause, Play, RotateCcw, Timer, ChevronDown, ChevronUp, SkipForward, Info } from 'lucide-react-native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { GoalService, PatientGoal } from '../services/goalService';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { SpeechBuddy } from '../components/ui/SpeechBuddy';
import { useT } from '../utils/i18n';
import { supabase } from '../lib/supabase';
import { haptics } from '../utils/haptics';

type TrainerState = 'selecting' | 'prepare' | 'active' | 'resting' | 'complete';

const DEFAULT_HOLD_SECONDS = 5;
const DEFAULT_REPS = 10;
const REST_SECONDS = 3;
const PREPARE_SECONDS = 6;

// Reusable elegant African Kente design accent bar
const KenteAccent = () => (
    <View style={{ flexDirection: 'row', height: 6, width: '100%', overflow: 'hidden', borderRadius: 3, marginVertical: 12 }}>
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
    const [showInstructions, setShowInstructions] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const title = language === 'twi' 
            ? 'Dwumadie no nni hɔ' 
            : language === 'ga' 
                ? 'Nifeemɔ nɛɛ bɛ' 
                : 'Feature Disabled';
        const msg = language === 'twi' 
            ? 'Ahoɔden adwumayɛfoɔ (Exercise Trainer) no nni hɔ seesei.' 
            : language === 'ga' 
                ? 'Ano ahoɔden hewale nitsumɔ nɛɛ bɛɔ hɔ seesei.' 
                : 'The Exercise Trainer feature is currently unavailable.';
        
        Alert.alert(
            title,
            msg,
            [{ text: 'OK', onPress: () => router.replace('/home') }]
        );
    }, [language]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rawId = await AsyncStorage.getItem('@voiceaid_patient_id');
            const id = rawId || 'guest_user';
            setPatientId(id);

            let dbExercises: PatientGoal[] = [];
            if (id && id !== 'guest_user') {
                const goals = await GoalService.getPatientGoals(id);
                dbExercises = goals.filter(g =>
                    ['speech_sound', 'voice', 'fluency'].includes(g.category) && !g.completed
                );
            }

            // Load local exercises
            const localGoalsJson = await AsyncStorage.getItem('@voiceaid_local_goals');
            let localGoals: PatientGoal[] = [];
            if (localGoalsJson) {
                try {
                    localGoals = JSON.parse(localGoalsJson);
                } catch (e) {
                    console.error('Error parsing local goals:', e);
                }
            }

            // If we have local goals or DB goals, use them!
            if (dbExercises.length > 0) {
                setExercises(dbExercises);
            } else {
                const activeLocalGoals = localGoals.filter(g => !g.completed);
                if (activeLocalGoals.length > 0) {
                    setExercises(activeLocalGoals);
                } else if (localGoals.length === 0) {
                    // Seed new active clinical templates!
                    const today = new Date().toISOString().split('T')[0];
                    const defaultTemplates: PatientGoal[] = [
                        {
                            id: 'local-voice-1',
                            patient_id: id,
                            therapist_id: 'local-therapist',
                            title: "Vowel Sound Prolongation ('Ah')",
                            description: "Hold a steady, comfortable 'Ah' sound to build speech breath support and vocal stability.",
                            category: 'voice',
                            completed: false,
                            assigned_date: today,
                            requires_recording: false,
                            voice_transcript: null,
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 'local-speech-1',
                            patient_id: id,
                            therapist_id: 'local-therapist',
                            title: "Lip Purser & Press",
                            description: "Press your lips together firmly and hold. Helps strengthen the bilabial seal for clearer articulation.",
                            category: 'speech_sound',
                            completed: false,
                            assigned_date: today,
                            requires_recording: false,
                            voice_transcript: null,
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 'local-fluency-1',
                            patient_id: id,
                            therapist_id: 'local-therapist',
                            title: "Easy Onset Breathing",
                            description: "Inhale gently and release soft, flowing air right as you start vocalization to reduce speech blocks.",
                            category: 'fluency',
                            completed: false,
                            assigned_date: today,
                            requires_recording: false,
                            voice_transcript: null,
                            created_at: new Date().toISOString()
                        }
                    ];

                    await AsyncStorage.setItem('@voiceaid_local_goals', JSON.stringify(defaultTemplates));
                    setExercises(defaultTemplates);

                    // Seed to remote Supabase if connected
                    if (id && id !== 'guest_user') {
                        try {
                            const { data: profile } = await supabase
                                .from('patient_profiles')
                                .select('therapist_id')
                                .eq('id', id)
                                .single();

                            const therapistId = profile?.therapist_id || '00000000-0000-0000-0000-000000000000';

                            for (const t of defaultTemplates) {
                                await GoalService.addGoal(
                                    id,
                                    therapistId,
                                    t.title,
                                    t.description,
                                    t.category,
                                    false,
                                    today
                                );
                            }
                            console.log('[Seeder] Seeding successful into Supabase DB for patient:', id);
                            
                            // Reload to get actual database goals with correct remote IDs
                            const freshGoals = await GoalService.getPatientGoals(id);
                            const freshExercises = freshGoals.filter(g =>
                                ['speech_sound', 'voice', 'fluency'].includes(g.category) && !g.completed
                            );
                            if (freshExercises.length > 0) {
                                setExercises(freshExercises);
                            }
                        } catch (dbErr) {
                            console.warn('[Seeder] Could not insert mock templates into Supabase database (expected if offline):', dbErr);
                        }
                    }
                } else {
                    // All local goals are completed
                    setExercises([]);
                }
            }
        } catch (err) {
            console.error('Error loading exercises data:', err);
        } finally {
            setLoading(false);
        }
    };

    const speak = (msg: string) => {
        const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
        TTSService.speak(msg, language as any, { 
            speed: speedMapping[ttsSpeed] || 1.0, 
            gender: ttsVoice 
        });
    };

    const startExercise = (exercise: PatientGoal) => {
        haptics.selection();
        setSelectedExercise(exercise);
        setCurrentRep(1);
        setCountdown(PREPARE_SECONDS);
        setTrainerState('prepare');
        setIsPaused(false);
        setShowInstructions(false);

        // Vocal pre-announcement cues
        const msg = `Ready to go! Next up is ${exercise.title}. Take a deep breath and get ready to practice.`;
        speak(msg);

        startPrepareTimer();
    };

    const startPrepareTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    // Transition to active hold rep 1
                    setTrainerState('active');
                    setCountdown(DEFAULT_HOLD_SECONDS);
                    haptics.medium();
                    speak("Go!");
                    startActiveTimer();
                    return DEFAULT_HOLD_SECONDS;
                }

                const nextCountdown = prev - 1;
                if (nextCountdown <= 3) {
                    speak(nextCountdown.toString());
                }
                return nextCountdown;
            });
        }, 1000);
    }, [currentRep, selectedExercise]);

    const startActiveTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleRepComplete();
                    return 0;
                }

                const nextCountdown = prev - 1;
                if (nextCountdown <= 3) {
                    speak(nextCountdown.toString());
                }
                return nextCountdown;
            });
        }, 1000);
    }, [currentRep, selectedExercise]);

    const startRestTimer = useCallback((nextRep: number) => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setCurrentRep(nextRep);
                    setCountdown(DEFAULT_HOLD_SECONDS);
                    setTrainerState('active');
                    haptics.medium();
                    speak("Go!");
                    startActiveTimer();
                    return DEFAULT_HOLD_SECONDS;
                }

                const nextCountdown = prev - 1;
                if (nextCountdown <= 3) {
                    speak(nextCountdown.toString());
                }
                return nextCountdown;
            });
        }, 1000);
    }, [currentRep, selectedExercise]);

    const handleRepComplete = () => {
        haptics.success();
        if (currentRep >= totalReps) {
            // Completed all repetitions!
            setTrainerState('complete');
            speak("Congratulations! You have completed all repetitions of this exercise. Great work!");

            // Update completeness in AsyncStorage or Supabase database
            if (selectedExercise) {
                (async () => {
                    if (selectedExercise.id.startsWith('local-')) {
                        try {
                            const localGoalsJson = await AsyncStorage.getItem('@voiceaid_local_goals');
                            if (localGoalsJson) {
                                const localGoals: PatientGoal[] = JSON.parse(localGoalsJson);
                                const updatedGoals = localGoals.map(g => 
                                    g.id === selectedExercise.id ? { ...g, completed: true } : g
                                );
                                await AsyncStorage.setItem('@voiceaid_local_goals', JSON.stringify(updatedGoals));
                            }
                        } catch (e) {
                            console.error('Error completing local goal:', e);
                        }
                    } else {
                        await GoalService.toggleGoal(selectedExercise.id, true);
                    }
                    await loadData();
                })();
            }
        } else {
            // Staggered Rest phase
            setTrainerState('resting');
            setCountdown(REST_SECONDS);

            const nextRep = currentRep + 1;
            speak(`Rest. Prepare for rep ${nextRep}.`);
            startRestTimer(nextRep);
        }
    };

    const togglePause = () => {
        haptics.selection();
        if (isPaused) {
            setIsPaused(false);
            if (trainerState === 'prepare') {
                startPrepareTimer();
            } else if (trainerState === 'active') {
                startActiveTimer();
            } else if (trainerState === 'resting') {
                const nextRep = currentRep + 1;
                startRestTimer(nextRep);
            }
        } else {
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
            TTSService.stop();
        }
    };

    const skipNext = () => {
        haptics.selection();
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (trainerState === 'prepare') {
            setTrainerState('active');
            setCountdown(DEFAULT_HOLD_SECONDS);
            speak("Go!");
            startActiveTimer();
        } else if (trainerState === 'resting') {
            const nextRep = currentRep + 1;
            setCurrentRep(nextRep);
            setTrainerState('active');
            setCountdown(DEFAULT_HOLD_SECONDS);
            speak("Go!");
            startActiveTimer();
        } else if (trainerState === 'active') {
            handleRepComplete();
        }
    };

    const restartAction = () => {
        haptics.selection();
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (trainerState === 'active') {
            setCountdown(DEFAULT_HOLD_SECONDS);
            speak("Restarting rep. Go!");
            startActiveTimer();
        } else if (trainerState === 'prepare') {
            setCountdown(PREPARE_SECONDS);
            speak("Prepare again.");
            startPrepareTimer();
        } else if (trainerState === 'resting') {
            setCountdown(REST_SECONDS);
            speak("Rest.");
            const nextRep = currentRep + 1;
            startRestTimer(nextRep);
        }
    };

    const resetExercise = () => {
        haptics.selection();
        if (timerRef.current) clearInterval(timerRef.current);
        TTSService.stop();
        setTrainerState('selecting');
        setSelectedExercise(null);
        setCurrentRep(1);
        setCountdown(DEFAULT_HOLD_SECONDS);
        setIsPaused(false);
        setShowInstructions(false);
    };

    // Calculate details for progress visualizations
    const activeStateColor = 
        trainerState === 'prepare' 
            ? '#3b82f6' 
            : trainerState === 'resting' 
            ? '#eab308' 
            : colors.primary;

    const activeStateLabel = 
        trainerState === 'prepare' 
            ? 'PREPARE' 
            : trainerState === 'resting' 
            ? tr('rest') 
            : tr('hold');

    const totalSeconds = 
        trainerState === 'prepare' 
            ? PREPARE_SECONDS 
            : trainerState === 'resting' 
            ? REST_SECONDS 
            : DEFAULT_HOLD_SECONDS;

    const ringProgress = ((totalSeconds - countdown) / totalSeconds) * 100;

    // Progress bar for selecting reps total
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

            <KenteAccent />

            {/* SELECTING STATE — Choice of exercises */}
            {trainerState === 'selecting' && (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {loading ? (
                        <Text style={[styles.emptyText, { color: colors.subText, marginTop: 40 }]}>Loading exercises...</Text>
                    ) : exercises.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Timer size={48} color={colors.subText} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {tr('noExercises')}
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.subText, marginBottom: 16 }]}>
                                {tr('noExercisesSub')}
                            </Text>
                            <TouchableOpacity
                                style={[styles.resetLocalBtn, { backgroundColor: colors.primary }]}
                                onPress={async () => {
                                    haptics.selection();
                                    await AsyncStorage.removeItem('@voiceaid_local_goals');
                                    await loadData();
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.resetLocalBtnText}>✨ Generate Demo Exercises</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
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
                                    <View style={[styles.exercisePlayBtn, { backgroundColor: colors.primary }]}>
                                        <Play size={16} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </ScrollView>
            )}

            {/* PREPARE / ACTIVE / RESTING PLAYBACK TIMER SHEET */}
            {(trainerState === 'prepare' || trainerState === 'active' || trainerState === 'resting') && (
                <ScrollView contentContainerStyle={styles.trainerScroll}>
                    {/* Top Progress bar */}
                    <View style={[styles.progressStrip, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressStripFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: colors.primary }]} />
                    </View>

                    {/* Horizontal Rep indicator ticks strip */}
                    <View style={styles.repTicksContainer}>
                        {Array.from({ length: totalReps }).map((_, index) => {
                            const isCompleted = index < currentRep - 1;
                            const isActive = index === currentRep - 1 && trainerState === 'active';
                            return (
                                <View 
                                    key={index} 
                                    style={[
                                        styles.repTick, 
                                        { 
                                            backgroundColor: isCompleted 
                                                ? '#22c55e' 
                                                : isActive 
                                                ? colors.primary 
                                                : 'rgba(255,255,255,0.12)',
                                            borderColor: isActive ? '#fff' : 'transparent',
                                            borderWidth: isActive ? 1.5 : 0
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>

                    {/* Interactive Visual Training Coach Pane */}
                    <View style={[styles.coachPane, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.activeTitle, { color: colors.text }]}>
                            {selectedExercise?.title}
                        </Text>
                        
                        <View style={styles.buddyWrapper}>
                            <SpeechBuddy
                                state={isPaused ? 'paused' : trainerState}
                                colors={colors}
                                size={190}
                                category={selectedExercise?.category as any}
                            />
                        </View>
                    </View>

                    {/* Phase indicator banner */}
                    <View style={[styles.phaseBanner, { backgroundColor: activeStateColor + '1F' }]}>
                        <Text style={[styles.phaseText, { color: activeStateColor }]}>
                            {activeStateLabel}
                        </Text>
                    </View>

                    {/* Circular countdown timer */}
                    <View style={styles.ringWrapper}>
                        <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
                            <Svg width="140" height="140">
                                <Circle
                                    cx="70"
                                    cy="70"
                                    r="62"
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeWidth="8"
                                    fill="transparent"
                                />
                                <Circle
                                    cx="70"
                                    cy="70"
                                    r="62"
                                    stroke={activeStateColor}
                                    strokeWidth="8"
                                    strokeDasharray={2 * Math.PI * 62}
                                    strokeDashoffset={2 * Math.PI * 62 - (ringProgress / 100) * (2 * Math.PI * 62)}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    transform="rotate(-90 70 70)"
                                />
                            </Svg>
                            <View style={{ position: 'absolute', alignItems: 'center' }}>
                                <Text style={[styles.countdownText, { color: colors.text }]}>
                                    {countdown}
                                </Text>
                                <Text style={[styles.secondsLabel, { color: colors.subText }]}>
                                    {tr('seconds').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Reps count summary */}
                    {trainerState !== 'prepare' && (
                        <Text style={[styles.repSummary, { color: colors.text }]}>
                            {tr('repOf')} {currentRep} {tr('of')} {totalReps}
                        </Text>
                    )}
                    {trainerState === 'prepare' && (
                        <Text style={[styles.repSummary, { color: colors.subText }]}>
                            GET READY!
                        </Text>
                    )}

                    {/* Accordion collapsable Instructions list */}
                    {selectedExercise?.description && (
                        <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TouchableOpacity 
                                style={styles.instructionsHeader} 
                                onPress={() => setShowInstructions(!showInstructions)}
                                activeOpacity={0.8}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Info size={16} color={colors.primary} />
                                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>Instructions</Text>
                                </View>
                                {showInstructions ? (
                                    <ChevronUp size={20} color={colors.subText} />
                                ) : (
                                    <ChevronDown size={20} color={colors.subText} />
                                )}
                            </TouchableOpacity>
                            {showInstructions && (
                                <Text style={[styles.instructionsBody, { color: colors.subText }]}>
                                    {selectedExercise.description}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Control Panel */}
                    <View style={styles.controlPanel}>
                        <TouchableOpacity 
                            style={[styles.smallControlBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                            onPress={restartAction}
                            activeOpacity={0.7}
                        >
                            <RotateCcw size={20} color={colors.subText} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.largePlayBtn, { backgroundColor: colors.primary }]} 
                            onPress={togglePause}
                            activeOpacity={0.8}
                        >
                            {isPaused ? (
                                <Play size={32} color="#fff" />
                            ) : (
                                <Pause size={32} color="#fff" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.smallControlBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                            onPress={skipNext}
                            activeOpacity={0.7}
                        >
                            <SkipForward size={20} color={colors.subText} />
                        </TouchableOpacity>
                    </View>

                    {/* Quit Exercise button */}
                    <TouchableOpacity style={styles.quitBtn} onPress={resetExercise}>
                        <Text style={[styles.quitText, { color: colors.subText }]}>QUIT EXERCISE</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* COMPLETE SUMMARIZED SHEET */}
            {trainerState === 'complete' && (
                <View style={styles.completeContainer}>
                    <View style={styles.completeIconWrapper}>
                        <SpeechBuddy 
                            state="complete"
                            colors={colors}
                            size={180}
                        />
                    </View>

                    <Text style={[styles.completeTitle, { color: colors.text }]}>
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
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.subText }]}>Reps Completed</Text>
                            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{totalReps}/{totalReps} ✓</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.subText }]}>Average Hold Time</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{DEFAULT_HOLD_SECONDS} seconds</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.doneBtn, { backgroundColor: colors.primary }]} 
                        onPress={resetExercise}
                        activeOpacity={0.8}
                    >
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
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSub: { fontSize: 13 },
    scroll: { padding: 20, paddingBottom: 60 },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
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
    exercisePlayBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetLocalBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    resetLocalBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // Trainer active player layout
    trainerScroll: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    progressStrip: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 16,
    },
    progressStripFill: {
        height: '100%',
        borderRadius: 3,
    },
    repTicksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    repTick: {
        flex: 1,
        height: 5,
        borderRadius: 2.5,
        marginHorizontal: 2,
    },
    coachPane: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        marginBottom: 16,
    },
    activeTitle: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    buddyWrapper: {
        width: 190,
        height: 190,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseBanner: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    phaseText: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
        textAlign: 'center',
    },
    ringWrapper: {
        marginBottom: 16,
    },
    countdownText: {
        fontSize: 54,
        fontWeight: '900',
        lineHeight: 54,
    },
    secondsLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    repSummary: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },

    // Collapsible instructions accordion
    instructionsCard: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
    },
    instructionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    instructionsBody: {
        fontSize: 13,
        lineHeight: 18,
        marginTop: 10,
    },

    // Action control pad
    controlPanel: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 24,
    },
    smallControlBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    largePlayBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    quitBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    quitText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Complete summarised sheet styles
    completeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    completeIconWrapper: {
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    completeTitle: {
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    completeSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    summaryCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 28,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        width: '100%',
    },
    doneBtn: {
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 18,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
