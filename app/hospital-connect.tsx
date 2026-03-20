/**
 * ==========================================
 * HOSPITAL CONNECT SCREEN
 * ==========================================
 * Two modes:
 *   NEW PATIENT  → Name + Therapist Invite Code → creates a fresh profile
 *   RETURNING    → PAT-XXXX code → exact lookup → no duplicates ever
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, RefreshCw, UserPlus } from 'lucide-react-native';
import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole } from '../contexts/RoleContext';
import { createPatientProfile } from '../services/profileService';
import { NotificationService } from '../services/notificationService';
import { supabase } from '../lib/supabase';
import { AppContext } from './_layout';

type Mode = 'new' | 'returning';

export default function HospitalConnectScreen() {
    const router = useRouter();
    const { colors } = useContext(AppContext);
    const { setRole, setPatientType } = useRole();

    const [mode, setMode] = useState<Mode>('new');
    const [loading, setLoading] = useState(false);

    // NEW PATIENT fields
    const [fullName, setFullName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    // RETURNING PATIENT field
    const [patientCode, setPatientCode] = useState('');

    // ─── Bind this device to a found/created patient profile ───────────────
    const bindPatient = async (patient: any, isNew: boolean) => {
        await AsyncStorage.setItem('@voiceaid_patient_id', patient.id);
        await AsyncStorage.setItem('@voiceaid_patient_name', patient.full_name || '');
        await AsyncStorage.setItem('@voiceaid_patient_code', patient.patient_code || '');

        const hasPermission = await NotificationService.requestPermission();
        if (hasPermission) {
            await NotificationService.scheduleDailyAssignmentReminder(9, 0, patient.full_name || '');
        }

        await setRole('patient');
        await setPatientType('hospital');

        const title = isNew ? 'Connected! 🎉' : 'Welcome back! 👋';
        const msg = isNew
            ? `Hi ${patient.full_name}! You are now connected to your therapist.\nYour Patient ID is: ${patient.patient_code}`
            : `Hi ${patient.full_name}! Your assignments and phrases are ready.`;
        Alert.alert(title, msg);
        router.replace('/');
    };

    // ─── Mode A: New Patient ────────────────────────────────────────────────
    const handleNewPatient = async () => {
        if (!fullName.trim() || !inviteCode.trim()) {
            Alert.alert('Missing Fields', 'Please enter your full name and the therapist invite code.');
            return;
        }

        setLoading(true);
        try {
            // 1. Verify invite code
            const { data: therapist, error } = await supabase
                .from('therapist_profiles')
                .select('id, organization_id')
                .eq('invite_code', inviteCode.toUpperCase().trim())
                .single();

            if (error || !therapist) {
                Alert.alert('Invalid Code', 'That invite code is not valid. Please check with your therapist.');
                return;
            }

            // 2. Create a brand new patient profile (always — no name guessing)
            const patient = await createPatientProfile(
                'hospital',
                undefined,
                fullName.trim(),
                therapist.id,
                therapist.organization_id,
            );

            if (!patient) throw new Error('Could not create patient profile.');

            await bindPatient(patient, true);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Mode B: Returning Patient ──────────────────────────────────────────
    const handleReturningPatient = async () => {
        const code = patientCode.toUpperCase().trim();
        if (!code) {
            Alert.alert('Missing Code', 'Please enter your Patient ID (e.g. PAT-4829).');
            return;
        }
        // Accept "4829" without the prefix too
        const formattedCode = code.startsWith('PAT-') ? code : `PAT-${code}`;

        setLoading(true);
        try {
            const { data: patient, error } = await supabase
                .from('patient_profiles')
                .select('*')
                .eq('patient_code', formattedCode)
                .maybeSingle();

            if (error || !patient) {
                Alert.alert(
                    'Not Found',
                    `No patient found with ID "${formattedCode}".\n\nIf you are new, use the "New Patient" tab instead.`
                );
                return;
            }

            await bindPatient(patient, false);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                    {/* Back */}
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ArrowLeft size={26} color={colors.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={s.header}>
                        <View style={[s.iconCircle, { backgroundColor: '#8b5cf6' }]}>
                            <Building2 size={44} color="#fff" />
                        </View>
                        <Text style={[s.title, { color: colors.text }]}>Connect to Hospital</Text>
                        <Text style={[s.subtitle, { color: colors.subText }]}>
                            Are you new or returning?
                        </Text>
                    </View>

                    {/* Mode Tabs */}
                    <View style={[s.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity
                            style={[s.tab, mode === 'new' && { backgroundColor: '#8b5cf6' }]}
                            onPress={() => setMode('new')}
                        >
                            <UserPlus size={16} color={mode === 'new' ? '#fff' : colors.subText} />
                            <Text style={[s.tabText, { color: mode === 'new' ? '#fff' : colors.subText }]}>
                                New Patient
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.tab, mode === 'returning' && { backgroundColor: '#8b5cf6' }]}
                            onPress={() => setMode('returning')}
                        >
                            <RefreshCw size={16} color={mode === 'returning' ? '#fff' : colors.subText} />
                            <Text style={[s.tabText, { color: mode === 'returning' ? '#fff' : colors.subText }]}>
                                I Have a Code
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── NEW PATIENT FORM ── */}
                    {mode === 'new' && (
                        <View style={s.form}>
                            <View style={[s.infoBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                                <Text style={{ color: '#1d4ed8', fontSize: 13, lineHeight: 19 }}>
                                    👋 First time? Enter your name and the <Text style={{ fontWeight: '700' }}>6-character invite code</Text> given by your therapist to get started.
                                </Text>
                            </View>

                            <Text style={[s.label, { color: colors.text }]}>Full Name</Text>
                            <TextInput
                                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="e.g. John Mensah"
                                placeholderTextColor={colors.subText}
                                value={fullName}
                                onChangeText={setFullName}
                                autoCorrect={false}
                            />

                            <Text style={[s.label, { color: colors.text }]}>Therapist Invite Code</Text>
                            <TextInput
                                style={[s.input, s.codeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="ABC123"
                                placeholderTextColor={colors.subText}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                                maxLength={8}
                            />

                            <TouchableOpacity style={s.primaryBtn} onPress={handleNewPatient} disabled={loading}>
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.primaryBtnText}>Connect Now</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── RETURNING PATIENT FORM ── */}
                    {mode === 'returning' && (
                        <View style={s.form}>
                            <View style={[s.infoBox, { backgroundColor: '#fdf4ff', borderColor: '#e9d5ff' }]}>
                                <Text style={{ color: '#7c3aed', fontSize: 13, lineHeight: 19 }}>
                                    🔄 Already a patient? Enter your <Text style={{ fontWeight: '700' }}>Patient ID</Text> (e.g. PAT-4829) shown on your profile. This reconnects you on any device without creating a duplicate.
                                </Text>
                            </View>

                            <Text style={[s.label, { color: colors.text }]}>Your Patient ID</Text>
                            <TextInput
                                style={[s.input, s.codeInput, { backgroundColor: colors.card, borderColor: '#a855f7', color: '#7c3aed', borderWidth: 1.5 }]}
                                placeholder="PAT-4829"
                                placeholderTextColor={colors.subText}
                                value={patientCode}
                                onChangeText={setPatientCode}
                                autoCapitalize="characters"
                                maxLength={8}
                            />
                            <Text style={{ color: colors.subText, fontSize: 12, marginTop: -8, marginBottom: 24 }}>
                                You can enter just the 4 digits (e.g. 4829) or the full code PAT-4829
                            </Text>

                            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#7c3aed' }]} onPress={handleReturningPatient} disabled={loading}>
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.primaryBtnText}>Reconnect</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, padding: 24, paddingTop: 16 },
    backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 16 },
    header: { alignItems: 'center', marginBottom: 28 },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
    subtitle: { fontSize: 15 },
    tabs: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
    },
    tabText: { fontSize: 14, fontWeight: '700' },
    form: {},
    infoBox: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        marginBottom: 20,
    },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    codeInput: {
        textAlign: 'center',
        letterSpacing: 4,
        fontSize: 22,
        fontWeight: '800',
    },
    primaryBtn: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
