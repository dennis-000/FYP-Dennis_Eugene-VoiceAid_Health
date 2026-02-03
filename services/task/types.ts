export interface Task {
    id: string;
    title: string;
    description: string;
    time: string; // HH:MM format
    icon: string;
    category: 'therapy' | 'medication' | 'exercise' | 'routine';
    completed: boolean;
    days: number[]; // 0-6 (Sun-Sat)

    // Reminder settings
    reminderEnabled?: boolean;
    reminderFormats?: {
        voice: boolean;    // Play audio reminder
        text: boolean;     // Show text notification
        visual: boolean;   // Show icon/visual alert
    };

    // Management
    createdBy?: 'patient' | 'caregiver';
    assignedTo?: string[]; // Patient IDs
    history?: { [date: string]: boolean }; // YYYY-MM-DD -> completed
    specificDate?: string; // Optional: ISO Date (YYYY-MM-DD) for one-off tasks
}
