import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { createStorage } from '../services/storage';

const SCREEN_WIDTH = Dimensions.get('window').width || 400;
const SCREEN_HEIGHT = Dimensions.get('window').height || 700;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const BG_CONFIGS: Record<string, { emojis: string[]; count: number; speed: number }> = {
  'bg-stars': { emojis: ['⭐', '✨', '🌟'], count: 12, speed: 4000 },
  'bg-bubbles': { emojis: ['🫧', '○', '◯'], count: 10, speed: 5000 },
  'bg-confetti': { emojis: ['🎊', '🎉', '✨', '🎈'], count: 15, speed: 3000 },
  'bg-ocean': { emojis: ['🌊', '🐚', '🐠', '🦀'], count: 8, speed: 6000 },
  'bg-space': { emojis: ['🚀', '🌍', '🌙', '⭐'], count: 10, speed: 5000 },
  'bg-forest': { emojis: ['🍃', '🌿', '🍂', '🌸'], count: 12, speed: 4500 },
};

interface FloatingItem {
  x: number;
  y: Animated.Value;
  emoji: string;
  size: number;
  opacity: number;
  delay: number;
}

export default function AnimatedBackground() {
  const [packId, setPackId] = useState<string | null>(null);
  const [items, setItems] = useState<FloatingItem[]>([]);
  const [isOcean, setIsOcean] = useState(false);

  useEffect(() => {
    const checkPack = () => {
      try {
        const storage = createStorage();
        const id = storage.getString('equipped_bg_pack_id') || null;
        setPackId(prev => {
          if (prev !== id) return id;
          return prev;
        });
      } catch {}
    };
    checkPack();
    const interval = setInterval(checkPack, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!packId || !BG_CONFIGS[packId]) {
      setItems([]);
      setIsOcean(false);
      return;
    }

    if (packId === 'bg-ocean') {
      // Ocean: waves at the bottom, moving horizontally
      const waveItems: FloatingItem[] = [];
      for (let i = 0; i < 8; i++) {
        waveItems.push({
          x: (i / 8) * SCREEN_WIDTH,
          y: new Animated.Value(0), // Will be positioned at bottom via style
          emoji: ['🌊', '🌊', '🌊', '🐚', '🐠', '🦀', '🐟', '🌊'][i],
          size: 24 + Math.random() * 10,
          opacity: 0.6 + Math.random() * 0.3,
          delay: i * 500,
        });
      }
      setItems(waveItems);
      setIsOcean(true);

      // Animate waves with a gentle bobbing motion
      waveItems.forEach((item) => {
        const animate = () => {
          Animated.sequence([
            Animated.timing(item.y, {
              toValue: -15,
              duration: 1500 + Math.random() * 500,
              useNativeDriver: USE_NATIVE_DRIVER,
              delay: item.delay,
            }),
            Animated.timing(item.y, {
              toValue: 15,
              duration: 1500 + Math.random() * 500,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ]).start(() => {
            item.delay = 0;
            animate();
          });
        };
        animate();
      });

      return () => waveItems.forEach(item => item.y.stopAnimation());
    }

    setIsOcean(false);
    const config = BG_CONFIGS[packId];
    const newItems: FloatingItem[] = [];

    for (let i = 0; i < config.count; i++) {
      newItems.push({
        x: Math.random() * SCREEN_WIDTH,
        y: new Animated.Value(-50),
        emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
        size: 16 + Math.random() * 14,
        opacity: 0.3 + Math.random() * 0.4,
        delay: Math.random() * config.speed,
      });
    }

    setItems(newItems);

    // Start looping animations
    newItems.forEach((item) => {
      const animate = () => {
        item.y.setValue(-50);
        Animated.timing(item.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration: BG_CONFIGS[packId].speed + Math.random() * 2000,
          useNativeDriver: USE_NATIVE_DRIVER,
          delay: item.delay,
        }).start(() => {
          item.delay = 0; // No delay on subsequent loops
          animate();
        });
      };
      animate();
    });

    return () => {
      // Cleanup: stop animations
      newItems.forEach((item) => item.y.stopAnimation());
    };
  }, [packId]);

  if (!packId || items.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none" testID="animated-background">
      {items.map((item, i) => (
        <Animated.Text
          key={i}
          style={[
            isOcean ? styles.oceanItem : styles.floatingItem,
            {
              left: item.x,
              fontSize: item.size,
              opacity: item.opacity,
              transform: [{ translateY: item.y }],
            },
          ]}
        >
          {item.emoji}
        </Animated.Text>
      ))}
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
    zIndex: 1,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  floatingItem: {
    position: 'absolute',
    top: 0,
  },
  oceanItem: {
    position: 'absolute',
    bottom: 20,
  },
});
