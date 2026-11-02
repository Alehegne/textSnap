import { useState, useCallback, useEffect, useRef } from 'react';
import { QueueItem } from '../types';
import { calculateTextStats } from '../services/imageService';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

let idCounter = 0;
function createUniqueId(): string {
  idCounter += 1;
  return `item_${Date.now()}_${idCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

export interface AddFilesResult {
  addedCount: number;
  rejectedCount: number;
  errors: string[];
}

export interface UseImageQueueReturn {
  queue: QueueItem[];
  activeItemId: string | null;
  activeItem: QueueItem | null;
  setActiveItemId: (id: string | null) => void;
  addFiles: (files: File[]) => AddFilesResult;
  removeQueueItem: (id: string) => void;
  clearQueue: () => void;
  updateItem: (id: string, updates: Partial<QueueItem>) => void;
  updateItemText: (id: string, newText: string) => void;
  completedItems: QueueItem[];
  failedItems: QueueItem[];
  queuedItems: QueueItem[];
}

export function useImageQueue(): UseImageQueueReturn {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Track all active object URLs for safe revocation
  const urlsRef = useRef<Map<string, string>>(new Map());

  // Clean up all object URLs on unmount
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      urls.clear();
    };
  }, []);

  const addFiles = useCallback((files: File[]): AddFilesResult => {
    const errors: string[] = [];
    const validItems: QueueItem[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": Unsupported format. Allowed: JPG, PNG, WebP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(
          `"${file.name}": Exceeds 8 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`
        );
        continue;
      }

      const id = createUniqueId();
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.set(id, previewUrl);

      validItems.push({
        id,
        file,
        previewUrl,
        filename: file.name,
        fileSize: file.size,
        status: 'queued',
        progress: 0,
        extractedText: '',
        confidence: 0,
        wordCount: 0,
        charCount: 0,
        linesCount: 0,
        error: null,
        timestamp: Date.now(),
      });
    }

    if (validItems.length > 0) {
      setQueue((prev) => {
        const next = [...prev, ...validItems];
        return next;
      });

      // If no active item, select the first newly added item
      setActiveItemId((prev) => (prev ? prev : validItems[0].id));
    }

    return {
      addedCount: validItems.length,
      rejectedCount: errors.length,
      errors,
    };
  }, []);

  const removeQueueItem = useCallback((id: string) => {
    // Revoke object URL
    const url = urlsRef.current.get(id);
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      urlsRef.current.delete(id);
    }

    setQueue((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next;
    });

    setActiveItemId((curr) => {
      if (curr === id) {
        return null;
      }
      return curr;
    });
  }, []);

  const clearQueue = useCallback(() => {
    urlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    urlsRef.current.clear();
    setQueue([]);
    setActiveItemId(null);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const updateItemText = useCallback((id: string, newText: string) => {
    const stats = calculateTextStats(newText);
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              extractedText: newText,
              wordCount: stats.wordCount,
              charCount: stats.charCount,
              linesCount: stats.linesCount,
            }
          : item
      )
    );
  }, []);

  // Update activeItemId if current active was deleted and queue has items
  useEffect(() => {
    if (activeItemId === null && queue.length > 0) {
      setActiveItemId(queue[0].id);
    }
  }, [activeItemId, queue]);

  const activeItem = queue.find((i) => i.id === activeItemId) || null;
  const completedItems = queue.filter((i) => i.status === 'completed');
  const failedItems = queue.filter((i) => i.status === 'failed');
  const queuedItems = queue.filter((i) => i.status === 'queued');

  return {
    queue,
    activeItemId,
    activeItem,
    setActiveItemId,
    addFiles,
    removeQueueItem,
    clearQueue,
    updateItem,
    updateItemText,
    completedItems,
    failedItems,
    queuedItems,
  };
}
