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
import { ArrowLeft, Building2, RefreshCw, UserPlus, Volume2 } from 'lucide-react-native';
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
import { supabase } from '../lib/supabase';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';
import { TTSService } from '../services/tts';

type Mode = 'new' | 'returning';

export default function HospitalConnectScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const { setRole, setPatientType } = useRole();
    const tr = useT(language as any);

    const [mode, setMode] = useState<Mode>('new');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeakInstructions = async () => {
        setIsSpeaking(true);
        const text = mode === 'new' 
            ? `${tr('connectTitle')}. ${tr('newOrReturning')}. ${tr('firstTimeHint')}`
            : `${tr('connectTitle')}. ${tr('alreadyPatientHint')}`;
        
        try {
            await TTSService.speak(text, language as any);
        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(() => setIsSpeaking(false), 3000);
        }
    };

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

            // 3. Link patient to therapist's assigned list (CRITICAL for dashboard visibility)
            await assignPatientToTherapist(therapist.id, patient.id);

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <View style={[s.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                                <Building2 size={36} color={colors.primary} />
                            </View>
                            <TouchableOpacity 
                                onPress={handleSpeakInstructions}
                                style={[s.playCircle, { backgroundColor: isSpeaking ? colors.primary + '20' : colors.card, borderColor: colors.border }]}
                            >
                                <Volume2 size={24} color={isSpeaking ? colors.primary : colors.subText} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[s.title, { color: colors.text }]}>{tr('connectTitle')}</Text>
                        <Text style={[s.subtitle, { color: colors.subText }]}>
                            {tr('newOrReturning')}
                        </Text>
                    </View>

                    {/* Mode Tabs */}
                    <View style={[s.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity
                            style={[s.tab, mode === 'new' && { backgroundColor: colors.primary }]}
                            onPress={() => setMode('new')}
                        >
                            <UserPlus size={16} color={mode === 'new' ? '#fff' : colors.subText} />
                            <Text style={[s.tabText, { color: mode === 'new' ? '#fff' : colors.subText }]}>
                                {tr('newPatient')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.tab, mode === 'returning' && { backgroundColor: colors.primary }]}
                            onPress={() => setMode('returning')}
                        >
                            <RefreshCw size={16} color={mode === 'returning' ? '#fff' : colors.subText} />
                            <Text style={[s.tabText, { color: mode === 'returning' ? '#fff' : colors.subText }]}>
                                {tr('iHaveACode')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── NEW PATIENT FORM ── */}
                    {mode === 'new' && (
                        <View style={s.form}>
                            <View style={[s.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                                <Text style={{ color: colors.primary, fontSize: 13, lineHeight: 19 }}>
                                    {tr('firstTimeHint')}
                                </Text>
                            </View>

                            <Text style={[s.label, { color: colors.text }]}>{tr('fullNameLabel')}</Text>
                            <TextInput
                                style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="e.g. John Mensah"
                                placeholderTextColor={colors.subText}
                                value={fullName}
                                onChangeText={setFullName}
                                autoCorrect={false}
                            />

                            <Text style={[s.label, { color: colors.text }]}>{tr('therapistInviteCode')}</Text>
                            <TextInput
                                style={[s.input, s.codeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                placeholder="ABC123"
                                placeholderTextColor={colors.subText}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                                maxLength={8}
                            />

                            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleNewPatient} disabled={loading}>
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.primaryBtnText}>{tr('connectNow')}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── RETURNING PATIENT FORM ── */}
                    {mode === 'returning' && (
                        <View style={s.form}>
                            <View style={[s.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                                <Text style={{ color: colors.primary, fontSize: 13, lineHeight: 19 }}>
                                    {tr('alreadyPatientHint')}
                                </Text>
                            </View>

                            <Text style={[s.label, { color: colors.text }]}>{tr('yourPatientId')}</Text>
                            <TextInput
                                style={[s.input, s.codeInput, { backgroundColor: colors.card, borderColor: colors.primary, color: colors.primary, borderWidth: 1.5 }]}
                                placeholder="PAT-4829"
                                placeholderTextColor={colors.subText}
                                value={patientCode}
                                onChangeText={setPatientCode}
                                autoCapitalize="characters"
                                maxLength={8}
                            />
                            <Text style={{ color: colors.subText, fontSize: 12, marginTop: -8, marginBottom: 24 }}>
                                {tr('digitsHint')}
                            </Text>

                            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleReturningPatient} disabled={loading}>
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={s.primaryBtnText}>{tr('reconnect')}</Text>
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
    scroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 40, paddingBottom: 60 },
    backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 24, marginLeft: -8 },
    header: { alignItems: 'flex-start', marginBottom: 40 },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
    },
    title: { fontSize: 32, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, lineHeight: 24 },
    tabs: {
        flexDirection: 'row',
        borderRadius: 16,
        borderWidth: 1.5,
        overflow: 'hidden',
        marginBottom: 32,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    tabText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
    form: {},
    infoBox: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
    },
    label: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 10, opacity: 0.7 },
    input: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 20,
    },
    codeInput: {
        textAlign: 'center',
        letterSpacing: 6,
        fontSize: 24,
        fontWeight: '800',
    },
    primaryBtn: {
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    playCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginLeft: 16,
    }
});
