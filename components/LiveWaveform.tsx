import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { THEMES } from '../constants/theme';

interface LiveWaveformProps {
  levels: number[]; // Array of audio metering levels (0 to -160)
  isListening: boolean;
}

export default function LiveWaveform({ levels, isListening }: LiveWaveformProps) {
  // Create a fixed number of bars to render
  const barCount = 25;
  const bars = Array(barCount).fill(0);

  // Animated values for each bar
  const animatedHeights = useRef(
    bars.map(() => new Animated.Value(10))
  ).current;

  // Pulse animation for idle state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening) {
      // Pulse animation when not listening
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  useEffect(() => {
    if (isListening && levels.length > 0) {
      // Animate each bar based on audio levels
      animatedHeights.forEach((animHeight, index) => {
        const currentLevel = levels[index % levels.length] || -160;

        // Convert level to percentage height (10% to 100%)
        let height = (1 + (currentLevel / 160)) * 100;

        // Clamp height
        height = Math.max(10, Math.min(100, height));

        Animated.spring(animHeight, {
          toValue: height,
          friction: 8,
          tension: 100,
          useNativeDriver: false,
        }).start();
      });
    } else if (!isListening) {
      // Reset to idle state
      animatedHeights.forEach((animHeight) => {
        Animated.timing(animHeight, {
          toValue: 10,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [levels, isListening]);

  return (
    <View style={styles.container}>
      {bars.map((_, index) => {
        // Create gradient effect - center bars are brighter
        const distanceFromCenter = Math.abs(index - barCount / 2);
        const opacity = 1 - (distanceFromCenter / (barCount / 2)) * 0.5;

        // Alternate bar widths for visual interest
        const barWidth = index % 3 === 0 ? 5 : 4;

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: animatedHeights[index].interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: isListening
                  ? THEMES.light.primary
                  : THEMES.light.primary,
                opacity: isListening ? opacity : 0.4,
                transform: isListening
                  ? []
                  : [{ scaleY: pulseAnim }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100%',
    gap: 3,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  bar: {
    borderRadius: 4,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  }
});