import { useAudioRecorder, useAudioRecorderState, RecordingPresets, AudioModule } from 'expo-audio';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mic, Share2, Square, Volume2 } from 'lucide-react-native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Animated,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LiveTranscriptionDisplay } from '../components/ui/LiveTranscriptionDisplay';
import { TranscriptMessage } from '../components/ui/TranscriptMessage';
import { WaveformVisualizer } from '../components/ui/WaveformVisualizer';
import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';
import { ASRService } from '../services/asr';
import { streamingASRService } from '../services/asr/streaming';
import { AnalyticsService } from '../services/analyticsService';
import { AudioPreprocessingService, ENHANCED_RECORDING_OPTIONS } from '../services/audioPreprocessingService';
import { HistoryService } from '../services/historyService';
import { Prediction, getCombinedPredictions } from '../services/prediction';
import { getTranslationsSync, Language } from '../services/translationService';
import { TTSService } from '../services/tts';
import { SupportedTTSLanguage } from '../services/tts/config';
import { haptics } from '../utils/haptics';
import { AppContext } from './_layout';
import { supabase } from '../lib/supabase';
import KenteAccent from '../components/KenteAccent';
import { useNetworkStatus } from '../utils/network';

const Header = ({ title, onBack, onShare, colors }: { title: string, onBack: () => void, onShare?: () => void, colors: any }) => {
  return (
    <View style={{ backgroundColor: colors.card }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: 'transparent', height: 60 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        {onShare ? (
          <TouchableOpacity onPress={onShare} style={styles.backBtn}>
            <Share2 size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: -4, marginBottom: 4 }}>
        <KenteAccent />
      </View>
    </View>
  );
};

interface Message {
  id: string;
  text: string;
  predictedText?: string;
  type: 'user' | 'system';
  timestamp: string;
}

export default function TranscriptionScreen() {
  const router = useRouter();
  const { colors, language, reduceMotion: hapticEnabled } = useContext(AppContext);
  const isOnline = useNetworkStatus();
  const { role } = useRole();
  const t = getTranslationsSync(language as Language);
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 100);

  const recording = audioRecorder.isRecording ? audioRecorder : null;
  const chunkIntervalRef = useRef<any>(null);

  // Metering levels sync
  useEffect(() => {
    if (audioRecorder.isRecording && typeof recorderState.metering === 'number') {
      setMeteringLevels(prev => {
        const newLevels = [...prev, recorderState.metering || -160];
        return newLevels.slice(-20);
      });
    }
  }, [recorderState.metering, audioRecorder.isRecording]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

  // Live streaming state
  const [isLiveMode, setIsLiveMode] = useState(true); // Default to live mode
  const [liveTranscript, setLiveTranscript] = useState('');
  const [livePredictedTranscript, setLivePredictedTranscript] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'error'>('connected');
  const [errorMessage, setErrorMessage] = useState('');

  // Blinking animation for live indicator
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Audio quality state
  const [meteringLevels, setMeteringLevels] = useState<number[]>([]);

  // Session tracking for analytics
  const sessionStartRef = useRef<number>(0);

  // Prediction state
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const predictionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Caregiver Patient Selection
  const { therapistProfile } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [assignedPatients, setAssignedPatients] = useState<{id: string, name: string}[]>([]);

  // Trigger predictions whenever the live transcript changes (with 1.2s debounce)
  useEffect(() => {
    if (predictionTimerRef.current) clearTimeout(predictionTimerRef.current);
    if (!liveTranscript || liveTranscript.trim().length < 2) {
      setPredictions([]);
      return;
    }
    predictionTimerRef.current = setTimeout(() => {
      // Use only the last 12 words for predictions — the full accumulated transcript
      // gets polluted with noise/hallucinations and gives irrelevant suggestions.
      const recentWords = liveTranscript.trim().split(/\s+/).slice(-12).join(' ');
      getCombinedPredictions(recentWords, language as string, setPredictions);
    }, 1200); // 1.2s debounce — fast enough for live speech, slow enough to avoid flicker
    return () => { if (predictionTimerRef.current) clearTimeout(predictionTimerRef.current); };
  }, [liveTranscript, language]);

  // Clear predictions when streaming stops
  useEffect(() => {
    if (!isStreaming) {
      setPredictions([]);
      setSelectedPrediction(null);
    }
  }, [isStreaming]);

  // Handle tapping a prediction chip
  const handlePredictionTap = useCallback((text: string) => {
    if (selectedPrediction === text) {
      // Second tap = send & speak
      handleSendPrediction(text);
    } else {
      // First tap = show confirm bar
      setSelectedPrediction(text);
    }
  }, [selectedPrediction]);

  const handleSendPrediction = useCallback(async (text: string) => {
    setSelectedPrediction(null);
    setPredictions([]);
    // Add as message
    const newMessage: Message = {
      id: Date.now().toString(),
      text: liveTranscript || text,
      predictedText: text,
      type: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
    setLiveTranscript('');
    setLivePredictedTranscript('');
    // Speak the predicted text aloud
    await TTSService.speak(text, language as SupportedTTSLanguage);
  }, [liveTranscript, language]);

  // Play welcome message on mount
  useEffect(() => {
    if (!hasPlayedWelcome) {
      playWelcomeMessage();
      setHasPlayedWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (role === 'caregiver' && therapistProfile?.assigned_patients) {
        loadAssignedPatients();
    }
  }, [role, therapistProfile]);

  const loadAssignedPatients = async () => {
      try {
          const { data } = await supabase
              .from('patient_profiles')
              .select('user_id, full_name')
              .in('user_id', therapistProfile?.assigned_patients || []);
          if (data) {
              setAssignedPatients(data.map(p => ({ id: p.user_id, name: p.full_name || 'Unnamed' })));
              if (data.length > 0) setSelectedPatientId(data[0].user_id);
          }
      } catch (e) {
          console.error('Failed to load assigned patients', e);
      }
  };

  const playWelcomeMessage = async () => {
    try {
      await TTSService.speak(t.transcript.welcomeMessage, language as SupportedTTSLanguage);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Exactly 2 seconds pause
      await TTSService.speak(t.transcript.startConversation, language as SupportedTTSLanguage);
    } catch (error) {
      console.log('Could not play welcome message:', error);
    }
  };

  // Request microphone permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await AudioModule.requestRecordingPermissionsAsync();
      if (status !== 'granted') Alert.alert('Permission needed', 'Microphone access is required.');
    })();
  }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      console.log('[TranscriptScreen] Unmounting - cleaning up recording');
      isStreamingRef.current = false;
      TTSService.stop().catch(() => {});
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
      }
      if (audioRecorder.isRecording) {
        audioRecorder.stop().catch(() => {});
      }
    };
  }, []); // Empty dependency array = runs only on mount/unmount

  // Permission check on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await AudioModule.requestRecordingPermissionsAsync();
        console.log('[TranscriptScreen] Audio permission status:', status);
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Microphone access is needed for transcription.');
        }
      } catch (err) {
        console.error('[TranscriptScreen] Failed to ask permission:', err);
      }
    })();
  }, []);

  const startRecording = async () => {
    console.log('[TranscriptScreen] startRecording called');
    try {
      setMeteringLevels([]);

      // ── GUARD: Stop any existing recording before creating a new one ──
      if (audioRecorder.isRecording) {
        try {
          await audioRecorder.stop();
        } catch (_) {
          // Ignore
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('[TranscriptScreen] Configuring audio session...');
      await AudioPreprocessingService.configureAudioSession();
      console.log('[TranscriptScreen] Audio session configured');

      if (!isStreamingRef.current && isStreaming) {
          console.log('[TranscriptScreen] Stream stopped during config. Aborting.');
          return null;
      }

      await audioRecorder.prepareToRecordAsync({
        ...RecordingPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      await audioRecorder.record();

      console.log('[TranscriptScreen] Recording started successfully');
      return audioRecorder;
    } catch (err) {
      console.error('[Recording Error]', err);
      Alert.alert('Error', 'Could not start recording: ' + (err as any).message);
      return null;
    }
  };


  const stopAndTranscribe = async () => {
    if (!audioRecorder.isRecording) return;

    try {
      setIsProcessing(true);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

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
          predictedText: result.predicted_text,
          type: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);

        // Save to history (attribute to selected patient if caregiver)
        await HistoryService.saveTranscription({
          text: result.text,
          detectedLanguage: result.detectedLanguage || language as string,
          timestamp: new Date().toISOString(),
          targetUserId: selectedPatientId || undefined // Pass the target patient ID
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

  // Live streaming transcription
  const startLiveTranscription = async () => {
    try {
      setIsStreaming(true);
      isStreamingRef.current = true;
      sessionStartRef.current = Date.now();
      if (hapticEnabled) haptics.medium();
      setLiveTranscript('');
      setLivePredictedTranscript('');
      setConnectionState('connecting');
      setErrorMessage('');

      // Connect to WebSocket
      await streamingASRService.connect(
        language as string,
        (result) => {
          if (!isStreamingRef.current) return;
          setConnectionState('connected');
          console.log('[Live ASR] ✅ RECEIVED TRANSCRIPTION:', result.text);
          console.log('[Live ASR] Chunk ID:', result.chunkId, 'Model:', result.model);
          setLiveTranscript(prev => prev + ' ' + result.text);
          if (result.predicted_text) {
              setLivePredictedTranscript(prev => prev + ' ' + result.predicted_text);
          }
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 50);
        },
        (error) => {
          console.error('[Live ASR] Error:', error.error);
          setConnectionState('error');
          setErrorMessage(error.error || "Connection lost");
        }
      );

      // Start initial recording
      const rec = await startRecording();
      if (!rec) {
        console.error('[Live ASR] Failed to start initial recording');
        throw new Error('Recording failed to start');
      }

      // Chunk loop (Record -> Stop -> Send -> Delay -> Record)
      const chunkInterval = setInterval(async () => {
        if (!isStreamingRef.current) {
            clearInterval(chunkIntervalRef.current);
            return;
        }

        if (audioRecorder.isRecording) {
          try {
            // Check metering levels for VAD (Voice Activity Detection)
            // If levels are extremely low, it's silence or background noise
            const isSpeech = AudioPreprocessingService.isSpeechDetected(meteringLevels);
            
            // 1. Stop current
            await audioRecorder.stop();
            const uri = audioRecorder.uri;

            // 2. Send chunk ONLY if speech was detected OR chunk id is 0 (to keep connection alive)
            if (uri && isStreamingRef.current) {
              if (isSpeech || (audioRecorder as any)._chunkCounter === 0) {
                console.log('[Live ASR] Sending chunk (Speech detected)...');
                streamingASRService.sendAudioChunk(uri).catch(err =>
                  console.error('[Live ASR] Send error:', err)
                );
              } else {
                console.log('[Live ASR] 🤫 Silence detected, skipping chunk to prevent hallucination');
              }
            }

            // 3. Reset metering for next chunk
            setMeteringLevels([]);

            // 4. Small delay to let audio system reset (Fixes setAudioSource failed)
            await new Promise(resolve => setTimeout(resolve, 50));

            // 5. Start new recording if still streaming
            if (isStreamingRef.current) {
                await startRecording();
            }

          } catch (error) {
            console.error('[Live ASR] Chunking error:', error);
            // Try to recover by restarting recording if it failed
            if (!audioRecorder.isRecording && isStreamingRef.current) {
              await new Promise(resolve => setTimeout(resolve, 500));
              await startRecording();
            }
          }
        }
      }, 5000); // 5-second chunks — gives speech-impaired speakers time to complete words/phrases

      // Store interval for cleanup
      chunkIntervalRef.current = chunkInterval;

    } catch (error: any) {
      console.error('[Live ASR] Failed to start:', error);
      setConnectionState('error');
      setErrorMessage(error.message || 'Could not connect to live server');
      Alert.alert('Error', 'Could not start live transcription');
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  };

  const stopLiveTranscription = async () => {
    console.log('[Live ASR] stopLiveTranscription called'); // Stack trace might be noisy in RN, simple log first
    try {
      setIsStreaming(false);
      isStreamingRef.current = false;
      
      // Clear interval
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      // Stop current recording
      if (audioRecorder.isRecording) {
        try {
          await audioRecorder.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      }

      // Wait briefly for any in-flight transcription responses before disconnecting
      console.log('[Live ASR] Waiting for pending responses (CPU processing)...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Disconnect WebSocket
      streamingASRService.disconnect();

      // Save final transcript
      if (liveTranscript.trim()) {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: liveTranscript.trim(),
          predictedText: livePredictedTranscript.trim(),
          type: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);

        await HistoryService.saveTranscription({
          text: liveTranscript.trim(),
          detectedLanguage: language as string,
          timestamp: new Date().toISOString(),
        });
      }

      // Log analytics
      const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const wordCount = liveTranscript.trim().split(/\s+/).filter(Boolean).length;
      await AnalyticsService.logSession({
        duration: sessionDuration,
        wordCount,
        messageCount: messages.length + (liveTranscript.trim() ? 1 : 0),
        language: language as string,
        mode: 'streaming',
      });
      if (hapticEnabled) haptics.success();

      setLiveTranscript('');
      setLivePredictedTranscript('');
      setIsStreaming(false);
    } catch (error) {
      console.error('[Live ASR] Failed to stop:', error);
      setIsStreaming(false);
    }
  };

  // ── Feature 4: Share/Export transcript ──
  const handleShareTranscript = async () => {
    if (messages.length === 0) {
      Alert.alert('Nothing to share', 'Record a session first.');
      return;
    }
    if (hapticEnabled) haptics.light();
    const lines = messages.map(m => {
      const prefix = m.type === 'user' ? '🗣️ Patient' : '🤖 System';
      const predicted = m.predictedText ? `\n   → Predicted: "${m.predictedText}"` : '';
      return `[${m.timestamp}] ${prefix}: ${m.text}${predicted}`;
    });
    const transcript = `VoiceAid Health — Session Transcript\n${new Date().toLocaleDateString()}\n${'─'.repeat(40)}\n\n${lines.join('\n\n')}`;
    try {
      await Share.share({ message: transcript, title: 'VoiceAid Transcript' });
    } catch (e) { console.error('Share error:', e); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title={t.transcript.title} onBack={() => router.back()} onShare={handleShareTranscript} colors={colors} />

      {/* ASR Connection Status Pill */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, flexDirection: 'row' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: isOnline ? '#e6fdfa' : '#fef2f2',
          borderColor: isOnline ? '#0d9488' : '#fca5a5',
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? '#0d9488' : '#ef4444' }} />
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: isOnline ? '#0f766e' : '#b91c1c' }}>
            {isOnline ? '🟢 Dysarthria Model Online' : '🟡 Offline ASR Mode'}
          </Text>
        </View>
      </View>

      {/* Caregiver Patient Selector */}
      {role === 'caregiver' && assignedPatients.length > 0 && (
          <View style={[styles.patientSelector, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.selectorLabel, { color: colors.subText }]}>ASSISTING PATIENT:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientsRow}>
                  {assignedPatients.map(p => (
                      <TouchableOpacity 
                          key={p.id} 
                          onPress={() => setSelectedPatientId(p.id)}
                          style={[
                              styles.patientPill, 
                              selectedPatientId === p.id ? { backgroundColor: colors.primary } : { backgroundColor: colors.bg, borderColor: colors.border }
                          ]}
                      >
                          <Text style={[styles.patientPillText, { color: selectedPatientId === p.id ? '#FFF' : colors.text }]}>{p.name}</Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        {messages.length === 0 && !recording && !isProcessing && (
          <View style={styles.emptyState}>
            <View style={[styles.welcomeCard, { backgroundColor: colors.card, borderColor: colors.border + '50' }]}>
              <TouchableOpacity
                onPress={playWelcomeMessage}
                style={[styles.playButton, { backgroundColor: colors.primary + '15' }]}
                activeOpacity={0.7}
              >
                <Volume2 size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t.transcript.welcomeMessage}</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.subText }]}>{t.transcript.startConversation}</Text>
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <TranscriptMessage
            key={message.id}
            text={message.text}
            predictedText={message.predictedText}
            type={message.type}
            timestamp={message.timestamp}
            onPlay={() => TTSService.speak(message.predictedText || message.text, language as SupportedTTSLanguage)}
          />
        ))}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text style={[styles.processingText, { color: colors.subText }]}>{t.transcript.processing}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.card, borderTopColor: colors.border + '50' }]}>
        {/* Mode Toggle */}
        <View style={[styles.modeToggleContainer, { backgroundColor: colors.border + '30' }]}>
          <TouchableOpacity
            style={[styles.modeButton, !isLiveMode && [styles.modeButtonActive, { backgroundColor: colors.primary }]]}
            onPress={() => setIsLiveMode(false)}
            disabled={!!(recording || isStreaming)}
          >
            <Text style={[styles.modeButtonText, { color: colors.subText }, !isLiveMode && styles.modeButtonTextActive]}>
              {t.transcript.batchMode}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isLiveMode && [styles.modeButtonActive, { backgroundColor: colors.primary }]]}
            onPress={() => setIsLiveMode(true)}
            disabled={!!(recording || isStreaming)}
          >
            <Animated.View style={{ opacity: isLiveMode ? blinkAnim : 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, color: isLiveMode ? (colors.bg === '#111111' ? '#111111' : '#FFFFFF') : colors.subText }}>🔴</Text>
              <Text style={[styles.modeButtonText, { color: colors.subText }, isLiveMode && styles.modeButtonTextActive]}>
                {t.transcript.liveMode}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Live Transcript Display */}
        {isStreaming && (
          <LiveTranscriptionDisplay
            text={liveTranscript}
            predictedText={livePredictedTranscript}
            isStreaming={isStreaming}
            connectionState={connectionState}
            errorMessage={errorMessage}
          />
        )}

        {/* ✨ Prediction Chips — shown while patient is speaking */}
        {isStreaming && predictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            <Text style={styles.predictionsLabel}>✨ Suggestions</Text>
            <View style={styles.chipsRow}>
              {predictions.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.chip,
                    p.source === 'ai' && styles.chipAI,
                    selectedPrediction === p.text && styles.chipSelected,
                  ]}
                  onPress={() => handlePredictionTap(p.text)}
                  activeOpacity={0.75}
                >
                  {p.source === 'ai' && <Text style={styles.chipBadge}>AI </Text>}
                  <Text style={[
                    styles.chipText,
                    selectedPrediction === p.text && styles.chipTextSelected,
                  ]} numberOfLines={2}>{p.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Confirm bar — shown after first tap */}
            {selectedPrediction && (
              <View style={styles.confirmBar}>
                <Text style={styles.confirmText} numberOfLines={2}>📢 "{selectedPrediction}"</Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.confirmSendBtn}
                    onPress={() => handleSendPrediction(selectedPrediction)}
                  >
                    <Text style={styles.confirmSendText}>Send & Speak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDismissBtn}
                    onPress={() => setSelectedPrediction(null)}
                  >
                    <Text style={styles.confirmDismissText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Waveform */}
        {(recording || isStreaming) && (
          <View style={styles.waveformContainer}>
            <WaveformVisualizer isActive={!!(recording || isStreaming)} levels={meteringLevels} />
          </View>
        )}

        {/* Mic Button */}
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
            (recording || isStreaming) && [styles.micButtonActive, { backgroundColor: colors.danger, shadowColor: colors.danger }],
          ]}
          onPress={() => {
            if (hapticEnabled) haptics.medium();
            if (isLiveMode) {
              isStreaming ? stopLiveTranscription() : startLiveTranscription();
            } else {
              recording ? stopAndTranscribe() : startRecording();
            }
          }}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          {(recording || isStreaming) ? (
            <Square size={36} color={colors.bg === '#111111' ? '#111111' : '#FFFFFF'} fill={colors.bg === '#111111' ? '#111111' : '#FFFFFF'} />
          ) : (
            <Mic size={44} color={colors.bg === '#111111' ? '#111111' : '#FFFFFF'} />
          )}
        </TouchableOpacity>

        <Text style={[styles.statusText, { color: colors.subText }]}>
          {(recording || isStreaming)
            ? (isLiveMode ? t.transcript.tapToStopLive : t.transcript.tapToProcess)
            : (isLiveMode ? t.transcript.tapToStartLive : t.transcript.tapToSpeak)
          }
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
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  // ✨ Prediction Chip Styles
  predictionsContainer: {
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#f8f7ff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  predictionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#c7d2fe',
    maxWidth: '100%',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chipAI: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  chipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  chipBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    flexShrink: 1,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  confirmBar: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 10,
    lineHeight: 18,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmSendBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmSendText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmDismissBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmDismissText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 13,
  },
  patientSelector: {
      padding: 12,
      borderBottomWidth: 1,
      backgroundColor: '#fff',
  },
  selectorLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 1,
  },
  patientsRow: {
      gap: 8,
      paddingRight: 16,
  },
  patientPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
  },
  patientPillText: {
      fontSize: 13,
      fontWeight: '600',
  }
});

