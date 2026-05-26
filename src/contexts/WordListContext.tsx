import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WordList, CustomWordList } from '../types';
import { ValidationError } from '../types/errors';
import { validateListName, validateWordList } from '../utils/validation';
import { WordListRepository } from '../services/WordListRepository';
import * as CommunityListService from '../services/CommunityListService';
import { BUILTIN_LISTS } from '../data/builtinLists';
import { createStorage } from '../services/storage';

const storage = createStorage();
const repository = new WordListRepository(storage, BUILTIN_LISTS);

export interface MigrationQueueEntry {
  list: CustomWordList;
  requiresAgreement: true;
}

/**
 * Pure helper function that builds a migration queue from local lists.
 * Each entry requires the user to accept the sharing agreement before migration.
 *
 * Validates: Requirements 10.4
 */
export function buildMigrationQueue(localLists: CustomWordList[]): MigrationQueueEntry[] {
  return localLists.map((list) => ({
    list,
    requiresAgreement: true as const,
  }));
}

interface WordListContextValue {
  lists: WordList[];
  getById: (id: string) => WordList | undefined;
  saveCustomList: (list: Omit<CustomWordList, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  deleteCustomList: (id: string) => void;
  publishList: (list: CustomWordList, sharingAgreementAccepted: boolean) => Promise<void>;
  adoptSharedList: (sharedListId: string) => Promise<void>;
  migrateLocalLists: (localLists: CustomWordList[]) => MigrationQueueEntry[];
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

  /**
   * Publishes a custom list to the community library.
   * Requires the sharing agreement to be accepted.
   *
   * Requirements: 3.2, 3.3, 3.4, 3.5
   */
  const publishList = useCallback(
    async (list: CustomWordList, sharingAgreementAccepted: boolean) => {
      if (!sharingAgreementAccepted) {
        throw new ValidationError(
          'sharingAgreement',
          'Sharing agreement must be accepted before publishing a list.'
        );
      }

      const now = new Date().toISOString();

      const sharedListId = await CommunityListService.publishList({
        name: list.name,
        words: list.words,
        creatorUid: list.creatorUid ?? '',
        creatorDisplayName: '',
      });

      // Update the list with sharing metadata
      const updatedList: CustomWordList = {
        ...list,
        sharedListId,
        sharingAgreementAcceptedAt: now,
        updatedAt: now,
      };

      repository.save(updatedList);
      refresh();
    },
    [refresh]
  );

  /**
   * Adopts a shared list from the community library.
   * Fetches the shared list data, creates a local copy, and records the adoption.
   *
   * Requirements: 4.4
   */
  const adoptSharedList = useCallback(
    async (sharedListId: string) => {
      const sharedList = await CommunityListService.getSharedListById(sharedListId);

      if (!sharedList) {
        throw new Error(`Shared list with ID "${sharedListId}" not found.`);
      }

      const now = new Date().toISOString();
      const newList: CustomWordList = {
        id: generateId(),
        name: sharedList.name,
        type: 'custom',
        words: sharedList.words,
        wordCount: sharedList.words.length,
        createdAt: now,
        updatedAt: now,
        sharedListId,
      };

      repository.save(newList);

      // Record the adoption in Firestore
      await CommunityListService.adoptList(sharedListId, '');

      refresh();
    },
    [refresh]
  );

  /**
   * Builds a migration queue for local lists after authentication.
   * Returns an array of entries, each requiring the user to accept the sharing agreement.
   * This is a pure function — actual migration happens when the user accepts each entry.
   *
   * Requirements: 10.4
   */
  const migrateLocalLists = useCallback(
    (localLists: CustomWordList[]): MigrationQueueEntry[] => {
      return buildMigrationQueue(localLists);
    },
    []
  );

  return (
    <WordListContext.Provider
      value={{
        lists,
        getById,
        saveCustomList,
        deleteCustomList,
        publishList,
        adoptSharedList,
        migrateLocalLists,
      }}
    >
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
