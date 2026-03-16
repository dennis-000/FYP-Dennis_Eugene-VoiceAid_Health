import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Calendar, ChevronRight, Grid, HeartPulse, LogOut, Mic, Settings } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRole } from '../../contexts/RoleContext';
import { supabase } from '../../lib/supabase';

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
    const { setRole, setPatientType: setContextPatientType } = useRole();
    const [patientName, setPatientName] = useState<string>('Patient');
    const [caregiverName, setCaregiverName] = useState<string | null>(null);

    useEffect(() => {
        loadPatientData();
    }, []);

    const loadPatientData = async () => {
        try {
            const name = await AsyncStorage.getItem('@voiceaid_patient_name');
            if (name) setPatientName(name);

            if (patientType === 'hospital') {
                const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
                if (patientId) {
                    // Fetch caregiver info
                    const { data: patientData } = await supabase
                        .from('patient_profiles')
                        .select('assigned_therapist_id')
                        .eq('id', patientId)
                        .single();

                    if (patientData?.assigned_therapist_id) {
                        const { data: therapistData } = await supabase
                            .from('therapist_profiles')
                            .select('full_name, organization')
                            .eq('id', patientData.assigned_therapist_id)
                            .single();

                        if (therapistData) {
                            setCaregiverName(therapistData.full_name || therapistData.organization || 'Your Therapist');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading patient data:', error);
        }
    };

    const handleDisconnect = () => {
        Alert.alert(
            "Disconnect",
            "Are you sure you want to disconnect from your hospital? You will need an invite code to reconnect.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Disconnect",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem('@voiceaid_patient_id');
                        await AsyncStorage.removeItem('@voiceaid_patient_name');
                        await setRole('');
                        await setContextPatientType(null);
                        router.replace('/');
                    }
                }
            ]
        );
    };

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
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.nameText}>{patientName}</Text>
                    </View>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>
                            {patientType === 'hospital' ? 'Hospital Patient' : 'Guest Patient'}
                        </Text>
                    </View>
                </View>

                {/* My Caregiver Card */}
                {patientType === 'hospital' && (
                    <View style={styles.caregiverCard}>
                        <View style={styles.caregiverCardRow}>
                            <View style={styles.heartIconBadge}>
                                <HeartPulse size={24} color="#ec4899" strokeWidth={2} />
                            </View>
                            <View style={styles.caregiverContent}>
                                <Text style={styles.caregiverLabel}>My Caregiver</Text>
                                <Text style={styles.caregiverValue}>
                                    {caregiverName ? caregiverName : 'Connected to Hospital'}
                                </Text>
                            </View>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                        </View>
                    </View>
                )}

                {/* Primary Action - Speak Now */}
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
                            <Mic size={32} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                        <View style={styles.primaryContent}>
                            <Text style={styles.primaryTitle}>Speak Now</Text>
                            <Text style={styles.primarySubtitle}>Start live transcription</Text>
                        </View>
                        <ChevronRight size={24} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Patient Tools */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Tools</Text>

                    <View style={styles.toolsGrid}>
                        {/* Phrase Board */}
                        <TouchableOpacity
                            onPress={() => router.push('/phraseboard')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#eff6ff' }]}>
                                <Grid size={24} color="#3b82f6" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>Phrase Board</Text>
                            <Text style={styles.toolSubText}>Quick text-to-speech</Text>
                        </TouchableOpacity>

                        {/* Reminders (Hospital only) */}
                        {patientType === 'hospital' && (
                            <TouchableOpacity
                                onPress={() => router.push('/routine')}
                                activeOpacity={0.8}
                                style={styles.toolCard}
                            >
                                <View style={[styles.toolIcon, { backgroundColor: '#f0fdf4' }]}>
                                    <Calendar size={24} color="#22c55e" strokeWidth={2} />
                                </View>
                                <Text style={styles.toolText}>Reminders</Text>
                                <Text style={styles.toolSubText}>Daily tasks</Text>
                            </TouchableOpacity>
                        )}

                        {/* History */}
                        <TouchableOpacity
                            onPress={() => router.push('/history')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#fef3c7' }]}>
                                <Activity size={24} color="#f59e0b" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>History</Text>
                            <Text style={styles.toolSubText}>Past conversations</Text>
                        </TouchableOpacity>

                        {/* Settings */}
                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#f3f4f6' }]}>
                                <Settings size={24} color="#6b7280" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>Settings</Text>
                            <Text style={styles.toolSubText}>App preferences</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Language Map (Minimalist) */}
                <View style={styles.languageSection}>
                    <Text style={styles.sectionTitle}>App Language</Text>
                    <View style={styles.languageButtons}>
                        {[{ code: 'en', label: 'English' }, { code: 'twi', label: 'Twi' }, { code: 'ga', label: 'Ga' }].map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                onPress={() => setLanguage(lang.code)}
                                style={[
                                    styles.langButton,
                                    language === lang.code && styles.langButtonActive
                                ]}
                            >
                                <Text style={[
                                    styles.langText,
                                    language === lang.code && styles.langTextActive
                                ]}>
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleDisconnect}
                    style={styles.logoutButton}
                    activeOpacity={0.7}
                >
                    <LogOut size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>
                        {patientType === 'hospital' ? 'Disconnect from Hospital' : 'Exit Guest Mode'}
                    </Text>
                </TouchableOpacity>

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
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
        marginBottom: 8,
    },
    typeBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    typeText: {
        color: '#3b82f6',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // Caregiver Card
    caregiverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#fce7f3',
    },
    caregiverCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heartIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#fdf2f8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    caregiverContent: {
        flex: 1,
        marginLeft: 12,
    },
    caregiverLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 2,
    },
    caregiverValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 8,
    },

    // Primary Action
    primaryCard: {
        borderRadius: 16,
        marginBottom: 24,
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
        padding: 18,
    },
    primaryIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryContent: {
        flex: 1,
        marginLeft: 16,
    },
    primaryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    primarySubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },

    // Section
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },

    // Tools Grid
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    toolCard: {
        width: '48%',
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
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    toolText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    toolSubText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },

    // Language
    languageSection: {
        marginBottom: 32,
    },
    languageButtons: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 4,
    },
    langButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    langButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    langText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    langTextActive: {
        color: '#6366f1',
    },

    // Logout Button
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
        backgroundColor: '#fef2f2',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
});
