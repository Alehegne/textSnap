import { describe, it, expect } from 'vitest';
import { formatFileSize, calculateTextStats } from '../services/imageService';

describe('imageService', () => {
  describe('formatFileSize', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('calculateTextStats', () => {
    it('calculates empty text correctly', () => {
      const stats = calculateTextStats('');
      expect(stats.charCount).toBe(0);
      expect(stats.wordCount).toBe(0);
      expect(stats.linesCount).toBe(0);
    });

    it('calculates single-line text', () => {
      const stats = calculateTextStats('Hello world from TextSnap');
      expect(stats.charCount).toBe(25);
      expect(stats.wordCount).toBe(4);
      expect(stats.linesCount).toBe(1);
    });

    it('handles multiple newlines and irregular spaces', () => {
      const text = 'Line 1  with   spaces\nLine 2\n\nLine 4';
      const stats = calculateTextStats(text);
      expect(stats.wordCount).toBe(8);
      expect(stats.linesCount).toBe(4);
      expect(stats.charCount).toBe(text.length);
    });
  });
});
