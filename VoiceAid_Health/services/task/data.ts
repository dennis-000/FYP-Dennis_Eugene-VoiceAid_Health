import { Task } from './types';

export const STORAGE_KEY = '@daily_tasks';

export const TASK_CATEGORIES = [
    { id: 'therapy', label: 'Speech Therapy', icon: 'activity', color: '#3B82F6' },
    { id: 'medication', label: 'Medication', icon: 'pill', color: '#EF4444' },
    { id: 'exercise', label: 'Exercise', icon: 'zap', color: '#10B981' },
    { id: 'routine', label: 'Daily Routine', icon: 'clock', color: '#F59E0B' },
];

export const DEFAULT_TASKS: Task[] = [
    {
        id: '1',
        title: 'Morning Speech Practice',
        description: 'Practice vowel sounds for 10 minutes',
        time: '09:00',
        icon: 'activity',
        category: 'therapy',
        completed: false,
        days: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
        id: '2',
        title: 'Take Morning Medication',
        description: 'Take prescribed medicine with water',
        time: '10:00',
        icon: 'pill',
        category: 'medication',
        completed: false,
        days: [0, 1, 2, 3, 4, 5, 6], // Every day
    },
    {
        id: '3',
        title: 'Afternoon Walk',
        description: 'Light exercise in the ward',
        time: '15:00',
        icon: 'zap',
        category: 'exercise',
        completed: false,
        days: [1, 2, 3, 4, 5],
    },
];
