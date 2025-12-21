import React, { useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Calendar, Settings, Activity, LayoutGrid } from 'lucide-react-native'; 
import { AppContext } from './_layout'; 
import BigButton from '../components/BigButton';

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

  // Get active translation based on selected language (default to English)
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="VoiceAid Health" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Language Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t.activeLang}</Text>
          <View style={styles.langRow}>
            {['en', 'twi', 'ga'].map((lang) => (
              <TouchableOpacity 
                key={lang}
                onPress={() => setLanguage(lang as any)}
                style={[
                  styles.langBadge, 
                  { 
                    backgroundColor: language === lang ? colors.primary : 'transparent',
                    borderColor: colors.primary
                  }
                ]}
              >
                <Text style={{ 
                  color: language === lang ? '#FFF' : colors.text, 
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Action Grid */}
        <View style={styles.grid}>
          <BigButton 
            icon={Mic} 
            label={t.speakNow} 
            fullWidth 
            onPress={() => router.push('/transcript')} 
          />
          
          <BigButton 
            icon={LayoutGrid} 
            label={t.phraseBoard} 
            onPress={() => router.push('/phraseboard')} 
          />
          
          <BigButton 
            icon={Calendar} 
            label={t.dailyCare} 
            onPress={() => router.push('/routine')} 
          />
          <BigButton 
            icon={Settings} 
            label={t.settings} 
            onPress={() => router.push('/settings')} 
          />
        </View>

        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Activity size={20} color={colors.success} />
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 10, marginBottom: 0 }]}>
              {t.systemReady}
            </Text>
          </View>
          <Text style={{ color: colors.subText, marginTop: 5 }}>
            Model: Phase 4 Twi/Ga Placeholder loaded.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 20 },
  
  // Cards
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
});