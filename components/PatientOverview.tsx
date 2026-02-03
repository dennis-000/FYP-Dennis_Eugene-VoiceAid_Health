import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Patient } from '../services/patientService';
import { Task } from '../services/task';
import { routineStyles as styles } from '../styles/routine.styles';

interface PatientOverviewProps {
    patients: Patient[];
    tasks: Task[];
    viewPatientId: string | null;
    onPatientSelect: (id: string | null) => void;
    colors: any;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
    patients,
    tasks,
    viewPatientId,
    onPatientSelect,
    colors
}) => {
    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionHeaderTitle, { marginTop: 10, marginBottom: 15, fontSize: 18 }]}>Patient Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 10 }}>
                {/* 'All' Option */}
                <TouchableOpacity
                    onPress={() => onPatientSelect(null)}
                    style={{ alignItems: 'center', marginRight: 16, opacity: viewPatientId === null ? 1 : 0.6 }}
                >
                    <View style={{
                        width: 56, height: 56, borderRadius: 28,
                        backgroundColor: viewPatientId === null ? colors.primary : colors.card,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 2, borderColor: viewPatientId === null ? colors.primary : colors.border
                    }}>
                        <Text style={{ color: viewPatientId === null ? '#FFF' : colors.text, fontWeight: 'bold' }}>ALL</Text>
                    </View>
                    <Text style={{ marginTop: 8, fontSize: 12, color: colors.text, fontWeight: '600' }}>Overview</Text>
                </TouchableOpacity>

                {/* Patient List */}
                {patients.map(p => {
                    // Calculate Progress
                    const pTasks = tasks.filter(t => t.assignedTo?.includes(p.id));
                    const pCompleted = pTasks.filter(t => t.completed).length;
                    const pTotal = pTasks.length;
                    const pProgress = pTotal > 0 ? pCompleted / pTotal : 0;

                    const isSelected = viewPatientId === p.id;

                    return (
                        <TouchableOpacity
                            key={p.id}
                            onPress={() => onPatientSelect(isSelected ? null : p.id)}
                            style={{ alignItems: 'center', marginRight: 16, opacity: isSelected || viewPatientId === null ? 1 : 0.5 }}
                        >
                            <View style={{ position: 'relative' }}>
                                {/* Avatar */}
                                <View style={{
                                    width: 56, height: 56, borderRadius: 28,
                                    backgroundColor: p.avatarColor || colors.primary,
                                    alignItems: 'center', justifyContent: 'center',
                                    borderWidth: 2, borderColor: isSelected ? colors.text : 'transparent'
                                }}>
                                    <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold' }}>{p.name.charAt(0)}</Text>
                                </View>
                                {/* Progress Dot */}
                                {pTotal > 0 && (
                                    <View style={{
                                        position: 'absolute', bottom: -2, right: -2,
                                        backgroundColor: colors.card, borderRadius: 10, padding: 2
                                    }}>
                                        <View style={{
                                            width: 16, height: 16, borderRadius: 8,
                                            backgroundColor: pProgress === 1 ? colors.success : colors.subText,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Text style={{ fontSize: 9, color: '#FFF', fontWeight: 'bold' }}>{Math.round(pProgress * 100)}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                            <Text style={{ marginTop: 8, fontSize: 12, color: colors.text, fontWeight: '600' }}>{p.name.split(' ')[0]}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};
