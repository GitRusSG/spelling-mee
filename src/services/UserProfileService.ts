import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, CreateProfileInput } from '../types';

/**
 * UserProfileService — manages user profile documents in Firestore.
 *
 * Firestore collection: users/{uid}
 */

/**
 * Retrieves a user profile from Firestore by UID.
 * Returns null if the profile does not exist.
 */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

/**
 * Creates a new user profile document in Firestore.
 * Called during registration to persist the user's profile data.
 */
export async function createProfile(uid: string, data: CreateProfileInput): Promise<void> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid,
    email: data.email,
    displayName: data.displayName,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, profile);
}

/**
 * Updates the display name for an existing user profile.
 */
export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    displayName,
    updatedAt: new Date().toISOString(),
  });
}
