/**
 * ==========================================
 * WELCOME SCREEN - USER ROLE SELECTION
 * ==========================================
 * Accessible role selection for speech-impaired patients
 * Features:
 * - Large, touch-friendly buttons
 * - High contrast design
 * - Clear icons and labels
 * - Simple, intuitive flow
 */

import { useRouter } from 'expo-router';
import { HeartPulse, Sparkles, User } from 'lucide-react-native';
import React, { useContext } from 'react';
import {
    Dimensions,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoleSelectionButton } from '../components/RoleSelectionButton';
import { useRole } from '../contexts/RoleContext';
import { welcomeStyles as styles } from '../styles/welcome.styles';
import { AppContext } from './_layout';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();
    const { colors } = useContext(AppContext);
    const { setRole } = useRole();

    const handleRoleSelection = async (selectedRole: 'patient' | 'caregiver') => {
        if (selectedRole === 'patient') {
            // Navigate to patient setup for type selection (no auth required)
            router.push('/patient-setup');
        } else {
            // Caregivers must authenticate first
            router.push('/login');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.content}>

                {/* Logo/Title Section */}
                <View style={styles.headerSection}>
                    <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                        <HeartPulse size={60} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        VoiceAid Health
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.subText }]}>
                        Communication Made Easier
                    </Text>
                </View>

                {/* Role Selection Section */}
                <View style={styles.selectionSection}>
                    <Text style={[styles.promptText, { color: colors.text }]}>
                        Who will be using this app?
                    </Text>

                    {/* Patient Button */}
                    <RoleSelectionButton
                        role="patient"
                        icon={User}
                        title="I am a Patient"
                        description="I need help communicating"
                        themeColor={colors.primary}
                        onPress={() => handleRoleSelection('patient')}
                        colors={colors}
                    />

                    {/* Caregiver Button */}
                    <RoleSelectionButton
                        role="caregiver"
                        icon={HeartPulse}
                        title="I am a Caregiver"
                        description="I help patients communicate (requires account)"
                        themeColor="#10B981"
                        onPress={() => handleRoleSelection('caregiver')}
                        colors={colors}
                    />
                </View>

                {/* Info Footer */}
                <View style={styles.footer}>
                    <Sparkles size={16} color={colors.primary} />
                    <Text style={[styles.footerText, { color: colors.subText }]}>
                        You can change this anytime in Settings
                    </Text>
                </View>

            </View>
        </SafeAreaView>
    );
}


