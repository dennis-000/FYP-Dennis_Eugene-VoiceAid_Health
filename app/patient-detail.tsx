import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import KenteAccent from '../components/KenteAccent';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    Activity, 
    ArrowLeft, 
    Brain,
    CheckCircle2, 
    Clock, 
    MapPin, 
    MessageSquare, 
    Mic, 
    Plus, 
    ShieldAlert, 
    Smile,
    Sparkles,
    Trash2, 
    TrendingUp, 
    X 
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { GoalCategory, GoalService, PatientGoal, todayDate } from '../services/goalService';

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
import { JournalService, VoiceJournal } from '../services/journalService';
import { AnalyticsService, SessionRecord } from '../services/analyticsService';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../constants/config';

// --- SLP-Backed Suggested Assignments ---
type SuggestedItem = {
    title: string;
    description: string;
    category: GoalCategory;
    icon: string;
};

const getSuggestions = (tr: any): SuggestedItem[] => [
    { title: tr('slpSuggIsolationTitle'), description: tr('slpSuggIsolationDesc'), category: 'speech_sound', icon: 'mic-outline' },
    { title: tr('slpSuggTongueTitle'), description: tr('slpSuggTongueDesc'), category: 'speech_sound', icon: 'accessibility-outline' },
    { title: tr('slpSuggNameObjectsTitle'), description: tr('slpSuggNameObjectsDesc'), category: 'language', icon: 'book-outline' },
    { title: tr('slpSuggThreeWordTitle'), description: tr('slpSuggThreeWordDesc'), category: 'language', icon: 'chatbubble-ellipses-outline' },
    { title: tr('slpSuggSlowSpeechTitle'), description: tr('slpSuggSlowSpeechDesc'), category: 'fluency', icon: 'timer-outline' },
    { title: tr('slpSuggVowelTitle'), description: tr('slpSuggVowelDesc'), category: 'voice', icon: 'musical-notes-outline' },
];

const getCategoryLabels = (tr: any): Record<GoalCategory, string> => ({
    communication: tr('catCommunication') || tr('catBasicNeeds'),
    language: tr('catLanguage'),
    social: tr('catSocial'),
    fluency: tr('catFluency'),
    voice: tr('catVoice'),
    speech_sound: tr('catSpeechSound'),
});

const CATEGORY_COLORS: Record<GoalCategory, string> = {
    communication: '#3b82f6',
    language: '#8b5cf6',
    social: '#ec4899',
    fluency: '#f59e0b',
    voice: '#10b981',
    speech_sound: '#ef4444',
};

export default function PatientDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, language, themeMode } = useContext(AppContext);
    const { therapistProfile } = useAuth();
    const tr = useT(language as any);
    const SUGGESTIONS = getSuggestions(tr);
    const CATEGORY_LABELS = getCategoryLabels(tr);

    const patientId = params.id as string;
    const patientName = params.name as string || 'Patient';
    const patientType = params.type as string;

    const [activeMainTab, setActiveMainTab] = useState<'assignments' | 'journal' | 'analytics'>('assignments');

    const [goals, setGoals] = useState<PatientGoal[]>([]);
    const [journals, setJournals] = useState<VoiceJournal[]>([]);
    const [analytics, setAnalytics] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCategory, setNewCategory] = useState<GoalCategory>('communication');
    const [requiresRecording, setRequiresRecording] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [filterCat, setFilterCat] = useState<GoalCategory | 'all'>('all');
    const [activeAlert, setActiveAlert] = useState<SessionRecord | null>(null);

    // Date selection states
    const [selectedDate, setSelectedDate] = useState<string>(todayDate());
    const [availableDates, setAvailableDates] = useState<string[]>([]);

    // AI Progress states
    const [aiSummary, setAiSummary] = useState<string>('');
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [aiSentiment, setAiSentiment] = useState<{ happy: number, frustrated: number, anxious: number, neutral: number, reasoning: string } | null>(null);
    const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
    const [moodLevels, setMoodLevels] = useState<number[]>([]);
    const [aiRecommendations, setAiRecommendations] = useState<{ title: string, description: string, difficulty_level: string }[]>([]);
    const [generatingRecs, setGeneratingRecs] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'Speech Sound' | 'Voice' | 'Fluency'>('Speech Sound');

    // AI Voice Journal states
    const [aiJournalAnalysis, setAiJournalAnalysis] = useState<string>('');
    const [analyzingJournal, setAnalyzingJournal] = useState(false);

    const getCardStyles = (index: number, isDark: boolean) => {
        const lightBgs = ['#eff6ff', '#ecfdf5', '#f5f3ff'];
        const darkBgs = ['rgba(59, 130, 246, 0.15)', 'rgba(16, 185, 129, 0.15)', 'rgba(139, 92, 246, 0.15)'];
        const borderColors = ['#3b82f6', '#10b981', '#8b5cf6'];
        const textColors = [isDark ? '#93c5fd' : '#1e3a8a', isDark ? '#6ee7b7' : '#065f46', isDark ? '#c084fc' : '#4c1d95'];
        return {
            bg: isDark ? darkBgs[index] : lightBgs[index],
            border: borderColors[index],
            text: textColors[index]
        };
    };

    const cleanMarkdown = (text: string) => {
        if (!text) return '';
        return text
            .replace(/#+\s+/g, '') // remove headings (# or ###)
            .replace(/\*\*/g, '')  // remove bold asterisks
            .replace(/\*/g, '')    // remove single asterisks
            .replace(/^-\s+/gm, '') // remove list hyphens at start of line
            .replace(/^\*\s+/gm, '') // remove list asterisks at start of line
            .replace(/_{1,2}/g, '') // remove underscores
            .trim();
    };

    const generateAISummary = async () => {
        setGeneratingSummary(true);
        try {
            const recentTranscripts = journals.slice(0, 8).map(j => j.transcript);
            const totalSecs = analytics.reduce((sum, a) => sum + (a.duration || 0), 0);
            const hours = Number((totalSecs / 3600).toFixed(1));
            
            let streakVal = 0;
            if (analytics.length > 0) {
                const uniqueDays = new Set(analytics.map(a => a.date.split('T')[0]));
                streakVal = uniqueDays.size;
            }
            
            const allGoals = await GoalService.getPatientGoals(patientId);
            const completedGoals = allGoals.filter(g => g.completed).length;
            const complianceVal = allGoals.length > 0 ? Math.round((completedGoals / allGoals.length) * 100) : 80;

            // Extract struggles/mistakes from session logs
            const strugglesPayload: any[] = [];
            analytics.forEach(s => {
                if (s.metadata?.struggles) {
                    s.metadata.struggles.forEach((st: any) => {
                        strugglesPayload.push({
                            questTitle: st.questTitle || 'Phrase Quest',
                            attempts: st.attempts || 1,
                            detail: st.detail || 'Wrong sentence arrangement'
                        });
                    });
                } else if (s.metadata?.incorrectAttempts > 0) {
                    strugglesPayload.push({
                        questTitle: s.metadata?.questTitle || 'Word Game Practice',
                        attempts: s.metadata.incorrectAttempts,
                        detail: s.metadata.details || 'Struggled with speech repetition / word match'
                    });
                }
            });

            const completedAssignmentsPayload = allGoals
                .filter(g => g.completed)
                .map(g => ({
                    title: g.title,
                    category: g.category,
                    completed: g.completed,
                    voice_transcript: (g as any).voice_transcript || null
                }));

            const res = await fetch(`${API_BASE_URL}/predict/summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: patientName,
                    transcripts: recentTranscripts,
                    compliance_rate: complianceVal,
                    streak: streakVal || 3,
                    hours_practiced: hours || 1.5,
                    struggles: strugglesPayload.slice(0, 10),
                    completed_assignments: completedAssignmentsPayload.slice(0, 10)
                })
            });
            const data = await res.json();
            setAiSummary(cleanMarkdown(data.summary || 'Summary generated.'));
        } catch (e) {
            console.error('Failed to get AI summary', e);
            Alert.alert('AI Error', 'Could not fetch summary. Please verify backend.');
        } finally {
            setGeneratingSummary(false);
        }
    };

    const generateAIJournalAnalysis = async () => {
        if (journals.length === 0) {
            Alert.alert('No Journals', 'Patient has no journal entries to analyze.');
            return;
        }
        setAnalyzingJournal(true);
        try {
            const res = await fetch(`${API_BASE_URL}/predict/journal_analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: patientName,
                    journals: journals.map(j => j.transcript)
                })
            });
            const data = await res.json();
            setAiJournalAnalysis(cleanMarkdown(data.analysis || 'No analysis generated.'));
        } catch (e) {
            console.error('Failed to get AI Journal analysis', e);
            Alert.alert('AI Error', 'Could not fetch journal analysis.');
        } finally {
            setAnalyzingJournal(false);
        }
    };

    const analyzeAISentiment = async () => {
        setAnalyzingSentiment(true);
        try {
            const recentTranscripts = journals.slice(0, 10).map(j => j.transcript);
            const res = await fetch(`${API_BASE_URL}/predict/sentiment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcripts: recentTranscripts,
                    mood_levels: moodLevels
                })
            });
            const data = await res.json();
            setAiSentiment({
                happy: data.happy || 0,
                frustrated: data.frustrated || 0,
                anxious: data.anxious || 0,
                neutral: data.neutral || 0,
                reasoning: data.reasoning || 'Stable emotional states observed.'
            });
        } catch (e) {
            console.error('Failed to get AI sentiment', e);
        } finally {
            setAnalyzingSentiment(false);
        }
    };

    const getAIRecommendations = async () => {
        setGeneratingRecs(true);
        try {
            const res = await fetch(`${API_BASE_URL}/predict/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_name: patientName,
                    language: language || 'tw',
                    difficulty: selectedDifficulty
                })
            });
            const data = await res.json();
            setAiRecommendations(data.recommendations || []);
        } catch (e) {
            console.error('Failed to get recommendations', e);
        } finally {
            setGeneratingRecs(false);
        }
    };

    const CATEGORY_TABS: (GoalCategory | 'all')[] = ['all', 'communication', 'language', 'social', 'fluency', 'voice', 'speech_sound'];

    useEffect(() => {
        // Initialize last 7 days
        const last7: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        setAvailableDates(last7);

        loadJournals();
        loadAnalytics();
        loadMoodLogs();
        checkActiveEmergency();

        // Real-time subscription for Clinical Priority alerts
        const channel = supabase
            .channel(`patient-alerts-${patientId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'patient_analytics',
                    // Listen for any priority alert, then filter in JS to handle both ID types
                },
                (payload) => {
                    const incomingId = payload.new.patient_profile_id || payload.new.user_id;
                    if (incomingId !== patientId) return;

                    console.log('[Real-time Analytics] 🚨 New priority event:', payload.new);
                    const newRecord = {
                        id: payload.new.id,
                        date: payload.new.created_at,
                        duration: payload.new.duration,
                        wordCount: payload.new.word_count,
                        messageCount: payload.new.message_count,
                        language: payload.new.language,
                        mode: payload.new.mode,
                        metadata: payload.new.metadata
                    } as SessionRecord;

                    setAnalytics(prev => [newRecord, ...prev]);
                    
                    if (newRecord.mode === 'CLINICAL_PRIORITY' || newRecord.mode === 'EMERGENCY') {
                        setActiveAlert(newRecord);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [patientId]);

    useEffect(() => {
        if (patientId) {
            loadGoals();
        }
    }, [patientId, selectedDate]);

    const loadAnalytics = async () => {
        const data = await AnalyticsService.getPatientAnalytics(patientId);
        setAnalytics(data);
    };

    const loadMoodLogs = async () => {
        try {
            const { data } = await supabase
                .from('mood_logs')
                .select('mood_level')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(10);
            if (data) {
                setMoodLevels(data.map(m => m.mood_level));
            }
        } catch (err) {
            console.error('Failed to load mood logs in patient-detail screen:', err);
        }
    };

    const checkActiveEmergency = async () => {
        const emergencies = await AnalyticsService.getActiveEmergencies([patientId]);
        if (emergencies.length > 0) {
            // Reconstruct a minimal SessionRecord to populate the alert UI
            setActiveAlert({
                id: 'active-alert',
                date: new Date().toISOString(),
                duration: 0,
                wordCount: 0,
                messageCount: 0,
                language: 'en',
                mode: 'CLINICAL_PRIORITY',
                metadata: emergencies[0].metadata
            } as SessionRecord);
        } else {
            setActiveAlert(null);
        }
    };

    const loadJournals = async () => {
        const data = await JournalService.getPatientJournals(patientId);
        setJournals(data);
    };

    const loadGoals = async () => {
        setLoading(true);
        const data = await GoalService.getGoalsByDate(patientId, selectedDate);
        setGoals(data);
        setLoading(false);
    };

    const handleSaveGoal = async () => {
        if (!newTitle.trim()) {
            Alert.alert(tr('missingTitleError'), tr('missingTitleSub'));
            return;
        }
        if (!therapistProfile?.id) {
            Alert.alert(tr('error'), tr('noTherapistProfile'));
            return;
        }
        setIsSaving(true);
        const result = await GoalService.addGoal(
            patientId, therapistProfile.id, newTitle, newDesc || null, newCategory, requiresRecording
        );
        setIsSaving(false);
        if (result) {
            setShowModal(false);
            setNewTitle('');
            setNewDesc('');
            setNewCategory('communication');
            setRequiresRecording(false);
            loadGoals();
        } else {
            Alert.alert(tr('error'), tr('error'));
        }
    };

    const handleQuickAssign = async (suggestion: SuggestedItem) => {
        if (!therapistProfile?.id) return;
        const result = await GoalService.addGoal(
            patientId,
            therapistProfile.id,
            suggestion.title,
            suggestion.description,
            suggestion.category
        );
        if (result) {
            loadGoals();
        }
    };

    const handleDelete = (goalId: string) => {
        Alert.alert(tr('removeAssignmentTitle'), tr('removeAssignmentQ'), [
            { text: tr('cancel'), style: 'cancel' },
            {
                text: tr('remove'),
                style: 'destructive',
                onPress: async () => {
                    await GoalService.deleteGoal(goalId);
                    loadGoals();
                },
            },
        ]);
    };

    const filteredGoals = filterCat === 'all' ? goals : goals.filter(g => g.category === filterCat);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={{ backgroundColor: colors.bg }}>
                <View style={[styles.header, { borderBottomColor: 'transparent', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{patientName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '30' }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {patientType === 'hospital' ? tr('hospitalBadge') : tr('guestBadge')}
                                </Text>
                            </View>
                            <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b50', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Ionicons name="trophy" size={11} color="#f59e0b" />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309' }}>
                                    {goals.filter(g => g.completed).length} Quests Completed
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={{ paddingHorizontal: 16, marginTop: -6, marginBottom: 6 }}>
                    <KenteAccent />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Clinical Priority Alert Banner */}
                {activeAlert && (
                    <View style={styles.alertBanner}>
                        <View style={styles.alertHeader}>
                            <ShieldAlert size={20} color="#fff" />
                            <Text style={styles.alertTitle}>CLINICAL PRIORITY ALERT</Text>
                            <TouchableOpacity onPress={async () => {
                                await AnalyticsService.resolveEmergency(patientId, 'Therapist');
                                setActiveAlert(null);
                            }}>
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.alertMsg}>
                            Patient triggered an emergency alert.
                        </Text>
                        {activeAlert.metadata?.latitude && (
                            <TouchableOpacity 
                                style={styles.locationBtn}
                                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${activeAlert.metadata.latitude},${activeAlert.metadata.longitude}`)}
                            >
                                <MapPin size={16} color="#ef4444" />
                                <Text style={styles.locationBtnText}>View Live Location</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                        onPress={() => router.push({ pathname: '/phraseboard', params: { patientId } })}
                    >
                        <MessageSquare size={20} color="#3b82f6" />
                        <Text style={[styles.actionLabel, { color: '#3b82f6' }]}>Phrases</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#fef3c7' }]}
                        onPress={() => router.push({ pathname: '/patient-history', params: { id: patientId, name: patientName } })}
                    >
                        <Activity size={20} color="#f59e0b" />
                        <Text style={[styles.actionLabel, { color: "#f59e0b" }]}>{tr('historyBtn')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Date label for today */}
                {!loading && (
                    <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.subText }}>
                            📅 {new Date().toLocaleDateString(language === 'en' ? 'en-GB' : language, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>
                    </View>
                )}

                {/* Main Tabs */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, marginTop: 8 }}>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: activeMainTab === 'assignments' ? colors.primary : 'transparent' }}
                        onPress={() => setActiveMainTab('assignments')}
                    >
                        <Text style={{ fontWeight: 'bold', color: activeMainTab === 'assignments' ? colors.primary : colors.subText }}>{tr('dailyAssignments')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: activeMainTab === 'journal' ? colors.primary : 'transparent' }}
                        onPress={() => setActiveMainTab('journal')}
                    >
                        <Text style={{ fontWeight: 'bold', color: activeMainTab === 'journal' ? colors.primary : colors.subText }}>{tr('voiceJournal')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: activeMainTab === 'analytics' ? colors.primary : 'transparent' }}
                        onPress={() => setActiveMainTab('analytics')}
                    >
                        <Text style={{ fontWeight: 'bold', color: activeMainTab === 'analytics' ? colors.primary : colors.subText }}>Insights</Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Summary (Only in Assignments tab) */}
                {activeMainTab === 'assignments' && !loading && goals.length > 0 && (() => {
                    const completed = goals.filter(g => g.completed).length;
                    const total = goals.length;
                    const pct = Math.round((completed / total) * 100);
                    const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.progressLabel, { color: colors.text }]}>{tr('patientProgressToday')}</Text>
                                <Text style={[styles.progressSub, { color: colors.subText }]}>
                                    {completed} {tr('of')} {total} {tr('assignmentsDoneCount')}
                                </Text>
                                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                                    <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                                </View>
                            </View>
                            <Text style={[styles.progressPct, { color }]}>{pct}%</Text>
                        </View>
                    );
                })()}

                {/* Assigned Goals Section */}
                {activeMainTab === 'assignments' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily assignments</Text>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TouchableOpacity
                                    style={[styles.headerBtn, { backgroundColor: colors.primary + '10' }]}
                                    onPress={() => router.push({ pathname: '/patient-assignments-history', params: { id: patientId, name: patientName } })}
                                >
                                    <Clock size={16} color={colors.primary} />
                                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>History</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.headerBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => setShowModal(true)}
                                >
                                    <Plus size={16} color="#fff" />
                                    <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>{tr('addGoal')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── Date Selector Strip ── */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginBottom: 12 }}
                            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
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
                                            borderWidth: 1,
                                            alignItems: 'center',
                                            backgroundColor: isSelected ? colors.primary : colors.card,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '600',
                                            color: isSelected ? '#fff' : isT ? colors.primary : colors.subText,
                                        }}>
                                            {formatDateLabel(date)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {selectedDate !== todayDate() && (
                            <View style={{ backgroundColor: '#fef9c3', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12 }}>
                                <Text style={{ color: '#92400e', fontSize: 12, textAlign: 'center', fontWeight: '500' }}>
                                    📖 Viewing past daily assignments
                                </Text>
                            </View>
                        )}

                        {/* Category Filter Tabs */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            {CATEGORY_TABS.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setFilterCat(cat)}
                                    style={[
                                        styles.filterTab,
                                        {
                                            backgroundColor: filterCat === cat ? colors.primary : colors.card,
                                            borderColor: filterCat === cat ? colors.primary : colors.border,
                                        }
                                    ]}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: filterCat === cat ? '#fff' : colors.subText }}>
                                        {cat === 'all' ? tr('catAll') : CATEGORY_LABELS[cat]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {loading ? (
                            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                        ) : filteredGoals.length === 0 ? (
                            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>{tr('noAssignmentsYet')}</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                                    {tr('noAssignmentsSub')}
                                </Text>
                            </View>
                        ) : (
                            filteredGoals.map(goal => (
                                <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderLeftColor: CATEGORY_COLORS[goal.category] }]}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                            <View style={[styles.catPill, { backgroundColor: CATEGORY_COLORS[goal.category] + '20' }]}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: CATEGORY_COLORS[goal.category] }}>
                                                    {CATEGORY_LABELS[goal.category]}
                                                </Text>
                                            </View>
                                            {(goal as any).requires_recording && (
                                                <View style={[styles.catPill, { backgroundColor: '#fdf4ff' }]}>
                                                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#a855f7' }}>{tr('recordingBadge')}</Text>
                                                </View>
                                            )}
                                            {goal.completed && <CheckCircle2 size={14} color="#22c55e" />}
                                        </View>
                                        <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                                        {goal.description ? (
                                            <Text style={[styles.goalDesc, { color: colors.subText }]}>{goal.description}</Text>
                                        ) : null}
                                        {/* Patient's voice transcript */}
                                        {(goal as any).voice_transcript && (
                                            <View style={[styles.transcriptBox, { borderColor: '#22c55e50', backgroundColor: '#f0fdf4' }]}>
                                                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700', marginBottom: 2 }}>{tr('patientSaid')}</Text>
                                                <Text style={{ fontSize: 13, color: '#15803d', fontStyle: 'italic' }}>"{(goal as any).voice_transcript}"</Text>
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity onPress={() => handleDelete(goal.id)} style={styles.deleteBtn}>
                                        <Trash2 size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* Voice Journal Section */}
                {activeMainTab === 'journal' && (
                    <View style={styles.section}>
                        <View style={[styles.progressCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary, marginBottom: 20 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.progressLabel, { color: colors.primary }]}>{tr('fluencyAnalytics')}</Text>
                                <Text style={[styles.progressSub, { color: colors.subText, fontSize: 13, marginTop: 4 }]}>
                                    {tr('averageWpm')}: {journals.length > 0 ? Math.round(journals.reduce((sum, j) => sum + j.wpm, 0) / journals.length) : 0} WPM
                                </Text>
                            </View>
                            <TrendingUp size={32} color={colors.primary} />
                        </View>

                        {/* ── ✨ AI VOICE JOURNAL ANALYSIS ── */}
                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Brain size={20} color={colors.primary} />
                                    <Text style={[styles.insightTitle, { color: colors.text, fontWeight: '700' }]}>AI Voice Journal Insights</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={generateAIJournalAnalysis} 
                                    disabled={analyzingJournal}
                                    style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '20' }}
                                >
                                    {analyzingJournal ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                            {aiJournalAnalysis ? 'Regenerate' : 'Generate'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {analyzingJournal ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={{ fontSize: 12, color: colors.subText, marginTop: 8 }}>Analyzing vocal journals...</Text>
                                </View>
                            ) : aiJournalAnalysis ? (
                                <View style={{ gap: 10 }}>
                                    {(() => {
                                        const paragraphs = aiJournalAnalysis.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                                        const titles = [
                                            "Spoken Themes & Cognitive Outlook",
                                            "Clinical Rehabilitation Tips",
                                            "Caregiver Coordination Guidance"
                                        ];
                                        const icons = [
                                            <Brain size={16} color={themeMode === 'dark' ? '#93c5fd' : '#1e3a8a'} />,
                                            <Activity size={16} color={themeMode === 'dark' ? '#6ee7b7' : '#065f46'} />,
                                            <Sparkles size={16} color={themeMode === 'dark' ? '#c084fc' : '#4c1d95'} />
                                        ];
                                        
                                        return paragraphs.map((paragraph, index) => {
                                            const cardStyle = getCardStyles(index % 3, themeMode === 'dark');
                                            const cleanText = paragraph.replace(/^(Spoken Themes & Cognitive Outlook|Clinical Rehabilitation Tips|Caregiver Coordination Guidance):\s*/i, '');
                                            return (
                                                <View 
                                                    key={index} 
                                                    style={{ 
                                                        backgroundColor: cardStyle.bg, 
                                                        padding: 12, 
                                                        borderRadius: 10, 
                                                        borderLeftWidth: 4, 
                                                        borderLeftColor: cardStyle.border, 
                                                        borderStyle: 'solid' 
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        {icons[index % 3]}
                                                        <Text style={{ fontSize: 12, fontWeight: '700', color: cardStyle.text }}>
                                                            {titles[index % 3] || 'AI Insight'}
                                                        </Text>
                                                    </View>
                                                    <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>{cleanText}</Text>
                                                </View>
                                            );
                                        });
                                    })()}
                                </View>
                            ) : (
                                <Text style={{ fontSize: 12, color: colors.subText, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>
                                    No journal analysis generated yet. Tap Generate to run speech-journal analysis.
                                </Text>
                            )}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Journal History</Text>

                        {journals.length === 0 ? (
                            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Mic size={32} color={colors.subText} style={{ marginBottom: 12 }} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>{tr('noJournalEntries')}</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                                    {tr('noJournalEntriesSub')}
                                </Text>
                            </View>
                        ) : (
                            journals.map(journal => (
                                <View key={journal.id} style={[styles.journalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Clock size={14} color={colors.subText} />
                                            <Text style={{ fontSize: 13, color: colors.subText }}>
                                                {new Date(journal.created_at).toLocaleDateString(language === 'en' ? 'en-GB' : language, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <View style={[styles.catPill, { backgroundColor: colors.primary + '15' }]}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{journal.wpm} WPM</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.goalDesc, { color: colors.text, fontStyle: 'italic', fontSize: 14, lineHeight: 22 }]}>"{journal.transcript}"</Text>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* Clinical Insights Section */}
                {activeMainTab === 'analytics' && (
                    <View style={styles.section}>
                        {/* ── ✨ AI CLINICAL PROGRESS SUMMARY ── */}
                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Brain size={20} color={colors.primary} />
                                    <Text style={[styles.insightTitle, { color: colors.text, fontWeight: '700' }]}>AI Progress Review</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={generateAISummary} 
                                    disabled={generatingSummary}
                                    style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '20' }}
                                >
                                    {generatingSummary ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                            {aiSummary ? 'Regenerate' : 'Generate'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {generatingSummary ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={{ fontSize: 12, color: colors.subText, marginTop: 8 }}>Contacting Qwen LLM Backend...</Text>
                                </View>
                            ) : aiSummary ? (
                                <View style={{ gap: 10 }}>
                                    {(() => {
                                        const paragraphs = aiSummary.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                                        const titles = [
                                            "Patient Performance & Compliance",
                                            "Journal & Sentiment Analysis",
                                            "Brainstormed Therapist Improvement Guide"
                                        ];
                                        const icons = [
                                            <Activity size={16} color={themeMode === 'dark' ? '#93c5fd' : '#1e3a8a'} />,
                                            <Smile size={16} color={themeMode === 'dark' ? '#6ee7b7' : '#065f46'} />,
                                            <Sparkles size={16} color={themeMode === 'dark' ? '#c084fc' : '#4c1d95'} />
                                        ];
                                        
                                        return paragraphs.map((paragraph, index) => {
                                            const cardStyle = getCardStyles(index % 3, themeMode === 'dark');
                                            const cleanText = paragraph.replace(/^(Patient Performance Summary|Journal & Sentiment Analysis|Brainstormed Therapist Improvement Guide|Therapist Guidance & Brainstormed Tips):\s*/i, '');
                                            return (
                                                <View 
                                                    key={index} 
                                                    style={{ 
                                                        backgroundColor: cardStyle.bg, 
                                                        padding: 12, 
                                                        borderRadius: 10, 
                                                        borderLeftWidth: 4, 
                                                        borderLeftColor: cardStyle.border, 
                                                        borderStyle: 'solid' 
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        {icons[index % 3]}
                                                        <Text style={{ fontSize: 12, fontWeight: '700', color: cardStyle.text }}>
                                                            {titles[index % 3] || 'AI Review'}
                                                        </Text>
                                                    </View>
                                                    <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>{cleanText}</Text>
                                                </View>
                                            );
                                        });
                                    })()}
                                </View>
                            ) : (
                                <Text style={{ fontSize: 12, color: colors.subText, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>
                                    No summary generated yet. Tap Generate to analyze recent exercises.
                                </Text>
                            )}
                        </View>

                        {/* ── ✨ AI MOOD & SENTIMENT ANALYSIS ── */}
                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Smile size={20} color="#10b981" />
                                    <Text style={[styles.insightTitle, { color: colors.text, fontWeight: '700' }]}>AI Mood Sentiment</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={analyzeAISentiment} 
                                    disabled={analyzingSentiment}
                                    style={{ backgroundColor: '#10b98115', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#10b98130' }}
                                >
                                    {analyzingSentiment ? (
                                        <ActivityIndicator size="small" color="#10b981" />
                                    ) : (
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>Analyze</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {analyzingSentiment ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#10b981" />
                                    <Text style={{ fontSize: 12, color: colors.subText, marginTop: 8 }}>Classifying voice transcripts...</Text>
                                </View>
                            ) : aiSentiment ? (
                                <View style={{ gap: 8 }}>
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 11, color: colors.text }}>😊 Happy</Text>
                                            <Text style={{ fontSize: 11, color: colors.subText }}>{aiSentiment.happy}%</Text>
                                        </View>
                                        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                                            <View style={{ width: `${aiSentiment.happy}%` as any, height: '100%', backgroundColor: '#10b981' }} />
                                        </View>
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 11, color: colors.text }}>😠 Frustrated</Text>
                                            <Text style={{ fontSize: 11, color: colors.subText }}>{aiSentiment.frustrated}%</Text>
                                        </View>
                                        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                                            <View style={{ width: `${aiSentiment.frustrated}%` as any, height: '100%', backgroundColor: '#ef4444' }} />
                                        </View>
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 11, color: colors.text }}>😰 Anxious</Text>
                                            <Text style={{ fontSize: 11, color: colors.subText }}>{aiSentiment.anxious}%</Text>
                                        </View>
                                        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                                            <View style={{ width: `${aiSentiment.anxious}%` as any, height: '100%', backgroundColor: '#f59e0b' }} />
                                        </View>
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 11, color: colors.text }}>😐 Neutral</Text>
                                            <Text style={{ fontSize: 11, color: colors.subText }}>{aiSentiment.neutral}%</Text>
                                        </View>
                                        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                                            <View style={{ width: `${aiSentiment.neutral}%` as any, height: '100%', backgroundColor: '#9ca3af' }} />
                                        </View>
                                    </View>
                                    <View style={{ backgroundColor: colors.bg, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginTop: 4 }}>
                                        <Text style={{ fontSize: 11, color: colors.subText, fontStyle: 'italic' }}>"{aiSentiment.reasoning}"</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={{ fontSize: 12, color: colors.subText, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>
                                    No sentiment metrics computed. Tap Analyze to classify mood.
                                </Text>
                            )}
                        </View>

                        {/* ── ✨ AI PERSONALIZED RECOMMENDATIONS ── */}
                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 14 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Sparkles size={20} color="#f59e0b" />
                                <Text style={[styles.insightTitle, { color: colors.text, fontWeight: '700' }]}>AI Recommended Drills</Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
                                {(['Speech Sound', 'Voice', 'Fluency'] as const).map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        onPress={() => setSelectedDifficulty(d)}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 5,
                                            borderRadius: 6,
                                            borderWidth: 1,
                                            borderColor: selectedDifficulty === d ? colors.primary : colors.border,
                                            backgroundColor: selectedDifficulty === d ? colors.primary : colors.bg,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: selectedDifficulty === d ? '#fff' : colors.subText }}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                onPress={getAIRecommendations}
                                disabled={generatingRecs}
                                style={{ backgroundColor: '#008000', paddingVertical: 8, borderRadius: 10, alignItems: 'center', marginBottom: 10 }}
                            >
                                {generatingRecs ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Get tailored exercises</Text>
                                )}
                            </TouchableOpacity>

                            {generatingRecs ? (
                                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#008000" />
                                </View>
                            ) : aiRecommendations.length > 0 ? (
                                <View style={{ gap: 8 }}>
                                    {aiRecommendations.map((r, idx) => (
                                        <View key={idx} style={{ backgroundColor: colors.bg, padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#008000', borderStyle: 'solid' }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={{ fontWeight: '700', fontSize: 12, color: colors.text }}>{r.title}</Text>
                                                <Text style={{ fontSize: 9, fontWeight: '700', color: '#008000', backgroundColor: '#00800015', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                    {r.difficulty_level}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 11, color: colors.subText }}>{r.description}</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{analytics.reduce((sum, s) => sum + s.wordCount, 0)}</Text>
                                <Text style={[styles.statLabel, { color: colors.subText }]}>Total Words</Text>
                            </View>
                            <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.statValue, { color: '#10b981' }]}>{analytics.length}</Text>
                                <Text style={[styles.statLabel, { color: colors.subText }]}>Sessions</Text>
                            </View>
                        </View>

                        {/* XP Sync & Daily Streak Stats */}
                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
                            <Text style={[styles.insightTitle, { color: colors.text, fontWeight: '700' }]}>Synced Milestones & Streaks</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="flash" size={24} color="#f59e0b" />
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>
                                        {analytics.length > 0 ? (analytics[0].metadata?.streak || 3) : 0} Days
                                    </Text>
                                    <Text style={{ fontSize: 11, color: colors.subText }}>Daily Streak</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="sparkles" size={24} color="#a855f7" />
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>
                                        {analytics.length > 0 ? (analytics[0].metadata?.totalXp || 350) : 0} XP
                                    </Text>
                                    <Text style={{ fontSize: 11, color: colors.subText }}>Synced Experience</Text>
                                </View>
                            </View>
                        </View>

                        {/* Practice Environment (Offline vs Online) */}
                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
                            <Text style={[styles.insightTitle, { color: colors.text, fontWeight: '700' }]}>Practice Environment</Text>
                            {analytics.length === 0 ? (
                                <Text style={{ color: colors.subText, fontSize: 13, marginTop: 8 }}>No practice data available.</Text>
                            ) : (
                                (() => {
                                    const offlineSessions = analytics.filter(s => s.metadata?.isOffline || s.metadata?.offline || s.mode === 'batch').length;
                                    const total = analytics.length;
                                    const offlinePct = Math.round((offlineSessions / total) * 100);
                                    const onlinePct = 100 - offlinePct;
                                    return (
                                        <View style={{ marginTop: 12 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <Text style={{ fontSize: 12, color: colors.subText }}>🟢 Online Sync ({onlinePct}%)</Text>
                                                <Text style={{ fontSize: 12, color: colors.subText }}>🟡 Offline Practice ({offlinePct}%)</Text>
                                            </View>
                                            <View style={{ height: 10, width: '100%', backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' }}>
                                                <View style={{ width: `${onlinePct}%`, backgroundColor: '#0ea5e9' }} />
                                                <View style={{ width: `${offlinePct}%`, backgroundColor: '#f59e0b' }} />
                                            </View>
                                            <Text style={{ fontSize: 11, color: colors.subText, marginTop: 8, fontStyle: 'italic' }}>
                                                Note: Offline practices automatically cached locally and synchronized once internet was restored.
                                            </Text>
                                        </View>
                                    );
                                })()
                            )}
                        </View>

                        {/* Cognitive Struggle History */}
                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
                            <Text style={[styles.insightTitle, { color: colors.text, fontWeight: '700' }]}>Cognitive Struggle History</Text>
                            {(() => {
                                const struggles: Array<{ questTitle: string; date: string; incorrectAttempts: number; detail?: string }> = [];
                                analytics.forEach(s => {
                                    if (s.metadata?.struggles) {
                                        s.metadata.struggles.forEach((st: any) => {
                                            struggles.push({
                                                questTitle: st.questTitle || 'Phrase Quest',
                                                date: s.date,
                                                incorrectAttempts: st.attempts || 1,
                                                detail: st.detail || 'Wrong sentence arrangement'
                                            });
                                        });
                                    } else if (s.metadata?.incorrectAttempts > 0) {
                                        struggles.push({
                                            questTitle: s.metadata?.questTitle || 'Word Game Practice',
                                            date: s.date,
                                            incorrectAttempts: s.metadata.incorrectAttempts,
                                            detail: s.metadata.details || 'Struggled with speech repetition / word match'
                                        });
                                    }
                                });

                                if (struggles.length === 0) {
                                    return (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 10, backgroundColor: '#d1fae5', borderRadius: 8 }}>
                                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                            <Text style={{ color: '#065f46', fontSize: 13, fontWeight: '600', flex: 1 }}>
                                                Perfect Streak: No cognitive struggles or wrong arrangements logged recently.
                                            </Text>
                                        </View>
                                    );
                                }

                                return (
                                    <View style={{ gap: 10, marginTop: 12 }}>
                                        <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>
                                            Review sessions where the patient encountered mistakes or incorrect attempts:
                                        </Text>
                                        {struggles.map((st, index) => (
                                            <View key={index} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={{ fontWeight: '700', fontSize: 13, color: colors.text }}>{st.questTitle}</Text>
                                                    <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                        <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                                                            {st.incorrectAttempts} Mistake{st.incorrectAttempts > 1 ? 's' : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={{ fontSize: 12, color: colors.subText, marginTop: 4 }}>{st.detail}</Text>
                                                <Text style={{ fontSize: 10, color: colors.subText, marginTop: 6 }}>
                                                    Date: {new Date(st.date).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                );
                            })()}
                        </View>

                        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
                            <Text style={[styles.insightTitle, { color: colors.text }]}>Communication Modes</Text>
                            {analytics.length === 0 ? (
                                <Text style={{ color: colors.subText, fontSize: 13, marginTop: 8 }}>No session data available yet.</Text>
                            ) : (
                                <View style={{ gap: 8, marginTop: 10 }}>
                                    {Array.from(new Set(analytics.map(s => s.language))).map(lang => {
                                        const count = analytics.filter(s => s.language === lang).length;
                                        const pct = Math.round((count / analytics.length) * 100);
                                        return (
                                            <View key={lang} style={styles.langRow}>
                                                <Text style={[styles.langName, { color: colors.text }]}>{lang.toUpperCase()}</Text>
                                                <View style={styles.barContainer}>
                                                    <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: colors.primary }]} />
                                                </View>
                                                <Text style={[styles.langPct, { color: colors.subText }]}>{pct}%</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12, marginTop: 20 }]}>Recent Activities</Text>
                        {analytics.length === 0 ? (
                            <View style={[styles.emptyCard, { borderStyle: 'dashed' }]}>
                                <Activity size={32} color={colors.subText} />
                                <Text style={{ color: colors.subText, marginTop: 8 }}>Waiting for first clinical session...</Text>
                            </View>
                        ) : (
                            analytics.map(session => (
                                <View key={session.id} style={[styles.sessionRow, { borderBottomColor: colors.border }]}>
                                    <View style={styles.sessionLeft}>
                                        <Text style={[styles.sessionDate, { color: colors.text }]}>
                                            {new Date(session.date).toLocaleDateString()}
                                        </Text>
                                        <Text style={[styles.sessionTime, { color: colors.subText }]}>
                                            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View style={styles.sessionRight}>
                                        <Text style={[styles.sessionWords, { color: colors.primary }]}>{session.wordCount} words</Text>
                                        <Text style={[styles.sessionDuration, { color: colors.subText }]}>{Math.round(session.duration)}s • {session.mode}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* ── Custom Assignment Modal ── */}
            <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{tr('newAssignment')}</Text>
                        <Text style={{ fontSize: 13, color: colors.subText, marginBottom: 16 }}>{tr('newAssignmentSub')}</Text>

                        {/* Templates shortcut */}
                        <TouchableOpacity 
                            style={[{ borderColor: colors.primary + '30', backgroundColor: colors.primary + '08', padding: 12, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }]}
                            onPress={() => {
                                setShowModal(false);
                                setShowSuggestions(true);
                            }}
                        >
                            <Plus size={20} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 8 }}>{tr('browseTemplates')}</Text>
                        </TouchableOpacity>

                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{tr('catAll')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            {(Object.keys(CATEGORY_LABELS) as GoalCategory[]).map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setNewCategory(cat)}
                                    style={[styles.filterTab, {
                                        backgroundColor: newCategory === cat ? CATEGORY_COLORS[cat] : colors.bg,
                                        borderColor: CATEGORY_COLORS[cat],
                                    }]}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: newCategory === cat ? '#fff' : CATEGORY_COLORS[cat] }}>
                                        {CATEGORY_LABELS[cat]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{tr('assignmentTitleLabel')}</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Sustain vowel for 5 seconds"
                            placeholderTextColor={colors.subText}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />

                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{tr('assignmentInstructionsLabel')}</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text, height: 80, textAlignVertical: 'top' }]}
                            placeholder="Describe how to do this exercise..."
                            placeholderTextColor={colors.subText}
                            multiline
                            value={newDesc}
                            onChangeText={setNewDesc}
                        />

                        {/* Requires Recording toggle */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 12,
                                paddingHorizontal: 14,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: requiresRecording ? '#a855f7' : colors.border,
                                backgroundColor: requiresRecording ? '#fdf4ff' : colors.bg,
                                marginBottom: 14,
                            }}
                            onPress={() => setRequiresRecording(prev => !prev)}
                        >
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: requiresRecording ? '#7c3aed' : colors.text }}>
                                    {tr('requiresVoiceToggle')}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.subText, marginTop: 2 }}>
                                    {tr('requiresVoiceSub')}
                                </Text>
                            </View>
                            <View style={{
                                width: 42, height: 24, borderRadius: 12,
                                backgroundColor: requiresRecording ? '#a855f7' : colors.border,
                                justifyContent: 'center',
                                paddingHorizontal: 2,
                            }}>
                                <View style={{
                                    width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
                                    alignSelf: requiresRecording ? 'flex-end' : 'flex-start',
                                }} />
                            </View>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setShowModal(false)}>
                                <Text style={{ color: colors.text, fontWeight: '600' }}>{tr('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveGoal} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>{tr('save')}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── SLP Templates Modal ── */}
            <Modal visible={showSuggestions} animationType="slide" transparent onRequestClose={() => setShowSuggestions(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: colors.card, maxHeight: '85%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{tr('slpTemplatesTitle')}</Text>
                            <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                                <Text style={{ color: colors.subText, fontSize: 15 }}>{tr('done')}</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {SUGGESTIONS.map((s, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.suggestionCard, { backgroundColor: colors.bg, borderColor: CATEGORY_COLORS[s.category] + '40' }]}
                                    onPress={async () => {
                                        await handleQuickAssign(s);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={[styles.suggIcon, { backgroundColor: CATEGORY_COLORS[s.category] + '20' }]}>
                                            <Ionicons name={s.icon as any} size={20} color={CATEGORY_COLORS[s.category]} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={[styles.catPill, { backgroundColor: CATEGORY_COLORS[s.category] + '20', marginBottom: 4 }]}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: CATEGORY_COLORS[s.category] }}>
                                                    {CATEGORY_LABELS[s.category]}
                                                </Text>
                                            </View>
                                            <Text style={[styles.goalTitle, { color: colors.text }]}>{s.title}</Text>
                                            <Text style={[styles.goalDesc, { color: colors.subText }]} numberOfLines={2}>{s.description}</Text>
                                        </View>
                                        <Plus size={18} color={CATEGORY_COLORS[s.category]} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    headerName: { fontSize: 20, fontWeight: 'bold' },
    headerSub: { fontSize: 13, marginTop: 2 },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        paddingBottom: 4,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
    },
    actionLabel: { fontSize: 14, fontWeight: '700' },
    section: { padding: 16 },
    progressCard: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    progressLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    progressSub: { fontSize: 12, marginBottom: 8 },
    progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    progressPct: { fontSize: 22, fontWeight: 'bold', marginLeft: 16 },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    headerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    emptyCard: {
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    goalCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderLeftWidth: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    catPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    goalTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    goalDesc: { fontSize: 13, lineHeight: 18 },
    deleteBtn: { padding: 6, marginLeft: 8 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        padding: 0,
    },
    modalBox: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
    },
    modalBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    suggestionCard: {
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    suggIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transcriptBox: {
        marginTop: 8,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    journalCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    alertBanner: {
        backgroundColor: '#ef4444',
        margin: 16,
        padding: 16,
        borderRadius: 20,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    alertTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    alertMsg: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    locationBtn: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    locationBtnText: {
        color: '#ef4444',
        fontWeight: '800',
        fontSize: 14,
    },
    insightCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    insightTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    langRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    langName: {
        width: 40,
        fontSize: 11,
        fontWeight: 'bold',
    },
    barContainer: {
        flex: 1,
        height: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
    },
    langPct: {
        width: 35,
        fontSize: 11,
        textAlign: 'right',
    },
    sessionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    sessionLeft: {},
    sessionDate: {
        fontSize: 14,
        fontWeight: '600',
    },
    sessionTime: {
        fontSize: 12,
    },
    sessionRight: {
        alignItems: 'flex-end',
    },
    sessionWords: {
        fontSize: 14,
        fontWeight: '700',
    },
    sessionDuration: {
        fontSize: 12,
    }
});

