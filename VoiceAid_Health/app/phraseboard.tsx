import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2, Plus, X } from 'lucide-react-native';
import { AppContext } from './_layout';
import { PhraseService, Phrase, PHRASE_CATEGORIES, ICON_MAP, CategoryId } from '../services/phraseService';
import { TTSService } from '../services/ttsService';

const { width } = Dimensions.get('window');
// Feature: Larger buttons for motor-impaired users (approx 45% of screen width)
const TILE_SIZE = (width - 60) / 2; 

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

// --- DEFAULT EXPORT IS HERE ---
export default function PhraseboardScreen() {
  const router = useRouter();
  const { colors, language } = useContext(AppContext);
  
  // State
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('needs');
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Form State
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    loadPhrases();
  }, []);

  const loadPhrases = async () => {
    const data = await PhraseService.getPhrases();
    setPhrases(data);
  };

  /**
   * PLAY AUDIO
   * Selects the correct translation based on global language setting
   */
  const handlePhraseTap = (phrase: Phrase) => {
    let textToSpeak = phrase.text; // Default English

    if (language === 'twi' && phrase.textTwi) {
      textToSpeak = phrase.textTwi;
    } else if (language === 'ga' && phrase.textGa) {
      textToSpeak = phrase.textGa;
    }

    // Call our Hybrid TTS Service
    TTSService.speak(textToSpeak, language as any);
  };

  const handleLongPress = (phrase: Phrase) => {
    if (!phrase.isCustom) return; // Only delete custom phrases

    Alert.alert(
      "Delete Phrase",
      "Do you want to remove this custom phrase?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const updated = await PhraseService.deletePhrase(phrase.id);
            setPhrases(updated);
          }
        }
      ]
    );
  };

  const handleAddPhrase = async () => {
    if (!newLabel.trim() || !newText.trim()) return;

    const updated = await PhraseService.addPhrase({
      category: activeCategory,
      label: newLabel,
      text: newText,
      // Note: Custom phrases currently default to English text. 
      // Future enhancement: Add inputs for Twi/Ga translations in this modal.
    });
    
    setPhrases(updated);
    setIsModalVisible(false);
    setNewLabel('');
    setNewText('');
  };

  const filteredPhrases = phrases.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Phraseboard" onBack={() => router.back()} />
      
      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {PHRASE_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id as CategoryId)}
              style={[
                styles.tab,
                { 
                  backgroundColor: activeCategory === cat.id ? colors.primary : colors.card,
                  borderColor: activeCategory === cat.id ? colors.primary : colors.border,
                }
              ]}
            >
              <Text style={{ 
                color: activeCategory === cat.id ? '#FFF' : colors.text,
                fontWeight: 'bold' 
              }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Grid of Phrases */}
      <ScrollView contentContainerStyle={styles.grid}>
        {filteredPhrases.map(phrase => {
          const Icon = ICON_MAP[phrase.iconName] || ICON_MAP['custom'];
          return (
            <TouchableOpacity
              key={phrase.id}
              onPress={() => handlePhraseTap(phrase)}
              onLongPress={() => handleLongPress(phrase)}
              activeOpacity={0.6}
              style={[
                styles.tile,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  width: TILE_SIZE,
                  height: TILE_SIZE
                }
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: phrase.color ? `${phrase.color}20` : `${colors.primary}20` }]}>
                <Icon size={32} color={phrase.color || colors.primary} />
              </View>
              <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={2}>
                {phrase.label}
              </Text>
              
              <View style={styles.ttsIcon}>
                <Volume2 size={16} color={colors.subText} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Add Button (Last item in grid) */}
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={[
            styles.tile,
            styles.addTile,
            { 
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderColor: colors.primary,
            }
          ]}
        >
          <Plus size={40} color={colors.primary} />
          <Text style={[styles.tileLabel, { color: colors.primary, marginTop: 8 }]}>Add New</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Phrase Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Phrase</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.subText }]}>Label (Short Name)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., Juice"
              placeholderTextColor={colors.subText}
              value={newLabel}
              onChangeText={setNewLabel}
            />

            <Text style={[styles.label, { color: colors.subText }]}>Spoken Text (TTS)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., I want apple juice please."
              placeholderTextColor={colors.subText}
              value={newText}
              onChangeText={setNewText}
            />

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleAddPhrase}
            >
              <Text style={styles.saveButtonText}>Save Phrase</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  
  // Tabs
  tabContainer: { marginVertical: 15, height: 45 },
  tabsScroll: { paddingHorizontal: 20, gap: 10 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center'
  },

  // Grid
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 20, 
    gap: 20,
    paddingBottom: 40
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    padding: 10
  },
  addTile: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    elevation: 0
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  tileLabel: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center'
  },
  ttsIcon: {
    position: 'absolute',
    top: 10,
    right: 10
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});