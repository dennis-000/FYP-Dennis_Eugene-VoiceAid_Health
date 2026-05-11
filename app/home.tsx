import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaregiverDashboard } from '../components/ui/CaregiverDashboard';
import { PatientDashboard } from '../components/ui/PatientDashboard';
import { AppTour, shouldShowTour } from '../components/AppTour';
import { useRole } from '../contexts/RoleContext';
import { homeStyles as styles } from '../styles/index.styles';
import { haptics } from '../utils/haptics';
import { AppContext } from './_layout';

export default function HomeScreen() {
    const router = useRouter();
    const { colors, language, setLanguage, largeText } = useContext(AppContext);
    const { role, patientType } = useRole();
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        // Only show tour for patients on their first visit
        if (role === 'patient') {
            shouldShowTour().then(shouldShow => {
                if (shouldShow) setShowTour(true);
            });
        }
    }, [role]);

    // Translation helper (simplified for now)
    const t = {
        welcome: language === 'twi' ? 'Akwaaba' : language === 'ga' ? 'Wɔɛjɔɔmɔ' : 'Welcome',
        activeLang: language === 'twi' ? 'Kasa a Ɛwɔ Hɔ' : language === 'ga' ? 'Kasa Nɔ' : 'Active Language',
        systemReady: language === 'twi' ? 'System Yɛ Krado' : language === 'ga' ? 'System Lɛ Krado' : 'System Ready',
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {showTour && <AppTour onComplete={() => setShowTour(false)} colors={colors} />}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border + '50', backgroundColor: colors.card }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 4, height: 24, backgroundColor: colors.accent, borderRadius: 2 }} />
                        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20, letterSpacing: 0.5 }]}>
                            VOICEAID HEALTH
                        </Text>
                    </View>
                </View>

                {/* Patient Dashboard */}
                {role === 'patient' && (
                    <PatientDashboard
                        router={router}
                        colors={colors}
                        language={language}
                        setLanguage={setLanguage}
                        patientType={patientType}
                        largeText={largeText}
                    />
                )}

                {/* Caregiver Dashboard */}
                {role === 'caregiver' && (
                    <CaregiverDashboard
                        router={router}
                        colors={colors}
                        language={language}
                        setLanguage={setLanguage}
                        largeText={largeText}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
