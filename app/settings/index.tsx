import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { createStorage } from '../../src/services/storage';

const BG_COLORS = [
  { color: '#F3E5F5', label: 'Pink' },
  { color: '#E3F2FD', label: 'Blue' },
  { color: '#E8F5E9', label: 'Green' },
  { color: '#FFF8E1', label: 'Yellow' },
  { color: '#FFF3E0', label: 'Orange' },
  { color: '#FFFFFF', label: 'White' },
];

const TEXT_COLORS = [
  { color: '#4A148C', label: 'Purple' },
  { color: '#333333', label: 'Black' },
  { color: '#1A237E', label: 'Navy' },
  { color: '#1B5E20', label: 'Green' },
];

function getStoredColor(key: string, fallback: string): string {
  try {
    const storage = createStorage();
    return storage.getString(key) || fallback;
  } catch {
    return fallback;
  }
}

function saveColor(key: string, color: string) {
  try {
    const storage = createStorage();
    storage.set(key, color);
  } catch {}
}

function getEquippedLabel(key: string, fallback: string): string {
  try {
    const storage = createStorage();
    return storage.getString(key) || fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuth();
  const [bgColor, setBgColor] = useState(getStoredColor('app_bg_color', '#F3E5F5'));
  const [textColor, setTextColor] = useState(getStoredColor('app_text_color', '#4A148C'));

  const handleBgChange = (color: string) => {
    setBgColor(color);
    saveColor('app_bg_color', color);
  };

  const handleTextChange = (color: string) => {
    setTextColor(color);
    saveColor('app_text_color', color);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>  
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton} testID="back-button">
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: textColor }]}>⚙️ Settings</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>🎨 Appearance</Text>
          
          <Text style={styles.label}>Background Color</Text>
          <View style={styles.colorRow}>
            {BG_COLORS.map((item) => (
              <TouchableOpacity
                key={item.color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: item.color },
                  bgColor === item.color && styles.colorSwatchSelected,
                ]}
                onPress={() => handleBgChange(item.color)}
                accessibilityLabel={`Background: ${item.label}`}
                testID={`bg-color-${item.label}`}
              />
            ))}
          </View>

          <Text style={styles.label}>Text Color</Text>
          <View style={styles.colorRow}>
            {TEXT_COLORS.map((item) => (
              <TouchableOpacity
                key={item.color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: item.color },
                  textColor === item.color && styles.colorSwatchSelected,
                ]}
                onPress={() => handleTextChange(item.color)}
                accessibilityLabel={`Text: ${item.label}`}
                testID={`text-color-${item.label}`}
              />
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Active Background Effect</Text>
          <TouchableOpacity style={styles.navButton} onPress={() => router.push('/settings/shop')}>
            <Text style={styles.navButtonText}>{getEquippedLabel('equipped_bg_pack', 'None — Browse Shop →')}</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 12 }]}>Active Text Style</Text>
          <TouchableOpacity style={styles.navButton} onPress={() => router.push('/settings/shop')}>
            <Text style={styles.navButtonText}>{getEquippedLabel('equipped_text_pack', 'None — Browse Shop →')}</Text>
          </TouchableOpacity>
        </View>

        {/* Shop */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>🛒 Shop</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push('/settings/shop')}
            testID="shop-link"
          >
            <Text style={styles.navButtonText}>Browse Packs →</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>🗣️ Voice</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push('/settings/voice')}
            testID="voice-settings-link"
          >
            <Text style={styles.navButtonText}>Voice Settings →</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>👤 Account</Text>
          {isAuthenticated ? (
            <View>
              <Text style={styles.accountEmail}>{user?.email}</Text>
              <TouchableOpacity style={styles.signOutButton} onPress={signOut} testID="settings-sign-out">
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/auth/login')}
              testID="settings-sign-in"
            >
              <Text style={styles.navButtonText}>Sign In →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  backButtonText: { fontSize: 15, color: '#7C4DFF', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  section: { marginBottom: 24, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 8 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  colorSwatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#ddd' },
  colorSwatchSelected: { borderColor: '#7C4DFF', borderWidth: 3 },
  navButton: { backgroundColor: '#EDE7F6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  navButtonText: { fontSize: 16, fontWeight: '600', color: '#7C4DFF' },
  accountEmail: { fontSize: 14, color: '#555', marginBottom: 12 },
  signOutButton: { backgroundColor: '#FFCDD2', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  signOutButtonText: { fontSize: 15, fontWeight: '600', color: '#C62828' },
});
