/**
 * ==========================================
 * MY PATIENTS LIST COMPONENT
 * ==========================================
 * Displays list of patients assigned to a therapist
 */

import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, User, UserPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PatientProfile } from '../../contexts/AuthContext';
import { getTherapistPatients } from '../../services/profileService';

interface MyPatientsListProps {
    therapistId: string;
    colors: any;
    onPatientSelect?: (patient: PatientProfile) => void;
}

export const MyPatientsList: React.FC<MyPatientsListProps> = ({
    therapistId,
    colors,
    onPatientSelect
}) => {
    const router = useRouter();
    const [patients, setPatients] = useState<PatientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPatients();
    }, [therapistId]);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const data = await getTherapistPatients(therapistId);
            setPatients(data);
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPatients();
        setRefreshing(false);
    };

    const handlePatientPress = (patient: PatientProfile) => {
        if (onPatientSelect) {
            onPatientSelect(patient);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.subText }]}>
                    Loading patients...
                </Text>
            </View>
        );
    }

    if (patients.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
                    <UserPlus size={48} color={colors.subText} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Patients Yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                    You haven't been assigned any patients yet.
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.bg }]}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    My Patients
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
                    {patients.length} {patients.length === 1 ? 'patient' : 'patients'} assigned
                </Text>
            </View>

            {/* Patient Cards */}
            {patients.map((patient, index) => (
                <TouchableOpacity
                    key={patient.id}
                    style={[
                        styles.patientCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            marginTop: index === 0 ? 0 : 12
                        }
                    ]}
                    onPress={() => handlePatientPress(patient)}
                    activeOpacity={0.7}
                >
                    {/* Patient Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <User size={24} color={colors.primary} />
                    </View>

                    {/* Patient Info */}
                    <View style={styles.patientInfo}>
                        <Text style={[styles.patientName, { color: colors.text }]}>
                            {patient.full_name || 'Unnamed Patient'}
                        </Text>
                        <View style={styles.patientMeta}>
                            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.badgeText, { color: colors.primary }]}>
                                    {patient.patient_type === 'hospital' ? 'Hospital' : 'Guest'}
                                </Text>
                            </View>
                            {patient.hospital_id && (
                                <Text style={[styles.hospitalId, { color: colors.subText }]}>
                                    ID: {patient.hospital_id}
                                </Text>
                            )}
                        </View>
                        <Text style={[styles.patientDate, { color: colors.subText }]}>
                            <Calendar size={12} color={colors.subText} />
                            {' '}Added {new Date(patient.created_at).toLocaleDateString()}
                        </Text>
                    </View>

                    {/* Chevron */}
                    <ChevronRight size={20} color={colors.subText} />
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    header: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontSize: 16,
    },
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    patientMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    hospitalId: {
        fontSize: 12,
    },
    patientDate: {
        fontSize: 13,
        marginTop: 2,
    },
});
