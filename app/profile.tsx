import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, ShieldCheck, Database, MessageSquare, BookOpen, ChevronRight, LogIn } from 'lucide-react-native';
import { AppContext } from './_layout';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
    const router = useRouter();
    const { colors, language } = useContext(AppContext);
    const { user, patientProfile } = useAuth();
    const tr = useT(language as any);
    
    const [stats, setStats] = useState({ journals: 0, logs: 0 });
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            const patientId = await AsyncStorage.getItem('@voiceaid_patient_id');
            setIsGuest(!patientId || patientId === 'guest_user');

            // Load Guest Stats
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border + '50' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{tr('profileDetails')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Identity Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
                        <User size={50} color={colors.primary} />
                    </View>
                    <Text style={[styles.userName, { color: colors.text }]}>
                        {isGuest ? 'Guest User' : (patientProfile?.full_name || user?.email?.split('@')[0])}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: isGuest ? '#f59e0b20' : colors.primary + '20' }]}>
                        <Text style={[styles.roleText, { color: isGuest ? '#d97706' : colors.primary }]}>
                            {isGuest ? 'GUEST PATIENT' : 'HOSPITAL PATIENT'}
                        </Text>
                    </View>
                </View>

                {/* Stats Section */}
                <Text style={[styles.sectionTitle, { color: colors.subText }]}>DEVICE USAGE</Text>
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
                    Device ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </Text>
            </ScrollView>
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
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
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
    sectionTitle: {
        fontSize: 12,
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
    }
});
