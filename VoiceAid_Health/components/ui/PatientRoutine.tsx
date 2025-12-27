import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import React, { useCallback, useContext, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppContext } from '../../app/_layout';
import { Task, TaskService } from '../../services/task';
import { TTSService } from '../../services/tts';
import { routineStyles as styles } from '../../styles/routine.styles';
import { TaskCard } from '../TaskCard';

export const PatientRoutine = () => {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = async () => {
        setLoading(true);
        const todaysTasks = await TaskService.getTodaysTasks();
        setTasks(todaysTasks);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadTasks();
        }, [])
    );

    const handleTaskPress = async (task: Task) => {
        const updated = await TaskService.toggleTask(task.id);
        // getTodaysTasks filters by today, toggleTask returns updated list.
        // We should filter the updated list to only show today's tasks again to be safe/consistent
        const todaysTasks = updated.filter(t => {
            const todayISO = new Date().toISOString().split('T')[0];
            // Logic from original routine.tsx:
            // If oneOff, match date. If recurring, match day index.
            // However, getTodaysTasks likely handles this standard logic.
            // For simplicity, we can just re-call getTodaysTasks or filter manually.
            // Let's filter manually similar to routine.tsx logic:
            if (t.specificDate) return t.specificDate === todayISO;
            return t.days.includes(new Date().getDay());
        });
        setTasks(todaysTasks);

        if (!task.completed) {
            TTSService.speak(`Completed: ${task.title}`, language as any);
        }
    };

    const handleSpeakTask = (task: Task) => {
        TTSService.speak(`${task.title}. ${task.description}`, language as any);
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Today's Routine</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Progress Card */}
                <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.progressTitle, { color: colors.text }]}>
                            Today's Progress
                        </Text>
                        <Text style={[styles.progressCount, { color: colors.primary }]}>
                            {completedCount} of {totalCount} completed
                        </Text>
                    </View>
                    <View style={[styles.progressCircle, { borderColor: colors.primary }]}>
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>
                            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                        </Text>
                    </View>
                </View>

                <View style={styles.tasksSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Tasks</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loadingState}>
                            <Text style={[styles.loadingText, { color: colors.subText }]}>Loading tasks...</Text>
                        </View>
                    ) : tasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Clock size={48} color={colors.subText} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>No tasks for today</Text>
                            <Text style={[styles.emptySubtext, { color: colors.subText }]}>Enjoy your day!</Text>
                        </View>
                    ) : (
                        tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                colors={colors}
                                onPress={handleTaskPress}
                                onSpeak={handleSpeakTask}
                                patients={[]} // Not needed for patient view
                                role="patient"
                                selectedDate={new Date()}
                            />
                        ))
                    )}
                </View>

                {/* Help Text */}
                <View style={[styles.helpCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.helpText, { color: colors.subText }]}>
                        💡 Tap any task to mark it as complete
                    </Text>
                    <Text style={[styles.helpText, { color: colors.subText }]}>
                        🔊 Tap the speaker icon to hear task details
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
