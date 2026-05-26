import { getProfile, createProfile, updateDisplayName } from '../UserProfileService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
}));

jest.mock('../firebase', () => ({
  db: 'mock-db',
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref');
  });

  describe('getProfile', () => {
    it('returns the user profile when the document exists', async () => {
      const profileData = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => profileData,
      });

      const result = await getProfile('user-123');

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user-123');
      expect(result).toEqual(profileData);
    });

    it('returns null when the document does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      });

      const result = await getProfile('nonexistent-uid');

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'nonexistent-uid');
      expect(result).toBeNull();
    });
  });

  describe('createProfile', () => {
    it('creates a profile document with correct fields', async () => {
      mockSetDoc.mockResolvedValue(undefined);

      const beforeTime = new Date().toISOString();
      await createProfile('user-456', {
        email: 'new@example.com',
        displayName: 'New User',
      });
      const afterTime = new Date().toISOString();

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user-456');
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          uid: 'user-456',
          email: 'new@example.com',
          displayName: 'New User',
        })
      );

      // Verify timestamps are ISO strings within the expected range
      const savedProfile = mockSetDoc.mock.calls[0][1];
      expect(savedProfile.createdAt).toBeDefined();
      expect(savedProfile.updatedAt).toBeDefined();
      expect(savedProfile.createdAt >= beforeTime).toBe(true);
      expect(savedProfile.createdAt <= afterTime).toBe(true);
      expect(savedProfile.createdAt).toBe(savedProfile.updatedAt);
    });
  });

  describe('updateDisplayName', () => {
    it('updates the display name and updatedAt timestamp', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const beforeTime = new Date().toISOString();
      await updateDisplayName('user-789', 'Updated Name');
      const afterTime = new Date().toISOString();

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user-789');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          displayName: 'Updated Name',
        })
      );

      // Verify updatedAt is set
      const updatePayload = mockUpdateDoc.mock.calls[0][1];
      expect(updatePayload.updatedAt).toBeDefined();
      expect(updatePayload.updatedAt >= beforeTime).toBe(true);
      expect(updatePayload.updatedAt <= afterTime).toBe(true);
    });
  });
});
