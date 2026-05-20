import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Heart, Megaphone, Phone, ShieldAlert, MapPin, X } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { useT, t } from '../utils/i18n';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const MEDICAL_INFO_KEY = '@voiceaid_medical_info';

interface MedicalInfo {
    condition: string;
    allergies: string;
    bloodType: string;
    notes: string;
}

export default function ClinicalPriorityScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const { patientProfile, user } = useAuth();
    const tr = useT(language as any);

    const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
        condition: 'Speech Impairment (Non-verbal)',
        allergies: 'None reported',
        bloodType: 'Unknown',
        notes: ''
    });
    
    const [patientName, setPatientName] = useState('Unknown Patient');
    
    const [isAlerting, setIsAlerting] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [showMedicalModal, setShowMedicalModal] = useState(false);
    
    const pulseAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        loadData();
    }, [patientProfile]);

    const loadData = async () => {
        try {
            const medData = await AsyncStorage.getItem(MEDICAL_INFO_KEY);
            if (medData) setMedicalInfo(JSON.parse(medData));
            
            if (patientProfile?.full_name) {
                setPatientName(patientProfile.full_name);
            } else {
                const storedName = await AsyncStorage.getItem('@voiceaid_patient_name');
                if (storedName) {
                    setPatientName(storedName);
                } else if (user?.email) {
                    setPatientName(user.email.split('@')[0]);
                }
            }
        } catch {}
    };

    const handlePriorityAlert = async () => {
        setIsAlerting(true);
        
        // 1. Visual Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
            ])
        ).start();

        // 2. Get Location
        let currentLoc = null;
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                currentLoc = await Location.getCurrentPositionAsync({});
                setLocation(currentLoc);
            }
        } catch (e) {
            console.error('Location error', e);
        }

        // 3. Dashboard Alert (High Priority to Supabase)
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            console.log('[SOS] Attempting to send alert for patient:', patientId);
            
            if (patientId && patientId !== 'guest_user') {
                const { error } = await supabase.from('patient_analytics').insert({
                    patient_profile_id: patientId,
                    mode: 'CLINICAL_PRIORITY',
                    duration: 0,
                    word_count: 0,
                    message_count: 0,
                    language: language,
                    metadata: {
                        is_emergency: true,
                        latitude: currentLoc?.coords.latitude,
                        longitude: currentLoc?.coords.longitude,
                        status: 'High Priority Alert Triggered'
                    },
                    created_at: new Date().toISOString()
                });

                if (error) {
                    console.error('[SOS] Supabase Insert Error:', error);
                    // Fallback: If it fails, at least the voice is playing locally
                } else {
                    console.log('[SOS] Dashboard alert sent successfully!');
                }
            } else {
                console.warn('[SOS] No valid patient ID found for dashboard alert');
            }
        } catch (e) {
            console.error('[SOS] Failed to send dashboard alert:', e);
        }

        // 4. Voice for the Voiceless Broadcast
        const msgEn = t('clinicalAlertMsg', 'en').replace('{name}', patientName);
        const msgTwi = t('clinicalAlertMsg', 'twi').replace('{name}', patientName);
        const msgGa = t('clinicalAlertMsg', 'ga').replace('{name}', patientName);

        const playLoop = async () => {
            if (!isAlerting) return;
            try {
                await TTSService.speak(msgEn, 'en');
                await new Promise(r => setTimeout(r, 1000));
                await TTSService.speak(msgTwi, 'en'); 
                await new Promise(r => setTimeout(r, 1000));
                await TTSService.speak(msgGa, 'en');
                
                if (isAlerting) {
                    setTimeout(playLoop, 2000);
                }
            } catch {}
        };
        
        playLoop();
        setShowMedicalModal(true); 
    };

    const stopAlert = async () => {
        setIsAlerting(false);
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);

        // Notify dashboard that alert is resolved
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            if (patientId && patientId !== 'guest_user') {
                await supabase.from('patient_analytics').insert({
                    patient_profile_id: patientId,
                    mode: 'CLINICAL_RESOLVED',
                    duration: 0,
                    word_count: 0,
                    message_count: 0,
                    language: language,
                    metadata: { status: 'Alert Stopped by Patient' },
                    created_at: new Date().toISOString()
                });
                console.log('[SOS] Resolved event sent.');
            }
        } catch (e) {
            console.error('[SOS] Failed to send resolved event:', e);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{tr('emergencySOSTitle')}</Text>
                <TouchableOpacity onPress={() => setShowMedicalModal(true)}>
                    <Heart size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.alertContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            style={[styles.mainAlertBtn, isAlerting && styles.alertingBtn]}
                            onPress={isAlerting ? stopAlert : handlePriorityAlert}
                        >
                            {isAlerting ? <ShieldAlert size={64} color="#fff" /> : <Megaphone size={64} color="#fff" />}
                            <Text style={styles.alertBtnText}>{isAlerting ? tr('stopAlert') : 'ALERT'}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    
                    <View style={styles.priorityLabel}>
                        <ShieldAlert size={16} color="#ef4444" />
                        <Text style={styles.priorityText}>High Priority Response Mode</Text>
                    </View>

                    <Text style={[styles.alertHint, { color: colors.subText }]}>
                        {isAlerting ? 'Broadcasting voice & sending location...' : tr('callForHelpSub')}
                    </Text>
                </View>

                {location && (
                    <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <MapPin size={20} color={colors.primary} />
                        <Text style={[styles.locationText, { color: colors.text }]}>
                            Live Location Active: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                        </Text>
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.medicalSummaryCard, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}
                    onPress={() => setShowMedicalModal(true)}
                >
                    <AlertTriangle size={20} color="#ef4444" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontWeight: 'bold', color: '#b91c1c' }}>View Clinical Medical ID</Text>
                        <Text style={{ fontSize: 12, color: '#991b1b' }}>Personalized for {patientName}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.infoSection}>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
                    <Text style={[styles.infoText, { color: colors.subText }]}>
                        1. Broadcats your name and medical status via loudspeaker.{"\n"}
                        2. Sends your precise GPS location to your caregiver.{"\n"}
                        3. Triggers a High Priority alert on the therapist dashboard.
                    </Text>
                </View>
            </ScrollView>

            <Modal visible={showMedicalModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: '#fff' }]}>
                        
                        {/* Red Emergency Banner */}
                        <View style={styles.emergencyBanner}>
                            <ShieldAlert size={28} color="#fff" />
                            <Text style={styles.emergencyBannerText}>🚨 THIS PERSON NEEDS HELP</Text>
                        </View>

                        {/* Cannot Speak Notice */}
                        <View style={styles.cannotSpeakBox}>
                            <Text style={styles.cannotSpeakText}>
                                ⚠️ I cannot speak.{'\n'}Please call for help immediately.
                            </Text>
                        </View>

                        {/* Patient Name */}
                        <View style={styles.patientNameRow}>
                            <Text style={styles.patientNameLabel}>MY NAME IS</Text>
                            <Text style={styles.patientNameValue}>{patientName}</Text>
                        </View>

                        <View style={{ height: 24 }} />

                        {/* Action Buttons */}
                        <TouchableOpacity style={styles.emergencyCallBtn} onPress={() => Linking.openURL('tel:112')}>
                            <Phone size={20} color="#fff" />
                            <Text style={styles.emergencyCallText}>Call Emergency Services (112)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowMedicalModal(false)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function MedicalItem({ label, value }: { label: string, value: string }) {
    return (
        <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>{label}</Text>
            <Text style={styles.medicalValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scroll: { padding: 20 },
    alertContainer: { alignItems: 'center', marginVertical: 30 },
    mainAlertBtn: {
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: '#ef4444',
        alignItems: 'center', justifyContent: 'center',
        elevation: 15, shadowColor: '#ef4444', shadowOpacity: 0.5, shadowRadius: 20,
    },
    alertingBtn: { backgroundColor: '#b91c1c' },
    alertBtnText: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 10 },
    priorityLabel: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 6 },
    priorityText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' },
    alertHint: { marginTop: 10, fontSize: 14, textAlign: 'center' },
    locationCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20, gap: 10 },
    locationText: { fontSize: 13, fontWeight: '600' },
    medicalSummaryCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 30 },
    infoSection: { padding: 20, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.03)' },
    infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    infoText: { fontSize: 13, lineHeight: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalBox: { borderRadius: 24, overflow: 'hidden', maxHeight: '90%' },
    emergencyBanner: {
        backgroundColor: '#dc2626',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    emergencyBannerText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    cannotSpeakBox: {
        backgroundColor: '#fff7ed',
        borderBottomWidth: 1,
        borderBottomColor: '#fed7aa',
        padding: 16,
    },
    cannotSpeakText: { color: '#c2410c', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    patientNameRow: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    patientNameLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
    patientNameValue: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
    medicalScroll: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 8, maxHeight: 200 },
    medicalItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    medicalLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 4 },
    medicalValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    emergencyCallBtn: {
        backgroundColor: '#dc2626',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
    },
    emergencyCallText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    closeBtn: { alignItems: 'center', paddingBottom: 20 },
    closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
});
