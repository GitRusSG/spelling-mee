import { publishList, getSharedLists, getSharedListById, adoptList } from '../CommunityListService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockStartAfter = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  startAfter: (...args: any[]) => mockStartAfter(...args),
}));

jest.mock('../firebase', () => ({
  db: 'mock-db',
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CommunityListService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref');
    mockCollection.mockReturnValue('mock-collection-ref');
    mockQuery.mockReturnValue('mock-query');
    mockOrderBy.mockReturnValue('mock-order-by');
    mockLimit.mockReturnValue('mock-limit');
    mockStartAfter.mockReturnValue('mock-start-after');
  });

  describe('publishList', () => {
    it('publishes a list and returns the generated document ID', async () => {
      mockAddDoc.mockResolvedValue({ id: 'generated-list-id' });

      const input = {
        name: 'Animals',
        words: ['cat', 'dog', 'bird'],
        creatorUid: 'user-123',
        creatorDisplayName: 'Test User',
      };

      const result = await publishList(input);

      expect(result).toBe('generated-list-id');
      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'sharedLists');
      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          name: 'Animals',
          words: ['cat', 'dog', 'bird'],
          wordCount: 3,
          creatorUid: 'user-123',
          creatorDisplayName: 'Test User',
        })
      );
    });

    it('includes createdAt and updatedAt timestamps', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-id' });

      const beforeTime = new Date().toISOString();
      await publishList({
        name: 'Test',
        words: ['hello'],
        creatorUid: 'uid',
        creatorDisplayName: 'User',
      });
      const afterTime = new Date().toISOString();

      const savedData = mockAddDoc.mock.calls[0][1];
      expect(savedData.createdAt >= beforeTime).toBe(true);
      expect(savedData.createdAt <= afterTime).toBe(true);
      expect(savedData.updatedAt).toBe(savedData.createdAt);
    });
  });

  describe('getSharedLists', () => {
    it('returns a list of shared list summaries', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'list-1',
            data: () => ({
              name: 'Animals',
              wordCount: 5,
              creatorDisplayName: 'Alice',
              createdAt: '2024-01-01T00:00:00.000Z',
            }),
          },
          {
            id: 'list-2',
            data: () => ({
              name: 'Colors',
              wordCount: 3,
              creatorDisplayName: 'Bob',
              createdAt: '2024-01-02T00:00:00.000Z',
            }),
          },
        ],
      });

      const result = await getSharedLists();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'list-1',
        name: 'Animals',
        wordCount: 5,
        creatorDisplayName: 'Alice',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      expect(result[1]).toEqual({
        id: 'list-2',
        name: 'Colors',
        wordCount: 3,
        creatorDisplayName: 'Bob',
        createdAt: '2024-01-02T00:00:00.000Z',
      });
    });

    it('uses default limit of 20 when no options provided', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getSharedLists();

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'sharedLists');
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('uses custom limit when provided', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getSharedLists({ limit: 10 });

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('uses startAfter cursor for pagination', async () => {
      const cursorSnapshot = { exists: () => true };
      mockGetDoc.mockResolvedValue(cursorSnapshot);
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getSharedLists({ startAfter: 'cursor-doc-id' });

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'sharedLists', 'cursor-doc-id');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(mockStartAfter).toHaveBeenCalledWith(cursorSnapshot);
    });

    it('falls back to no cursor when startAfter document does not exist', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getSharedLists({ startAfter: 'nonexistent-id' });

      expect(mockStartAfter).not.toHaveBeenCalled();
    });
  });

  describe('getSharedListById', () => {
    it('returns the full shared list detail when it exists', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'list-abc',
        data: () => ({
          name: 'Fruits',
          words: ['apple', 'banana', 'cherry'],
          wordCount: 3,
          creatorDisplayName: 'Charlie',
          createdAt: '2024-03-01T00:00:00.000Z',
        }),
      });

      const result = await getSharedListById('list-abc');

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'sharedLists', 'list-abc');
      expect(result).toEqual({
        id: 'list-abc',
        name: 'Fruits',
        words: ['apple', 'banana', 'cherry'],
        wordCount: 3,
        creatorDisplayName: 'Charlie',
        createdAt: '2024-03-01T00:00:00.000Z',
      });
    });

    it('returns null when the list does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getSharedListById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('adoptList', () => {
    it('copies the shared list data to the user adoptedLists sub-collection', async () => {
      // Mock the shared list fetch
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'Science Words',
          words: ['atom', 'molecule', 'cell'],
          wordCount: 3,
          creatorDisplayName: 'Dr. Smith',
        }),
      });
      mockSetDoc.mockResolvedValue(undefined);

      const beforeTime = new Date().toISOString();
      await adoptList('shared-list-1', 'user-456');
      const afterTime = new Date().toISOString();

      // First call to doc is for the shared list
      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'sharedLists', 'shared-list-1');
      // Second call to doc is for the adopted list sub-collection
      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user-456', 'adoptedLists', 'shared-list-1');

      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          name: 'Science Words',
          words: ['atom', 'molecule', 'cell'],
          wordCount: 3,
          creatorDisplayName: 'Dr. Smith',
          originalListId: 'shared-list-1',
        })
      );

      const savedData = mockSetDoc.mock.calls[0][1];
      expect(savedData.adoptedAt >= beforeTime).toBe(true);
      expect(savedData.adoptedAt <= afterTime).toBe(true);
    });

    it('throws an error when the shared list does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(adoptList('nonexistent-list', 'user-789')).rejects.toThrow(
        'Shared list with ID "nonexistent-list" not found.'
      );
    });
  });
});
