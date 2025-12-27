import { MoreHorizontal, Volume2 } from 'lucide-react-native';
import React from 'react';
import { Alert, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { ICON_MAP, Phrase } from '../services/phrase';
import { phraseboardStyles as styles } from '../styles/phraseboard.styles';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 60) / 2;

interface PhraseTileProps {
    phrase: Phrase;
    colors: any;
    onTap: (phrase: Phrase) => void;
    onEdit: (phrase: Phrase) => void;
    onDelete: (id: string) => void;
    displayLabel: string;
}

export const PhraseTile: React.FC<PhraseTileProps> = ({
    phrase,
    colors,
    onTap,
    onEdit,
    onDelete,
    displayLabel
}) => {
    const Icon = ICON_MAP[phrase.iconName] || ICON_MAP['custom'];

    return (
        <TouchableOpacity
            onPress={() => onTap(phrase)}
            activeOpacity={0.6}
            style={[
                styles.tile,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    width: TILE_SIZE,
                    height: TILE_SIZE
                }
            ]}
        >
            {/* Three-Dots Menu Button */}
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                        "Manage Phrase",
                        `Edit or delete "${displayLabel}"?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Edit",
                                onPress: () => onEdit(phrase)
                            },
                            {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => onDelete(phrase.id)
                            }
                        ]
                    );
                }}
                style={styles.menuButton}
            >
                <MoreHorizontal size={20} color={colors.subText} />
            </TouchableOpacity>

            <View style={[styles.iconCircle, { backgroundColor: phrase.color ? `${phrase.color}20` : `${colors.primary}20` }]}>
                <Icon size={32} color={phrase.color || colors.primary} />
            </View>

            <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={2}>
                {displayLabel}
            </Text>

            <View style={styles.ttsIcon}>
                <Volume2 size={16} color={colors.subText} />
            </View>
        </TouchableOpacity>
    );
};
