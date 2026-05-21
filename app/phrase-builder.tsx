import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Volume2 } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TTSService } from '../services/tts';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

const STORAGE_KEY = '@voiceaid_guest_phrases';

interface GuestPhrase {
    id: string;
    text: string;
    emoji: string;
    color: string;
}

const EMOJI_OPTIONS = ['💬','🙏','❤️','😊','👋','🚿','🍽️','💊','🛏️','🚽','📱','😣','🥺','😴','🙂','👀','🏠','👨‍⚕️'];
const COLOR_OPTIONS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#0d9488','#f97316','#6366f1','#14b8a6'];

export default function PhraseBuilderScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const tr = useT(language as any);

    const [phrases, setPhrases] = useState<GuestPhrase[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newText, setNewText] = useState('');
    const [newEmoji, setNewEmoji] = useState('💬');
    const [newColor, setNewColor] = useState('#3b82f6');
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    useEffect(() => {
        loadPhrases();
    }, []);

    const loadPhrases = async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) setPhrases(JSON.parse(raw));
        } catch {}
    };

    const savePhrases = async (updated: GuestPhrase[]) => {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setPhrases(updated);
    };

    const handleAdd = async () => {
        if (!newText.trim()) {
            Alert.alert(tr('missingText'), tr('missingTextSub'));
            return;
        }
        const phrase: GuestPhrase = {
            id: Date.now().toString(),
            text: newText.trim(),
            emoji: newEmoji,
            color: newColor,
        };
        await savePhrases([...phrases, phrase]);
        setNewText('');
        setNewEmoji('💬');
        setNewColor('#3b82f6');
        setShowModal(false);
    };

    const handleSpeak = async (phrase: GuestPhrase) => {
        setSpeakingId(phrase.id);
        try {
            await TTSService.speak(phrase.text, language as any);
        } catch {}
        setTimeout(() => setSpeakingId(null), 2000);
    };

    const handleDelete = (id: string) => {
        Alert.alert(tr('removePhraseTitle'), tr('removePhraseQ'), [
            { text: tr('cancel'), style: 'cancel' },
            {
                text: tr('remove'), style: 'destructive',
                onPress: async () => {
                    await savePhrases(phrases.filter(p => p.id !== id));
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {tr('myPhrasesTitle')}
                    </Text>
                    <Text style={[styles.headerSub, { color: colors.subText }]}>
                        {tr('myPhrasesSub')}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowModal(true)}
                    style={[styles.addHeaderBtn, { backgroundColor: colors.primary }]}
                >
                    <Plus size={20} color="#fff" />
                    <Text style={styles.addHeaderBtnText}>{tr('add')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {phrases.length === 0 ? (
                    <TouchableOpacity
                        style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowModal(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {tr('noPhrasesYet')}
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.subText }]}>
                            {tr('tapAddHint')}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.phraseGrid}>
                        {phrases.map(phrase => (
                            <TouchableOpacity
                                key={phrase.id}
                                style={[
                                    styles.phraseCard,
                                    { borderColor: phrase.color, backgroundColor: phrase.color + '12' },
                                    speakingId === phrase.id && { backgroundColor: phrase.color + '30', transform: [{ scale: 0.97 }] }
                                ]}
                                onPress={() => handleSpeak(phrase)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.phraseEmoji}>{phrase.emoji}</Text>
                                <Text style={[styles.phraseText, { color: colors.text }]} numberOfLines={3}>
                                    {phrase.text}
                                </Text>
                                <View style={styles.phraseFooter}>
                                    <Volume2 size={14} color={phrase.color} />
                                    <TouchableOpacity onPress={() => handleDelete(phrase.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Trash2 size={14} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Add Phrase Modal */}
            <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {tr('newPhraseTitle')}
                        </Text>

                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text, fontSize: 16 }]}
                            placeholder={tr('typeYourPhrase')}
                            placeholderTextColor={colors.subText}
                            value={newText}
                            onChangeText={setNewText}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Emoji Picker */}
                        <Text style={[styles.pickerLabel, { color: colors.text }]}>
                            {tr('chooseAnIcon')}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            {EMOJI_OPTIONS.map(e => (
                                <TouchableOpacity
                                    key={e}
                                    onPress={() => setNewEmoji(e)}
                                    style={[
                                        styles.emojiBtn,
                                        newEmoji === e && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                                    ]}
                                >
                                    <Text style={{ fontSize: 22 }}>{e}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Color Picker */}
                        <Text style={[styles.pickerLabel, { color: colors.text }]}>
                            {tr('chooseAColor')}
                        </Text>
                        <View style={styles.colorRow}>
                            {COLOR_OPTIONS.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => setNewColor(c)}
                                    style={[
                                        styles.colorDot,
                                        { backgroundColor: c },
                                        newColor === c && { borderWidth: 3, borderColor: colors.text }
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Buttons */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border, flex: 1 }]} onPress={() => setShowModal(false)}>
                                <Text style={{ color: colors.text, fontWeight: '700' }}>
                                    {tr('cancel')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: newColor, flex: 1 }]} onPress={handleAdd}>
                                <Text style={{ color: '#fff', fontWeight: '700' }}>
                                    {tr('save')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    headerSub: { fontSize: 13 },
    addHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        gap: 6,
    },
    addHeaderBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    scroll: { padding: 20, paddingBottom: 60 },
    emptyCard: {
        alignItems: 'center',
        padding: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        marginTop: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    phraseGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    phraseCard: {
        width: '47%',
        padding: 16,
        borderRadius: 18,
        borderWidth: 2,
        alignItems: 'center',
        minHeight: 120,
        justifyContent: 'space-between',
    },
    phraseEmoji: { fontSize: 32, marginBottom: 8 },
    phraseText: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
    phraseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        textAlignVertical: 'top',
    },
    pickerLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
    emojiBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    modalBtn: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
});
