import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';

interface SpeedSliderProps {
  value: number;
  onChange: (speed: number) => void;
  onChangeEnd: (speed: number) => void;
}

const MIN_SPEED = 0.5;
const MAX_SPEED = 1.5;
const STEP_LABELS = [
  { value: 0.5, label: '0.5x' },
  { value: 1.0, label: '1.0x' },
  { value: 1.5, label: '1.5x' },
];

/**
 * Speed slider for TTS voice speed adjustment.
 * Range: 0.5x to 1.5x with step labels.
 * Kid-friendly styling with colorful track and large thumb.
 * Triggers live preview on change end (when user releases).
 */
export default function SpeedSlider({ value, onChange, onChangeEnd }: SpeedSliderProps) {
  const trackWidth = useRef(0);
  const trackX = useRef(0);

  const clampSpeed = (speed: number): number => {
    return Math.round(Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed)) * 10) / 10;
  };

  const positionToSpeed = (x: number): number => {
    if (trackWidth.current === 0) return value;
    const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
    const speed = MIN_SPEED + ratio * (MAX_SPEED - MIN_SPEED);
    return clampSpeed(speed);
  };

  const speedToPosition = (speed: number): number => {
    if (trackWidth.current === 0) return 0;
    const ratio = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
    return ratio * trackWidth.current;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const x = evt.nativeEvent.locationX;
        const newSpeed = positionToSpeed(x);
        onChange(newSpeed);
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const x = gestureState.moveX - trackX.current;
        const newSpeed = positionToSpeed(x);
        onChange(newSpeed);
      },
      onPanResponderRelease: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const x = gestureState.moveX - trackX.current;
        const newSpeed = positionToSpeed(x);
        onChangeEnd(newSpeed);
      },
    })
  ).current;

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    trackWidth.current = event.nativeEvent.layout.width;
    trackX.current = event.nativeEvent.layout.x;
  };

  const thumbPosition = speedToPosition(value);
  const fillRatio = (value - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);

  return (
    <View style={styles.container} testID="speed-slider">
      <Text
        style={styles.currentValue}
        accessibilityLabel={`Current speed: ${value.toFixed(1)}x`}
        testID="speed-slider-value"
      >
        {value.toFixed(1)}x
      </Text>

      <View
        style={styles.trackContainer}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={`Speed slider, ${value.toFixed(1)}x`}
        accessibilityValue={{
          min: MIN_SPEED,
          max: MAX_SPEED,
          now: value,
          text: `${value.toFixed(1)}x`,
        }}
        testID="speed-slider-track"
      >
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${fillRatio * 100}%` }]} />
        </View>
        <View
          style={[styles.thumb, { left: thumbPosition - 16 }]}
          testID="speed-slider-thumb"
        />
      </View>

      <View style={styles.labelsContainer} testID="speed-slider-labels">
        {STEP_LABELS.map((step) => (
          <Text
            key={step.value}
            style={[
              styles.stepLabel,
              Math.abs(value - step.value) < 0.05 && styles.activeStepLabel,
            ]}
            testID={`speed-slider-label-${step.value}`}
          >
            {step.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  currentValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7C4DFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  trackContainer: {
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#7C4DFF',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C4DFF',
    borderWidth: 3,
    borderColor: '#fff',
    top: 8,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stepLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  activeStepLabel: {
    color: '#7C4DFF',
    fontWeight: '800',
  },
});
