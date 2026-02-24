import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryTabs } from '../components/CategoryTabs';
import { PhraseTile } from '../components/PhraseTile';
import { CategoryId, Phrase, PhraseService } from '../services/phrase';
import { TTSService } from '../services/tts';
import { phraseboardStyles as styles } from '../styles/phraseboard.styles';
import { AppContext } from './_layout';

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

export default function PhraseboardScreen() {
  const router = useRouter();
  const { colors, language } = useContext(AppContext);

  //State
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('needs');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State - English
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');

  // Form State - Twi
  const [newLabelTwi, setNewLabelTwi] = useState('');
  const [newTextTwi, setNewTextTwi] = useState('');

  // Form State - Ga
  const [newLabelGa, setNewLabelGa] = useState('');
  const [newTextGa, setNewTextGa] = useState('');

  // Icon selection
  const [selectedIcon, setSelectedIcon] = useState('custom');

  useEffect(() => {
    loadPhrases();
  }, []);

  const loadPhrases = async () => {
    const data = await PhraseService.getPhrases();
    setPhrases(data);
  };

  /**
   * HELPERS
   */
  const getActiveText = (phrase: Phrase) => {
    if (language === 'twi' && phrase.textTwi) return phrase.textTwi;
    if (language === 'ga' && phrase.textGa) return phrase.textGa;
    return phrase.text;
  };

  const getActiveLabel = (phrase: Phrase) => {
    if (language === 'twi' && phrase.labelTwi) return phrase.labelTwi;
    if (language === 'ga' && phrase.labelGa) return phrase.labelGa;
    return phrase.label;
  };

  /**
   * PLAY AUDIO
   */
  const handlePhraseTap = (phrase: Phrase) => {
    const textToSpeak = getActiveText(phrase);
    TTSService.speak(textToSpeak, language as any);
  };

  const handleDelete = (phraseId: string) => {
    Alert.alert(
      "Delete Phrase",
      "Are you sure you want to delete this phrase?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = await PhraseService.deletePhrase(phraseId);
            setPhrases(updated);
          }
        }
      ]
    );
  };

  const openEditModal = (phrase: Phrase) => {
    setEditingId(phrase.id);
    setNewLabel(phrase.label);
    setNewText(phrase.text);
    setNewLabelTwi(phrase.labelTwi || '');
    setNewTextTwi(phrase.textTwi || '');
    setNewLabelGa(phrase.labelGa || '');
    setNewTextGa(phrase.textGa || '');
    setSelectedIcon(phrase.iconName || 'custom');
    setIsModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewLabel('');
    setNewText('');
    setNewLabelTwi('');
    setNewTextTwi('');
    setNewLabelGa('');
    setNewTextGa('');
    setSelectedIcon('custom');
  };

  const handleAddPhrase = async () => {
    if (!newLabel.trim() || !newText.trim()) return;

    if (editingId) {
      // Update existing phrase
      const updated = await PhraseService.updatePhrase(editingId, {
        label: newLabel,
        text: newText,
        labelTwi: newLabelTwi || undefined,
        textTwi: newTextTwi || undefined,
        labelGa: newLabelGa || undefined,
        textGa: newTextGa || undefined,
        iconName: selectedIcon,
      });
      setPhrases(updated);
    } else {
      // Add new phrase
      const updated = await PhraseService.addPhrase({
        category: activeCategory,
        label: newLabel,
        text: newText,
        labelTwi: newLabelTwi || undefined,
        textTwi: newTextTwi || undefined,
        labelGa: newLabelGa || undefined,
        textGa: newTextGa || undefined,
        iconName: selectedIcon,
      });
      setPhrases(updated);
    }

    setIsModalVisible(false);
    resetForm();
  };

  const filteredPhrases = phrases.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Phraseboard" onBack={() => router.back()} />

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
        colors={colors}
      />

      {/* Grid of Phrases */}
      <ScrollView contentContainerStyle={styles.grid}>
        {filteredPhrases.map(phrase => {
          const displayLabel = getActiveLabel(phrase);
          return (
            <PhraseTile
              key={phrase.id}
              phrase={phrase}
              colors={colors}
              onTap={handlePhraseTap}
              onEdit={openEditModal}
              onDelete={handleDelete}
              displayLabel={displayLabel!}
            />
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
        onRequestClose={() => { setIsModalVisible(false); resetForm(); }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingId ? 'Edit Phrase' : 'Add New Phrase'}
                </Text>
                <TouchableOpacity onPress={() => { setIsModalVisible(false); resetForm(); }}>
                  <X size={24} color={colors.subText} />
                </TouchableOpacity>
              </View>

              {/* English Section */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🇬🇧 English (Required)</Text>

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
                multiline
              />

              {/* Twi Section */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>🇬🇭 Twi (Optional)</Text>

              <Text style={[styles.label, { color: colors.subText }]}>Label (Twi)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Nsuo"
                placeholderTextColor={colors.subText}
                value={newLabelTwi}
                onChangeText={setNewLabelTwi}
              />

              <Text style={[styles.label, { color: colors.subText }]}>Spoken Text (Twi)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Mepa kyɛw, mehia nsuo."
                placeholderTextColor={colors.subText}
                value={newTextTwi}
                onChangeText={setNewTextTwi}
                multiline
              />

              {/* Ga Section */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>🇬🇭 Ga (Optional)</Text>

              <Text style={[styles.label, { color: colors.subText }]}>Label (Ga)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Nu"
                placeholderTextColor={colors.subText}
                value={newLabelGa}
                onChangeText={setNewLabelGa}
              />

              <Text style={[styles.label, { color: colors.subText }]}>Spoken Text (Ga)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Ofainɛ, mihe nu."
                placeholderTextColor={colors.subText}
                value={newTextGa}
                onChangeText={setNewTextGa}
                multiline
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary, marginTop: 20 }]}
                onPress={handleAddPhrase}
              >
                <Text style={styles.saveButtonText}>
                  {editingId ? 'Update Phrase' : 'Save Phrase'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

