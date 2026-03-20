import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, BookOpen, Calendar, ChevronRight, ClipboardList, Grid, HeartPulse, LogOut, Mic, Settings } from 'lucide-react-native';
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
    largeText?: boolean;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
    router,
    colors,
    language,
    setLanguage,
    patientType,
    largeText = false
}) => {
    const { setRole, setPatientType: setContextPatientType } = useRole();
    const scale = largeText ? 1.25 : 1;
    const [patientName, setPatientName] = useState<string>('Patient');
    const [patientCode, setPatientCode] = useState<string | null>(null);
    const [caregiverName, setCaregiverName] = useState<string | null>(null);

    useEffect(() => {
        loadPatientData();
    }, []);

    const loadPatientData = async () => {
        try {
            const name = await AsyncStorage.getItem('@voiceaid_patient_name');
            if (name) setPatientName(name);
            const code = await AsyncStorage.getItem('@voiceaid_patient_code');
            if (code) setPatientCode(code);

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
                        await setRole(null);
                        await setContextPatientType(null);
                        router.replace('/');
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.welcomeText, { color: colors.subText, fontSize: 16 * scale }]}>Welcome back,</Text>
                        <Text style={[styles.nameText, { color: colors.text, fontSize: 28 * scale }]}>{patientName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeText}>
                                {patientType === 'hospital' ? 'Hospital Patient' : 'Guest Patient'}
                            </Text>
                        </View>
                        {patientCode && (
                            <View style={[styles.typeBadge, { backgroundColor: '#fdf4ff', borderColor: '#a855f7' }]}>
                                <Text style={[styles.typeText, { color: '#a855f7', fontWeight: '800', letterSpacing: 1 }]}>
                                    {patientCode}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Compact Language Selector at the Top */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <View style={styles.compactLanguageButtons}>
                        {[{ code: 'en', label: 'English' }, { code: 'twi', label: 'Twi' }, { code: 'ga', label: 'Ga' }].map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                onPress={() => setLanguage(lang.code)}
                                style={[
                                    styles.compactLangButton,
                                    language === lang.code && styles.compactLangButtonActive
                                ]}
                            >
                                <Text style={[
                                    styles.compactLangText,
                                    language === lang.code && styles.compactLangTextActive
                                ]}>
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* My Caregiver Card */}
                {patientType === 'hospital' && (
                    <View style={[styles.caregiverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.caregiverCardRow}>
                            <View style={styles.heartIconBadge}>
                                <HeartPulse size={24} color="#ec4899" strokeWidth={2} />
                            </View>
                            <View style={styles.caregiverContent}>
                                <Text style={[styles.caregiverLabel, { fontSize: 13 * scale }]}>My Caregiver</Text>
                                <Text style={[styles.caregiverValue, { color: colors.text, fontSize: 16 * scale }]}>
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
                            <Text style={[styles.primaryTitle, { fontSize: 22 * scale }]}>Speak Now</Text>
                            <Text style={[styles.primarySubtitle, { fontSize: 14 * scale }]}>Start live transcription</Text>
                        </View>
                        <ChevronRight size={24} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Patient Tools */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * scale }]}>My Tools</Text>

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
                            <Text style={[styles.toolText, { color: colors.text, fontSize: 15 * scale }]}>Phrase Board</Text>
                            <Text style={[styles.toolSubText, { fontSize: 12 * scale }]}>Quick text-to-speech</Text>
                        </TouchableOpacity>



                        {/* Voice Journal */}
                        <TouchableOpacity
                            onPress={() => router.push('/journal')}
                            activeOpacity={0.8}
                            style={styles.toolCard}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#f0fdfa' }]}>
                                <BookOpen size={24} color="#0d9488" strokeWidth={2} />
                            </View>
                            <Text style={styles.toolText}>Voice Journal</Text>
                            <Text style={styles.toolSubText}>Daily recording</Text>
                        </TouchableOpacity>

                        {/* My Assignments (Hospital only) */}
                        {patientType === 'hospital' && (
                            <TouchableOpacity
                                onPress={() => router.push('/my-assignments')}
                                activeOpacity={0.8}
                                style={styles.toolCard}
                            >
                                <View style={[styles.toolIcon, { backgroundColor: '#fdf4ff' }]}>
                                    <ClipboardList size={24} color="#a855f7" strokeWidth={2} />
                                </View>
                                <Text style={styles.toolText}>Assignments</Text>
                                <Text style={styles.toolSubText}>Therapy exercises</Text>
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

    // Compact Language
    compactLanguageButtons: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        padding: 4,
    },
    compactLangButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    compactLangButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    compactLangText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    compactLangTextActive: {
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
