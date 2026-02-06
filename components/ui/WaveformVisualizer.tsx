import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

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
    const barAnimations = Array.from({ length: bars }, () => useSharedValue(0.3));

    useEffect(() => {
        if (isActive) {
            barAnimations.forEach((anim, index) => {
                anim.value = withRepeat(
                    withSequence(
                        withTiming(1, {
                            duration: 400 + index * 100,
                            easing: Easing.inOut(Easing.ease),
                        }),
                        withTiming(0.3, {
                            duration: 400 + index * 100,
                            easing: Easing.inOut(Easing.ease),
                        })
                    ),
                    -1,
                    false
                );
            });
        } else {
            barAnimations.forEach((anim) => {
                anim.value = withTiming(0.3, { duration: 200 });
            });
        }
    }, [isActive]);

    return (
        <View style={styles.container}>
            {barAnimations.map((anim, index) => {
                const animatedStyle = useAnimatedStyle(() => ({
                    height: `${anim.value * 100}%`,
                }));

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.bar,
                            { backgroundColor: color },
                            animatedStyle,
                        ]}
                    />
                );
            })}
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
