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
import React, { useContext, useEffect } from 'react';
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
import { TTSService } from '../services/tts';
import { useT } from '../utils/i18n';

const { width } = Dimensions.get('window');

// Reusable elegant African Kente design accent bar
const KenteAccent = () => (
    <View style={{ flexDirection: 'row', height: 6, width: '100%', overflow: 'hidden', borderRadius: 3, marginVertical: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => (
            <React.Fragment key={i}>
                <View style={{ flex: 1, backgroundColor: '#dc2626' }} />
                <View style={{ flex: 1, backgroundColor: '#eab308' }} />
                <View style={{ flex: 1, backgroundColor: '#22c55e' }} />
                <View style={{ flex: 1, backgroundColor: '#111111' }} />
            </React.Fragment>
        ))}
    </View>
);

export default function WelcomeScreen() {
    const router = useRouter();
    const { colors, language, ttsVoice, ttsSpeed } = useContext(AppContext);
    const { setRole } = useRole();
    const tr = useT(language as any);

    useEffect(() => {
        // Automatically welcome the user as soon as the screen renders
        setTimeout(() => {
            const textToSpeak = language === 'ga' 
                ? 'Nye he awaba. Oji helatsɛ aloo nɔɔnsi?' 
                : language === 'twi' 
                    ? 'Akwaaba! Wo yɛ ɔyarefoɔ anaa ohwɛfoɔ?' 
                    : 'Welcome to Voice Aid Health. Who will be using this app?';
            const langCode = language === 'twi' ? 'twi' : language === 'ga' ? 'ga' : 'en';        
                    
            const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
            TTSService.speak(textToSpeak, langCode as any, { 
                speed: speedMapping[ttsSpeed], 
                gender: ttsVoice 
            }).catch(() => {});
        }, 600); // 600ms buffer delay allows the visuals & JS Engine to breathe

        return () => {
            TTSService.stop().catch(() => {});
        };
    }, []);

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
                    <View style={[styles.logoCircle, { backgroundColor: colors.primary + '15' }]}>
                        <HeartPulse size={32} color={colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        VoiceAid Health
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.subText }]}>
                        {tr('voiceAidSub')}
                    </Text>
                    <KenteAccent />
                </View>

                {/* Role Selection Section */}
                <View style={styles.selectionSection}>
                    <Text style={[styles.promptText, { color: colors.text }]}>
                        {tr('whoUsing')}
                    </Text>

                    {/* Patient Button */}
                    <RoleSelectionButton
                        role="patient"
                        icon={User}
                        title={tr('iAmPatient')}
                        description={tr('patientDesc')}
                        themeColor={colors.primary}
                        onPress={() => handleRoleSelection('patient')}
                        colors={colors}
                    />

                    {/* Caregiver Button */}
                    <RoleSelectionButton
                        role="caregiver"
                        icon={HeartPulse}
                        title={tr('iAmCaregiver')}
                        description={tr('caregiverDesc')}
                        themeColor={colors.accent || '#FFD700'}
                        onPress={() => handleRoleSelection('caregiver')}
                        colors={colors}
                    />
                </View>

                {/* Info Footer */}
                <View style={styles.footer}>
                    <Sparkles size={16} color={colors.primary} />
                    <Text style={[styles.footerText, { color: colors.subText }]}>
                        {tr('changeAnytime')}
                    </Text>
                </View>

            </View>
        </SafeAreaView>
    );
}


