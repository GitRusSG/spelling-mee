import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface ConfettiAnimationProps {
  trigger: boolean;
  intensity: 'small' | 'large';
}

const COLORS = ['#7C4DFF', '#FF6D00', '#00C853', '#E91E63', '#CE93D8', '#FFD600'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const startX = Math.random() * SCREEN_WIDTH;
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
  const particlesRef = useRef<Particle[]>(createParticles(particleCount));
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!trigger || animatingRef.current) return;
    animatingRef.current = true;

    // Reset and recreate particles
    const particles = createParticles(particleCount);
    particlesRef.current = particles;

    const animations = particles.map((particle) => {
      const duration = 1000 + Math.random() * 1000; // 1-2 seconds
      const horizontalDrift = (Math.random() - 0.5) * 100;

      return Animated.parallel([
        Animated.timing(particle.y, {
          toValue: SCREEN_HEIGHT * 0.6,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.x, {
          toValue: horizontalDrift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 720 - 360,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.5,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      animatingRef.current = false;
    });
  }, [trigger]);

  if (!trigger && !animatingRef.current) return null;

  return (
    <View style={styles.container} pointerEvents="none" testID="confetti-container">
      {particlesRef.current.map((particle, index) => {
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: -10,
  },
});
