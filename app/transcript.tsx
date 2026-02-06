import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mic, Square, Volume2 } from 'lucide-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AppContext } from './_layout';

import { ASRService } from '../services/asr';
import { HistoryService } from '../services/historyService';
import { getTranslationsSync, Language } from '../services/translationService';
import { TTSService } from '../services/tts';

import { TranscriptMessage } from '../components/ui/TranscriptMessage';
import { WaveformVisualizer } from '../components/ui/WaveformVisualizer';
import { useRole } from '../contexts/RoleContext';
import { AudioPreprocessingService, ENHANCED_RECORDING_OPTIONS } from '../services/audioPreprocessingService';

const Header = ({ title, onBack }: { title: string, onBack: () => void }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

interface Message {
  id: string;
  text: string;
  type: 'user' | 'system';
  timestamp: string;
}

export default function TranscriptionScreen() {
  const router = useRouter();
  const { colors, language } = useContext(AppContext);
  const { role } = useRole();
  const t = getTranslationsSync(language as Language);
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

  // Audio quality state
  const [meteringLevels, setMeteringLevels] = useState<number[]>([]);

  // Play welcome message on mount
  useEffect(() => {
    if (!hasPlayedWelcome) {
      playWelcomeMessage();
      setHasPlayedWelcome(true);
    }
  }, []);

  const playWelcomeMessage = async () => {
    try {
      await TTSService.speak(t.transcript.welcomeMessage, language as string);
    } catch (error) {
      console.log('Could not play welcome message:', error);
    }
  };

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
          console.log('[Recording Cleanup] Already stopped:', err);
        });
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      setMeteringLevels([]);

      await AudioPreprocessingService.configureAudioSession();

      const { recording } = await Audio.Recording.createAsync(
        ENHANCED_RECORDING_OPTIONS,
        (status) => {
          if (status.metering) {
            setMeteringLevels(prev => {
              const newLevels = [...prev, status.metering || -160];
              return newLevels.slice(-20); // Keep last 20 levels
            });
          }
        }
      );

      setRecording(recording);
    } catch (err) {
      console.error('[Recording Error]', err);
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopAndTranscribe = async () => {
    if (!recording) return;

    try {
      setIsProcessing(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        Alert.alert('Error', 'No audio recorded');
        setIsProcessing(false);
        return;
      }

      // Transcribe
      const result = await ASRService.transcribe(uri, language as string);

      if (result.text) {
        // Add user message
        const newMessage: Message = {
          id: Date.now().toString(),
          text: result.text,
          type: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);

        // Save to history
        await HistoryService.saveTranscription({
          text: result.text,
          detectedLanguage: result.detectedLanguage || language as string,
          timestamp: new Date().toISOString(),
        });

        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      setIsProcessing(false);
    } catch (err) {
      console.error('[Transcription Error]', err);
      Alert.alert('Error', 'Could not transcribe audio');
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t.transcript.title} onBack={() => router.back()} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        {messages.length === 0 && !recording && !isProcessing && (
          <View style={styles.emptyState}>
            <View style={styles.welcomeCard}>
              <TouchableOpacity
                onPress={playWelcomeMessage}
                style={styles.playButton}
                activeOpacity={0.7}
              >
                <Volume2 size={24} color="#6366f1" />
              </TouchableOpacity>
              <Text style={styles.welcomeTitle}>{t.transcript.welcomeMessage}</Text>
              <Text style={styles.welcomeSubtitle}>{t.transcript.startConversation}</Text>
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <TranscriptMessage
            key={message.id}
            text={message.text}
            type={message.type}
            timestamp={message.timestamp}
          />
        ))}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>{t.transcript.processing}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Waveform */}
        {recording && (
          <View style={styles.waveformContainer}>
            <WaveformVisualizer isActive={!!recording} levels={meteringLevels} />
          </View>
        )}

        {/* Mic Button */}
        <TouchableOpacity
          style={[
            styles.micButton,
            recording && styles.micButtonActive,
          ]}
          onPress={recording ? stopAndTranscribe : startRecording}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          {recording ? (
            <Square size={32} color="#FFF" fill="#FFF" />
          ) : (
            <Mic size={40} color="#FFF" />
          )}
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {recording ? t.transcript.tapToProcess : t.transcript.tapToSpeak}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  processingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  waveformContainer: {
    marginBottom: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});
