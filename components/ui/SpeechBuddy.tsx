import React, { useEffect, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppContext } from '../../app/_layout';
import Animated, { 
    useAnimatedProps, 
    useSharedValue, 
    withRepeat, 
    withSpring, 
    withTiming,
    withDelay,
    Easing,
    interpolate
} from 'react-native-reanimated';
import Svg, { Circle, Path, G } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

interface SpeechBuddyProps {
    state: 'selecting' | 'prepare' | 'active' | 'resting' | 'complete' | 'paused';
    colors: any;
    size?: number;
    category?: 'voice' | 'speech_sound' | 'fluency';
}

export const SpeechBuddy: React.FC<SpeechBuddyProps> = ({ state, colors, size = 180, category = 'voice' }) => {
    const { reduceMotion } = useContext(AppContext);
    
    // Animation Shared Values
    const bodyScale = useSharedValue(1);
    const eyeScaleY = useSharedValue(1);
    const armRotate = useSharedValue(0);

    // Human Trainer Facial Articulation Shared Values
    const eyebrowLift = useSharedValue(0);
    const mouthOpenY = useSharedValue(0.1);
    const mouthPucker = useSharedValue(0);
    const tongueRaise = useSharedValue(0);
    const teethGap = useSharedValue(0.1);

    // Advanced Clinical Trainer Visuals (Leap Workout Inspired)
    const rippleScale1 = useSharedValue(0);
    const rippleScale2 = useSharedValue(0);
    const rippleOpacity1 = useSharedValue(0);
    const rippleOpacity2 = useSharedValue(0);
    
    const cheekSqueeze = useSharedValue(0);
    
    const breathProgress = useSharedValue(0);
    const breathOpacity = useSharedValue(0);

    useEffect(() => {
        // Reset shared values to neutral defaults
        bodyScale.value = 1;
        eyeScaleY.value = 1;
        armRotate.value = 0;
        eyebrowLift.value = 0;
        mouthOpenY.value = 0.1;
        mouthPucker.value = 0;
        tongueRaise.value = 0;
        teethGap.value = 0.1;
        
        rippleScale1.value = 0;
        rippleScale2.value = 0;
        rippleOpacity1.value = 0;
        rippleOpacity2.value = 0;
        
        cheekSqueeze.value = 0;
        
        breathProgress.value = 0;
        breathOpacity.value = 0;

        if (reduceMotion) {
            // Simplified static transitions for reduced motion
            if (state === 'active' || state === 'prepare') {
                bodyScale.value = withTiming(1.04, { duration: 500 });
                eyebrowLift.value = withTiming(-3, { duration: 500 });
                if (category === 'voice') {
                    mouthOpenY.value = withTiming(1, { duration: 500 });
                    mouthPucker.value = withTiming(0, { duration: 500 });
                    tongueRaise.value = withTiming(0, { duration: 500 });
                    teethGap.value = withTiming(0.8, { duration: 500 });
                } else if (category === 'speech_sound') {
                    mouthOpenY.value = withTiming(0.3, { duration: 500 });
                    mouthPucker.value = withTiming(1, { duration: 500 });
                    tongueRaise.value = withTiming(0, { duration: 500 });
                    teethGap.value = withTiming(0.1, { duration: 500 });
                    cheekSqueeze.value = withTiming(1, { duration: 500 });
                } else if (category === 'fluency') {
                    mouthOpenY.value = withTiming(0.4, { duration: 500 });
                    mouthPucker.value = withTiming(0, { duration: 500 });
                    tongueRaise.value = withTiming(0.2, { duration: 500 });
                    teethGap.value = withTiming(0.3, { duration: 500 });
                }
            } else if (state === 'resting') {
                bodyScale.value = withTiming(1.02, { duration: 500 });
                mouthOpenY.value = withTiming(0.1, { duration: 800 });
                mouthPucker.value = withTiming(0, { duration: 800 });
                tongueRaise.value = withTiming(0, { duration: 800 });
                teethGap.value = withTiming(0.1, { duration: 800 });
                eyebrowLift.value = withTiming(0, { duration: 800 });
            } else if (state === 'complete') {
                bodyScale.value = withTiming(1.1, { duration: 500 });
                mouthOpenY.value = withTiming(0.8, { duration: 300 });
                mouthPucker.value = withTiming(0, { duration: 300 });
                tongueRaise.value = withTiming(0.3, { duration: 300 });
                teethGap.value = withTiming(0.5, { duration: 300 });
                eyebrowLift.value = withTiming(-2, { duration: 300 });
                armRotate.value = withTiming(20, { duration: 300 });
            } else {
                bodyScale.value = withTiming(1, { duration: 500 });
                mouthOpenY.value = withTiming(0.1, { duration: 500 });
                mouthPucker.value = withTiming(0, { duration: 500 });
                tongueRaise.value = withTiming(0, { duration: 500 });
                teethGap.value = withTiming(0.1, { duration: 500 });
                eyebrowLift.value = withTiming(0, { duration: 500 });
            }
            return;
        }

        // Standard dynamic repeating animations (Leap Fitness style high-fidelity animations)
        if (state === 'active' || state === 'prepare') {
            eyebrowLift.value = withRepeat(withTiming(-3, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true);
            
            if (category === 'voice') {
                // Energetic pulsating body/head
                bodyScale.value = withRepeat(withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true);
                
                // Wide Open Vowel Mouth ('Ah')
                mouthOpenY.value = withTiming(1, { duration: 400 });
                mouthPucker.value = withTiming(0, { duration: 400 });
                tongueRaise.value = withTiming(0, { duration: 400 });
                teethGap.value = withTiming(0.8, { duration: 400 });

                // Concentric Staggered Sound Waves ripples
                rippleScale1.value = withRepeat(withTiming(1.6, { duration: 1600, easing: Easing.linear }), -1, false);
                rippleOpacity1.value = withRepeat(withTiming(0, { duration: 1600, easing: Easing.linear }), -1, false);
                
                rippleScale2.value = withRepeat(withDelay(800, withTiming(1.6, { duration: 1600, easing: Easing.linear })), -1, false);
                rippleOpacity2.value = withRepeat(withDelay(800, withTiming(0, { duration: 1600, easing: Easing.linear })), -1, false);
            } 
            else if (category === 'speech_sound') {
                // Tense compression hold
                bodyScale.value = withTiming(1.02, { duration: 400 });
                
                // Tight Puckered Mouth Circle (Lip Purser)
                mouthOpenY.value = withTiming(0.3, { duration: 400 });
                mouthPucker.value = withTiming(1, { duration: 400 });
                tongueRaise.value = withTiming(0, { duration: 400 });
                teethGap.value = withTiming(0.1, { duration: 400 });

                // Squeezing facial tension/cheek parentheses curves
                cheekSqueeze.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
            } 
            else if (category === 'fluency') {
                // Deep, slow respiratory rhythm
                bodyScale.value = withRepeat(withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.quad) }), -1, true);
                
                // Relaxed breathing oral slot
                mouthOpenY.value = withTiming(0.4, { duration: 400 });
                mouthPucker.value = withTiming(0, { duration: 400 });
                tongueRaise.value = withTiming(0.2, { duration: 400 });
                teethGap.value = withTiming(0.3, { duration: 400 });

                // Gentle exhalation air vector currents
                breathProgress.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.linear }), -1, false);
                breathOpacity.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.linear }), -1, false);
            }
        } 
        else if (state === 'resting') {
            // Calm slow breathing
            bodyScale.value = withRepeat(withTiming(1.03, { duration: 1500 }), -1, true);
            eyeScaleY.value = withRepeat(withTiming(0.1, { duration: 200, easing: Easing.inOut(Easing.quad) }), -1, true); // Periodic blinks
            
            // Soft smile of relief
            mouthOpenY.value = withTiming(0.1, { duration: 600 });
            mouthPucker.value = withTiming(0, { duration: 600 });
            tongueRaise.value = withTiming(0, { duration: 600 });
            teethGap.value = withTiming(0.1, { duration: 600 });
            eyebrowLift.value = withTiming(0, { duration: 600 });
        } 
        else if (state === 'complete') {
            // Joyful celebration
            bodyScale.value = withRepeat(withSpring(1.12, { damping: 4, stiffness: 100 }), -1, true);
            mouthOpenY.value = withTiming(0.8, { duration: 300 });
            mouthPucker.value = withTiming(0, { duration: 300 });
            tongueRaise.value = withTiming(0.3, { duration: 300 });
            teethGap.value = withTiming(0.5, { duration: 300 });
            eyebrowLift.value = withTiming(-2, { duration: 300 });
            armRotate.value = withRepeat(withSpring(20, { damping: 4, stiffness: 100 }), -1, true);
        } 
        else {
            // Neutral/Idle
            bodyScale.value = withTiming(1, { duration: 500 });
            mouthOpenY.value = withTiming(0.1, { duration: 500 });
            mouthPucker.value = withTiming(0, { duration: 500 });
            tongueRaise.value = withTiming(0, { duration: 500 });
            teethGap.value = withTiming(0.1, { duration: 500 });
            eyebrowLift.value = withTiming(0, { duration: 500 });
        }
    }, [state, category, reduceMotion]);

    // Animated transformations
    const animatedBodyProps = useAnimatedProps(() => ({
        transform: [{ scale: bodyScale.value }]
    }));

    const animatedEyeProps = useAnimatedProps(() => ({
        transform: [{ scaleY: eyeScaleY.value }]
    }));

    const animatedEyebrowProps = useAnimatedProps(() => ({
        transform: [{ translateY: eyebrowLift.value }]
    }));

    // High-Fidelity Human Oral Cavity Background
    const animatedCavityProps = useAnimatedProps(() => {
        const w = interpolate(mouthPucker.value, [0, 1], [26, 10]);
        const h = interpolate(mouthPucker.value, [0, 1], [3 + mouthOpenY.value * 18, 10]);
        const d = `M ${50 - w/2} 66 Q 50 ${66 - h/2} ${50 + w/2} 66 Q 50 ${66 + h/2} ${50 - w/2} 66 Z`;
        return { d };
    });

    // High-Fidelity Human Upper Teeth Row (Arched white crescent)
    const animatedUpperTeethProps = useAnimatedProps(() => {
        const w = interpolate(mouthPucker.value, [0, 1], [26, 10]);
        const h = interpolate(mouthPucker.value, [0, 1], [3 + mouthOpenY.value * 18, 10]);
        const wTeeth = w * 0.85;
        const yTop = 66 - h/2;
        const opacity = interpolate(mouthPucker.value, [0.3, 0.7], [1, 0]); // Hide when puckered
        
        const d = `M ${50 - wTeeth/2} ${66 - h/6} Q 50 ${yTop + 0.8} ${50 + wTeeth/2} ${66 - h/6} Q 50 ${yTop + 3.2} ${50 - wTeeth/2} ${66 - h/6} Z`;
        return { d, opacity };
    });

    // High-Fidelity Human Lower Teeth Row (Arched white crescent)
    const animatedLowerTeethProps = useAnimatedProps(() => {
        const w = interpolate(mouthPucker.value, [0, 1], [26, 10]);
        const h = interpolate(mouthPucker.value, [0, 1], [3 + mouthOpenY.value * 18, 10]);
        const wTeeth = w * 0.8;
        const yBottom = 66 + h/2;
        const teethGapVal = teethGap.value;
        // Fade out when teethGap is small or mouth is puckering
        const opacity = interpolate(mouthPucker.value, [0.3, 0.7], [interpolate(teethGapVal, [0.1, 0.4], [0, 1]), 0]);
        
        const d = `M ${50 - wTeeth/2} ${66 + h/6} Q 50 ${yBottom - 0.8} ${50 + wTeeth/2} ${66 + h/6} Q 50 ${yBottom - 3.2} ${50 - wTeeth/2} ${66 + h/6} Z`;
        return { d, opacity };
    });

    // High-Fidelity Human Tongue (Pink dome morphing)
    const animatedTongueProps = useAnimatedProps(() => {
        const w = interpolate(mouthPucker.value, [0, 1], [26, 10]);
        const h = interpolate(mouthPucker.value, [0, 1], [3 + mouthOpenY.value * 18, 10]);
        const wTongue = w * 0.75;
        const yBottom = 66 + h/2;
        const opacity = interpolate(mouthPucker.value, [0.3, 0.7], [1, 0]); // Hide when puckered
        
        const yTongueTop = (66 + h/3) - (tongueRaise.value * h * 0.45);
        const d = `M ${50 - wTongue/2} ${66 + h/4} Q 50 ${yTongueTop} ${50 + wTongue/2} ${66 + h/4} Q 50 ${yBottom - 1.2} ${50 - wTongue/2} ${66 + h/4} Z`;
        return { d, opacity };
    });

    // High-Fidelity Human Outer Lips (Cupid's bow upper, curved lower)
    const animatedOuterLipProps = useAnimatedProps(() => {
        const w = interpolate(mouthPucker.value, [0, 1], [26, 10]);
        const h = interpolate(mouthPucker.value, [0, 1], [3 + mouthOpenY.value * 18, 10]);
        
        const d = `M ${50 - w/2} 66 C ${50 - w/4} ${66 - h/2 - 1.8}, ${50 - w/8} ${66 - h/2 - 1.8}, 50 ${66 - h/2} C ${50 + w/8} ${66 - h/2 - 1.8}, ${50 + w/4} ${66 - h/2 - 1.8}, ${50 + w/2} 66 Q 50 ${66 + h/2 + 1.8} ${50 - w/2} 66 Z`;
        return { d };
    });

    // Leap Fitness SVG overlays
    const ripple1Props = useAnimatedProps(() => {
        const radius = interpolate(rippleScale1.value, [0, 1.6], [6, 42]);
        return { r: radius, opacity: rippleOpacity1.value };
    });

    const ripple2Props = useAnimatedProps(() => {
        const radius = interpolate(rippleScale2.value, [0, 1.6], [6, 42]);
        return { r: radius, opacity: rippleOpacity2.value };
    });

    const cheekLeftProps = useAnimatedProps(() => {
        const xOffset = interpolate(cheekSqueeze.value, [0, 1], [29, 35]);
        const d = `M ${xOffset} 58 Q ${xOffset + 4} 66 ${xOffset} 74`;
        return { d, opacity: cheekSqueeze.value };
    });

    const cheekRightProps = useAnimatedProps(() => {
        const xOffset = interpolate(cheekSqueeze.value, [0, 1], [71, 65]);
        const d = `M ${xOffset} 58 Q ${xOffset - 4} 66 ${xOffset} 74`;
        return { d, opacity: cheekSqueeze.value };
    });

    const breathLeftProps = useAnimatedProps(() => {
        const progress = breathProgress.value;
        const opacity = breathOpacity.value;
        const yStart = 66;
        const yEnd = interpolate(progress, [0, 1], [66, 90]);
        const xStart = 45;
        const xEnd = interpolate(progress, [0, 1], [40, 15]);
        const cpX = interpolate(progress, [0, 1], [43, 22]);
        const cpY = interpolate(progress, [0, 1], [72, 82]);
        
        const d = `M ${xStart} ${yStart} Q ${cpX} ${cpY} ${xEnd} ${yEnd}`;
        return { d, opacity };
    });

    const breathRightProps = useAnimatedProps(() => {
        const progress = breathProgress.value;
        const opacity = breathOpacity.value;
        const yStart = 66;
        const yEnd = interpolate(progress, [0, 1], [66, 90]);
        const xStart = 55;
        const xEnd = interpolate(progress, [0, 1], [60, 85]);
        const cpX = interpolate(progress, [0, 1], [57, 78]);
        const cpY = interpolate(progress, [0, 1], [72, 82]);
        
        const d = `M ${xStart} ${yStart} Q ${cpX} ${cpY} ${xEnd} ${yEnd}`;
        return { d, opacity };
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg viewBox="0 0 100 100" width={size} height={size}>
                {/* Body Shadow */}
                <Circle cx="50" cy="88" r="32" fill="rgba(0,0,0,0.06)" />

                {/* Vocal Ripples Soundwaves (Voice Exercise Only) */}
                {(state === 'active' || state === 'prepare') && category === 'voice' && (
                    <G>
                        <AnimatedCircle cx="50" cy="66" stroke="rgba(198, 134, 66, 0.4)" strokeWidth="2" fill="transparent" animatedProps={ripple1Props} />
                        <AnimatedCircle cx="50" cy="66" stroke="rgba(198, 134, 66, 0.2)" strokeWidth="1.5" fill="transparent" animatedProps={ripple2Props} />
                    </G>
                )}

                {/* Flowing breath waves (Fluency Exercise Only) */}
                {(state === 'active' || state === 'prepare') && category === 'fluency' && (
                    <G>
                        <AnimatedPath stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" fill="transparent" animatedProps={breathLeftProps} />
                        <AnimatedPath stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" fill="transparent" animatedProps={breathRightProps} />
                    </G>
                )}

                {/* Main Human Body/Head Group - Scales organically as a single unit */}
                <AnimatedG animatedProps={animatedBodyProps} originX={50} originY={85}>
                    {/* Ears */}
                    <Path d="M 28 40 C 22 40, 22 52, 28 52 Z" fill="#8d5524" />
                    <Path d="M 72 40 C 78 40, 78 52, 72 52 Z" fill="#8d5524" />

                    {/* Neck */}
                    <Path d="M 38 72 L 36 90 Q 50 92 64 90 L 62 72 Z" fill="#8d5524" />

                    {/* Shirt Collar / Shoulder Base */}
                    <Path d="M 22 88 Q 50 94 78 88 L 82 100 L 18 100 Z" fill="#1e293b" />

                    {/* African Kente accent on shirt collar */}
                    <Path d="M 38 90 Q 50 93 62 90 L 60 95 Q 50 97 40 95 Z" fill="#e11d48" /> {/* Red Kente Base */}
                    <Path d="M 40 92 Q 50 95 60 92 L 58 95 Q 50 97 42 95 Z" fill="#fbbf24" /> {/* Gold Kente Accent */}

                    {/* Face Shape (Head & Structured Chin) */}
                    <Path 
                        d="M 30 35 C 30 18, 70 18, 70 35 C 70 56, 68 76, 50 82 C 32 76, 30 56, 30 35 Z" 
                        fill="#c68642"
                    />

                    {/* Modern Hairstyle */}
                    <Path 
                        d="M 28 36 C 28 14, 72 14, 72 36 C 73 30, 71 25, 68 25 C 64 25, 62 28, 58 26 C 54 24, 48 24, 44 26 C 40 28, 36 25, 32 25 C 29 25, 27 30, 28 36 Z" 
                        fill="#111" 
                    />

                    {/* Eyes */}
                    <G transform="translate(38, 46)">
                        <AnimatedG animatedProps={animatedEyeProps}>
                            {/* Sclera */}
                            <Path d="M -6 0 C -3 -4, 3 -4, 6 0 C 3 4, -3 4, -6 0 Z" fill="#fff" />
                            {/* Iris */}
                            <Circle cx="0" cy="0" r="2.3" fill="#4f46e5" />
                            {/* Pupil */}
                            <Circle cx="0" cy="0" r="1.1" fill="#111" />
                            {/* Highlight */}
                            <Circle cx="0.8" cy="-0.8" r="0.6" fill="#fff" />
                        </AnimatedG>
                    </G>
                    <G transform="translate(62, 46)">
                        <AnimatedG animatedProps={animatedEyeProps}>
                            {/* Sclera */}
                            <Path d="M -6 0 C -3 -4, 3 -4, 6 0 C 3 4, -3 4, -6 0 Z" fill="#fff" />
                            {/* Iris */}
                            <Circle cx="0" cy="0" r="2.3" fill="#4f46e5" />
                            {/* Pupil */}
                            <Circle cx="0" cy="0" r="1.1" fill="#111" />
                            {/* Highlight */}
                            <Circle cx="0.8" cy="-0.8" r="0.6" fill="#fff" />
                        </AnimatedG>
                    </G>

                    {/* Eyebrows */}
                    <AnimatedG animatedProps={animatedEyebrowProps}>
                        <Path d="M 32 40 Q 38 37 44 41" stroke="#111" strokeWidth="2.2" strokeLinecap="round" fill="transparent" />
                        <Path d="M 56 41 Q 62 37 68 40" stroke="#111" strokeWidth="2.2" strokeLinecap="round" fill="transparent" />
                    </AnimatedG>

                    {/* Detailed Nose */}
                    <Path 
                        d="M 49 44 L 48 57 Q 48 60 50 60 Q 52 60 52 57" 
                        stroke="#8d5524" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        fill="transparent" 
                        opacity={0.6} 
                    />
                    <Circle cx="50" cy="57" r="1.2" fill="#e0ac69" opacity={0.4} />

                    {/* Rosy Cheeks / Blush */}
                    <Circle cx="34" cy="56" r="3.5" fill="#e11d48" opacity={0.15} />
                    <Circle cx="66" cy="56" r="3.5" fill="#e11d48" opacity={0.15} />

                    {/* Articulating Mouth Cavity (Dark) */}
                    <AnimatedPath animatedProps={animatedCavityProps} fill="#2c0f0a" />

                    {/* White Teeth rows inside the cavity */}
                    <AnimatedPath animatedProps={animatedUpperTeethProps} fill="#ffffff" />
                    <AnimatedPath animatedProps={animatedLowerTeethProps} fill="#ffffff" />

                    {/* Pink Tongue inside the cavity */}
                    <AnimatedPath animatedProps={animatedTongueProps} fill="#f472b6" />

                    {/* Outer Lips outlining the mouth */}
                    <AnimatedPath 
                        animatedProps={animatedOuterLipProps}
                        stroke="#d87d8c" 
                        strokeWidth={3.2} 
                        strokeLinecap="round" 
                        fill="none"
                    />

                    {/* Facial tension parenthesis curves (Speech sound Lip Purser Only) */}
                    {(state === 'active' || state === 'prepare') && category === 'speech_sound' && (
                        <G>
                            <AnimatedPath stroke="#e0ac69" strokeWidth="2" strokeLinecap="round" fill="transparent" animatedProps={cheekLeftProps} />
                            <AnimatedPath stroke="#e0ac69" strokeWidth="2" strokeLinecap="round" fill="transparent" animatedProps={cheekRightProps} />
                        </G>
                    )}
                </AnimatedG>

                {/* Hat or accessory celebrating complete */}
                {state === 'complete' && (
                    <G transform="translate(50, 18)">
                        {/* Beautiful party hat with gold star */}
                        <Path d="M -12 6 L 0 -18 L 12 6 Z" fill="#e11d48" />
                        <Circle cx="0" cy="-18" r="3" fill="#fbbf24" />
                        <Circle cx="-15" cy="-5" r="1.5" fill="#fbbf24" />
                        <Circle cx="15" cy="-5" r="1.5" fill="#fbbf24" />
                    </G>
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
