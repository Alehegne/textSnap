import { useState, useCallback, useEffect } from 'react';
import { HistoryItem } from '../types';
import { storageService } from '../services/storageService';

export interface UseHistoryReturn {
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  removeHistoryItem: (id: string) => void;
  clearAllHistory: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const initial = storageService.getHistory();
    setHistory(initial);
  }, []);

  const addHistoryItem = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    // Only save if text is non-empty
    if (!item.text || item.text.trim().length === 0) return;
    const newItem = storageService.saveHistoryItem(item);
    if (newItem) {
      setHistory((prev) => [newItem, ...prev.filter(h => h.id !== newItem.id)]);
    }
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    const updated = storageService.deleteHistoryItem(id);
    setHistory(updated);
  }, []);

  const clearAllHistory = useCallback(() => {
    storageService.clearHistory();
    setHistory([]);
  }, []);

  return {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearAllHistory,
  };
}
