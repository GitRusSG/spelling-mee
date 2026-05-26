import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WordListCard from '../WordListCard';
import ProgressIndicator from '../ProgressIndicator';
import AudioButton from '../AudioButton';
import LetterKeyboard from '../LetterKeyboard';
import { WordList } from '../../types';

// ─── WordListCard Tests ──────────────────────────────────────────────────────

describe('WordListCard', () => {
  const builtinList: WordList = {
    id: 'top-schools',
    name: 'Top Schools',
    type: 'builtin',
    words: ['apple', 'banana', 'cherry'],
    wordCount: 3,
  };

  const customList: WordList = {
    id: 'my-list-1',
    name: 'My Custom List',
    type: 'custom',
    words: ['dog', 'cat', 'bird', 'fish', 'frog'],
    wordCount: 5,
  };

  it('renders the list name', () => {
    const { getByTestId } = render(
      <WordListCard list={builtinList} onPress={jest.fn()} />
    );
    const nameEl = getByTestId('word-list-card-name');
    // Component renders: {emoji} {list.name} — children is an array like ["📖", " ", "Top Schools"]
    const children = nameEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('Top Schools');
  });

  it('renders the word count', () => {
    const { getByTestId } = render(
      <WordListCard list={builtinList} onPress={jest.fn()} />
    );
    const countElement = getByTestId('word-list-card-count');
    expect(countElement.props.children).toEqual([3, ' ', 'words']);
  });

  it('renders "Built-in" badge for builtin lists', () => {
    const { getByText } = render(
      <WordListCard list={builtinList} onPress={jest.fn()} />
    );
    expect(getByText('Built-in')).toBeTruthy();
  });

  it('renders "Custom" badge for custom lists', () => {
    const { getByText } = render(
      <WordListCard list={customList} onPress={jest.fn()} />
    );
    expect(getByText('Custom')).toBeTruthy();
  });

  it('renders singular "word" for single-word lists', () => {
    const singleWordList: WordList = {
      id: 'single',
      name: 'Single',
      type: 'custom',
      words: ['hello'],
      wordCount: 1,
    };
    const { getByTestId } = render(
      <WordListCard list={singleWordList} onPress={jest.fn()} />
    );
    const countElement = getByTestId('word-list-card-count');
    expect(countElement.props.children).toEqual([1, ' ', 'word']);
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <WordListCard list={builtinList} onPress={onPress} />
    );
    fireEvent.press(getByTestId('word-list-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// ─── ProgressIndicator Tests ─────────────────────────────────────────────────

describe('ProgressIndicator', () => {
  it('renders "Word 1 of 10"', () => {
    const { getByLabelText } = render(
      <ProgressIndicator current={1} total={10} />
    );
    expect(getByLabelText('Word 1 of 10')).toBeTruthy();
  });

  it('renders "Word 5 of 20"', () => {
    const { getByLabelText } = render(
      <ProgressIndicator current={5} total={20} />
    );
    expect(getByLabelText('Word 5 of 20')).toBeTruthy();
  });

  it('renders correct accessibility label', () => {
    const { getByLabelText } = render(
      <ProgressIndicator current={3} total={7} />
    );
    expect(getByLabelText('Word 3 of 7')).toBeTruthy();
  });
});

// ─── AudioButton Tests ───────────────────────────────────────────────────────

describe('AudioButton', () => {
  it('renders "Hear the word!" label in idle state', () => {
    const { getByText } = render(
      <AudioButton onPress={jest.fn()} state="idle" />
    );
    expect(getByText('Hear the word!')).toBeTruthy();
  });

  it('renders "Loading…" label and spinner in loading state', () => {
    const { getByText, getByTestId } = render(
      <AudioButton onPress={jest.fn()} state="loading" />
    );
    expect(getByText('Loading…')).toBeTruthy();
    expect(getByTestId('audio-button-loading')).toBeTruthy();
  });

  it('renders "Playing…" label in playing state', () => {
    const { getByText } = render(
      <AudioButton onPress={jest.fn()} state="playing" />
    );
    expect(getByText('Playing…')).toBeTruthy();
  });

  it('renders "Oops! Try again" label and error indicator in error state', () => {
    const { getByText, getByTestId } = render(
      <AudioButton onPress={jest.fn()} state="error" />
    );
    expect(getByText('Oops! Try again')).toBeTruthy();
    expect(getByTestId('audio-button-error-indicator')).toBeTruthy();
  });

  it('is disabled in loading state', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioButton onPress={onPress} state="loading" />
    );
    fireEvent.press(getByTestId('audio-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is disabled in playing state', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioButton onPress={onPress} state="playing" />
    );
    fireEvent.press(getByTestId('audio-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPress in idle state', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioButton onPress={onPress} state="idle" />
    );
    fireEvent.press(getByTestId('audio-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress in error state (retry)', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioButton onPress={onPress} state="error" />
    );
    fireEvent.press(getByTestId('audio-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// ─── LetterKeyboard Tests ────────────────────────────────────────────────────

describe('LetterKeyboard', () => {
  it('renders all 26 letter buttons', () => {
    const { getByTestId } = render(
      <LetterKeyboard onLetterPress={jest.fn()} onBackspace={jest.fn()} />
    );
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(getByTestId(`letter-button-${letter}`)).toBeTruthy();
    }
  });

  it('renders a backspace button', () => {
    const { getByTestId } = render(
      <LetterKeyboard onLetterPress={jest.fn()} onBackspace={jest.fn()} />
    );
    expect(getByTestId('backspace-button')).toBeTruthy();
  });

  it('fires onLetterPress with the correct letter when a letter button is pressed', () => {
    const onLetterPress = jest.fn();
    const { getByTestId } = render(
      <LetterKeyboard onLetterPress={onLetterPress} onBackspace={jest.fn()} />
    );

    fireEvent.press(getByTestId('letter-button-A'));
    expect(onLetterPress).toHaveBeenCalledWith('A');

    fireEvent.press(getByTestId('letter-button-Z'));
    expect(onLetterPress).toHaveBeenCalledWith('Z');

    fireEvent.press(getByTestId('letter-button-M'));
    expect(onLetterPress).toHaveBeenCalledWith('M');
  });

  it('fires onBackspace when the backspace button is pressed', () => {
    const onBackspace = jest.fn();
    const { getByTestId } = render(
      <LetterKeyboard onLetterPress={jest.fn()} onBackspace={onBackspace} />
    );

    fireEvent.press(getByTestId('backspace-button'));
    expect(onBackspace).toHaveBeenCalledTimes(1);
  });

  it('does not fire onBackspace when a letter button is pressed', () => {
    const onBackspace = jest.fn();
    const { getByTestId } = render(
      <LetterKeyboard onLetterPress={jest.fn()} onBackspace={onBackspace} />
    );

    fireEvent.press(getByTestId('letter-button-B'));
    expect(onBackspace).not.toHaveBeenCalled();
  });
});
