import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, Globe, Mic, Square } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from './_layout';

import { ASRResponse, ASRService } from '../services/asr';
import { HistoryService } from '../services/historyService';
import { IntentResponse, IntentService } from '../services/intent';
import { TTSService } from '../services/tts';

import { IntentSuggestions } from '../components/IntentSuggestions';
import { TranscriptionDisplay } from '../components/TranscriptionDisplay';
import { useRole } from '../contexts/RoleContext';
import { AudioPreprocessingService, ENHANCED_RECORDING_OPTIONS } from '../services/audioPreprocessingService';
import { transcriptStyles as styles } from '../styles/transcript.styles';

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

export default function TranscriptionScreen() {
  const router = useRouter();
  const { colors, language } = useContext(AppContext);
  const { role } = useRole();

  // State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<ASRResponse | null>(null);

  // New Intent State (Object instead of string)
  const [intentData, setIntentData] = useState<IntentResponse | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Audio quality state
  const [meteringLevels, setMeteringLevels] = useState<number[]>([]);
  const [audioQualityMetrics, setAudioQualityMetrics] = useState({
    averageLevel: -160,
    peakLevel: -160,
    isTooQuiet: false,
    isTooLoud: false,
    hasConsistentInput: true,
  });

  // Request microphone permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') Alert.alert('Permission needed', 'Microphone access is required.');
    })();
  }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(err => {
          // Silently handle if already stopped
          console.log('[Recording Cleanup] Already stopped:', err);
        });
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      setFinalResult(null);
      setIntentData(null); // Clear previous suggestions
      setMeteringLevels([]);

      // Use enhanced audio configuration
      await AudioPreprocessingService.configureAudioSession();

      const { recording } = await Audio.Recording.createAsync(
        ENHANCED_RECORDING_OPTIONS,
        (status) => {
          if (status.metering) {
            setMeteringLevels(prev => {
              const newLevels = [...prev, status.metering || -160];
              if (newLevels.length > 25) newLevels.shift();

              // Update audio quality metrics in real-time
              const quality = AudioPreprocessingService.analyzeAudioQuality(newLevels);
              setAudioQualityMetrics(quality);

              return newLevels;
            });
          }
        },
        100 // Update every 100ms for smooth visualization
      );
      setRecording(recording);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not start microphone.");
    }
  };

  const stopAndTranscribe = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        setIsProcessing(true);

        // 1. Get Text from Audio
        const result = await ASRService.processAudio(uri, language as any);
        setFinalResult(result);

        // 2. Get Intelligent Suggestions based on text
        // (Even if text is "water... need", AI will find intent)
        const prediction = await IntentService.predictIntent(result.text);
        setIntentData(prediction);

        // 3. Save to History
        await HistoryService.addLog({
          text: result.text,
          intentCategory: prediction.category,
          detectedLanguage: result.detectedLanguage
        });

        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to process audio.");
    }
  };

  const handleSpeakSuggestion = (text: string) => {
    TTSService.speak(text, language as any);
  };

  // Editing state - now handled in component, only need update handler
  const handleUpdateResult = (text: string) => {
    if (finalResult) {
      setFinalResult(prev => prev ? ({ ...prev, text }) : null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Smart Transcribe" onBack={() => router.back()} />

      {/* Caregiver Helper Banner */}
      {role === 'caregiver' && !recording && !finalResult && (
        <View style={[styles.helperBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <AlertCircle size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.helperTitle, { color: colors.primary }]}>
              Assisted Communication Mode
            </Text>
            <Text style={[styles.helperText, { color: colors.text }]}>
              • Record patient speech • Edit text • Play aloud for medical team
            </Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.centerContent}>

        {/* Language Badge */}
        <View style={[styles.langBadge, { borderColor: colors.primary }]}>
          <Globe size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase' }}>
            {finalResult?.detectedLanguage && finalResult.detectedLanguage !== 'auto'
              ? `Detected: ${finalResult.detectedLanguage}`
              : (language === 'auto' ? 'Auto-Detect' : language)}
          </Text>
        </View>

        {/* --- TRANSCRIPTION BOX --- */}
        <TranscriptionDisplay
          recording={recording}
          isProcessing={isProcessing}
          finalResult={finalResult}
          intentData={intentData}
          meteringLevels={meteringLevels}
          audioQualityMetrics={audioQualityMetrics}
          colors={colors}
          language={language as string}
          onUpdateResult={handleUpdateResult}
          onUpdateIntent={setIntentData}
        />

        {/* --- PREDICTIVE SUGGESTIONS (The New Feature) --- */}
        {intentData && !recording && !isProcessing && (
          <IntentSuggestions
            intentData={intentData}
            onSuggestionPress={handleSpeakSuggestion}
            colors={colors}
          />
        )}

        {/* Mic Control */}
        <TouchableOpacity
          style={[
            styles.micCircle,
            {
              backgroundColor: recording ? colors.danger : colors.primary,
              shadowColor: colors.text
            }
          ]}
          onPress={recording ? stopAndTranscribe : startRecording}
          activeOpacity={0.7}
        >
          {recording ? (
            <Square size={32} color="#FFF" fill="#FFF" />
          ) : (
            <Mic size={40} color="#FFF" />
          )}
        </TouchableOpacity>

        <Text style={{ color: colors.subText, marginTop: 15, fontSize: 16, marginBottom: 40 }}>
          {recording ? "Tap to Process" : "Tap to Speak"}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

