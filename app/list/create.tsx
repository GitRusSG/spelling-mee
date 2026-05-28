import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWordList } from '../../src/contexts/WordListContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { validateListName, validateWordList } from '../../src/utils/validation';
import { containsProfanity, nameContainsProfanity } from '../../src/utils/profanityFilter';
import { ValidationError } from '../../src/types/errors';
import AuthGate from '../../src/components/AuthGate';

function CreateListForm() {
  const router = useRouter();
  const { saveCustomList, publishList } = useWordList();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [wordInput, setWordInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [wordsError, setWordsError] = useState<string | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleNameChange = (text: string) => {
    setName(text);
    const error = validateListName(text);
    setNameError(error ? error.message : null);
  };

  const handleAddWord = () => {
    const trimmed = wordInput.trim();
    if (trimmed.length === 0) return;
    if (containsProfanity(trimmed)) {
      setWordsError('Please remove inappropriate words');
      return;
    }
    if (trimmed.length < 2 || /\d/.test(trimmed)) {
      // Still add it but show a brief warning
      setWordsError('⚠️ This might not be a real word');
      setTimeout(() => setWordsError(null), 2000);
    } else {
      // Clear words error when a word is added
      if (wordsError) setWordsError(null);
    }
    setWords((prev) => [...prev, trimmed]);
    setWordInput('');
  };

  const handleDeleteWord = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleAgreement = () => {
    setAgreementAccepted((prev) => !prev);
    if (agreementError) setAgreementError(null);
  };

  const handleSave = async () => {
    // Validate name
    const nameValidation = validateListName(name);
    if (nameValidation) {
      setNameError(nameValidation.message);
      return;
    }

    // Check name for profanity
    if (nameContainsProfanity(name)) {
      setNameError('Please choose an appropriate list name');
      return;
    }

    // Validate words
    const wordsValidation = validateWordList(words);
    if (wordsValidation) {
      setWordsError(wordsValidation.message);
      return;
    }

    // Check words for profanity
    if (words.some((word) => containsProfanity(word))) {
      setWordsError('Please remove inappropriate words');
      return;
    }

    // Validate sharing agreement
    if (!agreementAccepted) {
      setAgreementError('You must accept the sharing agreement before saving.');
      return;
    }

    setIsSaving(true);
    try {
      // Save the list locally first (this is fast)
      const listData = {
        name: name.trim(),
        type: 'custom' as const,
        words,
        wordCount: words.length,
        creatorUid: user?.uid,
      };

      saveCustomList(listData);

      // Navigate immediately
      router.replace('/');

      // Publish to community in background (fire-and-forget)
      const now = new Date().toISOString();
      publishList(
        {
          ...listData,
          id: 'temp',
          createdAt: now,
          updatedAt: now,
        },
        agreementAccepted
      ).catch(() => {
        // Silent failure — list is saved locally regardless
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        if (error.field === 'name') {
          setNameError(error.message);
        } else if (error.field === 'words') {
          setWordsError(error.message);
        } else if (error.field === 'sharingAgreement') {
          setAgreementError(error.message);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} testID="back-button">
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create New List</Text>

        {/* Name Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>List Name</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            placeholder="Enter list name"
            value={name}
            onChangeText={handleNameChange}
            testID="name-input"
            accessibilityLabel="List name"
          />
          {nameError && (
            <Text style={styles.errorText} testID="name-error">
              {nameError}
            </Text>
          )}
        </View>

        {/* Word Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Words</Text>
          <View style={styles.wordInputRow}>
            <TextInput
              style={[styles.input, styles.wordInput]}
              placeholder="Enter a word"
              value={wordInput}
              onChangeText={setWordInput}
              onSubmitEditing={handleAddWord}
              testID="word-input"
              accessibilityLabel="Word input"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddWord}
              accessibilityRole="button"
              accessibilityLabel="Add word"
              testID="add-word-button"
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {wordsError && (
            <Text style={styles.errorText} testID="words-error">
              {wordsError}
            </Text>
          )}
        </View>

        {/* Word List */}
        <FlatList
          data={words}
          keyExtractor={(_, index) => index.toString()}
          style={styles.wordList}
          renderItem={({ item, index }) => (
            <View style={styles.wordItem}>
              <Text style={styles.wordText}>{item}</Text>
              <TouchableOpacity
                onPress={() => handleDeleteWord(index)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item}`}
                testID={`delete-word-${index}`}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No words added yet.</Text>
          }
        />

        {/* Sharing Agreement */}
        <View style={styles.agreementContainer}>
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={handleToggleAgreement}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreementAccepted }}
            accessibilityLabel="Accept sharing agreement"
            testID="sharing-agreement-checkbox"
          >
            <View style={[styles.checkbox, agreementAccepted && styles.checkboxChecked]}>
              {agreementAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.agreementText}>
              By saving this list, you agree to share it with the Spelling Mee community.
            </Text>
          </TouchableOpacity>
          {agreementError && (
            <Text style={styles.errorText} testID="agreement-error">
              {agreementError}
            </Text>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save list"
          testID="save-button"
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save List'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function CreateListScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthGate>
        <CreateListForm />
      </AuthGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8 },
  backButtonText: { fontSize: 15, color: '#7C4DFF', fontWeight: '600' },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginTop: 4,
  },
  wordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wordList: {
    flex: 1,
    marginTop: 8,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  wordText: {
    fontSize: 16,
    color: '#333',
  },
  deleteText: {
    fontSize: 18,
    color: '#E53935',
    paddingHorizontal: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  agreementContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#7C4DFF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7C4DFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  agreementText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
