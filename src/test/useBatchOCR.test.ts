import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchOCR } from '../hooks/useBatchOCR';
import { QueueItem } from '../types';
import { ocrService } from '../services/ocrService';

describe('useBatchOCR', () => {
  let mockQueue: QueueItem[];
  let updateItemMock: ReturnType<typeof vi.fn>;
  let onItemCompletedMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockQueue = [
      {
        id: 'img_1',
        file: new File(['content1'], 'doc1.png', { type: 'image/png' }),
        previewUrl: 'blob:url1',
        filename: 'doc1.png',
        fileSize: 1000,
        status: 'queued',
        progress: 0,
        extractedText: '',
        confidence: 0,
        wordCount: 0,
        charCount: 0,
        linesCount: 0,
        error: null,
        timestamp: 1,
      },
      {
        id: 'img_2',
        file: new File(['content2'], 'doc2.png', { type: 'image/png' }),
        previewUrl: 'blob:url2',
        filename: 'doc2.png',
        fileSize: 2000,
        status: 'queued',
        progress: 0,
        extractedText: '',
        confidence: 0,
        wordCount: 0,
        charCount: 0,
        linesCount: 0,
        error: null,
        timestamp: 2,
      },
    ];

    updateItemMock = vi.fn((id, updates) => {
      const idx = mockQueue.findIndex((i) => i.id === id);
      if (idx !== -1) {
        mockQueue[idx] = { ...mockQueue[idx], ...updates };
      }
    });

    onItemCompletedMock = vi.fn();
  });

  it('processes all queued items sequentially and reports completion', async () => {
    vi.spyOn(ocrService, 'recognize').mockImplementation(async (file) => {
      const filename = (file as File).name;
      return {
        text: `Extracted text from ${filename}`,
        confidence: 95,
        wordCount: 4,
        charCount: 28,
        linesCount: 1,
      };
    });

    const { result } = renderHook(() =>
      useBatchOCR({
        queue: mockQueue,
        updateItem: updateItemMock,
        onItemCompleted: onItemCompletedMock,
      })
    );

    await act(async () => {
      await result.current.processAll();
    });

    expect(ocrService.recognize).toHaveBeenCalledTimes(2);
    expect(mockQueue[0].status).toBe('completed');
    expect(mockQueue[0].extractedText).toBe('Extracted text from doc1.png');
    expect(mockQueue[1].status).toBe('completed');
    expect(mockQueue[1].extractedText).toBe('Extracted text from doc2.png');
    expect(onItemCompletedMock).toHaveBeenCalledTimes(2);
  });

  it('continues processing remaining items if one image fails', async () => {
    // Fail first image, succeed second image
    vi.spyOn(ocrService, 'recognize').mockImplementation(async (file) => {
      const filename = (file as File).name;
      if (filename === 'doc1.png') {
        throw new Error('Corrupted image data');
      }
      return {
        text: 'Successful text for doc2',
        confidence: 92,
        wordCount: 4,
        charCount: 24,
        linesCount: 1,
      };
    });

    const { result } = renderHook(() =>
      useBatchOCR({
        queue: mockQueue,
        updateItem: updateItemMock,
        onItemCompleted: onItemCompletedMock,
      })
    );

    await act(async () => {
      await result.current.processAll();
    });

    // Both images were attempted
    expect(ocrService.recognize).toHaveBeenCalledTimes(2);

    // First failed with isolated error
    expect(mockQueue[0].status).toBe('failed');
    expect(mockQueue[0].error).toBe('Corrupted image data');

    // Second completed successfully!
    expect(mockQueue[1].status).toBe('completed');
    expect(mockQueue[1].extractedText).toBe('Successful text for doc2');
    expect(onItemCompletedMock).toHaveBeenCalledTimes(1);
  });

  it('processes a single item on demand (for retry)', async () => {
    mockQueue[0].status = 'failed';
    mockQueue[0].error = 'Temporary error';

    vi.spyOn(ocrService, 'recognize').mockResolvedValue({
      text: 'Retried text successfully',
      confidence: 96,
      wordCount: 3,
      charCount: 25,
      linesCount: 1,
    });

    const { result } = renderHook(() =>
      useBatchOCR({
        queue: mockQueue,
        updateItem: updateItemMock,
        onItemCompleted: onItemCompletedMock,
      })
    );

    await act(async () => {
      await result.current.processSingleItem('img_1');
    });

    expect(ocrService.recognize).toHaveBeenCalledTimes(1);
    expect(mockQueue[0].status).toBe('completed');
    expect(mockQueue[0].extractedText).toBe('Retried text successfully');
    expect(mockQueue[0].error).toBeNull();
  });
});
