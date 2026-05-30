import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function KenteAccent() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={i}>
          <View style={[styles.stripe, { backgroundColor: '#dc2626' }]} />
          <View style={[styles.stripe, { backgroundColor: '#eab308' }]} />
          <View style={[styles.stripe, { backgroundColor: '#22c55e' }]} />
          <View style={[styles.stripe, { backgroundColor: '#111111' }]} />
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 6,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 3,
    marginVertical: 14,
  },
  stripe: {
    flex: 1,
  },
});
