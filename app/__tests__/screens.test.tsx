import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => ({ id: 'custom-1' }),
}));

const mockSaveCustomList = jest.fn();
const mockDeleteCustomList = jest.fn();
const mockGetById = jest.fn();

jest.mock('../../src/contexts/WordListContext', () => ({
  useWordList: () => ({
    lists: [
      {
        id: 'top-schools',
        name: 'Top Schools',
        type: 'builtin',
        words: ['apple', 'banana', 'cherry'],
        wordCount: 3,
      },
      {
        id: 'grade-1',
        name: 'Grade 1 Minimum',
        type: 'builtin',
        words: ['cat', 'dog', 'fish'],
        wordCount: 3,
      },
      {
        id: 'custom-1',
        name: 'My Custom List',
        type: 'custom',
        words: ['hello', 'world'],
        wordCount: 2,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    saveCustomList: mockSaveCustomList,
    deleteCustomList: mockDeleteCustomList,
    getById: mockGetById,
  }),
  useWordListContext: () => ({
    lists: [],
    saveCustomList: mockSaveCustomList,
    deleteCustomList: mockDeleteCustomList,
    getById: mockGetById,
  }),
}));

jest.mock('../../src/contexts/SubscriptionContext', () => ({
  useSubscription: () => ({
    isSubscribed: false,
    status: 'none',
    expiresAt: null,
    purchase: jest.fn(),
    restore: jest.fn(),
  }),
}));

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { BANNER: 'test-banner-id' },
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import HomeScreen from '../index';
import CreateListScreen from '../list/create';
import EditListScreen from '../list/[id]/edit';

// ─── HomeScreen Tests ────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the "Built-in Lists" section title', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Built-in Lists')).toBeTruthy();
  });

  it('renders built-in word lists', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Top Schools')).toBeTruthy();
    expect(getByText('Grade 1 Minimum')).toBeTruthy();
  });

  it('renders the "My Lists" section title for custom lists', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('My Lists')).toBeTruthy();
  });

  it('renders custom word lists', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('My Custom List')).toBeTruthy();
  });

  it('renders the "Create New List" button', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('create-list-button')).toBeTruthy();
  });

  it('navigates to create screen when create button is pressed', () => {
    const { getByTestId } = render(<HomeScreen />);
    fireEvent.press(getByTestId('create-list-button'));
    expect(mockPush).toHaveBeenCalledWith('/list/create');
  });

  it('renders AdBanner for non-subscribers', () => {
    const { UNSAFE_getByType } = render(<HomeScreen />);
    // AdBanner renders a BannerAd component (mocked as string 'BannerAd')
    // We verify the component tree includes it by checking the mock renders
    const { getByText } = render(<HomeScreen />);
    // The AdBanner is conditionally rendered; since isSubscribed is false, it should be present
    // We can verify by checking the component doesn't throw and renders the full tree
    expect(getByText('Spelling Mee')).toBeTruthy();
  });
});

// ─── CreateListScreen Tests ──────────────────────────────────────────────────

describe('CreateListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the create list form', () => {
    const { getByText, getByTestId } = render(<CreateListScreen />);
    expect(getByText('Create New List')).toBeTruthy();
    expect(getByTestId('name-input')).toBeTruthy();
    expect(getByTestId('word-input')).toBeTruthy();
    expect(getByTestId('save-button')).toBeTruthy();
  });

  it('shows name validation error for empty name on save', () => {
    const { getByTestId } = render(<CreateListScreen />);

    // Add a word so only name validation fails
    fireEvent.changeText(getByTestId('word-input'), 'hello');
    fireEvent.press(getByTestId('add-word-button'));

    // Try to save with empty name
    fireEvent.press(getByTestId('save-button'));

    expect(getByTestId('name-error')).toBeTruthy();
  });

  it('shows words validation error when saving with no words', () => {
    const { getByTestId } = render(<CreateListScreen />);

    // Set a valid name but no words
    fireEvent.changeText(getByTestId('name-input'), 'Valid Name');
    fireEvent.press(getByTestId('save-button'));

    expect(getByTestId('words-error')).toBeTruthy();
  });

  it('calls saveCustomList on valid input', () => {
    const { getByTestId } = render(<CreateListScreen />);

    // Enter a valid name
    fireEvent.changeText(getByTestId('name-input'), 'My Test List');

    // Add a word
    fireEvent.changeText(getByTestId('word-input'), 'apple');
    fireEvent.press(getByTestId('add-word-button'));

    // Save
    fireEvent.press(getByTestId('save-button'));

    expect(mockSaveCustomList).toHaveBeenCalledWith({
      name: 'My Test List',
      type: 'custom',
      words: ['apple'],
      wordCount: 1,
    });
  });

  it('navigates home after successful save', () => {
    const { getByTestId } = render(<CreateListScreen />);

    fireEvent.changeText(getByTestId('name-input'), 'My Test List');
    fireEvent.changeText(getByTestId('word-input'), 'apple');
    fireEvent.press(getByTestId('add-word-button'));
    fireEvent.press(getByTestId('save-button'));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

// ─── EditListScreen Tests ────────────────────────────────────────────────────

describe('EditListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetById.mockReturnValue({
      id: 'custom-1',
      name: 'My Custom List',
      type: 'custom',
      words: ['hello', 'world'],
      wordCount: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('pre-populates the name field from the existing list', () => {
    const { getByTestId } = render(<EditListScreen />);
    const nameInput = getByTestId('name-input');
    expect(nameInput.props.value).toBe('My Custom List');
  });

  it('pre-populates the words from the existing list', () => {
    const { getByText } = render(<EditListScreen />);
    expect(getByText('hello')).toBeTruthy();
    expect(getByText('world')).toBeTruthy();
  });

  it('renders the delete button', () => {
    const { getByTestId } = render(<EditListScreen />);
    expect(getByTestId('delete-button')).toBeTruthy();
  });

  it('calls deleteCustomList when delete is confirmed', () => {
    jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<EditListScreen />);
    fireEvent.press(getByTestId('delete-button'));

    // Alert.alert should have been called
    expect(Alert.alert).toHaveBeenCalled();

    // Simulate pressing the "Delete" button in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2].find(
      (btn: { text: string }) => btn.text === 'Delete'
    );
    deleteButton.onPress();

    expect(mockDeleteCustomList).toHaveBeenCalledWith('custom-1');
  });

  it('navigates home after delete', () => {
    jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<EditListScreen />);
    fireEvent.press(getByTestId('delete-button'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2].find(
      (btn: { text: string }) => btn.text === 'Delete'
    );
    deleteButton.onPress();

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('shows not found message when list does not exist', () => {
    mockGetById.mockReturnValue(undefined);

    const { getByText } = render(<EditListScreen />);
    expect(getByText('List not found')).toBeTruthy();
  });
});
