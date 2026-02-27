import { Copy } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TranscriptMessageProps {
    text: string;
    type: 'user' | 'system';
    timestamp?: string;
    onCopy?: () => void;
}

export const TranscriptMessage: React.FC<TranscriptMessageProps> = ({
    text,
    type,
    timestamp,
    onCopy,
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

                {timestamp && (
                    <Text style={styles.timestamp}>{timestamp}</Text>
                )}
            </View>

            {onCopy && (
                <TouchableOpacity
                    onPress={onCopy}
                    style={styles.copyButton}
                    activeOpacity={0.7}
                >
                    <Copy size={16} color="#6b7280" />
                </TouchableOpacity>
            )}
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
    copyButton: {
        marginTop: 4,
        padding: 4,
    },
});
