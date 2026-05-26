import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RecordButton from '../RecordButton';

describe('RecordButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders "Record" label in idle state', () => {
    const { getByText } = render(
      <RecordButton status="idle" onStart={jest.fn()} onStop={jest.fn()} />
    );
    expect(getByText('Record')).toBeTruthy();
  });

  it('renders microphone icon in idle state', () => {
    const { getByText } = render(
      <RecordButton status="idle" onStart={jest.fn()} onStop={jest.fn()} />
    );
    expect(getByText('🎙️')).toBeTruthy();
  });

  it('renders stop icon in recording state', () => {
    const { getByText } = render(
      <RecordButton status="recording" onStart={jest.fn()} onStop={jest.fn()} />
    );
    expect(getByText('⏹️')).toBeTruthy();
  });

  it('renders countdown timer showing max seconds when recording starts', () => {
    const { getByTestId } = render(
      <RecordButton
        status="recording"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={10000}
      />
    );
    expect(getByTestId('record-button-timer').props.children).toEqual([
      10,
      's',
    ]);
  });

  it('countdown decrements every second while recording', () => {
    const { getByTestId } = render(
      <RecordButton
        status="recording"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={10000}
      />
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByTestId('record-button-timer').props.children).toEqual([
      9,
      's',
    ]);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByTestId('record-button-timer').props.children).toEqual([
      8,
      's',
    ]);
  });

  it('countdown stops at 0', () => {
    const { getByTestId } = render(
      <RecordButton
        status="recording"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={3000}
      />
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(getByTestId('record-button-timer').props.children).toEqual([
      0,
      's',
    ]);

    // Should not go below 0
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByTestId('record-button-timer').props.children).toEqual([
      0,
      's',
    ]);
  });

  it('calls onStart when pressed in idle state', () => {
    const onStart = jest.fn();
    const { getByTestId } = render(
      <RecordButton status="idle" onStart={onStart} onStop={jest.fn()} />
    );
    fireEvent.press(getByTestId('record-button'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('calls onStop when pressed in recording state', () => {
    const onStop = jest.fn();
    const { getByTestId } = render(
      <RecordButton status="recording" onStart={jest.fn()} onStop={onStop} />
    );
    fireEvent.press(getByTestId('record-button'));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('does not call onStop when pressed in idle state', () => {
    const onStop = jest.fn();
    const { getByTestId } = render(
      <RecordButton status="idle" onStart={jest.fn()} onStop={onStop} />
    );
    fireEvent.press(getByTestId('record-button'));
    expect(onStop).not.toHaveBeenCalled();
  });

  it('does not call onStart when pressed in recording state', () => {
    const onStart = jest.fn();
    const { getByTestId } = render(
      <RecordButton status="recording" onStart={onStart} onStop={jest.fn()} />
    );
    fireEvent.press(getByTestId('record-button'));
    expect(onStart).not.toHaveBeenCalled();
  });

  it('resets countdown when status changes back to idle', () => {
    const { getByTestId, rerender } = render(
      <RecordButton
        status="recording"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={10000}
      />
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(getByTestId('record-button-timer').props.children).toEqual([
      7,
      's',
    ]);

    // Switch back to idle and then recording again
    rerender(
      <RecordButton
        status="idle"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={10000}
      />
    );
    rerender(
      <RecordButton
        status="recording"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={10000}
      />
    );

    expect(getByTestId('record-button-timer').props.children).toEqual([
      10,
      's',
    ]);
  });

  it('has correct accessibility label in idle state', () => {
    const { getByLabelText } = render(
      <RecordButton status="idle" onStart={jest.fn()} onStop={jest.fn()} />
    );
    expect(getByLabelText('Start recording')).toBeTruthy();
  });

  it('has correct accessibility label in recording state', () => {
    const { getByLabelText } = render(
      <RecordButton
        status="recording"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={10000}
      />
    );
    expect(
      getByLabelText('Recording, 10 seconds remaining. Tap to stop.')
    ).toBeTruthy();
  });

  it('uses custom maxDurationMs for initial countdown', () => {
    const { getByTestId } = render(
      <RecordButton
        status="recording"
        onStart={jest.fn()}
        onStop={jest.fn()}
        maxDurationMs={5000}
      />
    );
    expect(getByTestId('record-button-timer').props.children).toEqual([
      5,
      's',
    ]);
  });
});
