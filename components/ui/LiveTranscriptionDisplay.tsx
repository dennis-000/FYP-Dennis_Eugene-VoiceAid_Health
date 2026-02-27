import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

interface LiveTranscriptionDisplayProps {
    partialText: string;
    finalTexts: string[];
    isListening: boolean;
    confidence?: number;
}

export const LiveTranscriptionDisplay: React.FC<LiveTranscriptionDisplayProps> = ({
    partialText,
    finalTexts,
    isListening,
    confidence = 0,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Fade in animation for new text
    useEffect(() => {
        if (partialText) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [partialText]);

    // Pulse animation for listening indicator
    useEffect(() => {
        if (isListening) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isListening]);

    // Auto-scroll to bottom when new text appears
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [partialText, finalTexts]);

    return (
        <View style={styles.container}>
            {/* Listening Indicator */}
            {isListening && (
                <Animated.View
                    style={[
                        styles.listeningIndicator,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    <View style={styles.listeningDot} />
                    <Text style={styles.listeningText}>Listening...</Text>
                </Animated.View>
            )}

            {/* Transcription Display */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Final Texts */}
                {finalTexts.map((text, index) => (
                    <Text key={index} style={styles.finalText}>
                        {text}
                    </Text>
                ))}

                {/* Partial Text (Live) */}
                {partialText && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text style={styles.partialText}>{partialText}</Text>

                        {/* Confidence Indicator */}
                        {confidence > 0 && (
                            <View style={styles.confidenceContainer}>
                                <View style={styles.confidenceBar}>
                                    <View
                                        style={[
                                            styles.confidenceFill,
                                            {
                                                width: `${confidence * 100}%`,
                                                backgroundColor: getConfidenceColor(confidence),
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.confidenceText}>
                                    {(confidence * 100).toFixed(0)}%
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Empty State */}
                {!isListening && finalTexts.length === 0 && !partialText && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            Tap the microphone to start live transcription
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#10b981'; // Green
    if (confidence >= 0.6) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    listeningIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#eff6ff',
        borderBottomWidth: 1,
        borderBottomColor: '#dbeafe',
    },
    listeningDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        marginRight: 8,
    },
    listeningText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        flexGrow: 1,
    },
    finalText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#111827',
        marginBottom: 12,
        fontWeight: '500',
    },
    partialText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#6b7280',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 12,
    },
    confidenceBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 8,
    },
    confidenceFill: {
        height: '100%',
        borderRadius: 2,
    },
    confidenceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        minWidth: 40,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
});
