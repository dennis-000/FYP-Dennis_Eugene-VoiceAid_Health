import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Easing,
  Platform 
} from 'react-native';
import { Heart, AudioLines } from 'lucide-react-native';
import { THEMES } from '../constants/theme';

const { width } = Dimensions.get('window');
const useNativeDriver = Platform.OS !== 'web';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

export default function AnimatedSplashScreen({ onAnimationFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current; 
  const scaleAnim = useRef(new Animated.Value(0.3)).current; 
  const textAnim = useRef(new Animated.Value(0)).current; 
  const pulseAnim = useRef(new Animated.Value(1)).current; 

  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1200,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver,
        }),
      ])
    );
    pulseLoop.start();

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver,
      }),
      Animated.delay(1500), 
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver,
        easing: Easing.out(Easing.ease)
      })
    ]).start(() => {
      pulseLoop.stop();
      setIsAnimationComplete(true);
      onAnimationFinish();
    });
  }, []);

  if (isAnimationComplete) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      
      {/* Background Ripple */}
      <Animated.View 
        style={[
          styles.ripple, 
          { 
            transform: [{ scale: pulseAnim }],
            opacity: textAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.15] 
            }) 
          }
        ]} 
      />

      {/* Main Logo Container */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <View style={styles.logoCircle}>
          
          {/* LOGO: Health (Heart) + Voice (AudioLines) */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* The Heart Shape */}
            <Heart 
              size={68} 
              color={THEMES.light.primary} 
              fill={THEMES.light.primary}
              fillOpacity={0.1} // Soft fill inside
              strokeWidth={2}
              style={{ position: 'absolute' }}
            />
            
            {/* The Voice Wave inside the Heart */}
            <AudioLines 
              size={32} 
              color={THEMES.light.primary} 
              strokeWidth={3}
              style={{ marginTop: 2 }} // Visual centering
            />
          </View>

        </View>

        {/* Text Container */}
        <Animated.View style={{ opacity: textAnim, alignItems: 'center', marginTop: 24 }}>
          <Text style={styles.title}>VoiceAid</Text>
          <Text style={styles.subtitle}>Empowering Communication</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={{ position: 'absolute', bottom: 50, opacity: textAnim }}>
        <Text style={styles.footer}>Medical Assistive Technology</Text>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEMES.light.primary, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, 
  },
  ripple: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: '#FFFFFF',
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // High Elevation for "floating" effect
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800', // Extra bold
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E0E7FF', 
    letterSpacing: 0.5,
    marginTop: 4
  },
  footer: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1
  }
});