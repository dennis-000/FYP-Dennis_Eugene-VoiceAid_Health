import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Mic, Square, Volume2 } from 'lucide-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function JournalScreen() {
    const router = useRouter();
    const { colors, language, reduceMotion } = useContext(AppContext);
    const tr = useT(language as any);

    const [patientId, setPatientId] = useState<string | null>(null);
    const [journals, setJournals] = useState<VoiceJournal[]>([]);
    const [loading, setLoading] = useState(true);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const recordingStartTime = useRef<number>(0);

    const [meteringLevels, setMeteringLevels] = useState<number[]>([]);
    const [timer, setTimer] = useState(0);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadData();
        return () => {
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => {});
            }
        };
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
        } catch (error) {
            console.error('Failed to load journals', error);
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Microphone access is required to use the voice journal.');
                return;
            }

            setMeteringLevels([]);
            recordingStartTime.current = Date.now();
            await AudioPreprocessingService.configureAudioSession();
            const { recording } = await Audio.Recording.createAsync(
                ENHANCED_RECORDING_OPTIONS,
                (status) => {
                    if (status.metering) {
                        setMeteringLevels(prev => [...prev, status.metering || -160].slice(-20));
                    }
                }
            );
            recordingRef.current = recording;
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
        const currentRecording = recordingRef.current;
        if (!currentRecording || !patientId) return;

        setIsRecording(false);
        setIsProcessing(true);
        if (reduceMotion) haptics.heavy();
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }

        try {
            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();
            recordingRef.current = null;
            
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
    }
});
