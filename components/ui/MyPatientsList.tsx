/**
 * ==========================================
 * MY PATIENTS LIST COMPONENT
 * ==========================================
 * Displays list of patients assigned to a therapist
 */

import { useRouter } from 'expo-router';
import { Activity, Calendar, ChevronRight, MessageSquare, User, UserPlus } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import { useT } from '../../utils/i18n';
import { AppContext } from '../../app/_layout';
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
    const { language } = useContext(AppContext);
    const tr = useT(language as any);
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
                    {tr('loadingPatients')}
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
                    {tr('noPatientsYet')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                    {tr('noPatientsSubtitle')}
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
            {/* Patient Cards */}
            {patients.map((patient, index) => {
                const patientCode = (patient as any).patient_code;
                return (
                    <TouchableOpacity
                        key={patient.id}
                        style={[
                            styles.patientCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                marginTop: index === 0 ? 0 : 12,
                            }
                        ]}
                        onPress={() => handlePatientPress(patient)}
                        activeOpacity={0.7}
                    >
                        {/* Top Row: Avatar + Info + Code */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            {/* Avatar */}
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <User size={22} color={colors.primary} />
                            </View>

                            {/* Name & type */}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>
                                    {patient.full_name || tr('unnamedPatient')}
                                </Text>
                                <View style={[styles.badge, { backgroundColor: colors.primary + '15', alignSelf: 'flex-start', marginTop: 4 }]}>
                                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                                        {patient.patient_type === 'hospital' ? tr('hospitalBadge') : tr('guestBadge')}
                                    </Text>
                                </View>
                            </View>

                            {/* PAT Code — prominent top-right */}
                            {patientCode ? (
                                <View style={styles.patCodeBadge}>
                                    <Text style={styles.patCodeLabel}>{tr('patientIdLabel')}</Text>
                                    <Text style={styles.patCodeText}>{patientCode}</Text>
                                </View>
                            ) : (
                                <ChevronRight size={20} color={colors.subText} />
                            )}
                        </View>

                        {/* Divider */}
                        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 10 }} />

                        {/* Bottom Row: Date + Action Buttons */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.patientDate, { color: colors.subText }]}>
                                <Calendar size={12} color={colors.subText} />
                                {' '}{tr('addedDatePrefix')} {new Date(patient.created_at).toLocaleDateString()}
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {/* Phrases Button */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        router.push({ pathname: '/phraseboard', params: { patientId: patient.id } });
                                    }}
                                >
                                    <MessageSquare size={14} color="#3b82f6" />
                                    <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>{tr('phrasesBtn')}</Text>
                                </TouchableOpacity>

                                {/* History Button */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        router.push({ pathname: '/patient-history', params: { id: patient.id, name: patient.full_name || 'Patient' } });
                                    }}
                                >
                                    <Activity size={14} color={colors.primary} />
                                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>{tr('historyBtn')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
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
        fontSize: 12,
        marginTop: 2,
    },
    patCodeBadge: {
        alignItems: 'center',
        backgroundColor: '#fdf4ff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9d5ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        minWidth: 72,
    },
    patCodeLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#a855f7',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    patCodeText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#7c3aed',
        letterSpacing: 1.5,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
