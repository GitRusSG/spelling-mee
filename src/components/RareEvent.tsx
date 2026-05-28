import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface RareEventProps {
  trigger: boolean; // Triggers check on each new word
}

const RARE_EVENTS = [
  { id: 'star-fury', name: '⭐ Star Fury!', description: 'A burst of shooting stars!', emoji: '💫', chance: 0.03 },
  { id: 'golden-hour', name: '🌅 Golden Hour!', description: 'Everything turns golden!', emoji: '✨', chance: 0.03 },
  { id: 'bee-dance', name: '🐝 Bee Dance!', description: 'The bees are celebrating!', emoji: '🐝', chance: 0.04 },
  { id: 'rainbow-bridge', name: '🌈 Rainbow Bridge!', description: 'A rainbow appears!', emoji: '🌈', chance: 0.02 },
  { id: 'meteor-shower', name: '☄️ Meteor Shower!', description: 'Look up!', emoji: '☄️', chance: 0.02 },
  { id: 'treasure-found', name: '💰 Treasure Found!', description: '+5 bonus honey!', emoji: '💰', chance: 0.03, bonusHoney: 5 },
  { id: 'lucky-clover', name: '🍀 Lucky Clover!', description: 'Extra luck for this word!', emoji: '🍀', chance: 0.04 },
  { id: 'fireworks', name: '🎆 Fireworks!', description: 'Spectacular!', emoji: '🎆', chance: 0.02 },
];

export default function RareEvent({ trigger }: RareEventProps) {
  const [activeEvent, setActiveEvent] = useState<typeof RARE_EVENTS[0] | null>(null);
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const lastTrigger = useRef(false);

  useEffect(() => {
    if (trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    if (!trigger) return;

    // Roll for each event
    for (const event of RARE_EVENTS) {
      if (Math.random() < event.chance) {
        setActiveEvent(event);
        setVisible(true);

        // Award bonus honey if applicable
        if (event.bonusHoney) {
          try {
            const { createStorage } = require('../services/storage');
            const storage = createStorage();
            const current = parseInt(storage.getString('total_honey') || '0', 10);
            storage.set('total_honey', String(current + event.bonusHoney));
          } catch {}
        }

        // Animate in
        opacity.setValue(0);
        scale.setValue(0.5);
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, tension: 80, friction: 6 }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start();

        // Fade out after 3 seconds
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: USE_NATIVE_DRIVER }).start(() => {
            setVisible(false);
            setActiveEvent(null);
          });
        }, 3000);

        break; // Only one event at a time
      }
    }
  }, [trigger]);

  if (!visible || !activeEvent) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ scale }] },
      ]}
      pointerEvents="none"
      testID="rare-event"
    >
      <Text style={styles.emoji}>{activeEvent.emoji}</Text>
      <Text style={styles.name}>{activeEvent.name}</Text>
      <Text style={styles.description}>{activeEvent.description}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
    borderWidth: 3,
    borderColor: '#FFD600',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4A148C',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
