import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TASKS, STORAGE_KEY, TASK_CATEGORIES } from './data';
import { Task } from './types';

export { Task, TASK_CATEGORIES };

export const TaskService = {
    /**
     * Get all tasks
     */
    getTasks: async (): Promise<Task[]> => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const tasks = JSON.parse(stored);
                // Migration: Ensure assignedTo is always an array
                return tasks.map((t: any) => ({
                    ...t,
                    assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : (t.assignedTo ? [t.assignedTo] : [])
                }));
            }

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
            return DEFAULT_TASKS;
        } catch (error) {
            console.error('[Tasks] Error loading:', error);
            return [];
        }
    },

    /**
     * Get today's tasks
     */
    getTodaysTasks: async (): Promise<Task[]> => {
        try {
            const tasks = await TaskService.getTasks();
            const today = new Date().getDay(); // 0-6

            return tasks.filter(task => task.days.includes(today));
        } catch (error) {
            console.error('[Tasks] Error getting todays tasks:', error);
            return [];
        }
    },

    /**
     * Toggle task completion
     */
    toggleTask: async (id: string, date?: string): Promise<Task[]> => {
        try {
            const tasks = await TaskService.getTasks();
            const targetDate = date || new Date().toISOString().split('T')[0];

            const updated = tasks.map(task => {
                if (task.id === id) {
                    const isCompleted = !task.completed;
                    const newHistory = { ...(task.history || {}) };

                    // If toggling for today (or no date specified), update main flag
                    if (targetDate === new Date().toISOString().split('T')[0]) {
                        newHistory[targetDate] = isCompleted;
                        return { ...task, completed: isCompleted, history: newHistory };
                    }

                    // Toggling past/future date
                    const wasCompletedDate = newHistory[targetDate] || false;
                    newHistory[targetDate] = !wasCompletedDate;
                    return { ...task, history: newHistory };
                }
                return task;
            });

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('[Tasks] Error toggling:', error);
            throw error;
        }
    },

    /**
     * Reset all tasks (run daily)
     */
    resetTasks: async (): Promise<Task[]> => {
        try {
            const tasks = await TaskService.getTasks();
            const reset = tasks.map(task => ({ ...task, completed: false }));

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
            return reset;
        } catch (error) {
            console.error('[Tasks] Error resetting:', error);
            return [];
        }
    },

    /**
     * Add task (for caregivers)
     */
    addTask: async (task: Omit<Task, 'id' | 'completed'>): Promise<Task[]> => {
        try {
            const tasks = await TaskService.getTasks();
            const newTask: Task = {
                ...task,
                id: Date.now().toString(),
                completed: false,
            };

            const updated = [...tasks, newTask];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('[Tasks] Error adding:', error);
            throw error;
        }
    },

    /**
     * Delete task
     */
    deleteTask: async (id: string): Promise<Task[]> => {
        try {
            const tasks = await TaskService.getTasks();
            const updated = tasks.filter(task => task.id !== id);

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('[Tasks] Error deleting:', error);
            throw error;
        }
    },

    /**
     * Update task (for caregivers)
     */
    updateTask: async (id: string, updates: Partial<Task>): Promise<Task[]> => {
        try {
            const tasks = await TaskService.getTasks();
            const updated = tasks.map(task =>
                task.id === id ? { ...task, ...updates } : task
            );

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('[Tasks] Error updating:', error);
            throw error;
        }
    },
};
