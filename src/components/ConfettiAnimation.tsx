import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform } from 'react-native';

interface ConfettiAnimationProps {
  trigger: boolean;
  intensity: 'small' | 'large';
}

const COLORS = ['#7C4DFF', '#FF6D00', '#00C853', '#E91E63', '#CE93D8', '#FFD600'];

// On web, useNativeDriver doesn't support transforms
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  isCircle: boolean;
  startX: number;
}

function getScreenDimensions() {
  const { width, height } = Dimensions.get('window');
  return {
    width: width || 400,
    height: height || 700,
  };
}

function createParticles(count: number): Particle[] {
  const { width } = getScreenDimensions();
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const startX = Math.random() * width;
    particles.push({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      isCircle: Math.random() > 0.5,
      startX,
    });
  }
  return particles;
}

export default function ConfettiAnimation({ trigger, intensity }: ConfettiAnimationProps) {
  const particleCount = intensity === 'large' ? 30 : 15;
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!trigger) return;
    if (animatingRef.current) return;
    animatingRef.current = true;

    const { height } = getScreenDimensions();
    const newParticles = createParticles(particleCount);
    setParticles(newParticles);
    setVisible(true);

    const animations = newParticles.map((particle) => {
      const duration = 1000 + Math.random() * 1000;
      const horizontalDrift = (Math.random() - 0.5) * 100;

      return Animated.parallel([
        Animated.timing(particle.y, {
          toValue: height * 0.6,
          duration,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(particle.x, {
          toValue: horizontalDrift,
          duration,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 720 - 360,
          duration,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.5,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      animatingRef.current = false;
      setVisible(false);
    });
  }, [trigger]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none" testID="confetti-container">
      {particles.map((particle, index) => {
        const rotation = particle.rotation.interpolate({
          inputRange: [-360, 360],
          outputRange: ['-360deg', '360deg'],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.isCircle ? particle.size / 2 : 2,
                left: particle.startX,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { rotate: rotation },
                ],
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: -10,
  },
});
