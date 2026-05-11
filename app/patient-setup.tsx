/**
 * ==========================================
 * PATIENT SETUP SCREEN
 * ==========================================
 * Allows patients to choose their type:
 * - Guest Patient (independent use)
 * - Hospital Patient (affiliated with organization)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, UserCircle } from 'lucide-react-native';
import React, { useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { RoleSelectionButton } from '../components/RoleSelectionButton';
import { useRole } from '../contexts/RoleContext';
import { welcomeStyles as styles } from '../styles/welcome.styles';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

export default function PatientSetupScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const { setRole, setPatientType } = useRole();
    const tr = useT(language as any);

    const handlePatientTypeSelection = async (type: 'guest' | 'hospital') => {
        if (type === 'hospital') {
            // Navigate to the invite code screen
            router.push('/hospital-connect');
        } else {
            // Clear any leftover hospital session data so guest mode is always clean
            await AsyncStorage.multiRemove([
                '@voiceaid_patient_name',
                '@voiceaid_patient_code',
                '@voiceaid_patient_id',
                '@voiceaid_last_mood_date',
            ]);
            // Set both role and patient type immediately for guest users
            await setRole('patient');
            await setPatientType(type);
            router.replace('/');
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.content}>

                {/* Back Button */}
                <TouchableOpacity
                    onPress={handleBack}
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
                    <View style={[styles.logoCircle, { backgroundColor: colors.primary + '15' }]}>
                        <UserCircle size={32} color={colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {tr('patientSetupTitle')}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.subText }]}>
                        {tr('howUseVoiceAid')}
                    </Text>
                </View>

                {/* Patient Type Selection */}
                <View style={styles.selectionSection}>
                    <Text style={[styles.promptText, { color: colors.text }]}>
                        {tr('choosePatientType')}
                    </Text>

                    {/* Guest Patient Button */}
                    <RoleSelectionButton
                        role="patient"
                        icon={UserCircle}
                        title={tr('useAsGuest')}
                        description={tr('useAsGuestDesc')}
                        themeColor={colors.primary}
                        onPress={() => handlePatientTypeSelection('guest')}
                        colors={colors}
                    />

                    {/* Hospital Patient Button */}
                    <RoleSelectionButton
                        role="patient"
                        icon={Building2}
                        title={tr('connectToHospitalTitle')}
                        description={tr('hospitalAffiliationDesc')}
                        themeColor="#8B5CF6"
                        onPress={() => handlePatientTypeSelection('hospital')}
                        colors={colors}
                    />
                </View>

                {/* Info Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.subText }]}>
                        {tr('changeAnytime')}
                    </Text>
                </View>

            </View>
        </SafeAreaView>
    );
}
