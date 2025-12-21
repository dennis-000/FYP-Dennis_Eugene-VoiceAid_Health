import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av'; 
import { Mic, ArrowLeft, AlertCircle, Square, Languages, Volume2, Sparkles } from 'lucide-react-native';
import { AppContext } from './_layout';

import { ASRService, ASRResponse } from '../services/asrService';
import { IntentService, IntentResponse } from '../services/intentService';
import { TTSService } from '../services/ttsService';

import LiveWaveform from '../components/LiveWaveform'; 
import ConfidenceMeter from '../components/ConfidenceMeter'; 

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
  
  // State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<ASRResponse | null>(null);
  
  // New Intent State (Object instead of string)
  const [intentData, setIntentData] = useState<IntentResponse | null>(null);
  
  const [meteringLevels, setMeteringLevels] = useState<number[]>([]); 

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') Alert.alert('Permission needed', 'Microphone access is required.');
    })();
    return () => { if (recording) recording.stopAndUnloadAsync(); };
  }, [recording]);

  const startRecording = async () => {
    try {
      setFinalResult(null);
      setIntentData(null); // Clear previous suggestions
      setMeteringLevels([]);

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering) {
            setMeteringLevels(prev => {
              const newLevels = [...prev, status.metering || -160];
              if (newLevels.length > 20) newLevels.shift(); 
              return newLevels;
            });
          }
        },
        100
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Smart Transcribe" onBack={() => router.back()} />
      
      <ScrollView contentContainerStyle={styles.centerContent}>
        
        {/* Language Badge */}
        <View style={[styles.langBadge, { borderColor: colors.primary }]}>
          <Languages size={14} color={colors.primary} style={{ marginRight: 6 }}/>
          <Text style={{ color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase' }}>
             {language === 'auto' ? 'Auto-Detect' : language}
          </Text>
        </View>

        {/* --- TRANSCRIPTION BOX --- */}
        <View style={[styles.transcriptionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {recording && (
            <View style={{ width: '100%', alignItems: 'center' }}>
               <Text style={{ color: colors.primary, marginBottom: 10, fontWeight: 'bold' }}>Listening...</Text>
               <LiveWaveform levels={meteringLevels} isListening={true} />
            </View>
          )}

          {isProcessing && (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
               <ActivityIndicator size="large" color={colors.primary} />
               <Text style={{ color: colors.subText, marginTop: 15 }}>Analyzing with AI...</Text>
            </View>
          )}

          {!recording && !isProcessing && (
             <View style={{ width: '100%' }}>
                {/* Refined Text (Better Grammar) */}
                {intentData?.refinedText && intentData.refinedText !== finalResult?.text && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <Sparkles size={12} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold' }}>AI REFINED</Text>
                  </View>
                )}

                <Text style={[styles.transcriptText, { color: colors.text }]}>
                  {intentData?.refinedText || finalResult?.text || "Tap microphone to speak"}
                </Text>
                
                {finalResult && finalResult.text !== "Error: Could not connect to OpenAI. Check API Key." && (
                   <ConfidenceMeter score={finalResult.confidence} />
                )}
             </View>
          )}
        </View>

        {/* --- PREDICTIVE SUGGESTIONS (The New Feature) --- */}
        {intentData && !recording && !isProcessing && (
          <View style={{ width: '100%', marginBottom: 30 }}>
            
            {/* Category Header */}
            <View style={[styles.intentBadge, { backgroundColor: colors.primary }]}>
              <AlertCircle size={14} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.intentText}>Intent Detected: {intentData.category}</Text>
            </View>

            {/* Quick Phrase Chips */}
            <Text style={{ color: colors.subText, marginBottom: 10, fontWeight: '600' }}>
              Suggested Responses (Tap to Speak):
            </Text>
            
            <View style={styles.chipContainer}>
              {intentData.suggestions.map((suggestion, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.primary }]}
                  onPress={() => handleSpeakSuggestion(suggestion)}
                >
                  <Volume2 size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={{ color: colors.text, fontWeight: '500' }}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </View>
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
  centerContent: { 
    flexGrow: 1, 
    alignItems: 'center', 
    padding: 20 
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20
  },
  transcriptionBox: { 
    width: '100%', 
    minHeight: 180, 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 20, 
    alignItems: 'center',
    justifyContent: 'center', 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  transcriptText: { 
    fontSize: 22, 
    textAlign: 'center', 
    lineHeight: 32,
    fontWeight: '500',
    marginBottom: 10
  },
  
  // Intent & Suggestions
  intentBadge: { 
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    marginBottom: 15 
  },
  intentText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 1,
  },

  // Mic
  micCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});