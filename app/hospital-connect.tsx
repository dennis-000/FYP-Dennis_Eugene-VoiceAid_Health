import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ArrowLeft, Building2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { createPatientProfile } from '../services/profileService';
import { useRole } from '../contexts/RoleContext';
import { AppContext } from './_layout';
import { welcomeStyles as styles } from '../styles/welcome.styles';

export default function HospitalConnectScreen() {
    const router = useRouter();
    const { colors } = useContext(AppContext);
    const { setRole, setPatientType } = useRole();

    const [fullName, setFullName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        if (!fullName.trim() || !inviteCode.trim()) {
            Alert.alert('Missing Fields', 'Please enter your full name and the 6-digit invite code.');
            return;
        }

        setLoading(true);
        try {
            // 1. Verify the invite code belongs to a valid therapist
            const { data: therapistData, error: therapistError } = await supabase
                .from('therapist_profiles')
                .select('id, organization_id, organization_code')
                .eq('invite_code', inviteCode.toUpperCase().trim())
                .single();

            if (therapistError || !therapistData) {
                console.log("Supabase Error:", therapistError);
                Alert.alert('Invalid Code', 'The invite code you entered is not valid. Please check with your therapist.');
                setLoading(false);
                return;
            }

            // 2. Create Patient Profile
            const patient = await createPatientProfile(
                'hospital',
                undefined, // No user_id since they don't have an auth login
                fullName.trim(),
                therapistData.id,
                therapistData.organization_id // Optional: link to hospital
            );

            if (!patient) {
                throw new Error('Failed to create patient profile');
            }

            // 3. Save Patient ID locally so the device remembers them
            await AsyncStorage.setItem('@voiceaid_patient_id', patient.id);
            await AsyncStorage.setItem('@voiceaid_patient_name', patient.full_name || '');
            
            // 4. Update Role Context
            await setRole('patient');
            await setPatientType('hospital');
            
            // 5. Optionally, update the assigned_patients array for the therapist
            // (Handled automatically by the assignPatientToTherapist function if we use it, 
            // but for now, the therapist queries patients matching their ID)

            Alert.alert('Connected!', 'You are now connected to your therapist.');
            router.replace('/');

        } catch (error: any) {
            Alert.alert('Connection Error', error.message || 'An error occurred while connecting.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            position: 'absolute',
                            top: 20,
                            left: 20,
                            zIndex: 10,
                            padding: 10,
                        }}
                    >
                        <ArrowLeft size={28} color={colors.text} />
                    </TouchableOpacity>

                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <View style={[styles.logoCircle, { backgroundColor: '#8B5CF6' }]}>
                            <Building2 size={50} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.title, { color: colors.text, marginTop: 16 }]}>
                            Connect to Hospital
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.subText }]}>
                            Enter the code provided by your therapist or doctor.
                        </Text>
                    </View>

                    {/* Input Form */}
                    <View style={{ width: '100%', marginTop: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                            Full Name
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 16,
                                color: colors.text,
                                marginBottom: 20,
                            }}
                            placeholder="e.g. John Doe"
                            placeholderTextColor={colors.subText}
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                            Therapist Invite Code
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 20,
                                color: colors.text,
                                marginBottom: 32,
                                textAlign: 'center',
                                letterSpacing: 4,
                            }}
                            placeholder="6-DIGIT CODE"
                            placeholderTextColor={colors.subText}
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            autoCapitalize="characters"
                            maxLength={8}
                        />

                        {/* Connect Button */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#8B5CF6',
                                paddingVertical: 18,
                                borderRadius: 30,
                                alignItems: 'center',
                                shadowColor: '#8B5CF6',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 5,
                                flexDirection: 'row',
                                justifyContent: 'center',
                            }}
                            onPress={handleConnect}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                                    Connect
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
