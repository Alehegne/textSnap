import { useState, useCallback, useEffect, useRef } from 'react';
import { QueueItem, ImageEditorConfig, DEFAULT_EDITOR_CONFIG } from '../types';
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
  updateEditedItem: (
    id: string,
    editedFile: File,
    editedPreviewUrl: string,
    config: ImageEditorConfig
  ) => void;
  resetItemToOriginal: (id: string) => void;
  completedItems: QueueItem[];
  failedItems: QueueItem[];
  queuedItems: QueueItem[];
}

export function useImageQueue(): UseImageQueueReturn {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Track all active object URLs for safe revocation
  const urlsRef = useRef<Set<string>>(new Set());

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
      urlsRef.current.add(previewUrl);

      validItems.push({
        id,
        originalFile: file,
        file,
        previewUrl,
        originalPreviewUrl: previewUrl,
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
        editorConfig: DEFAULT_EDITOR_CONFIG,
        isEdited: false,
      });
    }

    if (validItems.length > 0) {
      setQueue((prev) => [...prev, ...validItems]);
      setActiveItemId((prev) => (prev ? prev : validItems[0].id));
    }

    return {
      addedCount: validItems.length,
      rejectedCount: errors.length,
      errors,
    };
  }, []);

  const removeQueueItem = useCallback((id: string) => {
    setQueue((prev) => {
      const itemToRemove = prev.find((i) => i.id === id);
      if (itemToRemove) {
        if (itemToRemove.previewUrl) {
          try {
            URL.revokeObjectURL(itemToRemove.previewUrl);
            urlsRef.current.delete(itemToRemove.previewUrl);
          } catch {
            // ignore
          }
        }
        if (
          itemToRemove.originalPreviewUrl &&
          itemToRemove.originalPreviewUrl !== itemToRemove.previewUrl
        ) {
          try {
            URL.revokeObjectURL(itemToRemove.originalPreviewUrl);
            urlsRef.current.delete(itemToRemove.originalPreviewUrl);
          } catch {
            // ignore
          }
        }
      }
      return prev.filter((item) => item.id !== id);
    });

    setActiveItemId((curr) => (curr === id ? null : curr));
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

  const updateEditedItem = useCallback(
    (
      id: string,
      editedFile: File,
      editedPreviewUrl: string,
      config: ImageEditorConfig
    ) => {
      urlsRef.current.add(editedPreviewUrl);

      setQueue((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          // Revoke old edited preview URL if it's not the original
          if (
            item.previewUrl &&
            item.previewUrl !== item.originalPreviewUrl &&
            item.previewUrl !== editedPreviewUrl
          ) {
            try {
              URL.revokeObjectURL(item.previewUrl);
              urlsRef.current.delete(item.previewUrl);
            } catch {
              // ignore
            }
          }

          return {
            ...item,
            file: editedFile,
            previewUrl: editedPreviewUrl,
            fileSize: editedFile.size,
            editorConfig: config,
            isEdited: true,
            status: 'queued', // Ready to re-process with new transformations
          };
        })
      );
    },
    []
  );

  const resetItemToOriginal = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (item.previewUrl && item.previewUrl !== item.originalPreviewUrl) {
          try {
            URL.revokeObjectURL(item.previewUrl);
            urlsRef.current.delete(item.previewUrl);
          } catch {
            // ignore
          }
        }

        const restoredFile = item.originalFile || item.file;
        const restoredUrl = item.originalPreviewUrl || item.previewUrl;

        return {
          ...item,
          file: restoredFile,
          previewUrl: restoredUrl,
          fileSize: restoredFile.size,
          editorConfig: DEFAULT_EDITOR_CONFIG,
          isEdited: false,
        };
      })
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
    updateEditedItem,
    resetItemToOriginal,
    completedItems,
    failedItems,
    queuedItems,
  };
}
