import { Activity, CheckCircle, Circle, Clock, Pill, Volume2, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Patient } from '../services/patientService';
import { Task, TASK_CATEGORIES } from '../services/task';
import { routineStyles as styles } from '../styles/routine.styles';

interface TaskCardProps {
    task: Task;
    colors: any;
    onPress: (task: Task) => void;
    onSpeak: (task: Task) => void;
    patients: Patient[];
    role: string | null;
    selectedDate: Date;
}

const ICON_MAP: Record<string, any> = {
    activity: Activity,
    pill: Pill,
    zap: Zap,
    clock: Clock,
};

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    colors,
    onPress,
    onSpeak,
    patients,
    role,
    selectedDate
}) => {
    const getCategoryData = (category: string) => {
        return TASK_CATEGORIES.find(c => c.id === category) || TASK_CATEGORIES[0];
    };

    const categoryData = getCategoryData(task.category);
    const IconComponent = ICON_MAP[categoryData.icon] || Clock;

    // Determine completion status based on date
    const dateISO = selectedDate.toISOString().split('T')[0];
    const isToday = dateISO === new Date().toISOString().split('T')[0];
    const isCompleted = task.history?.[dateISO] ?? (isToday ? task.completed : false);

    return (
        <TouchableOpacity
            style={[
                styles.taskCard,
                {
                    backgroundColor: colors.card,
                    borderColor: isCompleted ? colors.success : colors.border,
                    opacity: isCompleted ? 0.7 : 1,
                },
            ]}
            onPress={() => onPress(task)}
            activeOpacity={0.7}
        >
            {/* Checkbox */}
            <View style={styles.checkboxArea}>
                {isCompleted ? (
                    <CheckCircle size={32} color={colors.success} fill={colors.success + '20'} />
                ) : (
                    <Circle size={32} color={colors.border} />
                )}
            </View>

            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: categoryData.color + '20' }]}>
                <IconComponent size={24} color={categoryData.color} />
            </View>

            {/* Info */}
            <View style={styles.taskInfo}>
                <Text
                    style={[
                        styles.taskTitle,
                        {
                            color: colors.text,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                        },
                    ]}
                >
                    {task.title}
                </Text>
                <Text style={[styles.taskDescription, { color: colors.subText }]} numberOfLines={1}>
                    {task.description}
                </Text>
                <View style={styles.taskMeta}>
                    <Clock size={14} color={colors.subText} />
                    <Text style={[styles.taskTime, { color: colors.subText }]}>
                        {task.time}
                    </Text>
                    {role === 'caregiver' && task.assignedTo && task.assignedTo.length > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                            {/* Avatars */}
                            <View style={{ flexDirection: 'row' }}>
                                {task.assignedTo.slice(0, 3).map((pid) => {
                                    const p = patients.find(patient => patient.id === pid);
                                    return (
                                        <View key={pid} style={{
                                            width: 6, height: 6, borderRadius: 3,
                                            backgroundColor: p?.avatarColor || colors.primary,
                                            marginRight: 2
                                        }} />
                                    );
                                })}
                            </View>
                            <Text style={{ fontSize: 12, color: colors.subText, fontWeight: '500', marginLeft: 4 }}>
                                {task.assignedTo.length === 1
                                    ? patients.find(p => p.id === task.assignedTo![0])?.name
                                    : `${task.assignedTo.length} Patients`}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Speaker Icon */}
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation();
                    onSpeak(task);
                }}
                style={styles.speakerButton}
            >
                <Volume2 size={20} color={colors.primary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};
