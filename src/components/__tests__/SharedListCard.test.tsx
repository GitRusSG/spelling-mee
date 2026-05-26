import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SharedListCard from '../SharedListCard';
import { SharedListSummary } from '../../types';

describe('SharedListCard', () => {
  const mockList: SharedListSummary = {
    id: 'list-123',
    name: 'Animals',
    wordCount: 12,
    creatorDisplayName: 'John',
    createdAt: '2024-01-15T10:00:00Z',
  };

  const defaultProps = {
    list: mockList,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the list name', () => {
    const { getByTestId } = render(<SharedListCard {...defaultProps} />);
    const nameEl = getByTestId('shared-list-card-name');
    const children = nameEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('Animals');
  });

  it('renders the word count with plural', () => {
    const { getByTestId } = render(<SharedListCard {...defaultProps} />);
    const countEl = getByTestId('shared-list-card-word-count');
    const children = countEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('12');
    expect(text).toContain('words');
  });

  it('renders singular word count for 1 word', () => {
    const singleWordList: SharedListSummary = { ...mockList, wordCount: 1 };
    const { getByTestId } = render(
      <SharedListCard list={singleWordList} onPress={jest.fn()} />
    );
    const countEl = getByTestId('shared-list-card-word-count');
    const children = countEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('1');
    expect(text).toContain('word');
    expect(text).not.toContain('words');
  });

  it('renders the creator display name', () => {
    const { getByTestId } = render(<SharedListCard {...defaultProps} />);
    const creatorEl = getByTestId('shared-list-card-creator');
    const children = creatorEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('John');
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<SharedListCard list={mockList} onPress={onPress} />);
    fireEvent.press(getByTestId('shared-list-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility label', () => {
    const { getByTestId } = render(<SharedListCard {...defaultProps} />);
    const card = getByTestId('shared-list-card');
    expect(card.props.accessibilityLabel).toBe('Animals, 12 words, by John');
  });

  it('has correct accessibility label for singular word count', () => {
    const singleWordList: SharedListSummary = { ...mockList, wordCount: 1 };
    const { getByTestId } = render(
      <SharedListCard list={singleWordList} onPress={jest.fn()} />
    );
    const card = getByTestId('shared-list-card');
    expect(card.props.accessibilityLabel).toBe('Animals, 1 word, by John');
  });

  it('has accessibility role of button', () => {
    const { getByTestId } = render(<SharedListCard {...defaultProps} />);
    const card = getByTestId('shared-list-card');
    expect(card.props.accessibilityRole).toBe('button');
  });
});
