import { useState, useCallback, useRef } from 'react';
import { QueueItem } from '../types';
import { ocrService } from '../services/ocrService';

export interface BatchProgressInfo {
  currentIndex: number;
  totalInBatch: number;
  overallPercentage: number;
  currentFilename: string;
  currentStatusText: string;
}

export interface UseBatchOCRProps {
  queue: QueueItem[];
  updateItem: (id: string, updates: Partial<QueueItem>) => void;
  onItemCompleted?: (item: QueueItem) => void;
}

export interface UseBatchOCRReturn {
  isProcessingBatch: boolean;
  batchProgress: BatchProgressInfo | null;
  processAll: () => Promise<void>;
  processSingleItem: (id: string) => Promise<void>;
  cancelBatch: () => void;
}

export function useBatchOCR({
  queue,
  updateItem,
  onItemCompleted,
}: UseBatchOCRProps): UseBatchOCRReturn {
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgressInfo | null>(null);

  // Ref to support cooperative batch cancellation
  const cancelRequestedRef = useRef<boolean>(false);

  // Queue ref to always access latest items in async loops
  const queueRef = useRef<QueueItem[]>(queue);
  queueRef.current = queue;

  const cancelBatch = useCallback(() => {
    cancelRequestedRef.current = true;
  }, []);

  /**
   * Process a single queue item
   */
  const processSingleItem = useCallback(
    async (id: string) => {
      const item = queueRef.current.find((i) => i.id === id);
      if (!item) return;

      setIsProcessingBatch(true);
      cancelRequestedRef.current = false;

      updateItem(id, {
        status: 'processing',
        progress: 0.05,
        progressStatus: 'Starting OCR engine...',
        error: null,
      });

      setBatchProgress({
        currentIndex: 1,
        totalInBatch: 1,
        overallPercentage: 5,
        currentFilename: item.filename,
        currentStatusText: 'Starting OCR engine...',
      });

      try {
        const result = await ocrService.recognize(item.file, (prog) => {
          updateItem(id, {
            progress: prog.progress,
            progressStatus: prog.status,
          });

          setBatchProgress({
            currentIndex: 1,
            totalInBatch: 1,
            overallPercentage: Math.round(prog.progress * 100),
            currentFilename: item.filename,
            currentStatusText: prog.status,
          });
        });

        const completedUpdates: Partial<QueueItem> = {
          status: 'completed',
          extractedText: result.text,
          confidence: result.confidence,
          wordCount: result.wordCount,
          charCount: result.charCount,
          linesCount: result.linesCount,
          progress: 1,
          progressStatus: 'Completed',
          error: null,
        };

        updateItem(id, completedUpdates);

        if (onItemCompleted) {
          onItemCompleted({ ...item, ...completedUpdates });
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Text extraction failed for this image.';

        updateItem(id, {
          status: 'failed',
          error: message,
          progress: 0,
          progressStatus: 'Failed',
        });
      } finally {
        setIsProcessingBatch(false);
        setBatchProgress(null);
      }
    },
    [updateItem, onItemCompleted]
  );

  /**
   * Process all queued (or failed if retrying) items in the queue sequentially
   */
  const processAll = useCallback(async () => {
    if (isProcessingBatch) return;

    // Identify items that need processing
    const itemsToProcess = queueRef.current.filter(
      (item) => item.status === 'queued' || item.status === 'failed'
    );

    if (itemsToProcess.length === 0) return;

    setIsProcessingBatch(true);
    cancelRequestedRef.current = false;

    const total = itemsToProcess.length;

    for (let i = 0; i < total; i++) {
      if (cancelRequestedRef.current) {
        break;
      }

      const currentTarget = itemsToProcess[i];
      // Make sure it still exists in the queue (user might have removed it)
      const currentItem = queueRef.current.find((q) => q.id === currentTarget.id);
      if (!currentItem) continue;

      const baseProgress = (i / total) * 100;

      updateItem(currentItem.id, {
        status: 'processing',
        progress: 0.05,
        progressStatus: 'Preparing OCR...',
        error: null,
      });

      setBatchProgress({
        currentIndex: i + 1,
        totalInBatch: total,
        overallPercentage: Math.round(baseProgress),
        currentFilename: currentItem.filename,
        currentStatusText: 'Preparing OCR...',
      });

      try {
        const result = await ocrService.recognize(currentItem.file, (prog) => {
          updateItem(currentItem.id, {
            progress: prog.progress,
            progressStatus: prog.status,
          });

          const currentItemPct = (prog.progress / total) * 100;
          setBatchProgress({
            currentIndex: i + 1,
            totalInBatch: total,
            overallPercentage: Math.min(99, Math.round(baseProgress + currentItemPct)),
            currentFilename: currentItem.filename,
            currentStatusText: prog.status,
          });
        });

        const completedUpdates: Partial<QueueItem> = {
          status: 'completed',
          extractedText: result.text,
          confidence: result.confidence,
          wordCount: result.wordCount,
          charCount: result.charCount,
          linesCount: result.linesCount,
          progress: 1,
          progressStatus: 'Completed',
          error: null,
        };

        updateItem(currentItem.id, completedUpdates);

        if (onItemCompleted) {
          onItemCompleted({ ...currentItem, ...completedUpdates });
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Text extraction failed for this image.';

        // A failed image must not stop the rest of the queue
        updateItem(currentItem.id, {
          status: 'failed',
          error: message,
          progress: 0,
          progressStatus: 'Failed',
        });
      }
    }

    setIsProcessingBatch(false);
    setBatchProgress(null);
  }, [isProcessingBatch, updateItem, onItemCompleted]);

  return {
    isProcessingBatch,
    batchProgress,
    processAll,
    processSingleItem,
    cancelBatch,
  };
}
