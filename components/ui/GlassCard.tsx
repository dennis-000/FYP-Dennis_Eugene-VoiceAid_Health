import { LinearGradient } from 'expo-linear-gradient';
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
    const getGradientColors = () => {
        switch (variant) {
            case 'primary':
                return ['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.15)'];
            case 'accent':
                return ['rgba(6, 182, 212, 0.15)', 'rgba(99, 102, 241, 0.15)'];
            default:
                return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
        }
    };

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    {children}
                </View>
            </LinearGradient>
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
