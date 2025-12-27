import {
    AlertTriangle,
    BedDouble,
    DoorOpen,
    Frown,
    GlassWater,
    HeartPulse,
    MessageCircle,
    Phone,
    Smile,
    Sun,
    ThumbsDown,
    ThumbsUp,
    Utensils
} from 'lucide-react-native';
import { Phrase } from './types';

// BUMPED VERSION TO v3 TO FORCE DATA REFRESH
export const STORAGE_KEY = 'voiceaid_phrases_v3';

export const PHRASE_CATEGORIES = [
    { id: 'needs', label: 'Basic Needs' },
    { id: 'health', label: 'Health & Urgent' },
    { id: 'emotions', label: 'Emotions' },
    { id: 'yesno', label: 'Yes / No' },
];

export const ICON_MAP: any = {
    'water': GlassWater,
    'food': Utensils,
    'rest': BedDouble,
    'toilet': DoorOpen,
    'pain': AlertTriangle,
    'doctor': HeartPulse,
    'help': Phone,
    'happy': Smile,
    'sad': Frown,
    'yes': ThumbsUp,
    'no': ThumbsDown,
    'custom': MessageCircle,
    'morning': Sun
};

export const DEFAULT_PHRASES: Phrase[] = [
    // 1. BASIC NEEDS
    {
        id: '1', category: 'needs', iconName: 'water',
        label: 'Water', labelTwi: 'Nsuo', labelGa: 'Nu',
        text: 'I need some water please.',
        textTwi: 'Mepa kyɛw, mehia nsuo.',
        textGa: 'Ofainɛ, mihe nu.'
    },
    {
        id: '2', category: 'needs', iconName: 'food',
        label: 'Food', labelTwi: 'Aduane', labelGa: 'Niyenii',
        text: 'I am hungry.',
        textTwi: 'Ɛkɔm de me.',
        textGa: 'Hɔmɔ miye mi.'
    },
    {
        id: '3', category: 'needs', iconName: 'rest',
        label: 'Rest', labelTwi: 'Ahomegye', labelGa: 'Hejɔɔmɔ',
        text: 'I need to rest now.',
        textTwi: 'Mehia sɛ megye m’ahome.',
        textGa: 'Mihe mi jɔɔ mi he.'
    },
    {
        id: '4', category: 'needs', iconName: 'toilet',
        label: 'Toilet', labelTwi: 'Tiafi', labelGa: 'Ya nɔ',
        text: 'I need to use the washroom.',
        textTwi: 'Mepɛ sɛ mekɔ tiafi.',
        textGa: 'Mihe mi ya nɔ.'
    },

    // 2. HEALTH / URGENT
    {
        id: '5', category: 'health', iconName: 'pain', color: '#EF4444',
        label: 'Pain', labelTwi: 'Ɛyɛ Ya', labelGa: 'Piing',
        text: 'I am in pain.',
        textTwi: 'Me ho yɛ me ya.',
        textGa: 'Mi he mi wa mi.'
    },
    {
        id: '6', category: 'health', iconName: 'doctor',
        label: 'Doctor', labelTwi: 'Dɔkta', labelGa: 'Dɔkita',
        text: 'Please call the doctor.',
        textTwi: 'Mepa kyɛw, frɛ dɔkta ma me.',
        textGa: 'Ofainɛ, tsɛ dɔkita kɛ ha mi.'
    },
    {
        id: '7', category: 'health', iconName: 'help', color: '#EF4444',
        label: 'Help', labelTwi: 'Boa Me', labelGa: 'Wa Mi',
        text: 'I need help immediately!',
        textTwi: 'Mepa kyɛw, boa me ntɛm!',
        textGa: 'Ofainɛ, wa mi amrɔ nɛɛ!'
    },

    // 3. EMOTIONS
    {
        id: '8', category: 'emotions', iconName: 'happy', color: '#10B981',
        label: 'Happy', labelTwi: 'Anigye', labelGa: 'Miishɛɛ',
        text: 'I am feeling good.',
        textTwi: 'Me ho tɔ me.',
        textGa: 'Mi he jɔ mi.'
    },
    {
        id: '9', category: 'emotions', iconName: 'sad',
        label: 'Sad', labelTwi: 'Awerɛho', labelGa: 'Awɛrɛho',
        text: 'I am not feeling well.',
        textTwi: 'Me ho nyɛ.',
        textGa: 'Mi he jɔɔɔ mi.'
    },

    // 4. YES / NO
    {
        id: '10', category: 'yesno', iconName: 'yes', color: '#10B981',
        label: 'Yes', labelTwi: 'Aane', labelGa: 'Hɛɛ',
        text: 'Yes.',
        textTwi: 'Aane.',
        textGa: 'Hɛɛ.'
    },
    {
        id: '11', category: 'yesno', iconName: 'no', color: '#EF4444',
        label: 'No', labelTwi: 'Daabi', labelGa: 'Dabi',
        text: 'No.',
        textTwi: 'Daabi.',
        textGa: 'Dabi.'
    },
];
