import React, { useEffect, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppContext } from '../../app/_layout';
import Animated, { 
    useAnimatedProps, 
    useSharedValue, 
    withRepeat, 
    withSpring, 
    withTiming,
    Easing,
    interpolate
} from 'react-native-reanimated';
import Svg, { Circle, Path, G } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

interface SpeechBuddyProps {
    state: 'selecting' | 'active' | 'resting' | 'complete' | 'paused';
    colors: any;
    size?: number;
}

export const SpeechBuddy: React.FC<SpeechBuddyProps> = ({ state, colors, size = 180 }) => {
    const { reduceMotion } = useContext(AppContext);
    // Animation Values
    const bodyScale = useSharedValue(1);
    const eyeScaleY = useSharedValue(1);
    const mouthWidth = useSharedValue(20);
    const mouthHeight = useSharedValue(10);
    const armRotate = useSharedValue(0);

    useEffect(() => {
        // Reset animations
        bodyScale.value = 1;
        eyeScaleY.value = 1;
        armRotate.value = 0;
        
        if (reduceMotion) {
            // Simplified static transitions for reduced motion
            if (state === 'active') {
                bodyScale.value = withTiming(1.05, { duration: 500 });
                mouthWidth.value = withTiming(30, { duration: 500 });
                mouthHeight.value = withTiming(20, { duration: 500 });
            } else if (state === 'resting') {
                bodyScale.value = withTiming(1.02, { duration: 500 });
                mouthWidth.value = withTiming(15, { duration: 800 });
                mouthHeight.value = withTiming(2, { duration: 800 });
            } else if (state === 'complete') {
                bodyScale.value = withTiming(1.1, { duration: 500 });
                mouthWidth.value = withTiming(35, { duration: 300 });
                mouthHeight.value = withTiming(25, { duration: 300 });
                armRotate.value = withTiming(20, { duration: 300 });
            } else {
                bodyScale.value = withTiming(1, { duration: 500 });
                mouthWidth.value = withTiming(20, { duration: 500 });
                mouthHeight.value = withTiming(5, { duration: 500 });
            }
            return;
        }

        // Standard dynamic repeating animations
        if (state === 'active') {
            // Pulsing during exercise
            bodyScale.value = withRepeat(withTiming(1.05, { duration: 1000 }), -1, true);
            mouthWidth.value = withTiming(30, { duration: 500 });
            mouthHeight.value = withTiming(20, { duration: 500 }); // Open mouth
        } else if (state === 'resting') {
            // Relaxed breathing
            bodyScale.value = withRepeat(withTiming(1.02, { duration: 1500 }), -1, true);
            eyeScaleY.value = withRepeat(withTiming(0.1, { duration: 200, easing: Easing.inOut(Easing.quad) }), -1, true); // Blinking
            mouthWidth.value = withTiming(15, { duration: 800 });
            mouthHeight.value = withTiming(2, { duration: 800 }); // Smile line
        } else if (state === 'complete') {
            // Joyful jumping
            bodyScale.value = withRepeat(withSpring(1.1), -1, true);
            mouthWidth.value = withTiming(35, { duration: 300 });
            mouthHeight.value = withTiming(25, { duration: 300 });
            armRotate.value = withRepeat(withSpring(20), -1, true);
        } else {
            // Neutral/Idle
            bodyScale.value = withTiming(1, { duration: 500 });
            mouthWidth.value = withTiming(20, { duration: 500 });
            mouthHeight.value = withTiming(5, { duration: 500 });
        }
    }, [state, reduceMotion]);

    const animatedBodyProps = useAnimatedProps(() => ({
        transform: [{ scale: bodyScale.value }]
    }));

    const animatedMouthProps = useAnimatedProps(() => {
        const h = mouthHeight.value;
        const w = mouthWidth.value;
        // Simple d path for a rounded mouth
        const d = `M ${50 - w/2} 65 Q 50 ${65 + h} ${50 + w/2} 65`;
        return { d };
    });

    const animatedEyeProps = useAnimatedProps(() => ({
        transform: [{ scaleY: eyeScaleY.value }]
    }));

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg viewBox="0 0 100 100" width={size} height={size}>
                {/* Body Shadow */}
                <Circle cx="50" cy="85" r="30" fill="rgba(0,0,0,0.05)" />

                <AnimatedG animatedProps={animatedBodyProps}>
                    {/* Main Body - A friendly blob/pill shape */}
                    <Path 
                        d="M 30 40 C 30 20, 70 20, 70 40 L 70 70 C 70 85, 30 85, 30 70 Z" 
                        fill={state === 'active' ? colors.primary : state === 'resting' ? '#f59e0b' : state === 'complete' ? '#10b981' : colors.primary + 'CC'} 
                    />

                    {/* Eyes */}
                    <G transform="translate(40, 45)">
                        <AnimatedCircle animatedProps={animatedEyeProps} r="4" fill="#fff" />
                    </G>
                    <G transform="translate(60, 45)">
                        <AnimatedCircle animatedProps={animatedEyeProps} r="4" fill="#fff" />
                    </G>

                    {/* Mouth */}
                    <AnimatedPath 
                        animatedProps={animatedMouthProps}
                        stroke="#fff" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        fill="transparent"
                    />

                    {/* Rosy Cheeks */}
                    <Circle cx="35" cy="55" r="4" fill="rgba(255,255,255,0.3)" />
                    <Circle cx="65" cy="55" r="4" fill="rgba(255,255,255,0.3)" />
                </AnimatedG>

                {/* Hat or accessory (optional, but makes it cute) */}
                {state === 'complete' && (
                    <Path d="M 40 25 L 50 10 L 60 25 Z" fill="#fbbf24" transform="rotate(-15, 50, 20)" />
                )}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
