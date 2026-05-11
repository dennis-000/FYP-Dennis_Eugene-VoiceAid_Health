import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'primary' | 'accent';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    variant = 'default'
}) => {
    const getSolidColor = (): any => {
        switch (variant) {
            case 'primary':
                return 'rgba(110, 97, 243, 0.15)';
            case 'accent':
                return 'rgba(38, 142, 227, 0.15)';
            default:
                return 'rgba(255, 255, 255, 0.08)';
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.gradient, { backgroundColor: getSolidColor() }]}>
                <View style={styles.content}>
                    {children}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    gradient: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
});
