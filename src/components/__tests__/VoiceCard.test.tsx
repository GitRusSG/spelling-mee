import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VoiceCard from '../VoiceCard';
import { VoiceOption } from '../../types';

describe('VoiceCard', () => {
  const mockVoice: VoiceOption = {
    id: 'en-gb-female-1',
    name: 'Emma',
    language: 'en-GB',
    gender: 'female',
    quality: 'enhanced',
  };

  const defaultProps = {
    voice: mockVoice,
    isSelected: false,
    onSelect: jest.fn(),
    onPreview: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the voice name', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} />);
    const nameEl = getByTestId('voice-card-name');
    expect(nameEl.props.children).toBe('Emma');
  });

  it('renders the language label', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} />);
    const languageEl = getByTestId('voice-card-language');
    expect(languageEl.props.children).toBe('British English');
  });

  it('renders American English for en-US', () => {
    const usVoice: VoiceOption = { ...mockVoice, language: 'en-US' };
    const { getByTestId } = render(<VoiceCard {...defaultProps} voice={usVoice} />);
    const languageEl = getByTestId('voice-card-language');
    expect(languageEl.props.children).toBe('American English');
  });

  it('renders the raw language code for unknown languages', () => {
    const unknownVoice: VoiceOption = { ...mockVoice, language: 'fr-FR' };
    const { getByTestId } = render(<VoiceCard {...defaultProps} voice={unknownVoice} />);
    const languageEl = getByTestId('voice-card-language');
    expect(languageEl.props.children).toBe('fr-FR');
  });

  it('renders female gender indicator', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} />);
    const genderEl = getByTestId('voice-card-gender');
    const children = genderEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('♀');
    expect(text).toContain('Female');
  });

  it('renders male gender indicator', () => {
    const maleVoice: VoiceOption = { ...mockVoice, gender: 'male' };
    const { getByTestId } = render(<VoiceCard {...defaultProps} voice={maleVoice} />);
    const genderEl = getByTestId('voice-card-gender');
    const children = genderEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('♂');
    expect(text).toContain('Male');
  });

  it('renders neutral gender indicator', () => {
    const neutralVoice: VoiceOption = { ...mockVoice, gender: 'neutral' };
    const { getByTestId } = render(<VoiceCard {...defaultProps} voice={neutralVoice} />);
    const genderEl = getByTestId('voice-card-gender');
    const children = genderEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toContain('⚪');
    expect(text).toContain('Neutral');
  });

  it('shows checkmark when selected', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} isSelected={true} />);
    expect(getByTestId('voice-card-checkmark')).toBeTruthy();
  });

  it('does not show checkmark when not selected', () => {
    const { queryByTestId } = render(<VoiceCard {...defaultProps} isSelected={false} />);
    expect(queryByTestId('voice-card-checkmark')).toBeNull();
  });

  it('calls onSelect when card is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<VoiceCard {...defaultProps} onSelect={onSelect} />);
    fireEvent.press(getByTestId('voice-card'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onPreview when preview button is pressed', () => {
    const onPreview = jest.fn();
    const { getByTestId } = render(<VoiceCard {...defaultProps} onPreview={onPreview} />);
    fireEvent.press(getByTestId('voice-card-preview'));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('does not call onSelect when preview button is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<VoiceCard {...defaultProps} onSelect={onSelect} />);
    fireEvent.press(getByTestId('voice-card-preview'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('has correct accessibility label when not selected', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} isSelected={false} />);
    const card = getByTestId('voice-card');
    expect(card.props.accessibilityLabel).toBe('Emma, British English, Female');
  });

  it('has correct accessibility label when selected', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} isSelected={true} />);
    const card = getByTestId('voice-card');
    expect(card.props.accessibilityLabel).toBe('Emma, British English, Female, selected');
  });

  it('has accessibility state selected when isSelected is true', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} isSelected={true} />);
    const card = getByTestId('voice-card');
    expect(card.props.accessibilityState).toEqual({ selected: true });
  });

  it('preview button has correct accessibility label', () => {
    const { getByTestId } = render(<VoiceCard {...defaultProps} />);
    const previewBtn = getByTestId('voice-card-preview');
    expect(previewBtn.props.accessibilityLabel).toBe('Preview Emma');
  });
});
