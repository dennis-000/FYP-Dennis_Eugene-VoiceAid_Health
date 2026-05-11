import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phrase, PhraseService } from '../services/phraseService';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../utils/i18n';
import { HistoryService } from '../services/historyService';


type Category = 'All' | 'Basic Needs' | 'Medical' | 'Social' | 'Custom';

// Default phrases with categories
const DEFAULT_PHRASES = [
    // Social
    { id: 'default-1',  category: 'Social',       text: 'Hello',        twi: 'Agoo',        ga: 'Ojekoo',    icon: 'hand-left',         color: '#3b82f6' },
    { id: 'default-7',  category: 'Social',       text: 'Yes',          twi: 'Aane',        ga: 'Hɛɛ',      icon: 'checkmark-circle',  color: '#22c55e' },
    { id: 'default-8',  category: 'Social',       text: 'No',           twi: 'Daabi',       ga: 'Daabi',     icon: 'close-circle',      color: '#ef4444' },
    { id: 'default-9',  category: 'Social',       text: 'Thank you',    twi: 'Medaase',     ga: 'Oyiwala',   icon: 'heart',             color: '#ec4899' },
    { id: 'default-13', category: 'Social',       text: 'Please',       twi: 'Mepa wo kyɛw', ga: 'Paai',   icon: 'hand-right',        color: '#8b5cf6' },
    { id: 'default-14', category: 'Social',       text: 'Goodbye',      twi: 'Nante yie',   ga: 'Ogbuoi',   icon: 'exit',              color: '#64748b' },

    // Basic Needs
    { id: 'default-2',  category: 'Basic Needs',  text: 'Water',        twi: 'Nsuo',        ga: 'Nyɔŋ',     icon: 'water',             color: '#0ea5e9' },
    { id: 'default-3',  category: 'Basic Needs',  text: 'Food',         twi: 'Aduane',      ga: 'Nyemi',    icon: 'fast-food',         color: '#f59e0b' },
    { id: 'default-5',  category: 'Basic Needs',  text: 'Toilet',       twi: 'Wia',         ga: 'Atswa',    icon: 'male',              color: '#8b5cf6' },
    { id: 'default-10', category: 'Basic Needs',  text: 'Sleep',        twi: 'Da',          ga: 'Hee',      icon: 'bed',               color: '#6366f1' },
    { id: 'default-15', category: 'Basic Needs',  text: 'Cold',         twi: 'Awɔ',         ga: 'Petee',    icon: 'snow',              color: '#06b6d4' },
    { id: 'default-16', category: 'Basic Needs',  text: 'Hot',          twi: 'Ehyew',       ga: 'Ke',       icon: 'flame',             color: '#f97316' },

    // Medical
    { id: 'default-6',  category: 'Medical',      text: 'Pain',         twi: 'Me yare',     ga: 'Obuu',     icon: 'medkit',            color: '#ef4444' },
    { id: 'default-4',  category: 'Medical',      text: 'Help',         twi: 'Boa me',      ga: 'Boa mi',   icon: 'alert-circle',      color: '#dc2626' },
    { id: 'default-11', category: 'Medical',      text: 'Doctor',       twi: 'Dɔkota',      ga: 'Dɔkɔta',   icon: 'medkit',            color: '#10b981' },
    { id: 'default-12', category: 'Medical',      text: 'Medicine',     twi: 'Adura',       ga: 'Adura',    icon: 'flask',             color: '#0d9488' },
    { id: 'default-17', category: 'Medical',      text: 'Call Nurse',   twi: 'Frɛ okyɛfa',  ga: 'Frɛ boa',  icon: 'call',              color: '#7c3aed' },
    { id: 'default-18', category: 'Medical',      text: 'Dizzy',        twi: 'Me ti repin', ga: 'Pebi',     icon: 'warning',           color: '#d97706' },
    { id: 'default-19', category: 'Medical',      text: 'Nausea',       twi: 'Me yafunu yare', ga: 'Yafunu', icon: 'sad',              color: '#92400e' },
    { id: 'default-20', category: 'Medical',      text: 'Happy',        twi: 'Me ani gye',  ga: 'Obiaa',    icon: 'happy',             color: '#f59e0b' },
];

const CATEGORIES: Category[] = ['All', 'Basic Needs', 'Medical', 'Social', 'Custom'];

export default function PhraseboardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, language, ttsSpeed, ttsVoice, isScanningMode } = useContext(AppContext);
    const { role } = useRole();
    const { therapistProfile } = useAuth();
    const tr = useT(language as any);
    
    // State
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [scanIndex, setScanIndex] = useState<number>(-1);
    const [customPhrases, setCustomPhrases] = useState<Phrase[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [scanType, setScanType] = useState<'categories' | 'phrases'>('categories');
    const [catScanIndex, setCatScanIndex] = useState<number>(-1);

    // Modal State
    const [isModalVisible, setModalVisible] = useState(false);
    const [newPhraseText, setNewPhraseText] = useState('');
    const [newPhraseTwi, setNewPhraseTwi] = useState('');
    const [newPhraseImageUri, setNewPhraseImageUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        loadPhrases();
        
        // Instantly kill any lingering Audio if the user backs out of Phraseboard
        return () => {
            TTSService.stop().catch(() => {});
        };
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
        const speedMapping = { slow: 0.8, normal: 1.0, fast: 1.2 };

        try {
            await TTSService.speak(textToSpeak, langCode as any, { speed: speedMapping[ttsSpeed], gender: ttsVoice });
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

    // ─── Image Picker ─────────────────────────────────────────────────────────
    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo library access to add a picture to this phrase.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setNewPhraseImageUri(result.assets[0].uri);
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

        // Upload image if one was picked
        let uploadedImageUrl: string | null = null;
        if (newPhraseImageUri && patientId) {
            setIsUploadingImage(true);
            uploadedImageUrl = await PhraseService.uploadPhraseImage(patientId, newPhraseImageUri);
            setIsUploadingImage(false);
        }

        let icon = 'chatbox-ellipses';
        let color = '#8b5cf6';
        const fallback = getMatchingIconAndColor(newPhraseText);
        icon = fallback.icon;
        color = fallback.color;

        const newPhrase = await PhraseService.addPhrase(
            patientId,
            therapistProfile.id,
            newPhraseText.trim(),
            newPhraseTwi.trim() || null,
            icon,
            color,
            uploadedImageUrl
        );

        setIsSaving(false);
        if (newPhrase) {
            setModalVisible(false);
            setNewPhraseText('');
            setNewPhraseTwi('');
            setNewPhraseImageUri(null);
            loadPhrases();
            setActiveCategory('Custom');
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

    useEffect(() => {
        let scannerInterval: NodeJS.Timeout;
        
        if (isScanningMode) {
            scannerInterval = setInterval(() => {
                if (scanType === 'categories') {
                    setCatScanIndex(prev => {
                        const next = (prev + 1) % CATEGORIES.length;
                        const cat = CATEGORIES[next];
                        
                        const catTranslKey = `cat${cat.replace(' ', '')}` as any;

                        // Announce Category
                        const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
                        TTSService.speak(tr(catTranslKey), language as any, { 
                            speed: speedMapping[ttsSpeed], 
                            gender: ttsVoice 
                        }).catch(() => {});
                        
                        return next;
                    });
                } else if (scanType === 'phrases' && filteredPhrases.length > 0) {
                    setScanIndex(prev => {
                        const next = (prev + 1) % filteredPhrases.length;
                        const phrase = filteredPhrases[next];
                        
                        // Fire auditory TTS locator
                        const textToSpeak = language === 'twi' ? (phrase.twi || phrase.text) : phrase.text;
                        const langCode = language === 'twi' ? 'twi' : 'en';
                        const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
                        
                        TTSService.speak(textToSpeak, langCode as any, { 
                            speed: speedMapping[ttsSpeed], 
                            gender: ttsVoice 
                        }).catch(() => {});
                        
                        return next;
                    });
                }
            }, 3500);
        } else {
            setScanIndex(-1);
            setCatScanIndex(-1);
            setScanType('categories');
        }

        return () => {
            if (scannerInterval) clearInterval(scannerInterval);
        };
    }, [isScanningMode, scanType, filteredPhrases.length, language, ttsSpeed, ttsVoice]);

    const getPhraseLabel = (phrase: any): string => {
        if (language === 'twi' && phrase.twi) return phrase.twi;
        if (language === 'ga' && phrase.ga) return phrase.ga;
        return phrase.text;
    };

    const getPhraseSubLabel = (phrase: any): string | null => {
        if (language === 'twi' && phrase.twi) return phrase.text;
        if (language === 'ga' && phrase.ga) return phrase.text;
        if (phrase.twi) return phrase.twi;
        return null;
    };

    const Header = () => (
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{tr('phraseBoardTitle')}</Text>
                <Text style={{ fontSize: 13, color: colors.subText }}>{tr('tapCardToSpeak')}</Text>
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
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveCategory(cat)}
                            style={[
                                styles.categoryTab,
                                activeCategory === cat && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                                catScanIndex === CATEGORIES.indexOf(cat) && { backgroundColor: '#facc1530', borderRadius: 8 }
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                { color: activeCategory === cat ? colors.primary : colors.subText },
                                activeCategory === cat && { fontWeight: 'bold' }
                            ]}>
                                {tr(`cat${cat.replace(' ', '')}` as any)}
                                {cat === 'Custom' && customPhrases.length > 0 && ` (${customPhrases.length})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Quick Phrases shortcut — no keyboard needed */}
                <TouchableOpacity
                    style={[styles.quickPhrasesBar, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
                    onPress={() => router.push('/quick-phrases')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="flash" size={20} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.quickPhrasesTitle, { color: colors.primary }]}>
                            {tr('quickPhrasesTitle')}
                        </Text>
                        <Text style={[styles.quickPhrasesSub, { color: colors.subText }]}>
                            {tr('quickPhrasesSub')}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>

                {/* Custom Phrase Controls (Caregiver Only) */}

                {role === 'caregiver' && patientId && (activeCategory === 'All' || activeCategory === 'Custom') && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, paddingHorizontal: 16 }}>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: colors.primary, flex: 1, shadowColor: colors.primary }]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Plus size={20} color={colors.bg === '#111111' ? '#111111' : '#FFFFFF'} />
                            <Text style={[styles.addBtnText, { color: colors.bg === '#111111' ? '#111111' : '#FFFFFF' }]}>{tr('customPhraseAdd')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredPhrases.length === 0 ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
                        <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
                        <Text style={{ color: colors.subText, fontSize: 16, marginTop: 16 }}>
                            {tr('noPhrasesCat')}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredPhrases.map((phrase, index) => {
                            const isSpeaking = speakingId === phrase.id;
                            const isCustom = (phrase as any).isCustom;
                            const isScanned = scanIndex === index;
                            
                            return (
                                <View key={phrase.id} style={styles.cardWrapper}>
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        style={[
                                            styles.card,
                                            { backgroundColor: colors.card, borderColor: colors.border + '50' },
                                            isSpeaking && {
                                                borderColor: phrase.color,
                                                backgroundColor: phrase.color + '15',
                                                transform: [{ scale: 0.98 }]
                                            },
                                            isScanned && { 
                                                borderColor: colors.accent, 
                                                borderWidth: 4, 
                                                backgroundColor: colors.accent + '15',
                                                transform: [{ scale: 1.03 }]
                                            }
                                        ]}
                                        onPress={() => handleSpeak(phrase)}
                                    >
                                        {/* Symbol: Real photo if available, else large AAC icon */}
                                        {(phrase as any).image_url ? (
                                            <Image
                                                source={{ uri: (phrase as any).image_url }}
                                                style={styles.phraseImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[
                                                styles.iconCircle,
                                                { backgroundColor: phrase.color + '12' },
                                                isSpeaking && { backgroundColor: phrase.color + '25' }
                                            ]}>
                                                <Ionicons name={phrase.icon as any} size={48} color={phrase.color} />
                                            </View>
                                        )}

                                        {/* Primary label */}
                                        <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={2}>
                                            {getPhraseLabel(phrase)}
                                        </Text>

                                        {/* Secondary (translation) label */}
                                        {getPhraseSubLabel(phrase) ? (
                                            <Text style={[styles.subText, { color: colors.subText }]} numberOfLines={1}>
                                                {getPhraseSubLabel(phrase)}
                                            </Text>
                                        ) : null}

                                        {/* Speaking indicator */}
                                        {isSpeaking && (
                                            <View style={[styles.speakingBadge, { backgroundColor: phrase.color }]}>
                                                <Text style={styles.speakingBadgeText}>🔊</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* Delete pill for caregiver */}
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
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Visual Scanning Action Overlay Button */}
            {isScanningMode && scanIndex !== -1 && (
                <View style={{ position: 'absolute', bottom: 30, left: 24, right: 24, zIndex: 100 }}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={{ backgroundColor: colors.primary, paddingVertical: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10 }}
                        onPress={() => {
                            if (scanType === 'categories') {
                                const cat = CATEGORIES[catScanIndex];
                                setActiveCategory(cat);
                                setScanType('phrases');
                                setScanIndex(-1);
                            } else if (filteredPhrases[scanIndex]) {
                                handleSpeak(filteredPhrases[scanIndex]);
                                // Reset to categories after speaking? Or stay in phrases?
                                // AAC best practice: Stay in phrases for a few seconds, then reset.
                            }
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {scanType === 'categories' ? tr('selectCategory') || 'Select Category' : tr('tapAnyToSelect')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Visual Back Button for Scanning Mode to reset to Category selection */}
            {isScanningMode && scanType === 'phrases' && (
                <TouchableOpacity 
                    onPress={() => setScanType('categories')}
                    style={{ position: 'absolute', top: 100, right: 20, zIndex: 100, backgroundColor: '#ef4444', padding: 12, borderRadius: 30 }}
                >
                    <Ionicons name="arrow-up" size={24} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Add Custom Phrase Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{tr('addCustomPhraseTitle')}</Text>

                        {/* Photo picker */}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 }}>
                            {tr('photoSymbolOptional')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
                            onPress={handlePickImage}
                            activeOpacity={0.8}
                        >
                            {newPhraseImageUri ? (
                                <Image source={{ uri: newPhraseImageUri }} style={styles.imagePreview} resizeMode="cover" />
                            ) : (
                                <View style={{ alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="image-outline" size={32} color={colors.subText} />
                                    <Text style={{ color: colors.subText, fontSize: 13 }}>{tr('tapToPickPhoto')}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {newPhraseImageUri && (
                            <TouchableOpacity onPress={() => setNewPhraseImageUri(null)} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>✕ {tr('removePhoto')}</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 }}>
                            {tr('englishTextLabel')}
                        </Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Call my daughter Mary"
                            placeholderTextColor={colors.subText}
                            value={newPhraseText}
                            onChangeText={setNewPhraseText}
                        />

                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 }}>
                            {tr('twiTranslationOptional')}
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
                                <Text style={{ color: colors.text, fontWeight: '600' }}>{tr('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleSaveNewPhrase}
                                disabled={isSaving || isUploadingImage}
                            >
                                {(isSaving || isUploadingImage) ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>
                                            {isUploadingImage ? tr('uploading') : tr('saving')}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>{tr('savePhrase')}</Text>
                                )}
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
    cardWrapper: {
        width: '48%',
        marginBottom: 16,
        position: 'relative',
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    speakingBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    speakingBadgeText: {
        fontSize: 14,
    },
    phraseImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 10,
    },
    imagePickerBtn: {
        height: 120,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },

    quickPhrasesBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    quickPhrasesTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    quickPhrasesSub: {
        fontSize: 12,
        marginTop: 2,
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
