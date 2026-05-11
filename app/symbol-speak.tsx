import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, X } from 'lucide-react-native';
import React, { useContext, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TTSService } from '../services/tts';
import { useT } from '../utils/i18n';
import { AppContext } from './_layout';

type SymbolItem = {
    id: string;
    text: string;
    twi: string;
    ga: string;
    icon: string;
    color: string;
};

// ── Data ─────────────────────────────────────────────────────────────
const SUBJECTS: SymbolItem[] = [
    { id: 's1', text: 'I', twi: 'Me', ga: 'Mi', icon: 'person', color: '#3b82f6' },
    { id: 's2', text: 'You', twi: 'Wo', ga: 'Bo', icon: 'person-add', color: '#8b5cf6' },
    { id: 's3', text: 'Nurse', twi: 'Okyɛfa', ga: 'N\u0254\u0254nsi', icon: 'medkit', color: '#10b981' },
    { id: 's4', text: 'Doctor', twi: 'D\u0254kota', ga: 'D\u0254k\u0254ta', icon: 'medkit', color: '#0ea5e9' },
    { id: 's5', text: 'Family', twi: 'Abusua', ga: 'Weku', icon: 'people', color: '#f59e0b' },
];

const VERBS: SymbolItem[] = [
    { id: 'v1', text: 'want', twi: 'pɛ', ga: 'tao\u0254', icon: 'hand-right', color: '#ec4899' },
    { id: 'v2', text: 'need', twi: 'hia', ga: 'hia', icon: 'alert-circle', color: '#ef4444' },
    { id: 'v3', text: 'feel', twi: 'te nka', ga: 'nu\u0254 he', icon: 'heart', color: '#f43f5e' },
    { id: 'v4', text: 'am', twi: 'yɛ', ga: 'ji', icon: 'body', color: '#6366f1' },
    { id: 'v5', text: 'have', twi: 'wɔ', ga: 'yɛ', icon: 'briefcase', color: '#8b5cf6' },
    { id: 'v6', text: 'like', twi: 'pɛ', ga: 'sum\u0254\u0254', icon: 'thumbs-up', color: '#22c55e' },
];

const OBJECTS: SymbolItem[] = [
    { id: 'o1', text: 'water', twi: 'nsuo', ga: 'ny\u0254\u014b', icon: 'water', color: '#0ea5e9' },
    { id: 'o2', text: 'food', twi: 'aduane', ga: 'niyeni', icon: 'fast-food', color: '#f59e0b' },
    { id: 'o3', text: 'sleep', twi: 'nna', ga: 'w\u0254', icon: 'bed', color: '#6366f1' },
    { id: 'o4', text: 'help', twi: 'mmoa', ga: 'yelik\u025bbuam\u0254', icon: 'medkit', color: '#ef4444' },
    { id: 'o5', text: 'pain', twi: 'yaw', ga: 'hela', icon: 'warning', color: '#dc2626' },
    { id: 'o6', text: 'bathroom', twi: 'wia', ga: 'n\u0254yaa', icon: 'male-female', color: '#8b5cf6' },
    { id: 'o7', text: 'happy', twi: 'anigye', ga: 'miish\u025b\u025b', icon: 'happy', color: '#22c55e' },
    { id: 'o8', text: 'medicine', twi: 'adura', ga: 'tsufa', icon: 'flask', color: '#0d9488' },
];

export default function SymbolSpeakScreen() {
    const router = useRouter();
    const { colors, language, ttsSpeed, ttsVoice } = useContext(AppContext);
    const tr = useT(language as any);
    
    const [sentence, setSentence] = useState<SymbolItem[]>([]);
    const [activeTab, setActiveTab] = useState<'subject' | 'verb' | 'object'>('subject');
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        return () => {
            TTSService.stop().catch(() => {});
        };
    }, []);

    const getLabel = (item: SymbolItem) => {
        if (language === 'twi') return item.twi;
        if (language === 'ga') return item.ga;
        return item.text;
    };

    const handleSelect = (item: SymbolItem) => {
        setSentence(prev => [...prev, item]);
        
        // Provide instantaneous Auditory feedback!
        const speedMapping = { slow: 0.8, normal: 1.0, fast: 1.2 };
        TTSService.speak(getLabel(item), language as any, { 
            speed: speedMapping[ttsSpeed], 
            gender: ttsVoice 
        }).catch(() => {});

        // Auto advance tabs based on natural sentence flow
        if (activeTab === 'subject') setActiveTab('verb');
        else if (activeTab === 'verb') setActiveTab('object');
    };

    const handleRemoveLast = () => {
        setSentence(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setSentence([]);
        setActiveTab('subject');
    };

    const handleSpeak = async () => {
        if (sentence.length === 0) return;
        setIsSpeaking(true);
        const textToSpeak = sentence.map(getLabel).join(' ');
        
        const speedMapping = { slow: 0.8, normal: 1.0, fast: 1.2 };
        try {
            await TTSService.speak(textToSpeak, language as any, { speed: speedMapping[ttsSpeed], gender: ttsVoice });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSpeaking(false);
        }
    };

    const currentList = activeTab === 'subject' ? SUBJECTS : activeTab === 'verb' ? VERBS : OBJECTS;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {tr('symbolSpeak')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Sentence Builder Area */}
            <View style={[styles.builderArea, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.sentenceRow}>
                    {sentence.length === 0 ? (
                        <Text style={[styles.emptySentence, { color: colors.subText }]}>
                            {tr('buildSentence')}
                        </Text>
                    ) : (
                        <View style={styles.sentenceChips}>
                            {sentence.map((item, index) => (
                                <View key={index} style={[styles.chip, { backgroundColor: item.color + '20', borderColor: item.color }]}>
                                    <Ionicons name={item.icon as any} size={16} color={item.color} style={{ marginRight: 6 }} />
                                    <Text style={[styles.chipText, { color: colors.text }]}>{getLabel(item)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Controls */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        onPress={handleClear}
                        style={[styles.controlBtn, { backgroundColor: colors.border }]}
                        disabled={sentence.length === 0}
                    >
                        <Text style={{ color: colors.text, fontWeight: '600' }}>{tr('clearSentence')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleRemoveLast}
                        style={[styles.controlBtn, { backgroundColor: colors.border }]}
                        disabled={sentence.length === 0}
                    >
                        <Ionicons name="backspace" size={20} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSpeak}
                        style={[
                            styles.speakBtn,
                            { backgroundColor: sentence.length > 0 ? colors.primary : colors.border }
                        ]}
                        disabled={sentence.length === 0 || isSpeaking}
                    >
                        <Play size={22} color="#FFF" fill="#FFF" />
                        <Text style={styles.speakText}>{isSpeaking ? tr('speakingBtn') : tr('speak')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Tabs */}
            <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
                {[
                    { id: 'subject', label: tr('tabWho'), icon: 'person' },
                    { id: 'verb', label: tr('tabAction'), icon: 'hand-right' },
                    { id: 'object', label: tr('tabWhat'), icon: 'grid' }
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as any)}
                        style={[
                            styles.tab,
                            activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
                        ]}
                    >
                        <Ionicons 
                            name={tab.icon as any} 
                            size={20} 
                            color={activeTab === tab.id ? colors.primary : colors.subText} 
                        />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab.id ? colors.primary : colors.subText },
                            activeTab === tab.id && { fontWeight: 'bold' }
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Symbol Grid */}
            <ScrollView contentContainerStyle={styles.gridContent}>
                <View style={styles.grid}>
                    {currentList.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.card,
                                { backgroundColor: colors.card, borderColor: colors.border }
                            ]}
                            onPress={() => handleSelect(item)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon as any} size={48} color={item.color} />
                            </View>
                            <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={1}>
                                {getLabel(item)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 8, width: 40 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    
    // Builder Area
    builderArea: {
        padding: 16,
        borderBottomWidth: 1,
    },
    sentenceRow: {
        minHeight: 60,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptySentence: {
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    sentenceChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    controlsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    controlBtn: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    speakBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    speakText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Tabs
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    tabText: {
        fontSize: 16,
    },

    // Grid
    gridContent: {
        padding: 16,
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '31%',
        aspectRatio: 0.85,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        marginBottom: 12,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
