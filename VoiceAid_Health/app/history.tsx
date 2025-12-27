import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Trash2 } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { HistoryService, TranscriptionLog } from '../services/historyService';
import { historyStyles as styles } from '../styles/history.styles';
import { AppContext } from './_layout';

const Header = ({ title, onBack, onClear }: { title: string, onBack: () => void, onClear: () => void }) => {
    const { colors } = useContext(AppContext);
    return (
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
                <Trash2 size={24} color={colors.danger || '#EF4444'} />
            </TouchableOpacity>
        </View>
    );
};

export default function HistoryScreen() {
    const router = useRouter();
    const { colors } = useContext(AppContext);
    const [logs, setLogs] = useState<TranscriptionLog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLogs = async () => {
        setLoading(true);
        const data = await HistoryService.getLogs();
        setLogs(data);
        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleClear = () => {
        Alert.alert(
            "Clear History",
            "Are you sure you want to delete all logs?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await HistoryService.clearLogs();
                        loadLogs();
                    }
                }
            ]
        );
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <Header title="Patient Logs" onBack={() => router.back()} onClear={handleClear} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MessageSquare size={48} color={colors.subText} style={{ marginBottom: 16 }} />
                        <Text style={{ color: colors.subText, fontSize: 16 }}>No logs found.</Text>
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
