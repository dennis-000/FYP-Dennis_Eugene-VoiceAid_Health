/**
 * First-Time App Tour Overlay
 * Shows a step-by-step walkthrough for new patients explaining key features.
 * Tracked via AsyncStorage — only shows once per install.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mic, MessageSquare, BookOpen, Phone, Settings, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const TOUR_KEY = '@voiceaid_tour_completed';

interface TourStep {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        icon: Mic,
        title: 'Speak & Transcribe',
        description: 'Tap the microphone to start speaking. Your speech is transcribed in real-time, even with a speech impairment.',
        color: '#3B82F6',
    },
    {
        icon: MessageSquare,
        title: 'Smart Phrases',
        description: 'Use the phraseboard for quick medical phrases in Twi, Ga, or English. The app suggests phrases based on the time of day.',
        color: '#10B981',
    },
    {
        icon: BookOpen,
        title: 'Track Your Progress',
        description: 'Your speech sessions are tracked automatically. View your word count, streaks, and improvement over time.',
        color: '#8B5CF6',
    },
    {
        icon: Phone,
        title: 'Emergency SOS',
        description: 'In an emergency, use the SOS button to instantly alert your caregiver or nearby hospital.',
        color: '#EF4444',
    },
    {
        icon: Settings,
        title: 'Customize Everything',
        description: 'Adjust language, voice speed, text size, and dark mode in Settings. The app adapts to your needs.',
        color: '#F59E0B',
    },
];

interface AppTourProps {
    onComplete: () => void;
    colors: any;
}

export function AppTour({ onComplete, colors }: AppTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        // Animate step transitions
        slideAnim.setValue(20);
        fadeAnim.setValue(0.5);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        await AsyncStorage.setItem(TOUR_KEY, 'true');
        onComplete();
    };

    const step = TOUR_STEPS[currentStep];
    const Icon = step.icon;
    const isLast = currentStep === TOUR_STEPS.length - 1;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {/* Skip button */}
                <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
                    <X size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Icon */}
                <View style={[styles.iconCircle, { backgroundColor: step.color + '15' }]}>
                    <Icon size={36} color={step.color} />
                </View>

                {/* Content */}
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.description}>{step.description}</Text>

                {/* Progress dots */}
                <View style={styles.dots}>
                    {TOUR_STEPS.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { backgroundColor: i === currentStep ? step.color : '#E5E7EB' },
                                i === currentStep && { width: 24 },
                            ]}
                        />
                    ))}
                </View>

                {/* Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.nextBtn, { backgroundColor: step.color }]}
                    activeOpacity={0.85}
                >
                    <Text style={styles.nextText}>
                        {isLast ? "Let's Go! 🎉" : 'Next'}
                    </Text>
                </TouchableOpacity>

                {/* Step counter */}
                <Text style={styles.counter}>{currentStep + 1} of {TOUR_STEPS.length}</Text>
            </Animated.View>
        </View>
    );
}

/**
 * Check if the tour has been completed before.
 */
export async function shouldShowTour(): Promise<boolean> {
    try {
        const completed = await AsyncStorage.getItem(TOUR_KEY);
        return completed !== 'true';
    } catch {
        return true;
    }
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 24,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 32,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 10,
    },
    skipBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    dots: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 28,
    },
    dot: {
        height: 6,
        width: 6,
        borderRadius: 3,
    },
    nextBtn: {
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    nextText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    counter: {
        marginTop: 16,
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});
