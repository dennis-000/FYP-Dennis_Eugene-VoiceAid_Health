import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Activity, Calendar, ChevronRight, Copy, Globe, Grid, LayoutGrid, Mic, Settings, UserPlus, Users, AlertTriangle, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getLanguageFlag, getTranslationsSync, Language } from '../../services/translationService';
import { AnalyticsService } from '../../services/analyticsService';

interface CaregiverDashboardProps {
    router: any;
    colors?: any;
    language: string;
    setLanguage: (lang: string) => void;
    largeText?: boolean;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
    router,
    colors,
    language,
    setLanguage,
    largeText = false
}) => {
    const scale = largeText ? 1.25 : 1;
    const { therapistProfile, loadTherapistProfile, user } = useAuth();
    const t = getTranslationsSync(language as Language);
    const [livePatientCount, setLivePatientCount] = useState(0);
    const [activeEmergencies, setActiveEmergencies] = useState<{patientId: string, name: string}[]>([]);

    // Force real-time refresh whenever they view the dashboard
    useFocusEffect(
        useCallback(() => {
            const syncData = async () => {
                if (user?.id && therapistProfile?.id) {
                    await loadTherapistProfile(user.id);
                    // Dynamically fetch the absolute count of assigned patients to guarantee synchronization
                    const { getTherapistPatients } = await import('../../services/profileService');
                    const patients = await getTherapistPatients(therapistProfile.id);
                    setLivePatientCount(patients.length);
                    
                    // Fetch active emergencies
                    const patientIds = patients.map(p => p.id);
                    if (patientIds.length > 0) {
                        const emergencies = await AnalyticsService.getActiveEmergencies(patientIds);
                        const mappedEmergencies = emergencies.map(e => {
                            const p = patients.find(pat => pat.id === e.patientId);
                            return {
                                patientId: e.patientId,
                                name: p?.full_name || 'Unknown Patient'
                            };
                        });
                        setActiveEmergencies(mappedEmergencies);
                    }
                }
            };
            syncData();
            
            // Set up polling for emergencies every 10 seconds while focused
            const intervalId = setInterval(syncData, 10000);
            return () => clearInterval(intervalId);
        }, [user?.id, therapistProfile?.id])
    );

    const codeToCopy = therapistProfile?.invite_code || "GEN-1234";

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(codeToCopy);
        Alert.alert('Copied!', 'Patient Invite Code has been copied to your clipboard.');
    };
    
    const resolveEmergency = async (patientId: string) => {
        Alert.alert(
            "Resolve Emergency",
            "Are you sure you want to dismiss this patient's emergency alert?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Dismiss", style: "destructive", onPress: async () => {
                    await AnalyticsService.resolveEmergency(patientId, 'Therapist');
                    setActiveEmergencies(prev => prev.filter(e => e.patientId !== patientId));
                }}
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors?.bg }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Emergency Banners */}
                {activeEmergencies.map((emergency, idx) => (
                    <View key={`em-${emergency.patientId}-${idx}`} style={styles.emergencyBanner}>
                        <View style={styles.emergencyBannerContent}>
                            <AlertTriangle size={24} color="#fff" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.emergencyBannerTitle}>🚨 ACTIVE EMERGENCY</Text>
                                <Text style={styles.emergencyBannerText}>{emergency.name} needs immediate help!</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.emergencyResolveBtn} 
                            onPress={() => resolveEmergency(emergency.patientId)}
                        >
                            <Text style={styles.emergencyResolveText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.welcomeText, { color: colors?.subText || '#64748B', fontSize: 16 * scale }]}>{t.dashboard.welcome}</Text>
                        <Text style={[styles.nameText, { color: colors?.text || '#111111', fontSize: 32 * scale, fontWeight: '800' }]}>{therapistProfile?.full_name || 'Therapist'}</Text>
                    </View>
                    {therapistProfile?.organization && (
                        <View style={[styles.orgBadge, { backgroundColor: (colors?.primary || '#008000') + '15', borderColor: (colors?.primary || '#008000') + '30' }]}>
                            <Text style={[styles.orgText, { color: colors?.primary || '#008000' }]}>{therapistProfile.organization}</Text>
                        </View>
                    )}
                </View>

                {/* Language Selector */}
                <View style={[styles.card, { backgroundColor: colors?.card || '#FFFFFF', borderColor: colors?.border || '#E2E8F0' }]}>
                    <View style={styles.cardHeader}>
                        <Globe size={18} color={colors?.primary || '#008000'} />
                        <Text style={[styles.cardTitle, { color: colors?.text || '#111111' }]}>{t.language.select}</Text>
                    </View>
                    <View style={styles.languageButtons}>
                        {(['en', 'twi', 'ga'] as Language[]).map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                onPress={() => {
                                    setLanguage(lang);
                                }}
                                style={[
                                    styles.langButton,
                                    { borderColor: colors?.border || '#E2E8F0', backgroundColor: colors?.bg || '#FAFAFA' },
                                    language === lang && [styles.langButtonActive, { borderColor: colors?.primary || '#008000', backgroundColor: (colors?.primary || '#008000') + '10' }]
                                ]}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.langFlag}>{getLanguageFlag(lang)}</Text>
                                <Text style={[
                                    styles.langText,
                                    { color: colors?.subText || '#64748B' },
                                    language === lang && [styles.langTextActive, { color: colors?.primary || '#008000' }]
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
                    style={[styles.primaryCard, { shadowColor: colors?.primary || '#008000' }]}
                >
                    <View style={[styles.primaryGradient, { backgroundColor: colors?.primary || '#008000' }]}>
                        <View style={styles.primaryIconContainer}>
                            <Mic size={30} color={colors?.bg === '#111111' ? '#111111' : '#FFFFFF'} strokeWidth={2.5} />
                        </View>
                        <View style={styles.primaryContent}>
                            <Text style={[styles.primaryTitle, { fontSize: 24 * scale, color: colors?.bg === '#111111' ? '#111111' : '#FFFFFF', fontWeight: '800' }]}>{t.transcript.liveMode}</Text>
                            <Text style={[styles.primarySubtitle, { fontSize: 15 * scale, color: colors?.bg === '#111111' ? 'rgba(17,17,17,0.8)' : 'rgba(255,255,255,0.9)' }]}>{t.transcript.tapToSpeak}</Text>
                        </View>
                        <ChevronRight size={26} color={colors?.bg === '#111111' ? 'rgba(17,17,17,0.6)' : 'rgba(255,255,255,0.8)'} />
                    </View>
                </TouchableOpacity>

                {/* My Patients */}
                <TouchableOpacity
                    onPress={() => router.push('/my-patients')}
                    activeOpacity={0.8}
                    style={[styles.card, { backgroundColor: colors?.card || '#FFFFFF', borderColor: colors?.border || '#E2E8F0' }]}
                >
                    <View style={styles.cardRow}>
                        <View style={[styles.iconBadge, { backgroundColor: (colors?.accent || '#FFD700') + '15' }]}>
                            <Users size={24} color={colors?.accent || '#FFD700'} strokeWidth={2} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardLabel, { color: colors?.subText || '#64748B' }]}>{t.dashboard.myPatients}</Text>
                            <Text style={[styles.cardValue, { color: colors?.text || '#111111' }]}>{livePatientCount} {t.patients.assigned}</Text>
                        </View>
                        <ChevronRight size={20} color={colors?.subText || '#9ca3af'} />
                    </View>
                </TouchableOpacity>

                {/* Patient Invite Code */}
                <View style={[styles.card, { backgroundColor: colors?.card || '#FFFFFF', borderColor: colors?.border || '#E2E8F0' }]}>
                    <View style={styles.cardHeader}>
                        <UserPlus size={18} color={colors?.primary || '#008000'} />
                        <Text style={[styles.cardTitle, { color: colors?.text || '#111111' }]}>{t.dashboard.managementTools}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors?.subText || '#64748B', marginBottom: 12 }}>
                        {language === 'twi' 
                            ? 'Fa code yi ma wo ayarefoɔ ma wɔn nnya abusuabɔ wɔ wo dashboard so.' 
                            : language === 'ga' 
                                ? 'Hã ohela code nɛɛ koni amɛ app kɛ oyɔɔ tsɛ.'
                                : 'Share this 6-digit code with your patients to link their app to your dashboard.'}
                    </Text>
                    <View style={[styles.codeContainer, { backgroundColor: colors?.bg || '#FAFAFA' }]}>
                        <Text style={[styles.codeText, { color: colors?.text || '#111111' }]}>{codeToCopy}</Text>
                        <TouchableOpacity 
                            style={[styles.copyButton, { backgroundColor: colors?.primary || '#008000' }]} 
                            activeOpacity={0.7} 
                            onPress={copyToClipboard}
                        >
                            <Copy size={16} color={colors?.bg === '#111111' ? '#111111' : '#FFFFFF'} />
                            <Text style={[styles.copyButtonText, { color: colors?.bg === '#111111' ? '#111111' : '#FFFFFF' }]}>Copy</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors?.text, fontSize: 18 * scale }]}>{t.dashboard.quickActions}</Text>

                    <View style={styles.toolsGrid}>
                        <TouchableOpacity
                            onPress={() => router.push('/phraseboard')}
                            activeOpacity={0.8}
                            style={[styles.toolCard, { backgroundColor: colors?.card || '#FFFFFF', borderColor: colors?.border || '#E2E8F0' }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: (colors?.accent || '#FFD700') + '15' }]}>
                                <Grid size={24} color={colors?.accent || '#FFD700'} strokeWidth={2} />
                            </View>
                            <Text style={[styles.toolText, { color: colors?.text || '#111111', fontSize: 15 * scale }]}>{t.actions.phrases}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/history')}
                            activeOpacity={0.8}
                            style={[styles.toolCard, { backgroundColor: colors?.card || '#FFFFFF', borderColor: colors?.border || '#E2E8F0' }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: (colors?.primary || '#008000') + '15' }]}>
                                <Activity size={24} color={colors?.primary || '#008000'} strokeWidth={2} />
                            </View>
                            <Text style={[styles.toolText, { color: colors?.text || '#111111' }]}>{t.actions.history}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            activeOpacity={0.8}
                            style={[styles.toolCard, { backgroundColor: colors?.card || '#FFFFFF', borderColor: colors?.border || '#E2E8F0' }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: (colors?.border || '#E2E8F0') + '50' }]}>
                                <Settings size={24} color={colors?.subText || '#64748B'} strokeWidth={2} />
                            </View>
                            <Text style={[styles.toolText, { color: colors?.text || '#111111' }]}>{t.actions.settings}</Text>
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
    emergencyBanner: {
        backgroundColor: '#dc2626',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    emergencyBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    emergencyBannerTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    emergencyBannerText: {
        color: '#fca5a5',
        fontSize: 13,
        fontWeight: '600',
    },
    emergencyResolveBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 10,
    },
    emergencyResolveText: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 13,
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

    // Invite Code
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 4,
        paddingLeft: 16,
    },
    codeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        letterSpacing: 2,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366f1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    copyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
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
