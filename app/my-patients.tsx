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
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { MyPatientsList } from '../components/ui/MyPatientsList';
import { PatientProfile, useAuth } from '../contexts/AuthContext';
import { AppContext } from './_layout';

export default function MyPatientsScreen() {
    const router = useRouter();
    const { colors } = useContext(AppContext);
    const { therapistProfile } = useAuth();

    const handlePatientSelect = (patient: PatientProfile) => {
        Alert.alert(
            patient.full_name || 'Patient',
            `Patient ID: ${patient.id}\nType: ${patient.patient_type}\nAdded: ${new Date(patient.created_at).toLocaleDateString()}`,
            [
                { text: 'OK' }
            ]
        );
    };

    if (!therapistProfile) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.text }]}>
                        No therapist profile found
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    My Patients
                </Text>
                <View style={{ width: 24 }} />
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
