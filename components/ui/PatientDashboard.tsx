import { Activity, Calendar, Grid, Mic } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PatientDashboardProps {
    router: any;
    colors: any;
    language: string;
    setLanguage: (lang: string) => void;
    patientType?: 'guest' | 'hospital' | null;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
    router,
    colors,
    language,
    setLanguage,
    patientType
}) => {
    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'twi', label: 'TWI' },
        { code: 'ga', label: 'GA' }
    ];

    return (
        <View style={styles.container}>
            {/* Language Selector */}
            <View style={styles.languageSection}>
                <Text style={[styles.languageLabel, { color: colors.subText }]}>
                    Language:
                </Text>
                <View style={styles.languageButtons}>
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                styles.langButton,
                                {
                                    backgroundColor: language === lang.code ? colors.primary : colors.card,
                                    borderColor: language === lang.code ? colors.primary : colors.border,
                                }
                            ]}
                            onPress={() => setLanguage(lang.code)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.langButtonText,
                                    { color: language === lang.code ? '#FFFFFF' : colors.text }
                                ]}
                            >
                                {lang.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Primary Action - Speak Now */}
            <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/transcript')}
                activeOpacity={0.8}
            >
                <View style={styles.primaryButtonContent}>
                    <Mic size={36} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Speak Now</Text>
                </View>
            </TouchableOpacity>

            {/* Secondary Actions Grid */}
            <View style={styles.grid}>
                {/* Phrase Board */}
                <TouchableOpacity
                    style={[styles.gridButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push('/phraseboard')}
                    activeOpacity={0.7}
                >
                    <Grid size={32} color={colors.primary} />
                    <Text style={[styles.gridButtonText, { color: colors.text }]}>
                        Phrase Board
                    </Text>
                    <Text style={[styles.gridButtonSubtext, { color: colors.subText }]}>
                        Quick phrases
                    </Text>
                </TouchableOpacity>

                {/* My Reminders - Only for hospital patients */}
                {patientType === 'hospital' ? (
                    <TouchableOpacity
                        style={[styles.gridButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.push('/routine')}
                        activeOpacity={0.7}
                    >
                        <Calendar size={32} color={colors.primary} />
                        <Text style={[styles.gridButtonText, { color: colors.text }]}>
                            My Reminders
                        </Text>
                        <Text style={[styles.gridButtonSubtext, { color: colors.subText }]}>
                            From therapist
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.gridButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.push('/settings')}
                        activeOpacity={0.7}
                    >
                        <Calendar size={32} color={colors.subText} />
                        <Text style={[styles.gridButtonText, { color: colors.text }]}>
                            Settings
                        </Text>
                        <Text style={[styles.gridButtonSubtext, { color: colors.subText }]}>
                            Preferences
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Status Message */}
            <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statusContent}>
                    <Activity size={20} color={colors.success} />
                    <Text style={[styles.statusText, { color: colors.text }]}>
                        System Ready
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 10,
    },
    languageSection: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    languageLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    languageButtons: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },
    langButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 2,
        minWidth: 80,
        alignItems: 'center',
    },
    langButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    primaryButton: {
        borderRadius: 20,
        padding: 28,
        marginBottom: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    primaryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    gridButton: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 20,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    gridButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    gridButtonSubtext: {
        fontSize: 13,
        marginTop: 6,
        textAlign: 'center',
        opacity: 0.8,
    },
    statusCard: {
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        marginTop: 'auto',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
