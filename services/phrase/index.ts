import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PHRASES, ICON_MAP, PHRASE_CATEGORIES, STORAGE_KEY } from './data';
import { CategoryId, Phrase } from './types';

// Re-export specific items that consumers might need directly
export { CategoryId, ICON_MAP, Phrase, PHRASE_CATEGORIES };

export const PhraseService = {
    getPhrases: async (): Promise<Phrase[]> => {
        try {
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

    addPhrase: async (phrase: Omit<Phrase, 'id'> & { iconName?: string }) => {
        const newPhrase: Phrase = {
            ...phrase,
            id: Date.now().toString(),
            isCustom: true,
            iconName: phrase.iconName || 'custom'
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
    },

    updatePhrase: async (id: string, updates: Partial<Phrase>) => {
        const current = await PhraseService.getPhrases();
        const updated = current.map(p =>
            p.id === id ? { ...p, ...updates } : p
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    }
};
