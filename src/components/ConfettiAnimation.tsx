import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform } from 'react-native';

interface ConfettiAnimationProps {
  trigger: boolean;
  intensity: 'small' | 'large';
}

// Bee-themed colors: honey gold, purple, orange, green, pink
const COLORS = ['#FFD600', '#7C4DFF', '#FF6D00', '#00C853', '#E91E63', '#CE93D8', '#FFC107', '#4A148C'];

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  shape: 'pentagon' | 'hexagon' | 'circle';
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
  const shapes: Array<'pentagon' | 'hexagon' | 'circle'> = ['pentagon', 'hexagon', 'hexagon', 'pentagon', 'circle'];

  for (let i = 0; i < count; i++) {
    const startX = Math.random() * width;
    particles.push({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0.3),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.random() * 12,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      startX,
    });
  }
  return particles;
}

/**
 * Creates a CSS clip-path style for pentagon/hexagon shapes.
 * On web, we use borderRadius tricks to approximate the shapes.
 */
function getShapeStyle(shape: 'pentagon' | 'hexagon' | 'circle', size: number) {
  if (shape === 'circle') {
    return { borderRadius: size / 2 };
  }
  if (shape === 'hexagon') {
    // Approximate hexagon with high borderRadius
    return { borderRadius: size / 4 };
  }
  // Pentagon — use a slightly different borderRadius per corner
  return {
    borderTopLeftRadius: size / 3,
    borderTopRightRadius: size / 3,
    borderBottomLeftRadius: size / 6,
    borderBottomRightRadius: size / 6,
  };
}

export default function ConfettiAnimation({ trigger, intensity }: ConfettiAnimationProps) {
  // More particles! small=25, large=50
  const particleCount = intensity === 'large' ? 50 : 25;
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
      const duration = 1200 + Math.random() * 1200; // 1.2-2.4 seconds
      const horizontalDrift = (Math.random() - 0.5) * 150;

      return Animated.parallel([
        Animated.timing(particle.y, {
          toValue: height * 0.8,
          duration,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(particle.x, {
          toValue: horizontalDrift,
          duration,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 1080 - 540,
          duration,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(particle.scale, {
          toValue: 0.8 + Math.random() * 0.5,
          duration: duration * 0.3,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.6,
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
          inputRange: [-540, 540],
          outputRange: ['-540deg', '540deg'],
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
                ...getShapeStyle(particle.shape, particle.size),
                left: particle.startX,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { rotate: rotation },
                  { scale: particle.scale },
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
    top: -15,
  },
});
