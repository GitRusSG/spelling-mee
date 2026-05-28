import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Platform } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuizCompleteAnimationProps {
  trigger: boolean;
  score: number; // 0-100 percentage
}

// 10 animations with varying rarities
// Rarity determines how often each appears
const ANIMATIONS = [
  // Common (40% chance total)
  { id: 'honey-rain', name: 'Honey Rain', emoji: '🍯', rarity: 'common', weight: 15 },
  { id: 'bee-swarm', name: 'Bee Swarm', emoji: '🐝', rarity: 'common', weight: 15 },
  { id: 'star-burst', name: 'Star Burst', emoji: '⭐', rarity: 'common', weight: 10 },
  // Uncommon (35% chance total)
  { id: 'rainbow-wave', name: 'Rainbow Wave', emoji: '🌈', rarity: 'uncommon', weight: 12 },
  { id: 'flower-bloom', name: 'Flower Bloom', emoji: '🌸', rarity: 'uncommon', weight: 12 },
  { id: 'rocket-launch', name: 'Rocket Launch', emoji: '🚀', rarity: 'uncommon', weight: 11 },
  // Rare (20% chance total)
  { id: 'crown-drop', name: 'Crown Drop', emoji: '👑', rarity: 'rare', weight: 8 },
  { id: 'diamond-shower', name: 'Diamond Shower', emoji: '💎', rarity: 'rare', weight: 7 },
  { id: 'unicorn-magic', name: 'Unicorn Magic', emoji: '🦄', rarity: 'rare', weight: 5 },
  // Legendary (5% chance)
  { id: 'golden-bee', name: 'Golden Bee', emoji: '🐝✨', rarity: 'legendary', weight: 5 },
];

function pickAnimation(score: number) {
  // Higher scores have better chance of rare animations
  const scoreBonus = score >= 90 ? 2 : score >= 70 ? 1 : 0;

  // Adjust weights based on score
  const adjusted = ANIMATIONS.map((a) => {
    let w = a.weight;
    if (a.rarity === 'rare' && scoreBonus >= 1) w += 5;
    if (a.rarity === 'legendary' && scoreBonus >= 2) w += 5;
    return { ...a, adjustedWeight: w };
  });

  const totalWeight = adjusted.reduce((sum, a) => sum + a.adjustedWeight, 0);
  let random = Math.random() * totalWeight;

  for (const anim of adjusted) {
    random -= anim.adjustedWeight;
    if (random <= 0) return anim;
  }
  return adjusted[0];
}

const RARITY_COLORS: Record<string, string> = {
  common: '#4CAF50',
  uncommon: '#2196F3',
  rare: '#9C27B0',
  legendary: '#FF6D00',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: '✨ Rare',
  legendary: '🌟 LEGENDARY',
};

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  emoji: string;
  startX: number;
  size: number;
}

function createParticles(emoji: string, count: number): Particle[] {
  const w = SCREEN_WIDTH || 400;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0),
      emoji,
      startX: Math.random() * w,
      size: 24 + Math.random() * 16,
    });
  }
  return particles;
}

export default function QuizCompleteAnimation({ trigger, score }: QuizCompleteAnimationProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedAnim, setSelectedAnim] = useState<typeof ANIMATIONS[0] | null>(null);
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelScale = useRef(new Animated.Value(0.5)).current;
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!trigger || animatingRef.current) return;
    animatingRef.current = true;

    const anim = pickAnimation(score);
    setSelectedAnim(anim);

    const h = SCREEN_HEIGHT || 700;
    const particleCount = anim.rarity === 'legendary' ? 30 : anim.rarity === 'rare' ? 20 : 15;
    const newParticles = createParticles(anim.emoji.charAt(0) === '🐝' && anim.id === 'golden-bee' ? '🐝' : anim.emoji, particleCount);
    setParticles(newParticles);
    setVisible(true);

    // Animate label
    labelOpacity.setValue(0);
    labelScale.setValue(0.5);
    Animated.parallel([
      Animated.spring(labelScale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, tension: 80, friction: 6 }),
      Animated.timing(labelOpacity, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();

    // Animate particles
    const particleAnimations = newParticles.map((p) => {
      const duration = 1500 + Math.random() * 1500;
      const drift = (Math.random() - 0.5) * 200;

      return Animated.parallel([
        Animated.timing(p.scale, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(p.y, { toValue: h * 0.7, duration, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(p.x, { toValue: drift, duration, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(p.rotation, { toValue: Math.random() * 720 - 360, duration, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(p.opacity, { toValue: 0, duration, delay: duration * 0.5, useNativeDriver: USE_NATIVE_DRIVER }),
      ]);
    });

    Animated.parallel(particleAnimations).start(() => {
      // Fade out label after particles
      Animated.timing(labelOpacity, { toValue: 0, duration: 500, delay: 500, useNativeDriver: USE_NATIVE_DRIVER }).start(() => {
        setVisible(false);
        animatingRef.current = false;
      });
    });
  }, [trigger]);

  if (!visible || !selectedAnim) return null;

  return (
    <View style={styles.container} pointerEvents="none" testID="quiz-complete-animation">
      {/* Particles */}
      {particles.map((p, i) => {
        const rotation = p.rotation.interpolate({
          inputRange: [-360, 360],
          outputRange: ['-360deg', '360deg'],
        });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.particle,
              {
                left: p.startX,
                fontSize: p.size,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotate: rotation },
                  { scale: p.scale },
                ],
              },
            ]}
          >
            {p.emoji}
          </Animated.Text>
        );
      })}

      {/* Rarity label */}
      <Animated.View
        style={[
          styles.labelContainer,
          {
            opacity: labelOpacity,
            transform: [{ scale: labelScale }],
          },
        ]}
      >
        <Text style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[selectedAnim.rarity] }]}>
          {RARITY_LABELS[selectedAnim.rarity]}
        </Text>
        <Text style={styles.animName}>{selectedAnim.name}</Text>
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    top: -20,
  },
  labelContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rarityBadge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
    letterSpacing: 1,
  },
  animName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
});
