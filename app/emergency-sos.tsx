import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, PhoneOff, Plus, Trash2, UserPlus } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Linking,
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

const STORAGE_KEY = '@voiceaid_sos_contacts';

interface SOSContact {
    id: string;
    name: string;
    phone: string;
    relation: string;
}

export default function EmergencySOSScreen() {
    const router = useRouter();
    const { colors, language, ttsSpeed, ttsVoice } = useContext(AppContext);
    const tr = useT(language as any);

    const [contacts, setContacts] = useState<SOSContact[]>([]);
    const [calling, setCalling] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newRelation, setNewRelation] = useState('');

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) setContacts(JSON.parse(raw));
        } catch {}
    };

    const saveContacts = async (updated: SOSContact[]) => {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setContacts(updated);
    };

    const handleAddContact = async () => {
        if (!newName.trim() || !newPhone.trim()) {
            Alert.alert(tr('missingInfo'), tr('missingInfoSub'));
            return;
        }
        if (contacts.length >= 3) {
            Alert.alert(tr('limitReached'), tr('limitReachedSub'));
            return;
        }
        const contact: SOSContact = {
            id: Date.now().toString(),
            name: newName.trim(),
            phone: newPhone.trim(),
            relation: newRelation.trim() || tr('contactDefault'),
        };
        const updated = [...contacts, contact];
        await saveContacts(updated);
        setNewName('');
        setNewPhone('');
        setNewRelation('');
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert(tr('removeContact'), tr('removeContactQ'), [
            { text: tr('cancel'), style: 'cancel' },
            {
                text: tr('delete'), style: 'destructive',
                onPress: async () => {
                    const updated = contacts.filter(c => c.id !== id);
                    await saveContacts(updated);
                }
            }
        ]);
    };

    const handleSOS = async (contact?: SOSContact) => {
        const target = contact || contacts[0];
        if (!target) {
            Alert.alert(
                tr('noContactSet'),
                tr('noContactSetSub'),
                [{ text: tr('addContact'), onPress: () => setShowModal(true) }, { text: tr('cancel'), style: 'cancel' }]
            );
            return;
        }

        const msg = tr('callingPrefix') + target.name;

        setCalling(true);
        try {
            const speedMapping: any = { slow: 0.8, normal: 1.0, fast: 1.2 };
            TTSService.speak(msg, language as any, { 
                speed: speedMapping[ttsSpeed], 
                gender: ttsVoice 
            });
        } catch {}

        // Small delay so TTS can start, then open dialer
        setTimeout(async () => {
            const url = `tel:${target.phone.replace(/\s+/g, '')}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert(tr('error'), tr('dialerError'));
            }
            setCalling(false);
        }, 1500);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{tr('emergencySOSTitle')}</Text>
                    <Text style={[styles.headerSub, { color: colors.subText }]}>{tr('callForHelpSub')}</Text>
                </View>
                {contacts.length < 3 && (
                    <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                        <UserPlus size={18} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* BIG SOS Button */}
                <TouchableOpacity
                    style={[styles.sosButton, calling && styles.sosButtonCalling]}
                    onPress={() => handleSOS()}
                    activeOpacity={0.85}
                    disabled={calling}
                >
                    <View style={styles.sosInner}>
                        {calling
                            ? <PhoneOff size={48} color="#fff" />
                            : <Phone size={48} color="#fff" />
                        }
                        <Text style={styles.sosLabel}>SOS</Text>
                        <Text style={styles.sosSublabel}>
                        {calling
                            ? tr('calling')
                            : (contacts.length > 0
                                ? `${tr('callForHelp')} ${contacts[0].name}`
                                : tr('addContact'))
                        }
                    </Text>
                    </View>
                </TouchableOpacity>

                <Text style={[styles.sectionLabel, { color: colors.subText }]}>{tr('sosContacts')}</Text>

                {contacts.length === 0 ? (
                    <TouchableOpacity
                        style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowModal(true)}
                    >
                        <Plus size={32} color={colors.subText} style={{ marginBottom: 8 }} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>{tr('addContact')}</Text>
                        <Text style={[styles.emptyText, { color: colors.subText }]}>{tr('addContactSub')}</Text>
                    </TouchableOpacity>
                ) : (
                    contacts.map((contact, i) => (
                        <View key={contact.id} style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.contactAvatar, { backgroundColor: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#3b82f6' }]}>
                                <Text style={styles.contactAvatarText}>{contact.name[0]?.toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                                <Text style={[styles.contactDetail, { color: colors.subText }]}>{contact.relation} · {contact.phone}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.callBtn, { backgroundColor: '#22c55e' }]}
                                onPress={() => handleSOS(contact)}
                            >
                                <Phone size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.callBtn, { backgroundColor: '#fee2e2', marginLeft: 8 }]}
                                onPress={() => handleDelete(contact.id)}
                            >
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add Contact Modal */}
            <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{tr('addEmergencyContact')}</Text>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>{tr('name')} *</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder={tr('mumPlaceholder')}
                            placeholderTextColor={colors.subText}
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <Text style={[styles.inputLabel, { color: colors.text }]}>{tr('phone')} *</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder={tr('phonePlaceholder')}
                            placeholderTextColor={colors.subText}
                            value={newPhone}
                            onChangeText={setNewPhone}
                            keyboardType="phone-pad"
                        />
                        <Text style={[styles.inputLabel, { color: colors.text }]}>{tr('relation')}</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder={tr('relationPlaceholder')}
                            placeholderTextColor={colors.subText}
                            value={newRelation}
                            onChangeText={setNewRelation}
                        />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border, flex: 1 }]} onPress={() => setShowModal(false)}>
                                <Text style={{ color: colors.text, fontWeight: '700' }}>{tr('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleAddContact}>
                                <Text style={{ color: '#fff', fontWeight: '700' }}>{tr('save')}</Text>
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
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSub: { fontSize: 13 },
    addBtn: { padding: 10, borderRadius: 14 },
    scroll: { padding: 20, paddingBottom: 60, alignItems: 'center' },
    sosButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        elevation: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
    },
    sosButtonCalling: {
        backgroundColor: '#f97316',
        shadowColor: '#f97316',
    },
    sosInner: { alignItems: 'center' },
    sosLabel: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 4,
        marginTop: 8,
    },
    sosSublabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    sectionLabel: {
        alignSelf: 'flex-start',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    emptyCard: {
        width: '100%',
        alignItems: 'center',
        padding: 32,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
    emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    contactCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
        gap: 12,
    },
    contactAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactAvatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    contactName: { fontSize: 16, fontWeight: '700' },
    contactDetail: { fontSize: 13, marginTop: 2 },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        marginBottom: 16,
    },
    modalBtn: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
});
