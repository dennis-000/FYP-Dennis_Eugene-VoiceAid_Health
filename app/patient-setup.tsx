/**
 * ==========================================
 * PATIENT SETUP SCREEN
 * ==========================================
 * Allows patients to choose their type:
 * - Guest Patient (independent use)
 * - Hospital Patient (affiliated with organization)
 */

import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, UserCircle } from 'lucide-react-native';
import React, { useContext } from 'react';
import {
    SafeAreaView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { RoleSelectionButton } from '../components/RoleSelectionButton';
import { useRole } from '../contexts/RoleContext';
import { welcomeStyles as styles } from '../styles/welcome.styles';
import { AppContext } from './_layout';

export default function PatientSetupScreen() {
    const router = useRouter();
    const { colors } = useContext(AppContext);
    const { setRole, setPatientType } = useRole();

    const handlePatientTypeSelection = async (type: 'guest' | 'hospital') => {
        // Set both role and patient type
        await setRole('patient');
        await setPatientType(type);

        // Navigate to home screen which will redirect appropriately
        router.replace('/');
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
                    <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                        <UserCircle size={60} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Patient Setup
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.subText }]}>
                        How would you like to use VoiceAid?
                    </Text>
                </View>

                {/* Patient Type Selection */}
                <View style={styles.selectionSection}>
                    <Text style={[styles.promptText, { color: colors.text }]}>
                        Choose your patient type
                    </Text>

                    {/* Guest Patient Button */}
                    <RoleSelectionButton
                        role="patient"
                        icon={UserCircle}
                        title="Use as Guest"
                        description="Use the app independently without hospital affiliation"
                        themeColor={colors.primary}
                        onPress={() => handlePatientTypeSelection('guest')}
                        colors={colors}
                    />

                    {/* Hospital Patient Button */}
                    <RoleSelectionButton
                        role="patient"
                        icon={Building2}
                        title="Connect to Hospital"
                        description="I'm affiliated with a healthcare organization"
                        themeColor="#8B5CF6"
                        onPress={() => handlePatientTypeSelection('hospital')}
                        colors={colors}
                    />
                </View>

                {/* Info Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.subText }]}>
                        You can change this anytime in Settings
                    </Text>
                </View>

            </View>
        </SafeAreaView>
    );
}
