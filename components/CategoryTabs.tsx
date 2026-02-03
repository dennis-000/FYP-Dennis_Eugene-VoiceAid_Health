import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CategoryId, PHRASE_CATEGORIES } from '../services/phrase';
import { phraseboardStyles as styles } from '../styles/phraseboard.styles';

interface CategoryTabsProps {
    activeCategory: CategoryId;
    onCategorySelect: (id: CategoryId) => void;
    colors: any; // Ideally typed from Theme
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, onCategorySelect, colors }) => {
    return (
        <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {PHRASE_CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => onCategorySelect(cat.id as CategoryId)}
                        style={[
                            styles.tab,
                            {
                                backgroundColor: activeCategory === cat.id ? colors.primary : colors.card,
                                borderColor: activeCategory === cat.id ? colors.primary : colors.border,
                            }
                        ]}
                    >
                        <Text style={{
                            color: activeCategory === cat.id ? '#FFF' : colors.text,
                            fontWeight: 'bold'
                        }}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};
