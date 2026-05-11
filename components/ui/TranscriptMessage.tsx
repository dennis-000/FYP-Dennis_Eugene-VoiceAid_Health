import { Copy, Sparkles, Volume2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TranscriptMessageProps {
    text: string;
    predictedText?: string;
    type: 'user' | 'system';
    timestamp?: string;
    onCopy?: () => void;
    onPlay?: () => void;
}

export const TranscriptMessage: React.FC<TranscriptMessageProps> = ({
    text,
    predictedText,
    type,
    timestamp,
    onCopy,
    onPlay,
}) => {
    const isUser = type === 'user';

    return (
        <View
            style={[
                styles.container,
                isUser ? styles.userContainer : styles.systemContainer,
            ]}
        >
            <View
                style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.systemBubble,
                ]}
            >
                <Text style={[styles.text, isUser ? styles.userText : styles.systemText]}>
                    {text}
                </Text>

                {predictedText && predictedText !== text && (
                    <View style={styles.predictionContainer}>
                        <Sparkles size={14} color="#8b5cf6" style={styles.sparkleIcon} />
                        <Text style={styles.predictionText}>
                            {predictedText}
                        </Text>
                    </View>
                )}

                {timestamp && (
                    <Text style={styles.timestamp}>{timestamp}</Text>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                {onPlay && (
                    <TouchableOpacity
                        onPress={onPlay}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                    >
                        <Volume2 size={16} color="#6b7280" />
                    </TouchableOpacity>
                )}
                
                {onCopy && (
                    <TouchableOpacity
                        onPress={onCopy}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                    >
                        <Copy size={16} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        paddingHorizontal: 16,
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    systemContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userBubble: {
        backgroundColor: '#eff6ff',
        borderBottomRightRadius: 4,
    },
    systemBubble: {
        backgroundColor: '#f3f4f6',
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
    },
    userText: {
        color: '#1e40af',
    },
    systemText: {
        color: '#374151',
    },
    timestamp: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 4,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 8,
    },
    actionButton: {
        padding: 4,
    },
    predictionContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(139, 92, 246, 0.2)', // Light purple border 
        gap: 6,
    },
    sparkleIcon: {
        marginTop: 2,
    },
    predictionText: {
        fontSize: 15,
        color: '#6d28d9', // Deep Violet color for the AI 
        fontStyle: 'italic',
        fontWeight: '500',
        flexShrink: 1,
        lineHeight: 20,
    },
});
