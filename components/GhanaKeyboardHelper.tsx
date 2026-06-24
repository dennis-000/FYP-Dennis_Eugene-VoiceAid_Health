import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface GhanaKeyboardHelperProps {
    value: string;
    onChangeText: (text: string) => void;
    selection?: { start: number; end: number };
    onSelectionChange?: (sel: { start: number; end: number }) => void;
    colors: {
        bg: string;
        card: string;
        text: string;
        subText: string;
        primary: string;
        accent: string;
        border: string;
    };
    label?: string;
}

export default function GhanaKeyboardHelper({
    value = '',
    onChangeText,
    selection,
    onSelectionChange,
    colors,
    label = 'Twi & Ga Keys:'
}: GhanaKeyboardHelperProps) {
    const chars = ['ɛ', 'ɔ', 'ŋ', 'Ɛ', 'Ɔ', 'Ŋ'];

    const handlePressChar = (char: string) => {
        const start = selection?.start ?? value.length;
        const end = selection?.end ?? value.length;

        const before = value.substring(0, start);
        const after = value.substring(end);
        const newValue = before + char + after;

        onChangeText(newValue);

        // Advance cursor position
        const newIdx = start + char.length;
        if (onSelectionChange) {
            onSelectionChange({ start: newIdx, end: newIdx });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {label ? <Text style={[styles.title, { color: colors.subText }]}>{label}</Text> : null}
            <View style={styles.charRow}>
                {chars.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[styles.charKey, { backgroundColor: colors.bg, borderColor: colors.border }]}
                        onPress={() => handlePressChar(c)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.charText, { color: colors.text }]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 12,
        marginVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    charRow: {
        flexDirection: 'row',
        gap: 6,
    },
    charKey: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    charText: {
        fontSize: 18,
        fontWeight: '700',
    }
});
