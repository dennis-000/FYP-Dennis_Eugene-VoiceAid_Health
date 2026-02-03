import { AlertCircle, Volume2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { IntentResponse } from '../services/intent';
import { transcriptStyles as styles } from '../styles/transcript.styles';

interface IntentSuggestionsProps {
    intentData: IntentResponse | null;
    onSuggestionPress: (text: string) => void;
    colors: any;
}

export const IntentSuggestions: React.FC<IntentSuggestionsProps> = ({ intentData, onSuggestionPress, colors }) => {
    if (!intentData) return null;

    return (
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
                        onPress={() => onSuggestionPress(suggestion)}
                    >
                        <Volume2 size={16} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.text, fontWeight: '500' }}>{suggestion}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};
