import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  GlassWater, Utensils, BedDouble, Activity, AlertTriangle, 
  Smile, Frown, ThumbsUp, ThumbsDown, MessageCircle, HeartPulse,
  Phone, DoorOpen, Sun
} from 'lucide-react-native';

export type CategoryId = 'needs' | 'health' | 'emotions' | 'yesno';

export interface Phrase {
  id: string;
  category: CategoryId;
  label: string;
  // Multilingual Texts
  text: string;     // English (Default)
  textTwi?: string; // Twi
  textGa?: string;  // Ga
  iconName: string; 
  color?: string;
  isCustom?: boolean;
}

const STORAGE_KEY = 'voiceaid_phrases_v2'; // Bumped version for new schema

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

const DEFAULT_PHRASES: Phrase[] = [
  // 1. BASIC NEEDS
  { 
    id: '1', category: 'needs', label: 'Water', iconName: 'water',
    text: 'I need some water please.', 
    textTwi: 'Mepa kyɛw, mehia nsuo.', 
    textGa: 'Ofainɛ, mihe nu.' 
  },
  { 
    id: '2', category: 'needs', label: 'Food', iconName: 'food',
    text: 'I am hungry.', 
    textTwi: 'Ɛkɔm de me.', 
    textGa: 'Hɔmɔ miye mi.' 
  },
  { 
    id: '3', category: 'needs', label: 'Rest', iconName: 'rest',
    text: 'I need to rest now.', 
    textTwi: 'Mehia sɛ megye m’ahome.', 
    textGa: 'Mihe mi jɔɔ mi he.' 
  },
  { 
    id: '4', category: 'needs', label: 'Toilet', iconName: 'toilet',
    text: 'I need to use the washroom.', 
    textTwi: 'Mepɛ sɛ mekɔ tiafi.', 
    textGa: 'Mihe mi ya nɔ.' 
  },

  // 2. HEALTH / URGENT
  { 
    id: '5', category: 'health', label: 'Pain', iconName: 'pain', color: '#EF4444',
    text: 'I am in pain.', 
    textTwi: 'Me ho yɛ me ya.', 
    textGa: 'Mi he mi wa mi.' 
  },
  { 
    id: '6', category: 'health', label: 'Doctor', iconName: 'doctor',
    text: 'Please call the doctor.', 
    textTwi: 'Mepa kyɛw, frɛ dɔkta ma me.', 
    textGa: 'Ofainɛ, tsɛ dɔkita kɛ ha mi.' 
  },
  { 
    id: '7', category: 'health', label: 'Help', iconName: 'help', color: '#EF4444',
    text: 'I need help immediately!', 
    textTwi: 'Mepa kyɛw, boa me ntɛm!', 
    textGa: 'Ofainɛ, wa mi amrɔ nɛɛ!' 
  },

  // 3. EMOTIONS
  { 
    id: '8', category: 'emotions', label: 'Happy', iconName: 'happy', color: '#10B981',
    text: 'I am feeling good.', 
    textTwi: 'Me ho tɔ me.', 
    textGa: 'Mi he jɔ mi.' 
  },
  { 
    id: '9', category: 'emotions', label: 'Sad', iconName: 'sad',
    text: 'I am not feeling well.', 
    textTwi: 'Me ho nyɛ.', 
    textGa: 'Mi he jɔɔɔ mi.' 
  },

  // 4. YES / NO
  { 
    id: '10', category: 'yesno', label: 'Yes', iconName: 'yes', color: '#10B981',
    text: 'Yes.', 
    textTwi: 'Aane.', 
    textGa: 'Hɛɛ.' 
  },
  { 
    id: '11', category: 'yesno', label: 'No', iconName: 'no', color: '#EF4444',
    text: 'No.', 
    textTwi: 'Daabi.', 
    textGa: 'Dabi.' 
  },
];

export const PhraseService = {
  getPhrases: async (): Promise<Phrase[]> => {
    try {
      // Clear old V1 data to force update to V2 (for development only)
      // await AsyncStorage.removeItem('voiceaid_phrases_v1'); 
      
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        return JSON.parse(json);
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PHRASES));
      return DEFAULT_PHRASES;
    } catch (e) {
      console.error("Failed to load phrases", e);
      return DEFAULT_PHRASES;
    }
  },

  addPhrase: async (phrase: Omit<Phrase, 'id' | 'iconName'>) => {
    const newPhrase: Phrase = { 
      ...phrase, 
      id: Date.now().toString(), 
      isCustom: true, 
      iconName: 'custom' 
    };
    
    const current = await PhraseService.getPhrases();
    const updated = [...current, newPhrase];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  deletePhrase: async (id: string) => {
    const current = await PhraseService.getPhrases();
    const updated = current.filter(p => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};