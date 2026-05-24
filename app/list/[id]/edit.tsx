import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWordList } from '../../../src/contexts/WordListContext';
import { validateListName, validateWordList } from '../../../src/utils/validation';
import { ValidationError } from '../../../src/types/errors';

export default function EditListScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, saveCustomList, deleteCustomList } = useWordList();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [wordInput, setWordInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [wordsError, setWordsError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const list = getById(id);
    if (!list || list.type !== 'custom') {
      setNotFound(true);
      return;
    }
    setName(list.name);
    setWords([...list.words]);
  }, [id, getById]);

  const handleNameChange = (text: string) => {
    setName(text);
    const error = validateListName(text);
    setNameError(error ? error.message : null);
  };

  const handleAddWord = () => {
    const trimmed = wordInput.trim();
    if (trimmed.length === 0) return;
    setWords((prev) => [...prev, trimmed]);
    setWordInput('');
    if (wordsError) setWordsError(null);
  };

  const handleDeleteWord = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validate name
    const nameValidation = validateListName(name);
    if (nameValidation) {
      setNameError(nameValidation.message);
      return;
    }

    // Validate words
    const wordsValidation = validateWordList(words);
    if (wordsValidation) {
      setWordsError(wordsValidation.message);
      return;
    }

    try {
      saveCustomList({
        id,
        name: name.trim(),
        type: 'custom',
        words,
        wordCount: words.length,
      });
      router.replace('/');
    } catch (error) {
      if (error instanceof ValidationError) {
        if (error.field === 'name') {
          setNameError(error.message);
        } else if (error.field === 'words') {
          setWordsError(error.message);
        }
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (id) {
              deleteCustomList(id);
              router.replace('/');
            }
          },
        },
      ]
    );
  };

  if (notFound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.errorTitle}>List not found</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Edit List</Text>

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

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save list"
            testID="save-button"
          >
            <Text style={styles.saveButtonText}>Save List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete list"
            testID="delete-button"
          >
            <Text style={styles.deleteButtonText}>Delete List</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E53935',
    marginBottom: 16,
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
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
