import { HistoryItem, Theme } from '../types';

const STORAGE_KEY_HISTORY = 'textsnap_history_v1';
const STORAGE_KEY_THEME = 'textsnap_theme_v1';
const MAX_HISTORY_ITEMS = 25;

export const storageService = {
  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to load history from LocalStorage:', err);
      return [];
    }
  },

  saveHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem | null {
    try {
      const history = this.getHistory();
      const newItem: HistoryItem = {
        ...item,
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
      };

      // Add to front and limit count
      const updated = [newItem, ...history.filter(h => h.text !== item.text || h.fileName !== item.fileName)].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      return newItem;
    } catch (err) {
      console.warn('Failed to save history item to LocalStorage:', err);
      return null;
    }
  },

  deleteHistoryItem(id: string): HistoryItem[] {
    try {
      const history = this.getHistory();
      const updated = history.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Failed to delete history item from LocalStorage:', err);
      return [];
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (err) {
      console.warn('Failed to clear history from LocalStorage:', err);
    }
  },

  getTheme(): Theme {
    try {
      const theme = localStorage.getItem(STORAGE_KEY_THEME);
      if (theme === 'light' || theme === 'dark' || theme === 'system') {
        return theme;
      }
    } catch {
      // ignore
    }
    return 'system';
  },

  setTheme(theme: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  },
};
