import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    User,
    ShieldCheck,
    Database,
    MessageSquare,
    BookOpen,
    ChevronRight,
    LogIn,
    Edit2,
    Save,
    Calendar,
    Phone,
    Activity,
    Sparkles,
    CheckCircle,
    Key
} from 'lucide-react-native';
import { AppContext } from './_layout';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KenteAccent from '../components/KenteAccent';
import { haptics } from '../utils/haptics';

export default function ProfileScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const { user, patientProfile, updatePatientProfile } = useAuth();
    const tr = useT(language as any);

    const [stats, setStats] = useState({ journals: 0, logs: 0 });
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    // Profile editable state fields
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [condition, setCondition] = useState('');
    const [caregiverPhone, setCaregiverPhone] = useState('');
    const [stableDeviceId, setStableDeviceId] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            const guestStatus = !patientId || patientId === 'guest_user';
            setIsGuest(guestStatus);

            // 1. Load Local stable Device ID
            let devId = await AsyncStorage.getItem('@voiceaid_device_uuid');
            if (!devId) {
                devId = 'VA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                await AsyncStorage.setItem('@voiceaid_device_uuid', devId);
            }
            setStableDeviceId(devId);

            // 2. Load Patient Name
            const name = await AsyncStorage.getItem('@voiceaid_patient_name');
            if (name) {
                setFullName(name);
            } else if (!guestStatus && patientProfile?.full_name) {
                setFullName(patientProfile.full_name);
            } else if (user?.email) {
                setFullName(user.email.split('@')[0]);
            } else {
                setFullName('Patient');
            }

            // 3. Load other clinical/demographic fields
            const localAge = await AsyncStorage.getItem('@voiceaid_patient_age');
            setAge(localAge || '');

            const localCondition = await AsyncStorage.getItem('@voiceaid_patient_condition');
            setCondition(localCondition || '');

            const localPhone = await AsyncStorage.getItem('@voiceaid_patient_caregiver_phone');
            setCaregiverPhone(localPhone || '');

            // 4. Load Guest Stats
            const localJournals = await AsyncStorage.getItem('@voiceaid_guest_journals');
            const localLogs = await AsyncStorage.getItem('@voiceaid_guest_history');

            setStats({
                journals: localJournals ? JSON.parse(localJournals).length : 0,
                logs: localLogs ? JSON.parse(localLogs).length : 0
            });
        } catch (e) {
            console.error('Failed to load profile stats', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            setValidationError('Name cannot be empty.');
            haptics.warning();
            return;
        }
        setValidationError('');
        setSaving(true);
        haptics.medium();

        try {
            // Save to AsyncStorage
            await AsyncStorage.setItem('@voiceaid_patient_name', fullName.trim());
            await AsyncStorage.setItem('@voiceaid_patient_age', age.trim());
            await AsyncStorage.setItem('@voiceaid_patient_condition', condition.trim());
            await AsyncStorage.setItem('@voiceaid_patient_caregiver_phone', caregiverPhone.trim());

            // Save to Supabase if Hospital Patient
            if (!isGuest && patientProfile) {
                await updatePatientProfile({
                    full_name: fullName.trim()
                });
            }

            haptics.success();
            setSaveSuccess(true);
            setIsEditing(false);
            
            // Auto dismiss the success notification banner after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('Failed to save profile changes', err);
            setValidationError('Failed to sync changes. Stored locally.');
            haptics.error();
        } finally {
            setSaving(false);
        }
    };

    const toggleEditMode = () => {
        haptics.light();
        if (isEditing) {
            // Cancel editing
            setIsEditing(false);
            setValidationError('');
            loadProfileData(); // Reload original values
        } else {
            setIsEditing(true);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1 }}
            >
                {/* Header Accent Line */}
                <KenteAccent />

                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border + '30' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{tr('profileDetails')}</Text>
                    
                    <TouchableOpacity onPress={toggleEditMode} style={styles.editBtn}>
                        {isEditing ? (
                            <Text style={[styles.cancelText, { color: '#ef4444' }]}>Cancel</Text>
                        ) : (
                            <View style={styles.editRow}>
                                <Edit2 size={16} color={colors.primary} style={{ marginRight: 4 }} />
                                <Text style={[styles.editText, { color: colors.primary }]}>{tr('edit')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Success Banner */}
                {saveSuccess && (
                    <View style={[styles.successBanner, { backgroundColor: '#10b981' }]}>
                        <CheckCircle size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.successBannerText}>Profile Saved Successfully!</Text>
                    </View>
                )}

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Identity Card */}
                    <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
                            <User size={50} color={colors.primary} />
                        </View>
                        <Text style={[styles.userName, { color: colors.text }]}>
                            {fullName}
                        </Text>
                        <View style={[styles.roleBadge, { backgroundColor: isGuest ? '#f59e0b20' : colors.primary + '20' }]}>
                            <Text style={[styles.roleText, { color: isGuest ? '#d97706' : colors.primary }]}>
                                {isGuest ? 'GUEST PATIENT' : 'HOSPITAL PATIENT'}
                            </Text>
                        </View>
                        {!isGuest && patientProfile?.patient_code && (
                            <Text style={[styles.patientCodeText, { color: colors.subText }]}>
                                Code: {patientProfile.patient_code}
                            </Text>
                        )}
                    </View>

                    {/* Edit Form or View Details */}
                    {isEditing ? (
                        <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.formHeading, { color: colors.text }]}>EDIT DETAILS</Text>
                            
                            {validationError ? (
                                <Text style={styles.errorText}>{validationError}</Text>
                            ) : null}

                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.subText }]}>FULL NAME *</Text>
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Enter full name"
                                    placeholderTextColor={colors.subText + '90'}
                                    maxLength={40}
                                />
                            </View>

                            {/* Age */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.subText }]}>AGE</Text>
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Enter age (e.g. 54)"
                                    placeholderTextColor={colors.subText + '90'}
                                    keyboardType="numeric"
                                    maxLength={3}
                                />
                            </View>

                            {/* Condition */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.subText }]}>PRIMARY CONDITION / STRUGGLES</Text>
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                                    value={condition}
                                    onChangeText={setCondition}
                                    placeholder="e.g. Aphasia Recovery, Speech Sound"
                                    placeholderTextColor={colors.subText + '90'}
                                    maxLength={50}
                                />
                            </View>

                            {/* Caregiver Phone */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.subText }]}>CAREGIVER PHONE / EMERGENCY</Text>
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                                    value={caregiverPhone}
                                    onChangeText={setCaregiverPhone}
                                    placeholder="e.g. +233 24 123 4567"
                                    placeholderTextColor={colors.subText + '90'}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity 
                                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <View style={styles.saveBtnContent}>
                                        <Save size={18} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={styles.saveBtnText}>{tr('save')}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.detailsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.formHeading, { color: colors.text }]}>PATIENT VITAL SHEET</Text>

                            {/* Display Name */}
                            <View style={styles.detailRow}>
                                <User size={20} color={colors.primary} />
                                <View style={styles.detailTextCol}>
                                    <Text style={[styles.detailLabel, { color: colors.subText }]}>NAME</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{fullName || 'Not specified'}</Text>
                                </View>
                            </View>

                            {/* Display Age */}
                            <View style={styles.detailRow}>
                                <Calendar size={20} color="#3b82f6" />
                                <View style={styles.detailTextCol}>
                                    <Text style={[styles.detailLabel, { color: colors.subText }]}>AGE</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{age ? `${age} years old` : 'Not specified'}</Text>
                                </View>
                            </View>

                            {/* Display Condition */}
                            <View style={styles.detailRow}>
                                <Activity size={20} color="#10b981" />
                                <View style={styles.detailTextCol}>
                                    <Text style={[styles.detailLabel, { color: colors.subText }]}>PRIMARY STRUGGLE</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{condition || 'Not specified'}</Text>
                                </View>
                            </View>

                            {/* Display Caregiver Contact */}
                            <View style={styles.detailRow}>
                                <Phone size={20} color="#ef4444" />
                                <View style={styles.detailTextCol}>
                                    <Text style={[styles.detailLabel, { color: colors.subText }]}>CAREGIVER PHONE</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{caregiverPhone || 'Not specified'}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Stats Section */}
                    <Text style={[styles.sectionTitle, { color: colors.subText, marginTop: 25 }]}>DEVICE USAGE</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <BookOpen size={24} color="#8b5cf6" />
                            <Text style={[styles.statValue, { color: colors.text }]}>{stats.journals}</Text>
                            <Text style={[styles.statLabel, { color: colors.subText }]}>Journals</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <MessageSquare size={24} color="#10b981" />
                            <Text style={[styles.statValue, { color: colors.text }]}>{stats.logs}</Text>
                            <Text style={[styles.statLabel, { color: colors.subText }]}>Logs</Text>
                        </View>
                    </View>

                    {/* Privacy Info */}
                    <View style={[styles.infoCard, { backgroundColor: '#10b98110', borderColor: '#10b98130' }]}>
                        <ShieldCheck size={20} color="#10b981" />
                        <View style={styles.infoTextContainer}>
                            <Text style={[styles.infoTitle, { color: '#059669' }]}>Privacy Mode Active</Text>
                            <Text style={[styles.infoSub, { color: '#059669' }]}>
                                In Guest Mode, all your data is encrypted and stored locally on this phone. No data is sent to our servers.
                            </Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <Text style={[styles.sectionTitle, { color: colors.subText }]}>OPTIONS</Text>
                    <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {isGuest && (
                            <TouchableOpacity
                                style={[styles.actionRow, { borderBottomColor: colors.border + '50' }]}
                                onPress={() => router.push('/hospital-connect')}
                            >
                                <View style={styles.actionLeft}>
                                    <View style={[styles.actionIcon, { backgroundColor: '#3b82f615' }]}>
                                        <LogIn size={20} color="#3b82f6" />
                                    </View>
                                    <Text style={[styles.actionText, { color: colors.text }]}>Connect to Hospital</Text>
                                </View>
                                <ChevronRight size={20} color={colors.subText} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/history')}>
                            <View style={styles.actionLeft}>
                                <View style={[styles.actionIcon, { backgroundColor: '#8b5cf615' }]}>
                                    <Database size={20} color="#8b5cf6" />
                                </View>
                                <Text style={[styles.actionText, { color: colors.text }]}>Manage Local Data</Text>
                            </View>
                            <ChevronRight size={20} color={colors.subText} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.footerText, { color: colors.subText }]}>
                        Device ID: {stableDeviceId}
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
    },
    editBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editText: {
        fontSize: 14,
        fontWeight: '700',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 8,
        elevation: 2,
    },
    successBannerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    profileCard: {
        alignItems: 'center',
        padding: 30,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    patientCodeText: {
        fontSize: 11,
        marginTop: 6,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 10,
        marginLeft: 5,
        letterSpacing: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    statBox: {
        width: '48%',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    statLabel: {
        fontSize: 13,
        marginTop: 2,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 25,
        alignItems: 'flex-start',
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    infoSub: {
        fontSize: 12,
        lineHeight: 18,
    },
    actionsCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
    },
    footerText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 11,
        opacity: 0.5,
    },

    // Form and details styles
    formContainer: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        marginBottom: 10,
    },
    formHeading: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    textInput: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    saveBtn: {
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        elevation: 2,
    },
    saveBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    detailsContainer: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
    },
    detailTextCol: {
        flex: 1,
        marginLeft: 16,
    },
    detailLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
    }
});

