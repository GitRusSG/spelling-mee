import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { storage, db } from './firebase';
import { DictationStorageError } from '../types/errors';

/**
 * DictationStorageService — upload/download/delete dictation audio to Firebase Storage.
 *
 * Firebase Storage path: dictation/{uid}/{listId}/{word}.m4a
 * Firestore metadata: users/{uid}/dictationRecordings/{recordingId}
 *
 * The recordingId is derived as `${listId}_${word}` to ensure one recording per word per list.
 */

/**
 * Builds the Firebase Storage path for a dictation recording.
 */
function buildStoragePath(uid: string, listId: string, word: string): string {
  return `dictation/${uid}/${listId}/${word}.m4a`;
}

/**
 * Builds a deterministic Firestore document ID for a recording.
 * Uses listId + word to ensure one recording per word per list.
 */
function buildRecordingDocId(listId: string, word: string): string {
  return `${listId}_${word}`;
}

/**
 * Uploads a dictation recording to Firebase Storage and stores metadata in Firestore.
 *
 * Steps:
 * 1. Fetch the local file as a blob
 * 2. Upload to Firebase Storage at path dictation/{uid}/{listId}/{word}.m4a
 * 3. Get the download URL
 * 4. Store/update metadata in Firestore users/{uid}/dictationRecordings
 * 5. Return the download URL
 *
 * @returns The download URL for the uploaded recording
 */
export async function uploadRecording(
  uid: string,
  listId: string,
  word: string,
  localUri: string
): Promise<string> {
  try {
    // 1. Fetch the local file as a blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    // 2. Upload to Firebase Storage
    const storagePath = buildStoragePath(uid, listId, word);
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);

    // 3. Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // 4. Store/update metadata in Firestore
    const now = new Date().toISOString();
    const recordingDocId = buildRecordingDocId(listId, word);
    const recordingsColRef = collection(db, 'users', uid, 'dictationRecordings');
    const recordingDocRef = doc(recordingsColRef, recordingDocId);

    await setDoc(recordingDocRef, {
      listId,
      word,
      storageUrl: downloadUrl,
      recordedAt: now,
      updatedAt: now,
    });

    // 5. Return the download URL
    return downloadUrl;
  } catch (error) {
    if (error instanceof DictationStorageError) {
      throw error;
    }
    throw new DictationStorageError(
      'upload-failed',
      word,
      `Failed to upload dictation recording for "${word}": ${(error as Error).message}`
    );
  }
}

/**
 * Retrieves the download URL for a dictation recording by querying Firestore metadata.
 *
 * @returns The storage URL or null if no recording exists for this word
 */
export async function getDownloadUrl(
  uid: string,
  listId: string,
  word: string
): Promise<string | null> {
  try {
    const recordingDocId = buildRecordingDocId(listId, word);
    const recordingDocRef = doc(db, 'users', uid, 'dictationRecordings', recordingDocId);
    const snapshot = await getDoc(recordingDocRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return data.storageUrl ?? null;
  } catch (error) {
    if (error instanceof DictationStorageError) {
      throw error;
    }
    throw new DictationStorageError(
      'download-failed',
      word,
      `Failed to get download URL for "${word}": ${(error as Error).message}`
    );
  }
}

/**
 * Deletes a dictation recording from Firebase Storage and removes its Firestore metadata.
 *
 * Steps:
 * 1. Delete the file from Firebase Storage
 * 2. Delete the metadata document from Firestore
 */
export async function deleteRecording(
  uid: string,
  listId: string,
  word: string
): Promise<void> {
  try {
    // 1. Delete from Firebase Storage
    const storagePath = buildStoragePath(uid, listId, word);
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    // 2. Delete metadata from Firestore
    const recordingDocId = buildRecordingDocId(listId, word);
    const recordingDocRef = doc(db, 'users', uid, 'dictationRecordings', recordingDocId);
    await deleteDoc(recordingDocRef);
  } catch (error) {
    if (error instanceof DictationStorageError) {
      throw error;
    }
    throw new DictationStorageError(
      'not-found',
      word,
      `Failed to delete dictation recording for "${word}": ${(error as Error).message}`
    );
  }
}
