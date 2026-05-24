import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { MMKV } from 'react-native-mmkv';
import { WordList, CustomWordList } from '../types';
import { ValidationError } from '../types/errors';
import { validateListName, validateWordList } from '../utils/validation';
import { WordListRepository } from '../services/WordListRepository';
import { BUILTIN_LISTS } from '../data/builtinLists';

const storage = new MMKV({ id: 'word-lists' });
const repository = new WordListRepository(storage, BUILTIN_LISTS);

interface WordListContextValue {
  lists: WordList[];
  getById: (id: string) => WordList | undefined;
  saveCustomList: (list: Omit<CustomWordList, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  deleteCustomList: (id: string) => void;
}

const WordListContext = createContext<WordListContextValue | undefined>(undefined);

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function WordListProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<WordList[]>(() => repository.getAll());

  const refresh = useCallback(() => {
    setLists(repository.getAll());
  }, []);

  const getById = useCallback((id: string) => {
    return repository.getById(id);
  }, []);

  const saveCustomList = useCallback(
    (input: Omit<CustomWordList, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const nameError = validateListName(input.name);
      if (nameError) throw nameError;

      const wordsError = validateWordList(input.words);
      if (wordsError) throw wordsError;

      const now = new Date().toISOString();
      const list: CustomWordList = {
        ...input,
        id: input.id ?? generateId(),
        type: 'custom',
        wordCount: input.words.length,
        createdAt: now,
        updatedAt: now,
      };

      repository.save(list);
      refresh();
    },
    [refresh]
  );

  const deleteCustomList = useCallback(
    (id: string) => {
      repository.delete(id);
      refresh();
    },
    [refresh]
  );

  return (
    <WordListContext.Provider value={{ lists, getById, saveCustomList, deleteCustomList }}>
      {children}
    </WordListContext.Provider>
  );
}

export function useWordList(): WordListContextValue {
  const ctx = useContext(WordListContext);
  if (!ctx) throw new Error('useWordList must be used within a WordListProvider');
  return ctx;
}

// Alias for useWordList — both names are supported
export const useWordListContext = useWordList;

export { WordListContext };
