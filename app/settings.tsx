import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Info,
  LogOut,
  Moon,
  Sun,
  Type,
  User,
  Volume2,
  Accessibility,
  Languages,
  Trash2,
  FileDown,
  Activity,
  ScanLine
} from 'lucide-react-native';
import React, { useContext } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsRow } from '../components/SettingsRow';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { settingsStyles as styles } from '../styles/settings.styles';
import { AppContext } from './_layout';
import { useT } from '../utils/i18n';

/**
 * ==========================================
 * LOCAL COMPONENTS
 * ==========================================
 */
const Header = ({ title, onBack }: { title: string, onBack: () => void }) => {
  const { colors } = useContext(AppContext);
  return (
    <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

const SectionTitle = ({ title, color }: { title: string, color: string }) => (
  <Text style={[styles.sectionTitle, { color }]}>{title.toUpperCase()}</Text>
);

/**
 * ==========================================
 * SETTINGS SCREEN
 * ==========================================
 */
export default function SettingsScreen() {
  const router = useRouter();
  
  const { 
    colors, 
    themeMode, 
    toggleTheme, 
    language, 
    setLanguage,
    largeText,
    setLargeText,
    reduceMotion,
    setReduceMotion,
    ttsSpeed,
    setTtsSpeed,
    ttsVoice,
    setTtsVoice,
    isScanningMode,
    setScanningMode
  } = useContext(AppContext);

  const tr = useT(language as any);
  const { role, setRole, patientType } = useRole();
  const isGuest = role === 'patient' && patientType === 'guest';
  const { signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      tr('logout'),
      tr('logoutConfirmMessage'),
      [
        { text: tr('cancel'), style: 'cancel' },
        {
          text: tr('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem('@voiceaid_role');
              await AsyncStorage.removeItem('@voiceaid_patient_type');
              router.replace('/welcome');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert(tr('error'), tr('error'));
            }
          }
        }
      ]
    );
  };

  const cycleLanguage = () => {
    if (language === 'en') setLanguage('twi');
    else if (language === 'twi') setLanguage('ga');
    else setLanguage('en');
  };

  const languageLabel = language === 'twi' ? 'Twi (Akan)' : language === 'ga' ? 'Ga' : 'English';

  const cycleTtsSpeed = () => {
    if (ttsSpeed === 'normal') setTtsSpeed('slow');
    else if (ttsSpeed === 'slow') setTtsSpeed('fast');
    else setTtsSpeed('normal');
  };

  const cycleTtsVoice = () => {
    if (ttsVoice === 'male') setTtsVoice('female');
    else setTtsVoice('male');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title={tr('settingsTitle')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ACCESSIBILITY SECTION (Global) */}
        <SectionTitle title={tr('accessibility')} color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={themeMode === 'dark' ? Moon : Sun}
            iconColor={themeMode === 'dark' ? colors.accent : "#D97706"}
            iconBg={themeMode === 'dark' ? colors.accent + '20' : '#FEF3C7'}
            title={tr('darkMode')}
            subtitle={themeMode === 'dark' ? tr('darkModeOn') : tr('darkModeOff')}
            switchValue={themeMode === 'dark'}
            onSwitchChange={toggleTheme}
            activeTrackColor={colors.primary}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
          <SettingsRow
            icon={Type}
            iconColor={colors.primary}
            iconBg={colors.primary + '15'}
            title={tr('largeText')}
            subtitle={tr('largeTextSub')}
            switchValue={largeText}
            onSwitchChange={setLargeText}
            activeTrackColor={colors.primary}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
          <SettingsRow
            icon={Activity}
            iconColor={colors.accent}
            iconBg={colors.accent + '15'}
            title={tr('hapticFeedback' as any) || 'Haptic Feedback'}
            subtitle={tr('hapticSub' as any) || 'Vibrate when starting or stopping voice input'}
            switchValue={reduceMotion}
            onSwitchChange={setReduceMotion}
            activeTrackColor={colors.primary}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
          <SettingsRow
            icon={ScanLine}
            iconColor={colors.primary}
            iconBg={colors.primary + '15'}
            title={tr('visualScanning' as any) || 'Visual Scanning Mode'}
            subtitle={tr('scanningSub' as any) || 'Auto-highlights items for switch access'}
            switchValue={isScanningMode}
            onSwitchChange={setScanningMode}
            activeTrackColor={colors.primary}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
        </View>

        {/* LANGUAGE SECTION (Global) */}
        <SectionTitle title={tr('languageRegion')} color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={Languages}
            iconColor={colors.accent}
            iconBg={colors.accent + '15'}
            title={tr('appLanguage')}
            subtitle={languageLabel}
            onPress={cycleLanguage}
            rightElement={<ChevronRight size={20} color={colors.subText} />}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
        </View>

        {/* PATIENT ONLY SETTINGS */}
        {role === 'patient' && (
          <>
            <SectionTitle title={tr('voiceAssistant')} color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={Volume2}
                iconColor="#0EA5E9"
                iconBg="#E0F2FE"
                title={tr('voiceSpeed')}
                subtitle={`${tr('currentSpeed')} ${ttsSpeed.charAt(0).toUpperCase() + ttsSpeed.slice(1)}`}
                onPress={cycleTtsSpeed}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
              <SettingsRow
                icon={Accessibility}
                iconColor="#8B5CF6"
                iconBg="#EDE9FE"
                title={tr('voicePitch')}
                subtitle={`${tr('currentSpeed')} ${ttsVoice.charAt(0).toUpperCase() + ttsVoice.slice(1)}`}
                onPress={cycleTtsVoice}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                showBorderTop
                borderColor={colors.border}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>

            <SectionTitle title={tr('privacyData')} color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={Trash2}
                iconColor="#EF4444"
                iconBg="#FEE2E2"
                title={tr('clearHistory')}
                subtitle={tr('clearHistorySub')}
                onPress={() => {
                  Alert.alert(
                    tr('clearHistory'),
                    tr('clearHistoryPrompt'),
                    [
                      { text: tr('cancel'), style: 'cancel' },
                      { 
                        text: tr('deleteBtn'), 
                        style: 'destructive', 
                        onPress: async () => {
                          try {
                            const { HistoryService } = require('../services/historyService');
                            await HistoryService.clearLogs();
                            Alert.alert(tr('done'), tr('clearHistorySub'));
                          } catch (e) {
                            Alert.alert(tr('error'), 'Could not clear history.');
                          }
                        }
                      }
                    ]
                  );
                }}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>
          </>
        )}

        {/* CAREGIVER/THERAPIST ONLY SETTINGS */}
        {role === 'caregiver' && (
          <>
            <SectionTitle title={tr('clinicalManagement')} color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={Activity}
                iconColor="#10B981"
                iconBg="#D1FAE5"
                title={tr('defaultFluencyTarget')}
                subtitle={tr('defaultFluencySubtitle')}
                onPress={() => Alert.alert(tr('targetConfig'), tr('targetConfigSub'))}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
              <SettingsRow
                icon={ClipboardList}
                iconColor={colors.primary}
                iconBg="#E0E7FF"
                title={tr('globalAuditLogs')}
                subtitle={tr('globalAuditSubtitle')}
                onPress={() => router.push("/history")}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                showBorderTop
                borderColor={colors.border}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>

            <SectionTitle title={tr('dataCompliance')} color={colors.subText} />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingsRow
                icon={FileDown}
                iconColor="#F59E0B"
                iconBg="#FEF3C7"
                title={tr('exportPatientData')}
                subtitle={tr('exportDataSubtitle')}
                onPress={() => Alert.alert(tr('exportPatientData'), tr('preparedDownload'))}
                rightElement={<ChevronRight size={20} color={colors.subText} />}
                titleColor={colors.text}
                subtitleColor={colors.subText}
                largeText={largeText}
              />
            </View>
          </>
        )}

        {/* USER ACCOUNT SECTION */}
        <SectionTitle title={tr('account')} color={colors.subText} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon={role === 'patient' ? User : HeartPulse}
            iconColor={role === 'patient' ? "#2563EB" : "#059669"}
            iconBg={role === 'patient' ? '#DBEAFE' : '#D1FAE5'}
            title={tr('profileDetails')}
            subtitle={isGuest ? 'Guest Access' : `${tr('roleLabel')}: ${role === 'patient' ? tr('patientRole') : tr('therapistRole')}`}
            onPress={() => router.push('/profile')}
            rightElement={<ChevronRight size={20} color={colors.subText} />}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
          <SettingsRow
            icon={LogOut}
            iconColor="#EF4444"
            iconBg="#FEE2E2"
            title={tr('logout')}
            subtitle={tr('logoutSubtitle')}
            onPress={handleLogout}
            rightElement={<ChevronRight size={20} color={colors.subText} />}
            showBorderTop
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.subText}
            largeText={largeText}
          />
        </View>

        {/* APP INFO */}
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
          <Info size={24} color={colors.subText} style={{ marginBottom: 8 }} />
          <Text style={{ color: colors.subText, fontSize: 13 }}>VoiceAid MVP v1.0.0</Text>
          <Text style={{ color: colors.subText, fontSize: 12, marginTop: 4 }}>Speech Therapy & Augmentative Communication</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
