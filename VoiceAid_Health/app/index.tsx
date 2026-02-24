import { useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaregiverDashboard } from '../components/ui/CaregiverDashboard';
import { PatientDashboard } from '../components/ui/PatientDashboard';
import { useRole } from '../contexts/RoleContext';
import { homeStyles as styles } from '../styles/index.styles';
import { AppContext } from './_layout';

// --- TRANSLATIONS CONFIGURATION ---
const TRANSLATIONS = {
  en: {
    speakNow: "Speak Now",
    phraseBoard: "Phrase Board",
    dailyCare: "Daily Care",
    settings: "Settings",
    systemReady: "System Ready",
    activeLang: "Active Language"
  },
  twi: {
    speakNow: "Kasa Seesei",        // Speak Now
    phraseBoard: "Kasa Mfonini",    // Phrase Pictures/Board
    dailyCare: "Apɔmuden Noto",     // Health Routine
    settings: "Nhyehyɛe",           // Settings
    systemReady: "System Ayɛ Krado",// System Ready
    activeLang: "Kasa A Wopɛ"       // Active Language
  },
  ga: {
    speakNow: "Wiemɔ Amrɔ",         // Speak Now
    phraseBoard: "Wiemɔ Board",     // Phrase Board (Loan word often used)
    dailyCare: "Gbi Noto",          // Daily Plan
    settings: "Sajkuu",             // Settings/Arrangement
    systemReady: "System Ebe",      // System Ready
    activeLang: "Wiemɔ"             // Language
  }
};

// Header Component
const Header = ({ title }: { title: string }) => {
  const { colors } = useContext(AppContext);
  return (
    <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors, language, setLanguage } = useContext(AppContext);
  const { role, isFirstLaunch } = useRole();

  // Redirect to welcome screen if no role is selected
  useEffect(() => {
    if (!role) {
      router.replace('/welcome');
    }
  }, [role]);

  // Get active translation based on selected language (default to English)
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  // Show loading or nothing while checking role
  if (!role) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title={role === 'patient' ? "VoiceAid Health" : "VoiceAid Health (Caregiver)"} />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* PATIENT MODE: Simple, Minimal Interface */}
        {/* PATIENT MODE: Simple, Minimal Interface */}
        {role === 'patient' && (
          <PatientDashboard router={router} t={t} colors={colors} />
        )}

        {/* CAREGIVER MODE: Full Management Interface */}
        {role === 'caregiver' && (
          <CaregiverDashboard
            router={router}
            t={t}
            colors={colors}
            language={language}
            setLanguage={setLanguage}
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

