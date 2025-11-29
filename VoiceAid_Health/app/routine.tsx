import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native'; // Standardized to Lucide
import { AppContext } from './_layout';
import TaskItem, { Task } from '../components/TaskItem'; // Import custom component

/**
 * ==========================================
 * LOCAL COMPONENTS
 * ==========================================
 */
const Header = ({ title, onBack }: { title: string, onBack: () => void }) => {
  const { colors } = useContext(AppContext);
  return (
    <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 24 }} /> {/* Spacer for center alignment */}
    </View>
  );
};

/**
 * ==========================================
 * ROUTINE SCREEN
 * ==========================================
 */
export default function RoutineScreen() {
  const router = useRouter();
  const { colors } = useContext(AppContext);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('dailyTasks');
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        // Default tasks for the MVP
        const defaults = [
          { id: '1', title: 'Morning Speech Therapy', completed: false },
          { id: '2', title: 'Take Medication', completed: false },
          { id: '3', title: 'Afternoon Walk', completed: false },
        ];
        setTasks(defaults);
      }
    } catch (e) { 
      console.error("Failed to load tasks", e); 
    }
  };

  const toggleTask = async (id: string) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    try {
      await AsyncStorage.setItem('dailyTasks', JSON.stringify(newTasks));
    } catch (e) {
      console.error("Failed to save task status", e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Daily Care" onBack={() => router.back()} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionHeader, { color: colors.subText }]}>TODAYS TASKS</Text>
        
        {/* Render List using the new Component */}
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onToggle={toggleTask} 
          />
        ))}

        {/* Placeholder for Add Task functionality */}
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={() => Alert.alert("Coming Soon", "Caregiver task management will be added in Phase 3.")}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>+ Add New Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  sectionHeader: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    marginTop: 10, 
    letterSpacing: 1 
  },
  addButton: { 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    alignItems: 'center', 
    borderStyle: 'dashed',
    marginTop: 10
  },
  // Removed taskRow and taskText styles as they are now handled inside TaskItem.tsx
});