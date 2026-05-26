import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from './firebase';
import { SharedListInput, SharedListSummary, SharedListDetail } from '../types';

/**
 * CommunityListService — Firestore operations for shared community lists.
 *
 * Firestore collection: sharedLists/{listId}
 * Adopted lists stored in: users/{userId}/adoptedLists/{sharedListId}
 */

/**
 * Publishes a custom list to the community library.
 * Returns the Firestore-generated document ID.
 */
export async function publishList(list: SharedListInput): Promise<string> {
  const now = new Date().toISOString();
  const data = {
    name: list.name,
    words: list.words,
    wordCount: list.words.length,
    creatorUid: list.creatorUid,
    creatorDisplayName: list.creatorDisplayName,
    createdAt: now,
    updatedAt: now,
  };

  const colRef = collection(db, 'sharedLists');
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

/**
 * Retrieves a paginated list of shared lists from the community library.
 * Results are ordered by creation date (newest first).
 *
 * @param options.limit - Maximum number of results to return (default: 20)
 * @param options.startAfter - Firestore document ID to start after for pagination
 */
export async function getSharedLists(
  options?: { limit?: number; startAfter?: string }
): Promise<SharedListSummary[]> {
  const pageSize = options?.limit ?? 20;
  const colRef = collection(db, 'sharedLists');

  let q;

  if (options?.startAfter) {
    const cursorDocRef = doc(db, 'sharedLists', options.startAfter);
    const cursorSnapshot = await getDoc(cursorDocRef);

    if (cursorSnapshot.exists()) {
      q = query(
        colRef,
        orderBy('createdAt', 'desc'),
        startAfter(cursorSnapshot),
        limit(pageSize)
      );
    } else {
      // If cursor document doesn't exist, return from the beginning
      q = query(colRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }
  } else {
    q = query(colRef, orderBy('createdAt', 'desc'), limit(pageSize));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      wordCount: data.wordCount,
      creatorDisplayName: data.creatorDisplayName,
      createdAt: data.createdAt,
    };
  });
}

/**
 * Retrieves a single shared list by its Firestore document ID.
 * Returns null if the list does not exist.
 */
export async function getSharedListById(id: string): Promise<SharedListDetail | null> {
  const docRef = doc(db, 'sharedLists', id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name,
    words: data.words,
    wordCount: data.wordCount,
    creatorDisplayName: data.creatorDisplayName,
    createdAt: data.createdAt,
  };
}

/**
 * Adopts a shared list for a user by copying the list data into
 * the user's sub-collection: users/{userId}/adoptedLists/{sharedListId}
 */
export async function adoptList(sharedListId: string, userId: string): Promise<void> {
  // Fetch the shared list data
  const sharedDocRef = doc(db, 'sharedLists', sharedListId);
  const sharedSnapshot = await getDoc(sharedDocRef);

  if (!sharedSnapshot.exists()) {
    throw new Error(`Shared list with ID "${sharedListId}" not found.`);
  }

  const sharedData = sharedSnapshot.data();

  // Store the adopted list in the user's sub-collection
  const adoptedDocRef = doc(db, 'users', userId, 'adoptedLists', sharedListId);
  await setDoc(adoptedDocRef, {
    name: sharedData.name,
    words: sharedData.words,
    wordCount: sharedData.wordCount,
    creatorDisplayName: sharedData.creatorDisplayName,
    originalListId: sharedListId,
    adoptedAt: new Date().toISOString(),
  });
}
