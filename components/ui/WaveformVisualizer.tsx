import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface WaveformVisualizerProps {
    isActive: boolean;
    levels?: number[];
    color?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
    isActive,
    levels = [],
    color = '#6366f1',
}) => {
    const bars = 5;
    const barAnimations = useRef(
        Array.from({ length: bars }, () => new Animated.Value(0.3))
    ).current;

    useEffect(() => {
        if (isActive) {
            const animations = barAnimations.map((anim, index) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 400 + index * 100,
                            useNativeDriver: false,
                        }),
                        Animated.timing(anim, {
                            toValue: 0.3,
                            duration: 400 + index * 100,
                            useNativeDriver: false,
                        }),
                    ])
                )
            );

            animations.forEach(anim => anim.start());

            return () => {
                animations.forEach(anim => anim.stop());
            };
        } else {
            barAnimations.forEach((anim) => {
                Animated.timing(anim, {
                    toValue: 0.3,
                    duration: 200,
                    useNativeDriver: false,
                }).start();
            });
        }
    }, [isActive]);

    return (
        <View style={styles.container}>
            {barAnimations.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.bar,
                        { backgroundColor: color },
                        {
                            height: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['12%', '100%'],
                            }),
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        gap: 4,
    },
    bar: {
        width: 4,
        borderRadius: 2,
        minHeight: 4,
    },
});
