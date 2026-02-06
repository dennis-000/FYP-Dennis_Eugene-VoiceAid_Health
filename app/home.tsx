import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { CaregiverDashboard } from '../components/ui/CaregiverDashboard';
import { PatientDashboard } from '../components/ui/PatientDashboard';
import { useRole } from '../contexts/RoleContext';
import { homeStyles as styles } from '../styles/index.styles';
import { AppContext } from './_layout';

export default function HomeScreen() {
    const router = useRouter();
    const { colors, language, setLanguage } = useContext(AppContext);
    const { role, patientType } = useRole();

    // Translation helper (simplified for now)
    const t = {
        welcome: language === 'twi' ? 'Akwaaba' : language === 'ga' ? 'Wɔɛjɔɔmɔ' : 'Welcome',
        activeLang: language === 'twi' ? 'Kasa a Ɛwɔ Hɔ' : language === 'ga' ? 'Kasa Nɔ' : 'Active Language',
        systemReady: language === 'twi' ? 'System Yɛ Krado' : language === 'ga' ? 'System Lɛ Krado' : 'System Ready',
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        VoiceAid Health
                    </Text>
                    {role === 'caregiver' && (
                        <Text style={[styles.subtitle, { color: colors.subText }]}>
                            Caregiver Mode
                        </Text>
                    )}
                    {role === 'patient' && (
                        <Text style={[styles.subtitle, { color: colors.subText }]}>
                            {patientType === 'hospital' ? 'Hospital Patient' : 'Guest Mode'}
                        </Text>
                    )}
                </View>

                {/* Patient Dashboard */}
                {role === 'patient' && (
                    <PatientDashboard
                        router={router}
                        colors={colors}
                        language={language}
                        setLanguage={setLanguage}
                        patientType={patientType}
                    />
                )}

                {/* Caregiver Dashboard */}
                {role === 'caregiver' && (
                    <CaregiverDashboard
                        router={router}
                        t={t}
                        colors={colors}
                        language={language}
                        setLanguage={setLanguage}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
