import { AlertTriangle } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { THEMES } from '../constants/theme';

interface ConfidenceMeterProps {
  score: number; // 0.0 to 1.0
  hasNoise?: boolean; // Optional noise indicator
  languageConfidence?: number; // Optional language detection confidence
}

export default function ConfidenceMeter({ score, hasNoise, languageConfidence }: ConfidenceMeterProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Determine color based on score
  let color = THEMES.light.success; // Green (> 80%)
  let label = "High Accuracy";

  if (score < 0.8) {
    color = '#F59E0B'; // Amber
    label = "Medium Accuracy";
  }
  if (score < 0.5) {
    color = THEMES.light.danger; // Red
    label = "Low Confidence - Please repeat";
  }

  const percentage = Math.round(score * 100);

  // Animate the progress bar
  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: percentage,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
      </View>

      {/* Background Track */}
      <View style={styles.track}>
        {/* Animated Foreground Fill */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: color
            }
          ]}
        />
      </View>

      {/* Additional Info */}
      <View style={styles.infoRow}>
        {hasNoise && (
          <View style={styles.warningBadge}>
            <AlertTriangle size={12} color="#F59E0B" />
            <Text style={styles.warningText}>Background Noise Detected</Text>
          </View>
        )}

        {languageConfidence && languageConfidence > 0 && (
          <Text style={styles.langConfidence}>
            Language: {Math.round(languageConfidence * 100)}% confident
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  percentage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  track: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  infoRow: {
    marginTop: 8,
    gap: 6,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  warningText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  langConfidence: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
});