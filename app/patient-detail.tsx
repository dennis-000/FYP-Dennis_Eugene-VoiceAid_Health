import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    Clock,
    MessageSquare,
    Mic,
    Plus,
    Trash2,
    TrendingUp
} from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { GoalCategory, GoalService, PatientGoal } from '../services/goalService';
import { JournalService, VoiceJournal } from '../services/journalService';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

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
    const { colors, language } = useContext(AppContext);
    const { therapistProfile } = useAuth();
    const tr = useT(language as any);
    const SUGGESTIONS = getSuggestions(tr);
    const CATEGORY_LABELS = getCategoryLabels(tr);

    const patientId = params.id as string;
    const patientName = params.name as string || 'Patient';
    const patientType = params.type as string;

    const [activeMainTab, setActiveMainTab] = useState<'assignments' | 'journal'>('assignments');

    const [goals, setGoals] = useState<PatientGoal[]>([]);
    const [journals, setJournals] = useState<VoiceJournal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCategory, setNewCategory] = useState<GoalCategory>('communication');
    const [requiresRecording, setRequiresRecording] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [filterCat, setFilterCat] = useState<GoalCategory | 'all'>('all');

    const CATEGORY_TABS: (GoalCategory | 'all')[] = ['all', 'communication', 'language', 'social', 'fluency', 'voice', 'speech_sound'];

    useEffect(() => {
        loadGoals();
        loadJournals();
    }, [patientId]);

    const loadJournals = async () => {
        const data = await JournalService.getPatientJournals(patientId);
        setJournals(data);
    };

    const loadGoals = async () => {
        setLoading(true);
        const data = await GoalService.getPatientGoals(patientId);
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
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{patientName}</Text>
                    <Text style={[styles.headerSub, { color: colors.subText }]}>
                        {patientType === 'hospital' ? tr('hospitalBadge') : tr('guestBadge')}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
});

