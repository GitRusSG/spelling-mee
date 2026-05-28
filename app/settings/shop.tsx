import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createStorage } from '../../src/services/storage';
import { useSubscription } from '../../src/contexts/SubscriptionContext';

interface Pack {
  id: string;
  name: string;
  description: string;
  cost: number;
  preview: string;
}

const BACKGROUND_PACKS: Pack[] = [
  { id: 'bg-stars', name: '✨ Starry Night', description: 'Twinkling stars float across the screen', cost: 15, preview: '🌟' },
  { id: 'bg-bubbles', name: '🫧 Bubbles', description: 'Colorful bubbles drift upward', cost: 15, preview: '🫧' },
  { id: 'bg-confetti', name: '🎊 Party', description: 'Confetti rains down constantly', cost: 20, preview: '🎊' },
  { id: 'bg-ocean', name: '🌊 Ocean', description: 'Gentle waves roll across the bottom', cost: 20, preview: '🌊' },
  { id: 'bg-space', name: '🚀 Space', description: 'Planets and rockets zoom by', cost: 30, preview: '🚀' },
  { id: 'bg-forest', name: '🌲 Forest', description: 'Leaves fall gently from above', cost: 25, preview: '🍃' },
];

const TEXT_PACKS: Pack[] = [
  { id: 'text-bubble', name: '💬 Bubble Letters', description: 'Round, bubbly text style', cost: 10, preview: '💬' },
  { id: 'text-pixel', name: '👾 Pixel', description: 'Retro pixel-art style text', cost: 10, preview: '👾' },
  { id: 'text-rainbow', name: '🌈 Rainbow', description: 'Each letter is a different color', cost: 15, preview: '🌈' },
  { id: 'text-glow', name: '💡 Glow', description: 'Text glows with a neon effect', cost: 15, preview: '💡' },
  { id: 'text-handwritten', name: '✍️ Handwritten', description: 'Looks like handwriting', cost: 20, preview: '✍️' },
];

function getUnlockedPacks(): string[] {
  try {
    const storage = createStorage();
    const stored = storage.getString('unlocked_packs');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUnlockedPack(packId: string) {
  try {
    const storage = createStorage();
    const current = getUnlockedPacks();
    if (!current.includes(packId)) {
      current.push(packId);
      storage.set('unlocked_packs', JSON.stringify(current));
    }
  } catch {}
}

function getTotalHoney(): number {
  try {
    const storage = createStorage();
    const stored = storage.getString('total_honey');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function spendHoney(amount: number): boolean {
  try {
    const storage = createStorage();
    const current = getTotalHoney();
    if (current >= amount) {
      storage.set('total_honey', String(current - amount));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function equipPack(pack: Pack) {
  try {
    const storage = createStorage();
    const key = pack.id.startsWith('bg-') ? 'equipped_bg_pack' : 'equipped_text_pack';
    storage.set(key, pack.name);
  } catch {}
}

export default function ShopScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const [unlockedPacks, setUnlockedPacks] = useState<string[]>(getUnlockedPacks());
  const [honey, setHoney] = useState(getTotalHoney());

  const getDiscountedCost = (cost: number) => isSubscribed ? Math.floor(cost * 0.9) : cost;

  const handleBuy = (pack: Pack) => {
    const cost = getDiscountedCost(pack.cost);
    if (honey < cost) {
      if (typeof window !== 'undefined') {
        window.alert(`Not enough honey! You need ${cost} 🍯 but only have ${honey} 🍯. Keep spelling to earn more!`);
      }
      return;
    }

    // Use window.confirm on web since Alert.alert buttons don't work
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Unlock "${pack.name}" for ${cost} 🍯?`)
      : true;

    if (confirmed) {
      if (spendHoney(cost)) {
        saveUnlockedPack(pack.id);
        setUnlockedPacks((prev) => [...prev, pack.id]);
        setHoney((prev) => prev - cost);
        if (typeof window !== 'undefined') {
          window.alert(`🎉 Unlocked! ${pack.name} is now yours! Tap it again to equip.`);
        }
      }
    }
  };

  const handleEquip = (pack: Pack) => {
    equipPack(pack);
    if (typeof window !== 'undefined') {
      window.alert(`✅ ${pack.name} is now active!`);
    }
  };

  const handlePress = (pack: Pack, owned: boolean) => {
    if (owned) {
      handleEquip(pack);
    } else {
      handleBuy(pack);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.replace('/settings')} style={styles.backButton} testID="back-button">
          <Text style={styles.backButtonText}>← Back to Settings</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🛒 Shop</Text>
        <Text style={styles.honeyBalance}>🍯 {honey} honey</Text>

        {isSubscribed && (
          <View style={styles.premiumBanner}>
            <Text style={styles.premiumBannerText}>💎 Premium: 10% off all packs!</Text>
          </View>
        )}

        {/* Background Packs */}
        <Text style={styles.sectionTitle}>🎨 Background Packs</Text>
        <Text style={styles.sectionSubtitle}>Animated backgrounds for your spelling tests!</Text>
        {BACKGROUND_PACKS.map((pack) => {
          const owned = unlockedPacks.includes(pack.id);
          return (
            <TouchableOpacity
              key={pack.id}
              style={[styles.packCard, owned && styles.packCardOwned]}
              onPress={() => handlePress(pack, owned)}
              testID={`pack-${pack.id}`}
            >
              <Text style={styles.packPreview}>{pack.preview}</Text>
              <View style={styles.packInfo}>
                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.packDescription}>{pack.description}</Text>
              </View>
              {owned ? (
                <Text style={styles.ownedBadge}>✅ Owned</Text>
              ) : (
                isSubscribed ? (
                  <View style={styles.discountContainer}>
                    <Text style={styles.originalCost}>{pack.cost}</Text>
                    <Text style={styles.packCost}>{getDiscountedCost(pack.cost)} 🍯</Text>
                  </View>
                ) : (
                  <Text style={styles.packCost}>{pack.cost} 🍯</Text>
                )
              )}
            </TouchableOpacity>
          );
        })}

        {/* Text Packs */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>✏️ Text Packs</Text>
        <Text style={styles.sectionSubtitle}>Fun text styles for your answers!</Text>
        {TEXT_PACKS.map((pack) => {
          const owned = unlockedPacks.includes(pack.id);
          return (
            <TouchableOpacity
              key={pack.id}
              style={[styles.packCard, owned && styles.packCardOwned]}
              onPress={() => handlePress(pack, owned)}
              testID={`pack-${pack.id}`}
            >
              <Text style={styles.packPreview}>{pack.preview}</Text>
              <View style={styles.packInfo}>
                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.packDescription}>{pack.description}</Text>
              </View>
              {owned ? (
                <Text style={styles.ownedBadge}>✅ Owned</Text>
              ) : (
                isSubscribed ? (
                  <View style={styles.discountContainer}>
                    <Text style={styles.originalCost}>{pack.cost}</Text>
                    <Text style={styles.packCost}>{getDiscountedCost(pack.cost)} 🍯</Text>
                  </View>
                ) : (
                  <Text style={styles.packCost}>{pack.cost} 🍯</Text>
                )
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3E5F5' },
  content: { padding: 16, paddingBottom: 32 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  backButtonText: { fontSize: 15, color: '#7C4DFF', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: '#4A148C', textAlign: 'center', marginBottom: 4 },
  honeyBalance: { fontSize: 16, fontWeight: '700', color: '#F57F17', textAlign: 'center', marginBottom: 20, backgroundColor: '#FFF8E1', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'center', overflow: 'hidden' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#4A148C', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#666', marginBottom: 12 },
  packCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, borderWidth: 2, borderColor: '#E0E0E0' },
  packCardOwned: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  packPreview: { fontSize: 32, marginRight: 12 },
  packInfo: { flex: 1 },
  packName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  packDescription: { fontSize: 12, color: '#666' },
  packCost: { fontSize: 15, fontWeight: '700', color: '#F57F17', backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  ownedBadge: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  discountContainer: { alignItems: 'center' },
  originalCost: { fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginBottom: 2 },
  premiumBanner: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'center', marginBottom: 16 },
  premiumBannerText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
});
