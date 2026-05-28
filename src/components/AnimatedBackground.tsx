import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { createStorage } from '../services/storage';

const SCREEN_WIDTH = Dimensions.get('window').width || 400;
const SCREEN_HEIGHT = Dimensions.get('window').height || 700;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface FloatingItem {
  x: number;
  y: Animated.Value;
  emoji: string;
  size: number;
  opacity: number;
  delay: number;
  layer: 'top' | 'middle' | 'bottom';
}

export default function AnimatedBackground() {
  const [packId, setPackId] = useState<string | null>(null);
  const [items, setItems] = useState<FloatingItem[]>([]);
  const waterLineY = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const checkPack = () => {
      try {
        const storage = createStorage();
        const id = storage.getString('equipped_bg_pack_id') || null;
        setPackId(prev => prev !== id ? id : prev);
      } catch {}
    };
    checkPack();
    const interval = setInterval(checkPack, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!packId) { setItems([]); return; }

    const newItems: FloatingItem[] = [];

    switch (packId) {
      case 'bg-ocean': {
        // Shells falling from top to wave line
        for (let i = 0; i < 5; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(-40), emoji: ['🐚', '🐚', '⭐', '🪸', '🐚'][i], size: 14 + Math.random() * 6, opacity: 0.5, delay: Math.random() * 5000, layer: 'top' });
        }
        // Waves — consistent line across center
        for (let i = 0; i < 10; i++) {
          newItems.push({ x: (i / 10) * SCREEN_WIDTH - 10, y: new Animated.Value(0), emoji: '🌊', size: 30, opacity: 0.9, delay: i * 300, layer: 'middle' });
        }
        // Fish below waves — more density
        for (let i = 0; i < 10; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(0), emoji: ['🐠', '🐟', '🦀', '🐡', '🐙', '🐠', '🐟', '🦈', '🐠', '🐟'][i], size: 18 + Math.random() * 10, opacity: 0.7, delay: i * 400, layer: 'bottom' });
        }
        break;
      }
      case 'bg-stars': {
        // Shooting stars across top
        for (let i = 0; i < 5; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(-30), emoji: '💫', size: 14 + Math.random() * 6, opacity: 0.6, delay: Math.random() * 3000, layer: 'top' });
        }
        // Twinkling stars scattered
        for (let i = 0; i < 15; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(Math.random() * SCREEN_HEIGHT), emoji: ['⭐', '✨', '🌟', '✨', '⭐'][i % 5], size: 10 + Math.random() * 12, opacity: 0.3 + Math.random() * 0.5, delay: Math.random() * 4000, layer: 'middle' });
        }
        // Moon at top
        newItems.push({ x: SCREEN_WIDTH * 0.8, y: new Animated.Value(60), emoji: '🌙', size: 40, opacity: 0.8, delay: 0, layer: 'top' });
        break;
      }
      case 'bg-space': {
        // Rockets flying up
        for (let i = 0; i < 3; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(SCREEN_HEIGHT + 50), emoji: '🚀', size: 22 + Math.random() * 8, opacity: 0.7, delay: i * 2000, layer: 'top' });
        }
        // Planets scattered
        for (let i = 0; i < 6; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(Math.random() * SCREEN_HEIGHT), emoji: ['🌍', '🌙', '🪐', '☀️', '🌑', '⭐'][i], size: 20 + Math.random() * 15, opacity: 0.5, delay: 0, layer: 'middle' });
        }
        // Stars drifting
        for (let i = 0; i < 10; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(-20), emoji: '✨', size: 8 + Math.random() * 6, opacity: 0.4, delay: Math.random() * 5000, layer: 'bottom' });
        }
        break;
      }
      case 'bg-bubbles': {
        // Bubbles rising from bottom
        for (let i = 0; i < 14; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(SCREEN_HEIGHT + 30), emoji: ['🫧', '○', '◯', '🫧', '●'][i % 5], size: 12 + Math.random() * 18, opacity: 0.3 + Math.random() * 0.4, delay: Math.random() * 4000, layer: 'top' });
        }
        break;
      }
      case 'bg-confetti': {
        // Confetti falling everywhere
        for (let i = 0; i < 18; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(-30), emoji: ['🎊', '🎉', '✨', '🎈', '🎀', '🎊'][i % 6], size: 14 + Math.random() * 10, opacity: 0.5 + Math.random() * 0.3, delay: Math.random() * 3000, layer: 'top' });
        }
        // Balloons rising
        for (let i = 0; i < 5; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(SCREEN_HEIGHT + 30), emoji: '🎈', size: 24 + Math.random() * 8, opacity: 0.6, delay: Math.random() * 4000, layer: 'bottom' });
        }
        break;
      }
      case 'bg-forest': {
        // Leaves falling
        for (let i = 0; i < 12; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(-30), emoji: ['🍃', '🍂', '🌿', '🍃', '🌸', '🍃'][i % 6], size: 14 + Math.random() * 10, opacity: 0.4 + Math.random() * 0.3, delay: Math.random() * 4000, layer: 'top' });
        }
        // Trees at bottom
        for (let i = 0; i < 6; i++) {
          newItems.push({ x: (i / 6) * SCREEN_WIDTH + Math.random() * 30, y: new Animated.Value(0), emoji: ['🌲', '🌳', '🌲', '🌳', '🌲', '🌳'][i], size: 30 + Math.random() * 10, opacity: 0.6, delay: 0, layer: 'bottom' });
        }
        // Butterflies
        for (let i = 0; i < 4; i++) {
          newItems.push({ x: Math.random() * SCREEN_WIDTH, y: new Animated.Value(SCREEN_HEIGHT * 0.3 + Math.random() * SCREEN_HEIGHT * 0.3), emoji: '🦋', size: 16 + Math.random() * 6, opacity: 0.7, delay: i * 1000, layer: 'middle' });
        }
        break;
      }
    }

    setItems(newItems);

    // Animate based on pack type
    newItems.forEach((item, i) => {
      switch (packId) {
        case 'bg-ocean': {
          if (item.layer === 'top') {
            // Shells fall to wave line
            const animate = () => { item.y.setValue(-40); Animated.timing(item.y, { toValue: SCREEN_HEIGHT * 0.42, duration: 6000 + Math.random() * 3000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = 0; animate(); }); };
            animate();
          } else if (item.layer === 'middle') {
            // Waves bob — also animate the water line
            const animate = () => { Animated.sequence([Animated.timing(item.y, { toValue: -8, duration: 1500, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }), Animated.timing(item.y, { toValue: 8, duration: 1500, useNativeDriver: USE_NATIVE_DRIVER })]).start(() => { item.delay = 0; animate(); }); };
            animate();
            // Sync water line with first wave item
            if (i === newItems.findIndex(it => it.layer === 'middle')) {
              const animateWater = () => { Animated.sequence([Animated.timing(waterLineY, { toValue: -8, duration: 1500, useNativeDriver: false, delay: item.delay }), Animated.timing(waterLineY, { toValue: 8, duration: 1500, useNativeDriver: false })]).start(() => { animateWater(); }); };
              animateWater();
            }
          } else {
            // Fish drift up and down
            const baseOffset = Math.random() * 30;
            const animate = () => { Animated.sequence([Animated.timing(item.y, { toValue: -baseOffset - 10, duration: 2500 + Math.random() * 1000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }), Animated.timing(item.y, { toValue: baseOffset + 10, duration: 2500 + Math.random() * 1000, useNativeDriver: USE_NATIVE_DRIVER })]).start(() => { item.delay = 0; animate(); }); };
            animate();
          }
          break;
        }
        case 'bg-stars': {
          if (item.emoji === '🌙') return; // Moon stays still
          if (item.emoji === '💫') {
            // Shooting stars fall diagonally
            const animate = () => { item.y.setValue(-30); Animated.timing(item.y, { toValue: SCREEN_HEIGHT + 30, duration: 2000 + Math.random() * 1000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = Math.random() * 5000; animate(); }); };
            animate();
          } else {
            // Twinkle (pulse opacity via scale)
            const animate = () => { Animated.sequence([Animated.timing(item.y, { toValue: (item.y as any)._value - 5, duration: 2000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }), Animated.timing(item.y, { toValue: (item.y as any)._value + 5, duration: 2000, useNativeDriver: USE_NATIVE_DRIVER })]).start(() => { item.delay = 0; animate(); }); };
            animate();
          }
          break;
        }
        case 'bg-space': {
          if (item.emoji === '🚀') {
            const animate = () => { item.y.setValue(SCREEN_HEIGHT + 50); Animated.timing(item.y, { toValue: -80, duration: 4000 + Math.random() * 2000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = Math.random() * 3000; animate(); }); };
            animate();
          } else if (item.emoji === '✨') {
            const animate = () => { item.y.setValue(-20); Animated.timing(item.y, { toValue: SCREEN_HEIGHT + 20, duration: 8000 + Math.random() * 4000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = 0; animate(); }); };
            animate();
          }
          // Planets stay still
          break;
        }
        case 'bg-bubbles': {
          // Rise from bottom to top
          const animate = () => { item.y.setValue(SCREEN_HEIGHT + 30); Animated.timing(item.y, { toValue: -50, duration: 5000 + Math.random() * 4000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = 0; animate(); }); };
          animate();
          break;
        }
        case 'bg-confetti': {
          if (item.emoji === '🎈') {
            // Balloons rise
            const animate = () => { item.y.setValue(SCREEN_HEIGHT + 30); Animated.timing(item.y, { toValue: -50, duration: 6000 + Math.random() * 3000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = 0; animate(); }); };
            animate();
          } else {
            // Confetti falls
            const animate = () => { item.y.setValue(-30); Animated.timing(item.y, { toValue: SCREEN_HEIGHT + 30, duration: 3000 + Math.random() * 2000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = 0; animate(); }); };
            animate();
          }
          break;
        }
        case 'bg-forest': {
          if (item.layer === 'top') {
            // Leaves fall
            const animate = () => { item.y.setValue(-30); Animated.timing(item.y, { toValue: SCREEN_HEIGHT + 30, duration: 5000 + Math.random() * 3000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }).start(() => { item.delay = 0; animate(); }); };
            animate();
          } else if (item.layer === 'middle') {
            // Butterflies flutter
            const base = (item.y as any)._value || SCREEN_HEIGHT * 0.4;
            const animate = () => { Animated.sequence([Animated.timing(item.y, { toValue: base - 30, duration: 2000, useNativeDriver: USE_NATIVE_DRIVER, delay: item.delay }), Animated.timing(item.y, { toValue: base + 30, duration: 2000, useNativeDriver: USE_NATIVE_DRIVER })]).start(() => { item.delay = 0; animate(); }); };
            animate();
          }
          // Trees stay still
          break;
        }
      }
    });

    return () => { newItems.forEach(item => item.y.stopAnimation()); waterLineY.stopAnimation(); };
  }, [packId]);

  if (!packId || items.length === 0) return null;

  const isOcean = packId === 'bg-ocean';
  const isForest = packId === 'bg-forest';

  return (
    <View style={styles.container} pointerEvents="none" testID="animated-background">
      {/* Ocean: blue water following the wave line */}
      {isOcean && (
        <Animated.View style={[styles.oceanWater, { transform: [{ translateY: waterLineY }] }]} />
      )}
      {/* Forest: green ground at bottom */}
      {isForest && <View style={styles.forestGround} />}

      {items.map((item, i) => {
        // Position ocean waves and fish at correct vertical positions
        let extraStyle: any = {};
        if (isOcean && item.layer === 'middle') {
          extraStyle = { top: SCREEN_HEIGHT * 0.45 };
        } else if (isOcean && item.layer === 'bottom') {
          extraStyle = { top: SCREEN_HEIGHT * 0.55 + (i % 5) * (SCREEN_HEIGHT * 0.08) };
        } else if (isForest && item.layer === 'bottom') {
          extraStyle = { bottom: 10 };
        }

        return (
          <Animated.Text
            key={i}
            style={[
              styles.floatingItem,
              extraStyle,
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
    zIndex: 1,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  floatingItem: {
    position: 'absolute',
    top: 0,
  },
  oceanWater: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '48%',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  forestGround: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
});
