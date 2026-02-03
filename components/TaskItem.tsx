import React, { useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { AppContext } from '../app/_layout';

/**
 * ==========================================
 * INTERFACES
 * ==========================================
 */
export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

/**
 * ==========================================
 * COMPONENT
 * ==========================================
 */
const TaskItem = ({ task, onToggle }: TaskItemProps) => {
  const { colors, themeMode } = useContext(AppContext);
  const isContrast = themeMode === 'high-contrast';

  return (
    <TouchableOpacity 
      onPress={() => onToggle(task.id)}
      style={[
        styles.taskRow, 
        { 
          backgroundColor: colors.card, 
          // In high contrast, we use a thicker border for visibility
          borderColor: isContrast ? colors.primary : colors.border,
          borderWidth: isContrast ? 2 : 1,
        }
      ]}
      activeOpacity={0.7}
    >
      {/* Icon Indicator */}
      {task.completed ? (
        <CheckCircle 
          size={24} 
          color={isContrast ? colors.success : colors.success} 
          fill={isContrast ? undefined : '#E0F2FE'} // Subtle fill for standard mode
        />
      ) : (
        <Circle size={24} color={colors.subText} />
      )}

      {/* Task Text */}
      <Text style={[
        styles.taskText, 
        { 
          color: task.completed ? colors.subText : colors.text,
          textDecorationLine: task.completed ? 'line-through' : 'none',
          fontWeight: isContrast ? 'bold' : '500' // Bolder text in accessibility mode
        }
      ]}>
        {task.title}
      </Text>
    </TouchableOpacity>
  );
};

export default TaskItem;

const styles = StyleSheet.create({
  taskRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    // Add shadow for better depth in standard mode
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskText: { 
    marginLeft: 12, 
    fontSize: 18,
    flex: 1 // Ensures text wraps if it's too long
  },
});