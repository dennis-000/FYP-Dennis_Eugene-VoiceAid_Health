import { useRouter } from 'expo-router';
import {
    Activity,
    ArrowLeft,
    MessageSquare,
    Trash2, 
    User, 
    Users,
    Volume2,
    Languages,
    Calendar,
    Filter
} from 'lucide-react-native';
import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { HistoryService, TranscriptionLog } from '../services/historyService';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

const { width } = Dimensions.get('window');

import KenteAccent from '../components/KenteAccent';

const Header = ({ title, onBack, onClear, showClear = false }: any) => {
    const { colors, largeText } = useContext(AppContext);
    const scale = largeText ? 1.25 : 1;

    return (
        <View style={{ backgroundColor: colors.card }}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: 'transparent', height: 60 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24 * scale} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 * scale }]}>{title}</Text>
                {showClear ? (
                    <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                        <Trash2 size={24 * scale} color={colors.danger || '#EF4444'} />
                    </TouchableOpacity>
                ) : <View style={{ width: 24 * scale }} />}
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: -4, marginBottom: 4 }}>
                <KenteAccent />
            </View>
        </View>
    );
};

/**
 * ==========================================
 * PATIENT HISTORY VIEW
 * ==========================================
 * This is the original simple log view.
 */
const PatientHistoryView = () => {
    const { colors, largeText, language } = useContext(AppContext);
    const tr = useT(language as any);
    const scale = largeText ? 1.25 : 1;
    const [logs, setLogs] = useState<TranscriptionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    const loadLogs = async () => {
        setLoading(true);
        const data = await HistoryService.getLogs();
        setLogs(data);
        setLoading(false);
    };

    const handleSpeakLog = async (log: TranscriptionLog) => {
        setSpeakingId(log.id);
        try {
            await TTSService.speak(log.text, (log.detectedLanguage as any) || language);
        } catch (error) {
            console.error('History playback failed', error);
        } finally {
            setTimeout(() => setSpeakingId(null), 2000);
        }
    };

    useEffect(() => { loadLogs(); }, []);

    const handleClear = () => {
        Alert.alert(
            tr('clearHistory'),
            tr('clearHistoryPrompt'),
            [
                { text: tr('cancel'), style: "cancel" },
                {
                    text: tr('deleteBtn'),
                    style: "destructive",
                    onPress: async () => {
                        await HistoryService.clearLogs();
                        loadLogs();
                    }
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MessageSquare size={48} color={colors.subText} style={{ marginBottom: 16 }} />
                        <Text style={{ color: colors.subText, fontSize: 16 * scale }}>{tr('noLogsFound')}</Text>
                    </View>
                ) : (
                    logs.map((log) => (
                        <View key={log.id} style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border + '50' }]}>
                            <View style={styles.logHeader}>
                                <Text style={[styles.logDate, { color: colors.subText, fontSize: 13 * scale }]}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => handleSpeakLog(log)}
                                    style={[styles.playBtn, { backgroundColor: colors.bg }, speakingId === log.id && { backgroundColor: colors.primary + '15' }]}
                                >
                                    <Volume2 size={18 * scale} color={speakingId === log.id ? colors.primary : colors.subText} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.logText, { color: colors.text, fontSize: 17 * scale, fontWeight: '500' }]}>{log.text}</Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

/**
 * ==========================================
 * CAREGIVER ANALYTICS VIEW
 * ==========================================
 * A sophisticated dashboard for therapists.
 */
const CaregiverAnalyticsView = () => {
    const { colors, largeText, language } = useContext(AppContext);
    const tr = useT(language as any);
    const { therapistProfile } = useAuth();
    const scale = largeText ? 1.25 : 1;

    const [logs, setLogs] = useState<(TranscriptionLog & { patientName?: string })[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<(TranscriptionLog & { patientName?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterPatient, setFilterPatient] = useState<string>('ALL');
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    const loadAnalytics = async () => {
        setLoading(true);
        
        let data: any[] = [];
        if (therapistProfile?.assigned_patients) {
            data = await HistoryService.getLogsForPatients(therapistProfile.assigned_patients);
        }

        setLogs(data);
        setFilteredLogs(data);
        setLoading(false);
    };

    const handleSpeakLog = async (log: TranscriptionLog) => {
        setSpeakingId(log.id);
        try {
            await TTSService.speak(log.text, (log.detectedLanguage as any) || language);
        } catch (error) {
            console.error('History playback failed', error);
        } finally {
            setTimeout(() => setSpeakingId(null), 2000);
        }
    };

    useEffect(() => { loadAnalytics(); }, [therapistProfile]);

    // Handle Filtering
    useEffect(() => {
        if (filterPatient === 'ALL') {
            setFilteredLogs(logs);
        } else {
            setFilteredLogs(logs.filter(l => l.user_id === filterPatient));
        }
    }, [filterPatient, logs]);

    // Compute Metrics safely
    const metrics = useMemo(() => {
        const total = filteredLogs.length;
        if (total === 0) return { total: 0, topLang: 'N/A', activeDay: 'N/A' };

        // Top Language
        const langs: Record<string, number> = {};
        filteredLogs.forEach(l => {
            const code = l.detectedLanguage || 'en';
            langs[code] = (langs[code] || 0) + 1;
        });
        const topLangCode = Object.keys(langs).reduce((a, b) => langs[a] > langs[b] ? a : b);
        const topLang = topLangCode === 'en' ? 'English' : topLangCode === 'twi' ? 'Twi' : topLangCode === 'ga' ? 'Ga' : topLangCode;

        // Most Active Day
        const days: Record<string, number> = {};
        filteredLogs.forEach(l => {
            const date = new Date(l.timestamp).toLocaleDateString();
            days[date] = (days[date] || 0) + 1;
        });
        const mostActive = Object.keys(days).reduce((a, b) => days[a] > days[b] ? a : b);

        return { total, topLang, activeDay: mostActive };
    }, [filteredLogs]);

    // Get unique patients for filter pills
    const patientFilters = useMemo(() => {
        const unique = new Map<string, string>();
        logs.forEach(l => {
            if (l.user_id && l.patientName) unique.set(l.user_id, l.patientName);
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [logs]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Activity size={48} color={colors.subText} style={{ marginBottom: 16 }} />
                        <Text style={{ color: colors.subText, fontSize: 16 * scale, textAlign: 'center' }}>
                            {tr('noTranscriptionLogs')}
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Metrics Cards */}
                        <View style={styles.metricsGrid}>
                            <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <MessageSquare size={20 * scale} color="#3B82F6" />
                                <Text style={[styles.metricValue, { color: colors.text, fontSize: 24 * scale }]}>{metrics.total}</Text>
                                <Text style={[styles.metricLabel, { color: colors.subText, fontSize: 12 * scale }]}>{tr('totalPhrases')}</Text>
                            </View>
                            <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Languages size={20 * scale} color="#8B5CF6" />
                                <Text style={[styles.metricValue, { color: colors.text, fontSize: 24 * scale }]}>{metrics.topLang}</Text>
                                <Text style={[styles.metricLabel, { color: colors.subText, fontSize: 12 * scale }]}>{tr('primaryMode')}</Text>
                            </View>
                            <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Calendar size={20 * scale} color="#10B981" />
                                <Text style={[styles.metricValue, { color: colors.text, fontSize: 16 * scale, marginTop: 4 }]} numberOfLines={1}>{metrics.activeDay}</Text>
                                <Text style={[styles.metricLabel, { color: colors.subText, fontSize: 12 * scale }]}>{tr('peakActivity')}</Text>
                            </View>
                        </View>

                        {/* Filter Bar */}
                        <View style={styles.filterBar}>
                            <Filter size={20 * scale} color={colors.subText} style={{ marginRight: 8 }} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <TouchableOpacity
                                    style={[styles.filterPill, filterPatient === 'ALL' ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => setFilterPatient('ALL')}
                                >
                                    <Text style={[styles.filterText, filterPatient === 'ALL' ? { color: '#FFF' } : { color: colors.text }, { fontSize: 13 * scale }]}>{tr('allPatients')}</Text>
                                </TouchableOpacity>
                                {patientFilters.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[styles.filterPill, filterPatient === p.id ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                                        onPress={() => setFilterPatient(p.id)}
                                    >
                                        <Text style={[styles.filterText, filterPatient === p.id ? { color: '#FFF' } : { color: colors.text }, { fontSize: 13 * scale }]}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Data Table */}
                        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * scale }]}>{tr('communicationAuditLog')}</Text>
                        
                        {filteredLogs.map((log) => (
                            <View key={log.id} style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.logHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <User size={14 * scale} color={colors.subText} />
                                        <Text style={[styles.patientNameBadge, { color: colors.text, fontSize: 14 * scale }]}>
                                            {log.patientName}
                                        </Text>
                                    </View>
                                    <Text style={[styles.langBadge, { fontSize: 11 * scale, color: colors.primary }]}>
                                        {log.detectedLanguage?.toUpperCase() || 'EN'}
                                    </Text>
                                    <TouchableOpacity 
                                        onPress={() => handleSpeakLog(log)}
                                        style={[styles.playBtn, speakingId === log.id && { backgroundColor: colors.primary + '15' }]}
                                    >
                                        <Volume2 size={16 * scale} color={speakingId === log.id ? colors.primary : colors.subText} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.logText, { color: colors.text, fontSize: 16 * scale }]}>{log.text}</Text>
                                <Text style={[styles.logDate, { color: colors.subText, fontSize: 11 * scale, marginTop: 8 }]}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default function HistoryScreen() {
    const { role } = useRole();
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const tr = useT(language as any);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
            {role === 'caregiver' ? (
                <View style={{ flex: 1 }}>
                    <Header title={tr('clinicalDataAnalytics')} onBack={() => router.back()} showClear={false} />
                    <CaregiverAnalyticsView />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <Header title={tr('myConversations')} onBack={() => router.back()} showClear={true} />
                    <PatientHistoryView />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontWeight: '800',
    },
    clearBtn: {
        padding: 4,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    logItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    logDate: {
        fontWeight: '500',
    },
    logText: {
        lineHeight: 24,
    },
    patientNameBadge: {
        fontWeight: '600',
        marginLeft: 6,
    },
    langBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        fontWeight: 'bold',
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    metricCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    metricValue: {
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    metricLabel: {
        textAlign: 'center',
    },
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    filterText: {
        fontWeight: '600',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    playBtn: {
        padding: 6,
        borderRadius: 12,
        marginLeft: 8,
    }
});
