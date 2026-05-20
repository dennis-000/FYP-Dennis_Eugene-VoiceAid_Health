import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock, ListTodo } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalCategory, GoalService, PatientGoal } from '../services/goalService';
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

export default function PatientAssignmentsHistoryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, language } = useContext(AppContext);
    const tr = useT(language as any);

    const patientId = params.id as string;
    const patientName = params.name as string || 'Patient';

    const [loading, setLoading] = useState(true);
    const [groupedGoals, setGroupedGoals] = useState<Record<string, PatientGoal[]>>({});
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadHistory();
    }, [patientId]);

    const loadHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        const allGoals = await GoalService.getAllPatientGoals(patientId);

        // Group by assigned_date
        const grouped: Record<string, PatientGoal[]> = {};
        allGoals.forEach(goal => {
            const dateStr = goal.assigned_date;
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(goal);
        });

        // Initialize latest date as expanded
        const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const initialExpanded: Record<string, boolean> = {};
        if (dates.length > 0) {
            initialExpanded[dates[0]] = true; // Auto-expand the most recent day
        }

        setGroupedGoals(grouped);
        setExpandedDates(initialExpanded);
        setLoading(false);
    };

    const toggleDate = (dateStr: string) => {
        setExpandedDates(prev => ({
            ...prev,
            [dateStr]: !prev[dateStr]
        }));
    };

    const formatDateHeader = (dateStr: string) => {
        const d = new Date(dateStr);
        // Add artificial timezone offset fix if dates are shifting
        const localDate = new Date(d.getTime() + Math.abs(d.getTimezoneOffset() * 60000));
        return localDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Sort dates descending (newest first)
    const sortedDates = Object.keys(groupedGoals).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

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
                        Assignment History Timeline
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : sortedDates.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <ListTodo size={48} color={colors.subText} style={{ marginBottom: 16 }} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No assignments found</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                            You haven't assigned any clinical goals to this patient yet.
                        </Text>
                    </View>
                ) : (
                    sortedDates.map((dateStr) => {
                        const dayGoals = groupedGoals[dateStr];
                        const completedCount = dayGoals.filter(g => g.completed).length;
                        const totalCount = dayGoals.length;
                        const isExpanded = !!expandedDates[dateStr];
                        const pctDone = Math.round((completedCount / totalCount) * 100);

                        return (
                            <View key={dateStr} style={[styles.dateGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                {/* Date Accordion Header */}
                                <TouchableOpacity
                                    style={styles.dateHeader}
                                    onPress={() => toggleDate(dateStr)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                                            <Calendar size={20} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.dateText, { color: colors.text }]}>{formatDateHeader(dateStr)}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                <Text style={[styles.progressText, { color: colors.subText }]}>
                                                    {completedCount} of {totalCount} completed
                                                </Text>
                                                <View style={[styles.pill, { backgroundColor: pctDone === 100 ? '#dcfce7' : pctDone >= 50 ? '#fef9c3' : '#fee2e2' }]}>
                                                    <Text style={{ fontSize: 10, fontWeight: '700', color: pctDone === 100 ? '#166534' : pctDone >= 50 ? '#854d0e' : '#991b1b' }}>
                                                        {pctDone}%
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ paddingLeft: 8 }}>
                                        {isExpanded ? <ChevronUp size={20} color={colors.subText} /> : <ChevronDown size={20} color={colors.subText} />}
                                    </View>
                                </TouchableOpacity>

                                {/* Expanded Goals List */}
                                {isExpanded && (
                                    <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
                                        {dayGoals.map((goal, index) => (
                                            <View key={goal.id} style={[
                                                styles.goalRow,
                                                index !== dayGoals.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                                            ]}>
                                                <View style={{ flex: 1 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                                        <View style={[styles.catPill, { backgroundColor: CATEGORY_COLORS[goal.category] + '20' }]}>
                                                            <Text style={{ fontSize: 10, fontWeight: '700', color: CATEGORY_COLORS[goal.category] }}>
                                                                {(() => {
                                                                    const cat = goal.category;
                                                                    const catKey = `cat${cat.charAt(0).toUpperCase()}${cat.slice(1).replace(/_([a-z])/g, (_, m) => m.toUpperCase())}`;
                                                                    const translatedCat = tr(catKey as any);
                                                                    return translatedCat && translatedCat !== catKey ? translatedCat : CATEGORY_LABELS[cat];
                                                                })()}
                                                            </Text>
                                                        </View>
                                                        {goal.requires_recording && (
                                                            <View style={[styles.catPill, { backgroundColor: '#fdf4ff' }]}>
                                                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#a855f7' }}>🎙️ Recording</Text>
                                                            </View>
                                                        )}
                                                        {goal.completed && <CheckCircle2 size={14} color="#22c55e" />}
                                                    </View>
                                                    
                                                    <Text style={[styles.goalTitle, { color: colors.text, textDecorationLine: goal.completed ? 'line-through' : 'none', opacity: goal.completed ? 0.6 : 1 }]}>
                                                        {tr.translateText(goal.title)}
                                                    </Text>
                                                    
                                                    {goal.description ? (
                                                        <Text style={[styles.goalDesc, { color: colors.subText }]}>{tr.translateText(goal.description)}</Text>
                                                    ) : null}

                                                    {/* Patient's Voice Transcript Log */}
                                                    {goal.voice_transcript && (
                                                        <View style={[styles.transcriptBox, { borderColor: '#22c55e50', backgroundColor: '#f0fdf4' }]}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                                                <Clock size={12} color="#16a34a" />
                                                                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700' }}>
                                                                    {tr('patientSaid').replace('🎤 ', '')}
                                                                </Text>
                                                            </View>
                                                            <Text style={{ fontSize: 13, color: '#15803d', fontStyle: 'italic' }}>
                                                                "{goal.voice_transcript}"
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    headerSub: {
        fontSize: 13,
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    dateGroup: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressText: {
        fontSize: 13,
        fontWeight: '500',
    },
    pill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    expandedContent: {
        borderTopWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    goalRow: {
        padding: 16,
    },
    catPill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    goalTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    goalDesc: {
        fontSize: 13,
        lineHeight: 18,
        marginTop: 4,
    },
    transcriptBox: {
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
});
