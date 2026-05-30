/**
 * ==========================================
 * MY PATIENTS SCREEN
 * ==========================================
 * Screen for therapists to view and manage their assigned patients
 */

import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useContext } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MyPatientsList } from '../components/ui/MyPatientsList';
import { PatientProfile, useAuth } from '../contexts/AuthContext';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

import KenteAccent from '../components/KenteAccent';

export default function MyPatientsScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const { therapistProfile } = useAuth();
    const tr = useT(language as any);

    const handlePatientSelect = (patient: PatientProfile) => {
        router.push({
            pathname: '/patient-detail',
            params: {
                id: patient.id,
                name: patient.full_name || 'Patient',
                type: patient.patient_type,
            }
        });
    };

    if (!therapistProfile) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.text }]}>
                        {tr('noTherapistProfile')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={{ backgroundColor: colors.bg }}>
                <View style={[styles.header, { borderBottomColor: 'transparent', height: 60, paddingHorizontal: 16, alignItems: 'center' }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {tr('myPatients')}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={{ paddingHorizontal: 16, marginTop: -4, marginBottom: 4 }}>
                    <KenteAccent />
                </View>
            </View>

            {/* Patient List */}
            <MyPatientsList
                therapistId={therapistProfile.id}
                colors={colors}
                onPatientSelect={handlePatientSelect}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
    },
});
