import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEMES } from '../constants/theme';

interface LiveWaveformProps {
  levels: number[]; // Array of audio metering levels (0 to -160)
  isListening: boolean;
}

export default function LiveWaveform({ levels, isListening }: LiveWaveformProps) {
  // Create a fixed number of bars to render
  const bars = Array(20).fill(0); 

  return (
    <View style={styles.container}>
      {bars.map((_, index) => {
        // Map the incoming metering levels to the bars. 
        // Audio metering is usually -160 (silent) to 0 (loud)
        const currentLevel = levels[index % levels.length] || -160;
        
        // Convert level to percentage height (10% to 100%)
        let height = (1 + (currentLevel / 160)) * 100;
        
        // Clamp height visually
        if (height < 10) height = 10;
        if (height > 100) height = 100;

        // Flatten bars if not recording
        if (!isListening) height = 5;

        return (
          <View 
            key={index} 
            style={[
              styles.bar, 
              { 
                height: `${height}%`,
                backgroundColor: THEMES.light.primary,
                opacity: isListening ? 1 : 0.3 // Dim when idle
              }
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
    height: 80,
    width: '100%',
    gap: 4,
    marginBottom: 20
  },
  bar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  }
});