import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Trash2 } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoryService, TranscriptionLog } from '../services/historyService';
import { historyStyles as styles } from '../styles/history.styles';
import { AppContext } from './_layout';

const Header = ({ title, subTitle, onBack, onClear }: { title: string, subTitle?: string, onBack: () => void, onClear: () => void }) => {
    const { colors } = useContext(AppContext);
    return (
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                {subTitle && <Text style={{ fontSize: 13, color: colors.subText }}>{subTitle}</Text>}
            </View>
            <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                <Trash2 size={24} color={colors.danger || '#EF4444'} />
            </TouchableOpacity>
        </View>
    );
};

export default function PatientHistoryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors } = useContext(AppContext);
    const [logs, setLogs] = useState<TranscriptionLog[]>([]);
    const [loading, setLoading] = useState(true);

    const patientId = params.id as string;
    const patientName = params.name as string || 'Patient';

    const loadLogs = async () => {
        if (!patientId) return;
        setLoading(true);
        const data = await HistoryService.getPatientLogs(patientId);
        setLogs(data);
        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, [patientId]);

    const handleClear = () => {
        Alert.alert(
            "Clear History",
            `Are you sure you want to delete all logs for ${patientName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        // Note: Depending on rules, therapists might not be allowed to delete patient logs.
                        // Assuming they can for this implementation:
                        // await HistoryService.clearPatientLogs(patientId); 
                        // loadLogs();
                        Alert.alert("Permission Denied", "Only patients can delete their own history logs.");
                    }
                }
            ]
        );
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    if (!patientId) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <Header title="Patient History" onBack={() => router.back()} onClear={() => {}} />
                <View style={[styles.emptyState, { flex: 1 }]}>
                    <Text style={{ color: colors.text }}>Error: No patient selected.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <Header 
                title={`${patientName}'s Logs`} 
                subTitle="Transcription History"
                onBack={() => router.back()} 
                onClear={handleClear} 
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MessageSquare size={48} color={colors.subText} style={{ marginBottom: 16 }} />
                        <Text style={{ color: colors.subText, fontSize: 16 }}>No transcription logs found for this patient.</Text>
                    </View>
                ) : (
                    logs.map((log) => (
                        <View key={log.id} style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.logHeader}>
                                <Text style={[styles.logDate, { color: colors.subText }]}>{formatDate(log.timestamp)}</Text>
                                <Text style={[styles.logIntent, { color: colors.primary }]}>{log.intentCategory || 'Transcription'}</Text>
                            </View>
                            <Text style={[styles.logText, { color: colors.text }]}>{log.text}</Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
