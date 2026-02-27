import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface LiveTranscriptionDisplayProps {
    text: string;
    isStreaming: boolean;
    connectionState?: 'connecting' | 'connected' | 'error';
    errorMessage?: string;
}

const AnimatedWord = ({ word }: { word: string }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(4)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <Animated.Text style={[styles.word, { opacity, transform: [{ translateY }] }]}>
            {word}{' '}
        </Animated.Text>
    );
};

export const LiveTranscriptionDisplay: React.FC<LiveTranscriptionDisplayProps> = ({
    text,
    isStreaming,
    connectionState = 'connected',
    errorMessage
}) => {
    const words = text.split(' ').filter(w => w.length > 0);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isStreaming) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isStreaming]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>Live Transcription</Text>
                {isStreaming && (
                    <View style={styles.statusContainer}>
                        <Animated.View style={[
                            styles.dot,
                            {
                                opacity: pulseAnim,
                                backgroundColor: connectionState === 'error' ? '#ef4444' : connectionState === 'connecting' ? '#f59e0b' : '#10b981'
                            }
                        ]} />
                        <Text style={styles.statusText}>
                            {connectionState === 'error' ? 'Offline' : connectionState === 'connecting' ? 'Connecting...' : 'Live'}
                        </Text>
                    </View>
                )}
            </View>

            {connectionState === 'error' && errorMessage && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            )}

            <View style={styles.textContainer}>
                {words.length > 0 ? (
                    words.map((word, index) => <AnimatedWord key={index} word={word} />)
                ) : (
                    <Text style={styles.placeholderText}>
                        {connectionState === 'connected' ? 'Listening... (Speak now)' : 'Waiting for connection...'}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6366f1',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ffffff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
    },
    errorContainer: {
        backgroundColor: '#fee2e2',
        padding: 8,
        borderRadius: 6,
        marginBottom: 12,
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 12,
    },
    textContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    word: {
        fontSize: 16,
        color: '#111827',
        lineHeight: 24,
    },
    placeholderText: {
        fontSize: 16,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
});
