import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';

interface DrawingCanvasProps {
  onLetterConfirmed: (letter: string) => void;
  onClear: () => void;
  letterIndex: number;
}

const LETTER_ROWS = [
  'ABCDEFGHI'.split(''),
  'JKLMNOPQR'.split(''),
  'STUVWXYZ'.split(''),
];

export default function DrawingCanvas({ onLetterConfirmed, onClear, letterIndex }: DrawingCanvasProps) {
  const canvasRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState<string | null>(null);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 280, 280);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#7C4DFF';
    ctx.lineWidth = 6;
  }, []);

  const getPosition = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getTouchPosition = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
    setRecognizedLetter(null);
    setShowManualPicker(false);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e: any) => {
    e.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const pos = getTouchPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
    setRecognizedLetter(null);
    setShowManualPicker(false);
  };

  const handleTouchMove = (e: any) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const pos = getTouchPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleClear = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 280, 280);
    ctx.strokeStyle = '#7C4DFF';
    ctx.lineWidth = 6;
    setHasDrawn(false);
    setRecognizedLetter(null);
    setShowManualPicker(false);
    onClear();
  };

  const handleRecognize = async () => {
    if (!canvasRef.current) return;
    setIsRecognizing(true);
    setRecognizedLetter(null);

    try {
      const Tesseract = await import('tesseract.js');
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');

      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: () => {},
      });

      const text = result.data.text.trim().toUpperCase();
      // Extract first letter character from the result
      const match = text.match(/[A-Z]/);
      if (match) {
        setRecognizedLetter(match[0]);
      } else {
        // OCR couldn't recognize — show manual picker
        setShowManualPicker(true);
      }
    } catch {
      // Fallback to manual picker on error
      setShowManualPicker(true);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleConfirmRecognized = () => {
    if (recognizedLetter) {
      onLetterConfirmed(recognizedLetter.toLowerCase());
      clearForNext();
    }
  };

  const handleReject = () => {
    setRecognizedLetter(null);
    setShowManualPicker(true);
  };

  const handleManualPick = (letter: string) => {
    onLetterConfirmed(letter.toLowerCase());
    clearForNext();
  };

  const clearForNext = () => {
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 280, 280);
      ctx.strokeStyle = '#7C4DFF';
      ctx.lineWidth = 6;
    }
    setHasDrawn(false);
    setRecognizedLetter(null);
    setShowManualPicker(false);
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.unsupportedText}>Draw mode is only available on web</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Draw letter #{letterIndex + 1}</Text>
      <View style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          style={{
            borderRadius: 12,
            border: '3px solid #CE93D8',
            background: '#fff',
            touchAction: 'none',
            cursor: 'crosshair',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear} testID="draw-clear-button">
          <Text style={styles.clearButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.doneButton, (!hasDrawn || isRecognizing) && styles.doneButtonDisabled]}
          onPress={handleRecognize}
          disabled={!hasDrawn || isRecognizing}
          testID="draw-done-button"
        >
          {isRecognizing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.doneButtonText}>Recognize ✨</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recognition result */}
      {recognizedLetter && (
        <View style={styles.recognitionResult} testID="recognition-result">
          <Text style={styles.recognitionLabel}>I think you drew:</Text>
          <Text style={styles.recognizedLetter}>{recognizedLetter}</Text>
          <View style={styles.confirmRow}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmRecognized} testID="confirm-letter">
              <Text style={styles.confirmButtonText}>✓ Yes!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject} testID="reject-letter">
              <Text style={styles.rejectButtonText}>✗ No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Manual picker fallback */}
      {showManualPicker && (
        <View style={styles.letterPickerContainer} testID="letter-picker">
          <Text style={styles.letterPickerLabel}>Which letter did you draw?</Text>
          {LETTER_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.letterRow}>
              {row.map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={styles.letterButton}
                  onPress={() => handleManualPick(letter)}
                  testID={`pick-letter-${letter}`}
                >
                  <Text style={styles.letterButtonText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 8,
    textAlign: 'center',
  },
  unsupportedText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  canvasWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#FFCDD2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C62828',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  recognitionResult: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  recognitionLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  recognizedLetter: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4CAF50',
    marginBottom: 12,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 40,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 40,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  letterPickerContainer: {
    backgroundColor: '#EDE7F6',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CE93D8',
  },
  letterPickerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 10,
  },
  letterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    justifyContent: 'center',
  },
  letterButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 8,
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
