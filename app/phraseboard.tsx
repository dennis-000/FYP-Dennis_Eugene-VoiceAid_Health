import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phrase, PhraseService } from '../services/phraseService';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';
import { HistoryService } from '../services/historyService';
import { VisionService } from '../services/visionService';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

type Category = 'All' | 'Basic Needs' | 'Medical' | 'Social' | 'Custom';

// Default phrases with categories
const DEFAULT_PHRASES = [
    // Social
    { id: 'default-1', category: 'Social', text: 'Hello', twi: 'Agoo', icon: 'hand-left', color: '#3b82f6' },
    { id: 'default-7', category: 'Social', text: 'Yes', twi: 'Aane', icon: 'checkmark-circle', color: '#22c55e' },
    { id: 'default-8', category: 'Social', text: 'No', twi: 'Daabi', icon: 'close-circle', color: '#ef4444' },
    { id: 'default-9', category: 'Social', text: 'Thank you', twi: 'Medaase', icon: 'heart', color: '#ec4899' },
    
    // Basic Needs
    { id: 'default-2', category: 'Basic Needs', text: 'Water', twi: 'Nsuo', icon: 'water', color: '#0ea5e9' },
    { id: 'default-3', category: 'Basic Needs', text: 'Food', twi: 'Aduane', icon: 'fast-food', color: '#f59e0b' },
    { id: 'default-5', category: 'Basic Needs', text: 'Toilet', twi: 'Wia', icon: 'male', color: '#8b5cf6' },
    { id: 'default-10', category: 'Basic Needs', text: 'Sleep', twi: 'Da', icon: 'bed', color: '#6366f1' },

    // Medical
    { id: 'default-6', category: 'Medical', text: 'Pain', twi: 'Me yare', icon: 'medkit', color: '#ef4444' },
    { id: 'default-4', category: 'Medical', text: 'Help', twi: 'Boa me', icon: 'alert-circle', color: '#dc2626' },
    { id: 'default-11', category: 'Medical', text: 'Doctor', twi: 'Dɔkota', icon: 'medkit', color: '#10b981' },
    { id: 'default-12', category: 'Medical', text: 'Cold', twi: 'Awɔ', icon: 'snow', color: '#06b6d4' },
];

const CATEGORIES: Category[] = ['All', 'Basic Needs', 'Medical', 'Social', 'Custom'];

export default function PhraseboardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, language } = useContext(AppContext);
    const { role } = useRole();
    const { therapistProfile } = useAuth();
    
    // State
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [customPhrases, setCustomPhrases] = useState<Phrase[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('All');

    // Modal State
    const [isModalVisible, setModalVisible] = useState(false);
    const [newPhraseText, setNewPhraseText] = useState('');
    const [newPhraseTwi, setNewPhraseTwi] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPhrases();
    }, [params.patientId]);

    const loadPhrases = async () => {
        setLoading(true);
        try {
            let targetPatientId = params.patientId as string;
            
            // If no ID via params, try local storage (meaning we are the patient)
            if (!targetPatientId) {
                targetPatientId = await AsyncStorage.getItem('@voiceaid_patient_id') || '';
            }

            if (targetPatientId) {
                setPatientId(targetPatientId);
                const phrases = await PhraseService.getPatientPhrases(targetPatientId);
                setCustomPhrases(phrases);
            }
        } catch (error) {
            console.error('Error loading custom phrases:', error);
        } finally {
            setLoading(false);
        }
    };

    // Keyword mapping for automatic icons
    const getMatchingIconAndColor = (text: string): { icon: string, color: string } => {
        const lowerText = text.toLowerCase();
        
        // Medical / Pain
        if (lowerText.includes('hurt') || lowerText.includes('pain') || lowerText.includes('ache') || lowerText.includes('sore')) return { icon: 'medkit', color: '#ef4444' };
        if (lowerText.includes('doctor') || lowerText.includes('nurse')) return { icon: 'medkit', color: '#10b981' };
        if (lowerText.includes('pill') || lowerText.includes('medicine')) return { icon: 'flask', color: '#6366f1' };
        
        // Basic Needs
        if (lowerText.includes('hungry') || lowerText.includes('eat') || lowerText.includes('food')) return { icon: 'fast-food', color: '#f59e0b' };
        if (lowerText.includes('thirsty') || lowerText.includes('drink') || lowerText.includes('water')) return { icon: 'water', color: '#0ea5e9' };
        if (lowerText.includes('toilet') || lowerText.includes('bathroom') || lowerText.includes('pee') || lowerText.includes('poop')) return { icon: 'male', color: '#8b5cf6' };
        if (lowerText.includes('sleep') || lowerText.includes('tired') || lowerText.includes('bed')) return { icon: 'bed', color: '#6366f1' };
        if (lowerText.includes('cold')) return { icon: 'snow', color: '#06b6d4' };
        if (lowerText.includes('hot')) return { icon: 'flame', color: '#f97316' };
        if (lowerText.includes('itch')) return { icon: 'hand-left', color: '#d946ef' };
        
        // Social / Family
        if (lowerText.includes('call') || lowerText.includes('phone')) return { icon: 'call', color: '#22c55e' };
        if (lowerText.includes('daughter') || lowerText.includes('son') || lowerText.includes('wife') || lowerText.includes('husband') || lowerText.includes('family')) return { icon: 'people-circle', color: '#ec4899' };
        if (lowerText.includes('thank')) return { icon: 'heart', color: '#ec4899' };
        if (lowerText.includes('love')) return { icon: 'heart', color: '#f43f5e' };

        // Default fallback
        return { icon: 'chatbox-ellipses', color: '#8b5cf6' };
    };

    const handleSpeak = async (phrase: any) => {
        setSpeakingId(phrase.id);
        const textToSpeak = language === 'twi' ? (phrase.twi || phrase.twi_translation || phrase.text) : phrase.text;
        const langCode = language === 'twi' ? 'twi' : 'en';

        const rate = ttsSpeed === 'slow' ? 0.75 : ttsSpeed === 'fast' ? 1.25 : 1.0;

        try {
            await TTSService.speak(textToSpeak, langCode as any, { rate });
            await HistoryService.saveTranscription({
                text: textToSpeak,
                detectedLanguage: langCode,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[Phraseboard] Error speaking or saving history:', error);
        } finally {
            setTimeout(() => setSpeakingId(null), 500);
        }
    };

    const handleScanObject = async () => {
        if (!VisionService.isConfigured()) {
            Alert.alert("Setup Required", "Please configure the Gemini API Key to use Vision Features.");
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to scan objects.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            base64: true,
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const base64Image = result.assets[0].base64;
            if (base64Image) {
                setLoading(true);
                try {
                    const aiResult = await VisionService.identifyObjectFromImage(base64Image);
                    if (aiResult && patientId && therapistProfile?.id) {
                        await PhraseService.addPhrase(
                            patientId,
                            therapistProfile.id,
                            aiResult.text,
                            aiResult.twi,
                            aiResult.icon,
                            aiResult.color
                        );
                        loadPhrases();
                        setActiveCategory('Custom');
                        Alert.alert("Success", `Added: "${aiResult.text}" (${aiResult.twi})`);
                    } else {
                        Alert.alert("Error", "Could not identify object. Please try again.");
                    }
                } catch (e) {
                    console.error("Vision Error:", e);
                    Alert.alert("Error", "Failed to process image.");
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleSaveNewPhrase = async () => {
        if (!newPhraseText.trim()) {
            Alert.alert("Missing Text", "Please enter the English phrase.");
            return;
        }
        if (!patientId) {
            Alert.alert("Error", "No patient selected.");
            return;
        }

        if (!therapistProfile?.id) {
            Alert.alert("Error", "Could not identify your therapist profile ID.");
            return;
        }

        setIsSaving(true);
        
        let icon = 'chatbox-ellipses';
        let color = '#8b5cf6';
        
        if (VisionService.isConfigured()) {
            const aiMatch = await VisionService.generateIconForPhrase(newPhraseText.trim());
            if (aiMatch) {
                icon = aiMatch.icon;
                color = aiMatch.color;
            } else {
                const fallback = getMatchingIconAndColor(newPhraseText);
                icon = fallback.icon;
                color = fallback.color;
            }
        } else {
            const fallback = getMatchingIconAndColor(newPhraseText);
            icon = fallback.icon;
            color = fallback.color;
        }

        const newPhrase = await PhraseService.addPhrase(
            patientId,
            therapistProfile.id,
            newPhraseText.trim(),
            newPhraseTwi.trim() || null,
            icon,
            color
        );

        setIsSaving(false);
        if (newPhrase) {
            setModalVisible(false);
            setNewPhraseText('');
            setNewPhraseTwi('');
            loadPhrases(); // Refresh list
            setActiveCategory('Custom'); // Switch to custom tab to see it
        } else {
            Alert.alert("Error", "Could not save custom phrase.");
        }
    };

    const handleDeletePhrase = (phraseId: string) => {
         Alert.alert(
            "Delete Phrase",
            "Are you sure you want to remove this custom phrase?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        await PhraseService.deletePhrase(phraseId);
                        loadPhrases();
                    } 
                }
            ]
        );
    };

    // Combine default and custom phrases
    const allPhrases = [
        ...DEFAULT_PHRASES,
        ...customPhrases.map(cp => ({
            id: cp.id,
            category: 'Custom',
            text: cp.text,
            twi: cp.twi_translation || '',
            icon: cp.icon,
            color: cp.color,
            isCustom: true
        }))
    ];

    // Filter phrases by active category
    const filteredPhrases = activeCategory === 'All' 
        ? allPhrases 
        : allPhrases.filter(p => p.category === activeCategory);

    const Header = () => (
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Phrase Board</Text>
                <Text style={{ fontSize: 13, color: colors.subText }}>Tap a card to speak</Text>
            </View>
            <View style={{ width: 40 }} />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <Header />

            {/* Category Tabs */}
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveCategory(cat)}
                            style={[
                                styles.categoryTab,
                                activeCategory === cat && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                { color: activeCategory === cat ? colors.primary : colors.subText },
                                activeCategory === cat && { fontWeight: 'bold' }
                            ]}>
                                {cat}
                                {cat === 'Custom' && customPhrases.length > 0 && ` (${customPhrases.length})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Custom Phrase Controls (Caregiver Only) */}
                {role === 'caregiver' && patientId && (activeCategory === 'All' || activeCategory === 'Custom') && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 16 }}>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: colors.primary, flex: 1 }]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Plus size={20} color="#fff" />
                            <Text style={styles.addBtnText}>Custom Phrase</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: '#10b981', flex: 1.2 }]}
                            onPress={handleScanObject}
                        >
                            <Camera size={20} color="#fff" />
                            <Text style={styles.addBtnText}>Scan Object</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredPhrases.length === 0 ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
                        <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
                        <Text style={{ color: colors.subText, fontSize: 16, marginTop: 16 }}>
                            No phrases in this category.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredPhrases.map((phrase) => {
                            const isSpeaking = speakingId === phrase.id;
                            const isCustom = (phrase as any).isCustom;
                            return (
                                <View key={phrase.id} style={{ width: '48%', marginBottom: 16 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[
                                            styles.card,
                                            { backgroundColor: colors.card, borderColor: colors.border },
                                            isSpeaking && { borderColor: phrase.color, backgroundColor: phrase.color + '10' }
                                        ]}
                                        onPress={() => handleSpeak(phrase)}
                                    >
                                        <View style={[styles.iconContainer, { backgroundColor: phrase.color + '15' }]}>
                                            <Ionicons name={phrase.icon as any} size={36} color={phrase.color} />
                                        </View>
                                        <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={2}>
                                            {language === 'twi' && phrase.twi ? phrase.twi : phrase.text}
                                        </Text>
                                        {phrase.twi ? (
                                            <View style={{ backgroundColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 }}>
                                                <Text style={[styles.subText, { color: colors.subText }]} numberOfLines={1}>
                                                    {language === 'twi' ? phrase.text : phrase.twi}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </TouchableOpacity>

                                    {/* Explicit Delete Button for Caregivers on Custom Phrases */}
                                    {role === 'caregiver' && isCustom && (
                                        <TouchableOpacity 
                                            style={[styles.deletePill, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
                                            onPress={() => handleDeletePhrase(phrase.id)}
                                        >
                                            <Ionicons name="trash" size={14} color="#ef4444" />
                                            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>DELETE</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add Custom Phrase Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Custom Phrase</Text>
                        
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 }}>
                            English Text *
                        </Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Call my daughter Mary"
                            placeholderTextColor={colors.subText}
                            value={newPhraseText}
                            onChangeText={setNewPhraseText}
                        />

                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 }}>
                            Twi Translation (Optional)
                        </Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Frɛ me babaa Mary"
                            placeholderTextColor={colors.subText}
                            value={newPhraseTwi}
                            onChangeText={setNewPhraseTwi}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: colors.border }]} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
                                onPress={handleSaveNewPhrase}
                                disabled={isSaving}
                            >
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save Phrase</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
        width: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    categoryScroll: {
        paddingHorizontal: 8,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 4,
    },
    categoryText: {
        fontSize: 15,
        fontWeight: '500',
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 40,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 15,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    card: {
        width: '100%',
        aspectRatio: 0.9,
        borderRadius: 20,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    deletePill: {
        position: 'absolute',
        top: -8,
        right: -8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    subText: {
        fontSize: 13,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modalBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    }
});
