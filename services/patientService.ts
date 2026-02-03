import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Patient {
    id: string;
    name: string;
    age: number;
    condition: string;
    roomNumber?: string;
    avatarColor?: string;
}

const STORAGE_KEY = '@voiceaid_patients';

const MOCK_PATIENTS: Patient[] = [
    {
        id: 'p1',
        name: 'Albert A.',
        age: 72,
        condition: 'Aphasia (Post-Stroke)',
        roomNumber: '101',
        avatarColor: '#3B82F6', // Blue
    },
    {
        id: 'p2',
        name: 'Grace O.',
        age: 65,
        condition: 'Dysarthria',
        roomNumber: '102',
        avatarColor: '#10B981', // Green
    },
    {
        id: 'p3',
        name: 'Kwame M.',
        age: 58,
        condition: 'Apraxia of Speech',
        roomNumber: '104',
        avatarColor: '#F59E0B', // Amber
    }
];

export const PatientService = {
    getPatients: async (): Promise<Patient[]> => {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            if (json) {
                return JSON.parse(json);
            }
            // Initialize with mock data if empty
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PATIENTS));
            return MOCK_PATIENTS;
        } catch (e) {
            console.error('Failed to load patients', e);
            return MOCK_PATIENTS;
        }
    },

    getPatientById: async (id: string): Promise<Patient | undefined> => {
        const patients = await PatientService.getPatients();
        return patients.find(p => p.id === id);
    }
};
