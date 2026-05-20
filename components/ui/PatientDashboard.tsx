import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, BookOpen, Calendar, ChevronRight, ClipboardList, Dumbbell, Grid, HeartPulse, LogOut, Mic, Phone, Settings, Wand2 } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../../app/_layout';
import { useRole } from '../../contexts/RoleContext';
import { supabase } from '../../lib/supabase';
import { useT } from '../../utils/i18n';
import { DailyTip } from './DailyTip';
import { MoodCheckIn } from './MoodCheckIn';
import { TTSService } from '../../services/tts';
import { haptics } from '../../utils/haptics';

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
    const tr = useT(language as any);
    const [patientName, setPatientName] = useState<string>('Patient');
    const [patientCode, setPatientCode] = useState<string | null>(null);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [caregiverName, setCaregiverName] = useState<string | null>(null);

    // Scanning Engine State
    const { isScanningMode, ttsSpeed, ttsVoice } = useContext(AppContext);
    const [scanningIndex, setScanningIndex] = useState(-1);
    const [isScanningPaused, setIsScanningPaused] = useState(false);

    const scannerItems = [
        { id: 'transcript', route: '/transcript' },
        { id: 'phraseboard', route: '/phraseboard' },
        { id: 'symbol-speak', route: '/symbol-speak' },
        { id: 'journal', route: '/journal' },
        ...(patientType === 'hospital' ? [{ id: 'my-assignments', route: '/my-assignments' }] : []),
        { id: 'history', route: '/history' },
        { id: 'settings', route: '/settings' },
        { id: 'emergency-sos', route: '/emergency-sos' }
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isScanningMode && !isScanningPaused) {
            // Speak the first item immediately on enable
            announceItem(0);
            
            interval = setInterval(() => {
                if (!isScanningPaused) {
                    setScanningIndex((prev) => {
                        const next = (prev + 1) % scannerItems.length;
                        announceItem(next);
                        return next;
                    });
                }
            }, 3500); // 3.5 seconds to give time for TTS to speak safely
        } else if (!isScanningMode) {
            setScanningIndex(-1);
        }
        return () => clearInterval(interval);
    }, [isScanningMode, isScanningPaused, patientType, language, ttsSpeed, ttsVoice]);

    const announceItem = (index: number) => {
        const item = scannerItems[index];
        if (!item) return;
        
        const routeMap: any = {
            'transcript': tr('speakNow'),
            'phraseboard': tr('phraseBoard'),
            'symbol-speak': tr('symbolSpeak'),
            'journal': tr('voiceJournal'),
            'my-assignments': tr('myAssignments'),
            'history': tr('history'),
            'settings': tr('settings'),
            'emergency-sos': tr('emergencySOSTitle')
        };
        
        const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
        
        TTSService.speak(routeMap[item.id], language as any, { 
            speed: speedMapping[ttsSpeed] || 1.0, 
            gender: ttsVoice || 'female'
        }).catch(() => {});
    };

    const isHighlighted = (id: string) => isScanningMode && scannerItems[scanningIndex]?.id === id;

    const getHighlightStyle = (id: string) => {
        return isHighlighted(id) ? { borderColor: colors.primary, borderWidth: 4 } : {};
    };

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
                const pId = await AsyncStorage.getItem('@voiceaid_patient_id');
                if (pId) {
                    setPatientId(pId);
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
            tr('disconnectConfirmTitle'),
            tr('disconnectConfirmMessage'),
            [
                { text: tr('cancel'), style: "cancel" },
                {
                    text: tr('disconnectConfirmTitle'),
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
                        <Text style={[styles.welcomeText, { color: colors.subText, fontSize: 16 * scale }]}>{tr('welcomeBack')}</Text>
                        <Text style={[styles.nameText, { color: colors.text, fontSize: 32 * scale, fontWeight: '800' }]}>{patientName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                            <Text style={[styles.typeText, { color: colors.primary }]}>
                                {patientType === 'hospital' ? tr('hospitalPatient') : tr('guestPatient')}
                            </Text>
                        </View>
                        {patientCode && (
                            <View style={[styles.typeBadge, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                                <Text style={[styles.typeText, { color: colors.accent, fontWeight: '900', letterSpacing: 1.5 }]}>
                                    {patientCode}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Compact Language Selector at the Top */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
                    <View style={[styles.compactLanguageButtons, { backgroundColor: colors.border + '50' }]}>
                        {[{ code: 'en', label: 'English' }, { code: 'twi', label: 'Twi' }, { code: 'ga', label: 'Ga' }].map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                onPress={() => {
                                    haptics.selection();
                                    setLanguage(lang.code);
                                }}
                                style={[
                                    styles.compactLangButton,
                                    language === lang.code && [styles.compactLangButtonActive, { backgroundColor: colors.card }]
                                ]}
                            >
                                <Text style={[
                                    styles.compactLangText,
                                    language === lang.code && [styles.compactLangTextActive, { color: colors.primary }]
                                ]}>
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* My Caregiver Card */}
                {patientType === 'hospital' && (
                    <View style={[styles.caregiverCard, { backgroundColor: colors.card, borderColor: colors.border, shadowOpacity: colors.bg === '#111111' ? 0.3 : 0.05 }]}>
                        <View style={styles.caregiverCardRow}>
                            <View style={[styles.heartIconBadge, { backgroundColor: colors.danger + '15' }]}>
                                <HeartPulse size={24} color={colors.danger} strokeWidth={2.5} />
                            </View>
                            <View style={styles.caregiverContent}>
                                <Text style={[styles.caregiverLabel, { fontSize: 13 * scale, color: colors.subText }]}>{tr('myCaregiver')}</Text>
                                <Text style={[styles.caregiverValue, { color: colors.text, fontSize: 18 * scale, fontWeight: '700' }]}>
                                    {caregiverName ? caregiverName : tr('connectedHospital')}
                                </Text>
                            </View>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                        </View>
                    </View>
                )}

                {/* Mood Daily Check-In (Hospital patients only) */}
                {patientType === 'hospital' && (
                    <MoodCheckIn
                        patientId={patientId}
                        colors={colors}
                        language={language}
                        scale={scale}
                    />
                )}

                {/* Daily Tip (Guest patients only) */}
                {patientType === 'guest' && (
                    <DailyTip
                        colors={colors}
                        language={language}
                        scale={scale}
                    />
                )}

                {/* Primary Action - Speak Now */}
                <TouchableOpacity
                    onPress={() => {
                        haptics.medium();
                        router.push('/transcript');
                    }}
                    activeOpacity={0.85}
                    style={[styles.primaryCard, getHighlightStyle('transcript'), { shadowColor: colors.primary }]}
                >
                    <View style={[styles.primaryGradient, { backgroundColor: colors.primary }]}>
                        <View style={styles.primaryIconContainer}>
                            <Mic size={34} color={colors.bg === '#111111' ? '#111111' : '#FFFFFF'} strokeWidth={2.5} />
                        </View>
                        <View style={styles.primaryContent}>
                            <Text style={[styles.primaryTitle, { fontSize: 24 * scale, color: colors.bg === '#111111' ? '#111111' : '#FFFFFF', fontWeight: '800' }]}>{tr('speakNow')}</Text>
                            <Text style={[styles.primarySubtitle, { fontSize: 15 * scale, color: colors.bg === '#111111' ? 'rgba(17,17,17,0.8)' : 'rgba(255,255,255,0.9)' }]}>{tr('startTranscription')}</Text>
                        </View>
                        <ChevronRight size={28} color={colors.bg === '#111111' ? 'rgba(17,17,17,0.6)' : 'rgba(255,255,255,0.8)'} />
                    </View>
                </TouchableOpacity>

                {/* Patient Tools */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * scale }]}>{tr('myTools')}</Text>

                    <View style={styles.toolsGrid}>
                        {/* Phrase Board */}
                        <TouchableOpacity
                            onPress={() => {
                                haptics.selection();
                                router.push('/phraseboard');
                            }}
                            activeOpacity={0.8}
                            style={[styles.toolCard, getHighlightStyle('phraseboard'), { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: colors.accent + '15' }]}>
                                <Grid size={24} color={colors.accent} strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.toolText, { color: colors.text, fontSize: 15 * scale }]}>{tr('phraseBoard')}</Text>
                            <Text style={[styles.toolSubText, { fontSize: 12 * scale, color: colors.subText }]}>{tr('quickTTS')}</Text>
                        </TouchableOpacity>



                        {/* Symbol Speak (A4) */}
                        <TouchableOpacity
                            onPress={() => {
                                haptics.selection();
                                router.push('/symbol-speak');
                            }}
                            activeOpacity={0.8}
                            style={[styles.toolCard, getHighlightStyle('symbol-speak'), { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Wand2 size={24} color={colors.primary} strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.toolText, { color: colors.text, fontSize: 15 * scale }]}>{tr('symbolSpeak' as any) || 'Symbol Speak'}</Text>
                            <Text style={[styles.toolSubText, { fontSize: 12 * scale, color: colors.subText }]}>{tr('buildSentence' as any) || 'Tap pictures to talk'}</Text>
                        </TouchableOpacity>

                        {/* Voice Journal */}
                        <TouchableOpacity
                            onPress={() => {
                                haptics.selection();
                                router.push('/journal');
                            }}
                            activeOpacity={0.8}
                            style={[styles.toolCard, getHighlightStyle('journal'), { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: colors.primary + '15' }]}>
                                <BookOpen size={24} color={colors.primary} strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.toolText, { color: colors.text, fontSize: 15 * scale }]}>{tr('voiceJournal')}</Text>
                            <Text style={[styles.toolSubText, { fontSize: 12 * scale, color: colors.subText }]}>{tr('dailyRecording')}</Text>
                        </TouchableOpacity>

                        {/* My Assignments (Hospital only) */}
                        {patientType === 'hospital' && (
                            <TouchableOpacity
                                onPress={() => {
                                    haptics.selection();
                                    router.push('/my-assignments');
                                }}
                                activeOpacity={0.8}
                                style={[styles.toolCard, getHighlightStyle('my-assignments'), { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <View style={[styles.toolIcon, { backgroundColor: colors.accent + '15' }]}>
                                    <ClipboardList size={24} color={colors.accent} strokeWidth={2.5} />
                                </View>
                                <Text style={[styles.toolText, { color: colors.text, fontSize: 15 * scale }]}>{tr('assignments')}</Text>
                                <Text style={[styles.toolSubText, { fontSize: 12 * scale, color: colors.subText }]}>{tr('therapyExercises')}</Text>
                            </TouchableOpacity>
                        )}
                        {/* History */}
                        <TouchableOpacity
                            onPress={() => {
                                haptics.selection();
                                router.push('/history');
                            }}
                            activeOpacity={0.8}
                            style={[styles.toolCard, getHighlightStyle('history'), { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: colors.accent + '15' }]}>
                                <Activity size={24} color={colors.accent} strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.toolText, { color: colors.text, fontSize: 15 * scale }]}>{tr('history')}</Text>
                            <Text style={[styles.toolSubText, { fontSize: 12 * scale, color: colors.subText }]}>{tr('pastConversations')}</Text>
                        </TouchableOpacity>

                        {/* Settings */}
                        <TouchableOpacity
                            onPress={() => {
                                haptics.selection();
                                router.push('/settings');
                            }}
                            activeOpacity={0.8}
                            style={[styles.toolCard, getHighlightStyle('settings'), { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: colors.border + '30' }]}>
                                <Settings size={24} color={colors.subText} strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.toolText, { color: colors.text, fontSize: 15 * scale }]}>{tr('settings')}</Text>
                            <Text style={[styles.toolSubText, { fontSize: 12 * scale, color: colors.subText }]}>{tr('appPreferences')}</Text>
                        </TouchableOpacity>




                        {/* Exercise Trainer (Hospital only) */}
                        {patientType === 'hospital' && (
                            <TouchableOpacity
                                onPress={() => router.push('/exercise-trainer')}
                                activeOpacity={0.8}
                                style={styles.toolCard}
                            >
                                <View style={[styles.toolIcon, { backgroundColor: '#ecfdf5' }]}>
                                    <Dumbbell size={24} color="#10b981" strokeWidth={2} />
                                </View>
                                <Text style={styles.toolText}>{tr('exercises')}</Text>
                                <Text style={styles.toolSubText}>{tr('guidedTrainer')}</Text>
                            </TouchableOpacity>
                        )}




                        {/* Clinical Priority Alert (All Patients) */}
                        <TouchableOpacity
                            onPress={() => router.push('/emergency-sos')}
                            activeOpacity={0.8}
                            style={[styles.toolCard, { borderColor: '#fca5a5' }]}
                        >
                            <View style={[styles.toolIcon, { backgroundColor: '#fef2f2' }]}>
                                <Phone size={24} color="#ef4444" strokeWidth={2} />
                            </View>
                            <Text style={[styles.toolText, { color: '#ef4444' }]}>{tr('emergencySOSTitle')}</Text>
                            <Text style={styles.toolSubText}>{tr('callForHelpSub')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>



                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleDisconnect}
                    style={[styles.logoutButton, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}
                    activeOpacity={0.7}
                >
                    <LogOut size={20} color={colors.danger} />
                    <Text style={[styles.logoutText, { color: colors.danger }]}>
                        {patientType === 'hospital' ? tr('disconnectHospital') : tr('exitGuestMode')}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Visual Scanning Full-Screen Interceptor */}
            {isScanningMode && (
                <TouchableOpacity
                    style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: 'rgba(0,0,0,0)' }]}
                    activeOpacity={1}
                    onTouchStart={(e) => {
                        // If 2 or more fingers touch the screen, toggle pause/play
                        if (e.nativeEvent.touches.length >= 2) {
                            setIsScanningPaused(prev => !prev);
                        }
                    }}
                    onPress={() => {
                        // Only trigger if not paused
                        if (isScanningPaused) return;

                        const target = scannerItems[scanningIndex];
                        if (target) {
                            router.push(target.route as any);
                        }
                    }}
                />
            )}
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
