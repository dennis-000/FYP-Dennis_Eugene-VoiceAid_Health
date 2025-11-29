import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { AppContext } from './_layout';

// Import Services (Separation of Concerns)
import { ASRService } from '../services/asrService';
import { IntentService } from '../services/intentService';

/**
 * ==========================================
 * LOCAL COMPONENT: HEADER
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

/**
 * ==========================================
 * TRANSCRIPTION SCREEN
 * ==========================================
 */
export default function TranscriptionScreen() {
  const router = useRouter();
  const { colors, language } = useContext(AppContext);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [intent, setIntent] = useState<string | null>(null);

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setTranscript("Listening...");
    setIntent(null);

    // Call External Service
    try {
      // 1. Get Transcription
      const result = await ASRService.startListening(language);
      setTranscript(result);
      setIsListening(false);
      
      // 2. Predict Intent (Logic handled in service)
      const predicted = IntentService.predictIntent(result);
      setIntent(predicted);

    } catch (e: any) {
      // Handle errors (e.g., no speech detected)
      setTranscript(e.toString() || "Error capturing audio.");
      setIsListening(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Live Speech" onBack={() => router.back()} />
      
      <View style={styles.centerContent}>
        
        {/* Language Badge */}
        <View style={[styles.langBadge, { borderColor: colors.primary }]}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase' }}>
            Input: {language}
          </Text>
        </View>

        {/* Visual Feedback / Transcript Area */}
        <View style={[styles.transcriptionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isListening ? (
             <View style={{ alignItems: 'center', justifyContent: 'center', height: 100 }}>
               <ActivityIndicator size="large" color={colors.primary} />
               <Text style={{ color: colors.subText, marginTop: 10 }}>Processing Audio...</Text>
             </View>
          ) : (
            <Text style={[styles.transcriptText, { color: colors.text }]}>
              {transcript || "Tap microphone to start speaking..."}
            </Text>
          )}
        </View>

        {/* Intent Prediction Bubble */}
        {intent && !isListening && (
          <View style={[styles.intentBadge, { backgroundColor: colors.primary }]}>
            <AlertCircle size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.intentText}>Detected Intent: {intent}</Text>
          </View>
        )}

        {/* Mic Control */}
        <TouchableOpacity 
          style={[
            styles.micCircle, 
            { 
              backgroundColor: isListening ? colors.danger : colors.primary,
              shadowColor: colors.text 
            }
          ]}
          onPress={toggleListening}
          activeOpacity={0.7}
        >
          <Mic size={40} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={{ color: colors.subText, marginTop: 15, fontSize: 16 }}>
          {isListening ? "Tap to stop" : "Tap to speak"}
        </Text>

      </View>
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
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  
  // Elements
  langBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20
  },
  transcriptionBox: { 
    width: '100%', 
    minHeight: 200, 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  transcriptText: { 
    fontSize: 24, 
    textAlign: 'center', 
    lineHeight: 34,
    fontWeight: '500' 
  },
  
  // Intent
  intentBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 24, 
    marginBottom: 40 
  },
  intentText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 14 
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