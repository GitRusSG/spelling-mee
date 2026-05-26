import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpeedSlider from '../SpeedSlider';

describe('SpeedSlider', () => {
  const defaultProps = {
    value: 1.0,
    onChange: jest.fn(),
    onChangeEnd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the current speed value', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} value={1.0} />);
    const valueEl = getByTestId('speed-slider-value');
    const children = valueEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toBe('1.0x');
  });

  it('renders the speed value formatted to one decimal place', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} value={0.5} />);
    const valueEl = getByTestId('speed-slider-value');
    const children = valueEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toBe('0.5x');
  });

  it('renders 1.5x at maximum', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} value={1.5} />);
    const valueEl = getByTestId('speed-slider-value');
    const children = valueEl.props.children;
    const text = Array.isArray(children) ? children.join('') : children;
    expect(text).toBe('1.5x');
  });

  it('renders step labels for 0.5x, 1.0x, and 1.5x', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    expect(getByTestId('speed-slider-label-0.5')).toBeTruthy();
    expect(getByTestId('speed-slider-label-1')).toBeTruthy();
    expect(getByTestId('speed-slider-label-1.5')).toBeTruthy();
  });

  it('renders the 0.5x label text', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    const label = getByTestId('speed-slider-label-0.5');
    expect(label.props.children).toBe('0.5x');
  });

  it('renders the 1.0x label text', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    const label = getByTestId('speed-slider-label-1');
    expect(label.props.children).toBe('1.0x');
  });

  it('renders the 1.5x label text', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    const label = getByTestId('speed-slider-label-1.5');
    expect(label.props.children).toBe('1.5x');
  });

  it('renders the slider container', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    expect(getByTestId('speed-slider')).toBeTruthy();
  });

  it('renders the track', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    expect(getByTestId('speed-slider-track')).toBeTruthy();
  });

  it('renders the thumb', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    expect(getByTestId('speed-slider-thumb')).toBeTruthy();
  });

  it('has correct accessibility label on the track', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} value={1.2} />);
    const track = getByTestId('speed-slider-track');
    expect(track.props.accessibilityLabel).toBe('Speed slider, 1.2x');
  });

  it('has correct accessibility role on the track', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    const track = getByTestId('speed-slider-track');
    expect(track.props.accessibilityRole).toBe('adjustable');
  });

  it('has correct accessibility value on the track', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} value={0.8} />);
    const track = getByTestId('speed-slider-track');
    expect(track.props.accessibilityValue).toEqual({
      min: 0.5,
      max: 1.5,
      now: 0.8,
      text: '0.8x',
    });
  });

  it('has correct accessibility label on the current value display', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} value={1.3} />);
    const valueEl = getByTestId('speed-slider-value');
    expect(valueEl.props.accessibilityLabel).toBe('Current speed: 1.3x');
  });

  it('renders labels container', () => {
    const { getByTestId } = render(<SpeedSlider {...defaultProps} />);
    expect(getByTestId('speed-slider-labels')).toBeTruthy();
  });
});
