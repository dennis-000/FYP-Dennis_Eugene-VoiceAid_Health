import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEMES } from '../constants/theme';

interface ConfidenceMeterProps {
  score: number; // 0.0 to 1.0
}

export default function ConfidenceMeter({ score }: ConfidenceMeterProps) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
      </View>
      
      {/* Background Track */}
      <View style={styles.track}>
        {/* Foreground Fill */}
        <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: color }]} />
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
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});