import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Activity, Calendar, ChevronRight, Globe, LayoutGrid, Mic, Settings, Users } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getLanguageFlag, getTranslationsSync, Language } from '../../services/translationService';

interface CaregiverDashboardProps {
    router: ReturnType<typeof useRouter>;
    language: string;
    setLanguage: (lang: 'en' | 'twi' | 'ga') => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
    router,
    language,
    setLanguage
}) => {
    const { therapistProfile } = useAuth();
    const t = getTranslationsSync(language as Language);
    const patientCount = therapistProfile?.assigned_patients?.length || 0;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>{t.dashboard.welcome}</Text>
                        <Text style={styles.nameText}>{therapistProfile?.full_name || 'Therapist'}</Text>
                    </View>
                    {therapistProfile?.organization && (
                        <View style={styles.orgBadge}>
                            <Text style={styles.orgText}>{therapistProfile.organization}</Text>
                        </View>
                    )}
                </View>

                {/* Language Selector */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Globe size={18} color="#6366f1" />
                        <Text style={styles.cardTitle}>{t.language.select}</Text>
                    </View>
                    <View style={styles.languageButtons}>
                        {(['en', 'twi', 'ga'] as Language[]).map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                onPress={() => setLanguage(lang)}
                                style={[
                                    styles.langButton,
                                    language === lang && styles.langButtonActive
                                ]}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.langFlag}>{getLanguageFlag(lang)}</Text>
                                <Text style={[
                                    styles.langText,
                                    language === lang && styles.langTextActive
                                ]}>
                                    {lang.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Primary Action */}
                <TouchableOpacity
                    onPress={() => router.push('/transcript')}
                    activeOpacity={0.8}
                    style={styles.primaryCard}
                >
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryGradient}
                    >
                        <View style={styles.primaryIconContainer}>
                            <Mic size={28} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                        <View style={styles.primaryContent}>
                            <Text style={styles.primaryTitle}>{t.actions.speak}</Text>
                            <Text style={styles.primarySubtitle}>Start voice assistance</Text>
                        </View>
                        <ChevronRight size={24} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* My Patients */}
                <TouchableOpacity
                    onPress={() => router.push('/my-patients')}
                    activeOpacity={0.8}
                    style={styles.card}
                >
                    <View style={styles.cardRow}>
                        <View style={styles.iconBadge}>
                            <Users size={24} color="#6366f1" strokeWidth={2} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>{t.dashboard.myPatients}</Text>
                            <Text style={styles.cardValue}>{patientCount} {t.patients.assigned}</Text>
                        </View>
                        <ChevronRight size={20} color="#9ca3af" />
                    </View>
                </TouchableOpacity>

                {/* Management Tools */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.dashboard.managementTools}</Text>

                    <View style={styles.toolsGrid}>
                        <TouchableOpacity
                            onPress={() => router.push('/phraseboard')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#eff6ff' }]}>
                                <LayoutGrid size={24} color="#3b82f6" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>{t.actions.phrases}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/routine')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#f0fdf4' }]}>
                                <Calendar size={24} color="#22c55e" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>{t.actions.routine}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/history')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#fef3c7' }]}>
                                <Activity size={24} color="#f59e0b" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>{t.actions.history}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#f3f4f6' }]}>
                                <Settings size={24} color="#6b7280" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>{t.actions.settings}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },

    // Header
    header: {
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 28,
        color: '#111827',
        fontWeight: 'bold',
        marginBottom: 12,
    },
    orgBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    orgText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '600',
    },

    // Cards
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
    },
    cardLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    // Language Selector
    languageButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    langButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f9fafb',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
    },
    langButtonActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#6366f1',
    },
    langFlag: {
        fontSize: 18,
    },
    langText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 0.5,
    },
    langTextActive: {
        color: '#6366f1',
    },

    // Primary Action
    primaryCard: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    primaryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryContent: {
        flex: 1,
        marginLeft: 16,
    },
    primaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    primarySubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },

    // Section
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },

    // Tools Grid
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    toolCard: {
        width: '48.5%', // Slightly less than 50% to account for any rounding
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        marginBottom: 12,
    },
    toolIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    toolText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
});
