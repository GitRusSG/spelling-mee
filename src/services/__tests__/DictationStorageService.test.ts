import { uploadRecording, getDownloadUrl, deleteRecording } from '../DictationStorageService';
import { DictationStorageError } from '../../types/errors';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRef = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockDeleteObject = jest.fn();

jest.mock('firebase/storage', () => ({
  ref: (...args: any[]) => mockRef(...args),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: any[]) => mockDeleteObject(...args),
}));

const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
}));

jest.mock('../firebase', () => ({
  storage: 'mock-storage',
  db: 'mock-db',
}));

// Mock global fetch for blob fetching
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DictationStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRef.mockReturnValue('mock-storage-ref');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockCollection.mockReturnValue('mock-collection-ref');
  });

  describe('uploadRecording', () => {
    it('uploads a recording and returns the download URL', async () => {
      const mockBlob = new Blob(['audio-data'], { type: 'audio/m4a' });
      mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
      mockUploadBytes.mockResolvedValue(undefined);
      mockGetDownloadURL.mockResolvedValue('https://storage.example.com/dictation/uid1/list1/hello.m4a');
      mockSetDoc.mockResolvedValue(undefined);

      const result = await uploadRecording('uid1', 'list1', 'hello', 'file:///local/recording.m4a');

      expect(result).toBe('https://storage.example.com/dictation/uid1/list1/hello.m4a');
    });

    it('fetches the local file as a blob', async () => {
      const mockBlob = new Blob(['audio-data']);
      mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
      mockUploadBytes.mockResolvedValue(undefined);
      mockGetDownloadURL.mockResolvedValue('https://example.com/url');
      mockSetDoc.mockResolvedValue(undefined);

      await uploadRecording('uid1', 'list1', 'cat', 'file:///path/to/cat.m4a');

      expect(mockFetch).toHaveBeenCalledWith('file:///path/to/cat.m4a');
    });

    it('uploads to the correct Firebase Storage path', async () => {
      const mockBlob = new Blob(['audio-data']);
      mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
      mockUploadBytes.mockResolvedValue(undefined);
      mockGetDownloadURL.mockResolvedValue('https://example.com/url');
      mockSetDoc.mockResolvedValue(undefined);

      await uploadRecording('user-abc', 'list-xyz', 'apple', 'file:///local.m4a');

      expect(mockRef).toHaveBeenCalledWith('mock-storage', 'dictation/user-abc/list-xyz/apple.m4a');
      expect(mockUploadBytes).toHaveBeenCalledWith('mock-storage-ref', mockBlob);
    });

    it('stores metadata in Firestore with correct doc ID (listId_word)', async () => {
      const mockBlob = new Blob(['audio-data']);
      mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
      mockUploadBytes.mockResolvedValue(undefined);
      mockGetDownloadURL.mockResolvedValue('https://example.com/download-url');
      mockSetDoc.mockResolvedValue(undefined);

      const beforeTime = new Date().toISOString();
      await uploadRecording('uid1', 'list1', 'dog', 'file:///dog.m4a');
      const afterTime = new Date().toISOString();

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'users', 'uid1', 'dictationRecordings');
      expect(mockDoc).toHaveBeenCalledWith('mock-collection-ref', 'list1_dog');
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          listId: 'list1',
          word: 'dog',
          storageUrl: 'https://example.com/download-url',
        })
      );

      const savedData = mockSetDoc.mock.calls[0][1];
      expect(savedData.recordedAt >= beforeTime).toBe(true);
      expect(savedData.recordedAt <= afterTime).toBe(true);
      expect(savedData.updatedAt).toBe(savedData.recordedAt);
    });

    it('throws DictationStorageError with upload-failed reason on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        uploadRecording('uid1', 'list1', 'word', 'file:///bad.m4a')
      ).rejects.toThrow(DictationStorageError);

      try {
        await uploadRecording('uid1', 'list1', 'word', 'file:///bad.m4a');
      } catch (error) {
        expect(error).toBeInstanceOf(DictationStorageError);
        expect((error as DictationStorageError).reason).toBe('upload-failed');
        expect((error as DictationStorageError).word).toBe('word');
      }
    });
  });

  describe('getDownloadUrl', () => {
    it('returns the storageUrl when a recording exists', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          storageUrl: 'https://storage.example.com/dictation/uid1/list1/cat.m4a',
          listId: 'list1',
          word: 'cat',
        }),
      });

      const result = await getDownloadUrl('uid1', 'list1', 'cat');

      expect(result).toBe('https://storage.example.com/dictation/uid1/list1/cat.m4a');
      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'uid1', 'dictationRecordings', 'list1_cat');
    });

    it('returns null when no recording exists', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getDownloadUrl('uid1', 'list1', 'nonexistent');

      expect(result).toBeNull();
    });

    it('throws DictationStorageError with download-failed reason on failure', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firestore unavailable'));

      try {
        await getDownloadUrl('uid1', 'list1', 'word');
      } catch (error) {
        expect(error).toBeInstanceOf(DictationStorageError);
        expect((error as DictationStorageError).reason).toBe('download-failed');
        expect((error as DictationStorageError).word).toBe('word');
      }
    });
  });

  describe('deleteRecording', () => {
    it('deletes the file from Storage and metadata from Firestore', async () => {
      mockDeleteObject.mockResolvedValue(undefined);
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteRecording('uid1', 'list1', 'hello');

      expect(mockRef).toHaveBeenCalledWith('mock-storage', 'dictation/uid1/list1/hello.m4a');
      expect(mockDeleteObject).toHaveBeenCalledWith('mock-storage-ref');
      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'uid1', 'dictationRecordings', 'list1_hello');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('throws DictationStorageError with not-found reason on failure', async () => {
      mockDeleteObject.mockRejectedValue(new Error('Object not found'));

      try {
        await deleteRecording('uid1', 'list1', 'missing');
      } catch (error) {
        expect(error).toBeInstanceOf(DictationStorageError);
        expect((error as DictationStorageError).reason).toBe('not-found');
        expect((error as DictationStorageError).word).toBe('missing');
      }
    });
  });
});
