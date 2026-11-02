import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../services/storageService';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('History Storage', () => {
    it('returns empty array when no history exists', () => {
      expect(storageService.getHistory()).toEqual([]);
    });

    it('saves history items and generates ID and timestamp', () => {
      const item = storageService.saveHistoryItem({
        fileName: 'receipt.png',
        fileSize: 4096,
        text: 'Total: $50.00',
        wordCount: 2,
        charCount: 13,
        confidence: 95,
      });

      expect(item).not.toBeNull();
      expect(item?.id).toBeDefined();
      expect(item?.timestamp).toBeGreaterThan(0);
      expect(item?.fileName).toBe('receipt.png');

      const history = storageService.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].text).toBe('Total: $50.00');
    });

    it('deletes history item by ID', () => {
      const item1 = storageService.saveHistoryItem({
        fileName: 'doc1.png',
        fileSize: 1000,
        text: 'Text 1',
        wordCount: 2,
        charCount: 6,
        confidence: 90,
      });

      const item2 = storageService.saveHistoryItem({
        fileName: 'doc2.png',
        fileSize: 2000,
        text: 'Text 2',
        wordCount: 2,
        charCount: 6,
        confidence: 92,
      });

      expect(storageService.getHistory().length).toBe(2);

      if (item1) {
        storageService.deleteHistoryItem(item1.id);
      }

      const history = storageService.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].id).toBe(item2?.id);
    });

    it('clears all history', () => {
      storageService.saveHistoryItem({
        fileName: 'doc1.png',
        fileSize: 1000,
        text: 'Text 1',
        wordCount: 2,
        charCount: 6,
        confidence: 90,
      });

      storageService.clearHistory();
      expect(storageService.getHistory()).toEqual([]);
    });
  });

  describe('Theme Storage', () => {
    it('defaults to system when not set', () => {
      expect(storageService.getTheme()).toBe('system');
    });

    it('saves and retrieves dark theme', () => {
      storageService.setTheme('dark');
      expect(storageService.getTheme()).toBe('dark');
    });

    it('saves and retrieves light theme', () => {
      storageService.setTheme('light');
      expect(storageService.getTheme()).toBe('light');
    });
  });
});
