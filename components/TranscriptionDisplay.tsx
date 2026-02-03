import { Audio } from 'expo-av';
import { Check, Edit3, Mic, Sparkles, Volume2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ASRResponse } from '../services/asr';
import { IntentResponse, IntentService } from '../services/intent';
import { TTSService } from '../services/tts';
import { transcriptStyles as styles } from '../styles/transcript.styles';

import AudioQualityIndicator from './AudioQualityIndicator';
import ConfidenceMeter from './ConfidenceMeter';
import LiveWaveform from './LiveWaveform';

interface TranscriptionDisplayProps {
    recording: Audio.Recording | null;
    isProcessing: boolean;
    finalResult: ASRResponse | null;
    intentData: IntentResponse | null;
    meteringLevels: number[];
    audioQualityMetrics: any;
    colors: any;
    language: string;
    onUpdateResult: (text: string) => void;
    onUpdateIntent: (data: IntentResponse) => void; // To update logic if needed
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
    recording,
    isProcessing,
    finalResult,
    intentData,
    meteringLevels,
    audioQualityMetrics,
    colors,
    language,
    onUpdateResult,
    onUpdateIntent
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');

    // Editing functions
    const handleEnableEdit = () => {
        setEditedText(finalResult?.text || '');
        setIsEditing(true);
    };

    const handleApplyRefined = () => {
        if (intentData?.refinedText) {
            setEditedText(intentData.refinedText);
        }
    };

    const handleConfirmEdit = () => {
        if (editedText.trim()) {
            onUpdateResult(editedText.trim());
            setIsEditing(false);
            // Optional: Re-analyze intent with edited text
            IntentService.predictIntent(editedText.trim()).then(onUpdateIntent);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedText('');
    };

    return (
        <View style={[styles.transcriptionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recording && (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={{ color: colors.primary, marginBottom: 10, fontWeight: 'bold' }}>Listening...</Text>
                    <LiveWaveform levels={meteringLevels} isListening={true} />

                    {/* Real-time Audio Quality Feedback */}
                    <AudioQualityIndicator
                        averageLevel={audioQualityMetrics.averageLevel}
                        peakLevel={audioQualityMetrics.peakLevel}
                        isTooQuiet={audioQualityMetrics.isTooQuiet}
                        isTooLoud={audioQualityMetrics.isTooLoud}
                        hasConsistentInput={audioQualityMetrics.hasConsistentInput}
                        isRecording={true}
                    />
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
                    {/* Editable Text Section */}
                    {finalResult?.text && (
                        <>
                            {/* Header with Edit Button */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Mic size={14} color={colors.text} style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 12, color: colors.subText, fontWeight: '600' }}>
                                        {isEditing ? 'EDIT TEXT:' : 'WHAT YOU SAID:'}
                                    </Text>
                                </View>

                                {!isEditing && (
                                    <TouchableOpacity
                                        onPress={handleEnableEdit}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            backgroundColor: colors.primary,
                                            borderRadius: 6,
                                        }}
                                    >
                                        <Edit3 size={14} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Text Display or Input */}
                            {isEditing ? (
                                <>
                                    <TextInput
                                        style={[
                                            styles.transcriptTextInput,
                                            {
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderColor: colors.primary,
                                            },
                                        ]}
                                        value={editedText}
                                        onChangeText={setEditedText}
                                        multiline
                                        autoFocus
                                        placeholder="Edit transcription..."
                                        placeholderTextColor={colors.subText}
                                    />

                                    {/* Action Buttons */}
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                        {/* Apply AI Refined Button */}
                                        {intentData?.refinedText && intentData.refinedText !== editedText && (
                                            <TouchableOpacity
                                                onPress={handleApplyRefined}
                                                style={{
                                                    flex: 1,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    paddingVertical: 12,
                                                    backgroundColor: colors.primary + '20',
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: colors.primary,
                                                }}
                                            >
                                                <Sparkles size={16} color={colors.primary} style={{ marginRight: 6 }} />
                                                <Text style={{ color: colors.primary, fontWeight: '600' }}>Use AI Version</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Confirm Button */}
                                        <TouchableOpacity
                                            onPress={handleConfirmEdit}
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingVertical: 12,
                                                backgroundColor: colors.success,
                                                borderRadius: 8,
                                            }}
                                        >
                                            <Check size={16} color="#FFF" style={{ marginRight: 6 }} />
                                            <Text style={{ color: '#FFF', fontWeight: '600' }}>Confirm</Text>
                                        </TouchableOpacity>

                                        {/* Cancel Button */}
                                        <TouchableOpacity
                                            onPress={handleCancelEdit}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                                backgroundColor: colors.border,
                                                borderRadius: 8,
                                            }}
                                        >
                                            <Text style={{ color: colors.text }}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <Text style={[styles.transcriptText, { color: colors.text, marginBottom: 15 }]}>
                                    "{finalResult.text}"
                                </Text>
                            )}
                        </>
                    )}

                    {/* AI Refined Version - Show only when not editing */}
                    {!isEditing && intentData?.refinedText && intentData.refinedText !== finalResult?.text && (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Sparkles size={14} color={colors.primary} style={{ marginRight: 6 }} />
                                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold' }}>
                                    AI REFINED (BETTER GRAMMAR):
                                </Text>
                            </View>

                            <Text style={[styles.transcriptText, { color: colors.primary, marginBottom: 15 }]}>
                                "{intentData.refinedText}"
                            </Text>
                        </>
                    )}

                    {/* Confidence Score */}
                    {finalResult && !finalResult.text.includes("Connection Failed") && (
                        <>
                            <ConfidenceMeter
                                score={finalResult.confidence}
                                hasNoise={finalResult.hasNoiseDetected}
                                languageConfidence={finalResult.languageConfidence}
                            />

                            {/* SPEAK ALOUD BUTTON */}
                            {!isEditing && (
                                <TouchableOpacity
                                    onPress={() => TTSService.speak(finalResult.text, language as any)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: 16,
                                        paddingHorizontal: 24,
                                        backgroundColor: colors.success,
                                        borderRadius: 12,
                                        marginTop: 15,
                                        marginBottom: 20,
                                        elevation: 3,
                                        shadowColor: colors.success,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 4,
                                    }}
                                >
                                    <Volume2 size={24} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>
                                        Speak Aloud
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
};
